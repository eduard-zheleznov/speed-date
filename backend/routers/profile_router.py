from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from models import User, ProfileUpdate
from auth import get_current_user_id
from database import users_collection
from datetime import datetime
import base64
import uuid
import io
from PIL import Image

# Register HEIF opener if available
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HEIF_SUPPORTED = True
except ImportError:
    HEIF_SUPPORTED = False

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("", response_model=User)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_dict.get("created_at"), str):
        user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    if isinstance(user_dict.get("last_login"), str):
        user_dict["last_login"] = datetime.fromisoformat(user_dict["last_login"])
    
    return User(**user_dict)

@router.put("", response_model=User)
async def update_profile(profile_data: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    update_dict = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    
    if update_dict:
        # Check if profile is now complete
        user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
        if user_dict:
            user_dict.update(update_dict)
            required_fields = ["name", "age", "height", "weight", "gender", "education", "smoking", "city"]
            profile_completed = all(user_dict.get(field) is not None for field in required_fields)
            update_dict["profile_completed"] = profile_completed
        
        await users_collection.update_one(
            {"id": user_id},
            {"$set": update_dict}
        )
    
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_dict.get("created_at"), str):
        user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    if isinstance(user_dict.get("last_login"), str):
        user_dict["last_login"] = datetime.fromisoformat(user_dict["last_login"])
    
    return User(**user_dict)

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    # Validate content type - support HEIC/HEIF from iPhone
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
    
    # Check if it's an image type
    if not file.content_type or not (file.content_type.startswith('image/') or file.content_type in allowed_types):
        raise HTTPException(status_code=400, detail="Только изображения разрешены")
    
    # Read file
    contents = await file.read()
    
    # Check size (max 10MB for raw files, will be compressed)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Файл слишком большой (макс 10МБ)")
    
    try:
        # Process image with Pillow (handles HEIC if pillow-heif is installed)
        img = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary (for HEIC, RGBA, etc.)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create white background for transparency
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if too large (max 1200px on longest side)
        max_size = 1200
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Auto-rotate based on EXIF
        try:
            from PIL import ExifTags
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            exif = img._getexif()
            if exif:
                orientation_value = exif.get(orientation)
                if orientation_value == 3:
                    img = img.rotate(180, expand=True)
                elif orientation_value == 6:
                    img = img.rotate(270, expand=True)
                elif orientation_value == 8:
                    img = img.rotate(90, expand=True)
        except (AttributeError, KeyError, IndexError):
            pass
        
        # Save as JPEG with good quality
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        # Convert to base64
        base64_image = base64.b64encode(output.getvalue()).decode('utf-8')
        photo_url = f"data:image/jpeg;base64,{base64_image}"
        
    except Exception as e:
        print(f"Image processing error: {e}")
        raise HTTPException(status_code=400, detail="Не удалось обработать изображение. Попробуйте другой файл.")
    
    # Get user
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add photo (max 3)
    photos = user_dict.get("photos", [])
    if len(photos) >= 3:
        raise HTTPException(status_code=400, detail="Максимум 3 фотографии")
    
    photos.append(photo_url)
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"photos": photos}}
    )
    
    return {"photo_url": photo_url, "photos": photos}

@router.delete("/photo/{photo_index}")
async def delete_photo(photo_index: int, user_id: str = Depends(get_current_user_id)):
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    photos = user_dict.get("photos", [])
    if photo_index < 0 or photo_index >= len(photos):
        raise HTTPException(status_code=400, detail="Invalid photo index")
    
    photos.pop(photo_index)
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"photos": photos}}
    )
    
    return {"photos": photos}

@router.post("/set-main-photo")
async def set_main_photo(photo_index: int, user_id: str = Depends(get_current_user_id)):
    user_dict = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    
    photos = user_dict.get("photos", [])
    if photo_index < 0 or photo_index >= len(photos):
        raise HTTPException(status_code=400, detail="Invalid photo index")
    
    # Move selected photo to first position
    main_photo = photos.pop(photo_index)
    photos.insert(0, main_photo)
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"photos": photos}}
    )
    
    return {"photos": photos}
