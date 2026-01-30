from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import logging
import socketio

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create FastAPI app
app = FastAPI()

# Create Socket.IO server for WebRTC signaling
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'
)
socket_app = socketio.ASGIApp(sio, app)

# Import routers
from routers.auth_router import router as auth_router
from routers.profile_router import router as profile_router
from routers.filters_router import router as filters_router
from routers.matching_router import router as matching_router
from routers.chat_router import router as chat_router
from routers.complaints_router import router as complaints_router
from routers.subscriptions_router import router as subscriptions_router
from routers.admin_router import router as admin_router
from routers.testing_router import router as testing_router
from routers.feedback_router import router as feedback_router
from routers.documents_router import router as documents_router
from database import close_db

# Create API router with prefix
api_router = APIRouter(prefix="/api")

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Video Dating API"}

# Include routers
api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(filters_router)
api_router.include_router(matching_router)
api_router.include_router(chat_router)
api_router.include_router(complaints_router)
api_router.include_router(subscriptions_router)
api_router.include_router(admin_router)
api_router.include_router(testing_router)
api_router.include_router(feedback_router)
api_router.include_router(documents_router)

app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# WebRTC Signaling via WebSocket
# Store active connections
active_connections = {}

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    active_connections[sid] = {}

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")
    if sid in active_connections:
        # Notify peer if exists
        peer_sid = active_connections[sid].get('peer_sid')
        if peer_sid and peer_sid in active_connections:
            await sio.emit('peer_disconnected', room=peer_sid)
        del active_connections[sid]

@sio.event
async def join_room(sid, data):
    """User joins a video room"""
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    
    logger.info(f"User {user_id} joining room {room_id}")
    
    await sio.enter_room(sid, room_id)
    active_connections[sid]['room_id'] = room_id
    active_connections[sid]['user_id'] = user_id
    
    # Get other users in room
    room_sids = [s for s, conn in active_connections.items() 
                 if conn.get('room_id') == room_id and s != sid]
    
    if room_sids:
        # Notify existing user about new peer
        peer_sid = room_sids[0]
        active_connections[sid]['peer_sid'] = peer_sid
        active_connections[peer_sid]['peer_sid'] = sid
        
        await sio.emit('peer_joined', {'peer_id': sid}, room=peer_sid)
    
    await sio.emit('room_joined', {'room_id': room_id, 'peers': room_sids}, room=sid)

@sio.event
async def offer(sid, data):
    """Forward WebRTC offer to peer"""
    peer_sid = active_connections[sid].get('peer_sid')
    if peer_sid:
        await sio.emit('offer', {'offer': data['offer'], 'from': sid}, room=peer_sid)

@sio.event
async def answer(sid, data):
    """Forward WebRTC answer to peer"""
    peer_sid = active_connections[sid].get('peer_sid')
    if peer_sid:
        await sio.emit('answer', {'answer': data['answer'], 'from': sid}, room=peer_sid)

@sio.event
async def ice_candidate(sid, data):
    """Forward ICE candidate to peer"""
    peer_sid = active_connections[sid].get('peer_sid')
    if peer_sid:
        await sio.emit('ice_candidate', {'candidate': data['candidate'], 'from': sid}, room=peer_sid)

@app.on_event("startup")
async def startup_event():
    """Создает начальные данные при запуске сервера"""
    from seed_data import create_super_admin
    from database import get_db
    
    try:
        db = await get_db()
        await create_super_admin(db)
        logger.info("✓ Проверка супер-админа завершена")
    except Exception as e:
        logger.error(f"Ошибка при создании супер-админа: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db()

# Export socket_app as the main ASGI application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8001)
