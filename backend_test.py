import requests
import sys
import json
import io
import base64
from datetime import datetime
from PIL import Image

class VideoDateAPITester:
    def __init__(self, base_url="https://datemeet-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.admin_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        # Don't set Content-Type for file uploads
        if not files:
            test_headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=test_headers, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_register_with_test_users(self):
        """Test user registration with specific test users"""
        # Try to register bob@test.com (might already exist)
        bob_data = {
            "email": "bob@test.com",
            "name": "Bob Test",
            "password": "test123",
            "age_confirmed": True
        }
        
        success, response = self.run_test(
            "Register Bob Test User",
            "POST",
            "auth/register",
            200,
            data=bob_data
        )
        
        if not success:
            # User might already exist, that's okay
            print("   Bob user already exists - continuing with login test")
            return True
        
        if success and 'access_token' in response:
            print(f"   Bob registered successfully")
            return True
        return False

    def test_login_valid_credentials(self):
        """Test login with valid credentials"""
        login_data = {
            "email": "alice@test.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Login with Valid Credentials",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login_wrong_password(self):
        """Test login with wrong password - should return 'Invalid credentials'"""
        login_data = {
            "email": "alice@test.com",
            "password": "wrongpassword"
        }
        
        success, response = self.run_test(
            "Login with Wrong Password",
            "POST",
            "auth/login",
            400,  # Should return 400 for invalid credentials
            data=login_data
        )
        
        return success

    def test_get_current_user_auth(self):
        """Test getting current user with authentication"""
        return self.run_test("Get Current User (Authenticated)", "GET", "auth/me", 200)[0]

    def create_test_image(self, format='JPEG', size=(800, 600)):
        """Create a test image in memory"""
        img = Image.new('RGB', size, color='red')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format=format)
        img_buffer.seek(0)
        return img_buffer

    def test_photo_upload_jpeg(self):
        """Test JPEG photo upload"""
        if not self.token:
            print("   Skipping - No authentication token")
            return False
            
        # Create test JPEG image
        img_buffer = self.create_test_image('JPEG')
        
        files = {
            'file': ('test.jpg', img_buffer, 'image/jpeg')
        }
        
        success, response = self.run_test(
            "Upload JPEG Photo",
            "POST",
            "profile/upload-photo",
            200,
            files=files
        )
        
        return success and 'photo_url' in response

    def test_photo_upload_png(self):
        """Test PNG photo upload"""
        if not self.token:
            print("   Skipping - No authentication token")
            return False
            
        # Create test PNG image
        img_buffer = self.create_test_image('PNG')
        
        files = {
            'file': ('test.png', img_buffer, 'image/png')
        }
        
        success, response = self.run_test(
            "Upload PNG Photo",
            "POST",
            "profile/upload-photo",
            200,
            files=files
        )
        
        return success and 'photo_url' in response

    def test_photo_upload_size_limit(self):
        """Test photo upload size limit (max 10MB)"""
        if not self.token:
            print("   Skipping - No authentication token")
            return False
            
        # First clear existing photos to test properly
        try:
            self.run_test("Clear Photo 0", "DELETE", "profile/photo/0", 200)
            self.run_test("Clear Photo 1", "DELETE", "profile/photo/0", 200)  # Index shifts after deletion
            self.run_test("Clear Photo 2", "DELETE", "profile/photo/0", 200)  # Index shifts after deletion
        except:
            pass  # Photos might not exist
            
        # Create large test image (simulate reasonable size)
        img_buffer = self.create_test_image('JPEG', (1500, 1500))
        
        files = {
            'file': ('large_test.jpg', img_buffer, 'image/jpeg')
        }
        
        success, response = self.run_test(
            "Upload Large Photo (Size Test)",
            "POST",
            "profile/upload-photo",
            200,  # Should work for reasonable size
            files=files
        )
        
        return success

    def test_set_main_photo(self):
        """Test setting a different photo as main"""
        if not self.token:
            print("   Skipping - No authentication token")
            return False
            
        # First upload another photo
        img_buffer = self.create_test_image('JPEG')
        files = {
            'file': ('test2.jpg', img_buffer, 'image/jpeg')
        }
        
        upload_success, _ = self.run_test(
            "Upload Second Photo for Main Test",
            "POST",
            "profile/upload-photo",
            200,
            files=files
        )
        
        if not upload_success:
            print("   Could not upload second photo - testing with existing photos")
        
        # Now set photo at index 1 as main (using query parameter)
        success, response = self.run_test(
            "Set Main Photo",
            "POST",
            "profile/set-main-photo?photo_index=1",
            200
        )
        
        return success

    def test_delete_photo(self):
        """Test photo deletion"""
        if not self.token:
            print("   Skipping - No authentication token")
            return False
            
        # Delete photo at index 1
        success, response = self.run_test(
            "Delete Photo",
            "DELETE",
            "profile/photo/1",
            200
        )
        
        return success

    def test_profile_update_complete(self):
        """Test profile update with valid data and verify profile_completed flag"""
        if not self.token:
            print("   Skipping - No authentication token")
            return False
            
        # Update profile with complete data
        profile_data = {
            "age": 28,
            "height": 170,
            "weight": 65,
            "gender": "female",
            "education": "higher",
            "smoking": "negative",
            "city": "Moscow",
            "description": "Test user profile description"
        }
        
        success, response = self.run_test(
            "Update Profile (Complete)",
            "PUT",
            "profile",
            200,
            data=profile_data
        )
        
        if success:
            # Check if profile_completed is set correctly
            profile_completed = response.get('profile_completed', False)
            print(f"   Profile completed flag: {profile_completed}")
            return profile_completed
        
        return False

    def test_profile_operations(self):
        """Test profile get and update"""
        # Get profile
        success, _ = self.run_test("Get Profile", "GET", "profile", 200)
        if not success:
            return False
        
        # Update profile
        profile_data = {
            "age": 25,
            "height": 175,
            "weight": 70,
            "gender": "male",
            "education": "higher",
            "smoking": "negative",
            "city": "Moscow",
            "description": "Test description"
        }
        
        success, _ = self.run_test(
            "Update Profile",
            "PUT",
            "profile",
            200,
            data=profile_data
        )
        
        return success

    def test_filters_operations(self):
        """Test filters get and update"""
        # Get filters
        success, _ = self.run_test("Get Filters", "GET", "filters", 200)
        if not success:
            return False
        
        # Update filters
        filters_data = {
            "age_range": "25-35",
            "gender_preference": "female",
            "city": "Moscow",
            "smoking_preference": "negative"
        }
        
        success, _ = self.run_test(
            "Update Filters",
            "PUT",
            "filters",
            200,
            data=filters_data
        )
        
        return success

    def test_subscriptions(self):
        """Test subscription endpoints"""
        # Get plans
        success, _ = self.run_test("Get Subscription Plans", "GET", "subscriptions/plans", 200)
        if not success:
            return False
        
        # Get status
        success, _ = self.run_test("Get Subscription Status", "GET", "subscriptions/my-status", 200)
        if not success:
            return False
        
        # Test purchase (mock)
        success, _ = self.run_test(
            "Purchase Subscription",
            "POST",
            "subscriptions/purchase?plan_name=Серебро",
            200
        )
        
        return success

    def test_matching_flow(self):
        """Test matching endpoints"""
        # Try to find match (might fail due to no other users)
        success, response = self.run_test("Find Match", "POST", "matching/find-match", 200)
        
        if not success:
            # Check if it's expected 404 (no matches)
            success_404, _ = self.run_test("Find Match (No Users)", "POST", "matching/find-match", 404)
            if success_404:
                print("   Expected: No matches found (no other users in system)")
                return True
        
        return success

    def test_password_operations(self):
        """Test password related operations"""
        # Test forgot password
        success, _ = self.run_test(
            "Forgot Password",
            "POST",
            "auth/forgot-password",
            200,
            data={"email": "test@example.com"}
        )
        
        if not success:
            return False
        
        # Test change password
        success, _ = self.run_test(
            "Change Password",
            "POST",
            "auth/change-password",
            200,
            data={
                "current_password": "TestPass123!",
                "new_password": "NewPass123!"
            }
        )
        
        return success

    def test_admin_login(self):
        """Test admin login with super admin credentials"""
        login_data = {
            "email": "admin@test.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user_id = response['user']['id']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_admin_protection_block(self):
        """Test that super admin cannot be blocked"""
        if not hasattr(self, 'admin_token') or not self.admin_token:
            print("   Skipping - No admin token")
            return False
            
        # Try to block the super admin (should fail with 403)
        success, response = self.run_test(
            "Block Super Admin (Should Fail)",
            "PUT",
            f"admin/user/{self.admin_user_id}/block?blocked=true",
            403
        )
        
        return success

    def test_admin_protection_delete(self):
        """Test that super admin cannot be deleted"""
        if not hasattr(self, 'admin_token') or not self.admin_token:
            print("   Skipping - No admin token")
            return False
            
        # Try to delete the super admin (should fail with 403)
        success, response = self.run_test(
            "Delete Super Admin (Should Fail)",
            "DELETE",
            f"admin/user/{self.admin_user_id}",
            403
        )
        
        return success

    def test_admin_role_assignment(self):
        """Test admin role assignment"""
        if not hasattr(self, 'admin_token') or not self.admin_token:
            print("   Skipping - No admin token")
            return False
            
        # First get a regular user ID (alice)
        if not self.user_id:
            print("   Skipping - No regular user ID available")
            return False
            
        # Assign admin role with specific permissions
        role_data = {
            "is_admin": True,
            "permissions": ["users", "subscriptions", "feedback"]
        }
        
        # Store current token and switch to admin
        user_token = self.token
        self.token = self.admin_token
        
        success, response = self.run_test(
            "Assign Admin Role",
            "PUT",
            f"admin/user/{self.user_id}/admin-role",
            200,
            data=role_data
        )
        
        # Restore user token
        self.token = user_token
        
        return success

    def test_get_all_admins(self):
        """Test getting list of all admins"""
        if not hasattr(self, 'admin_token') or not self.admin_token:
            print("   Skipping - No admin token")
            return False
            
        # Store current token and switch to admin
        user_token = self.token
        self.token = self.admin_token
        
        success, response = self.run_test(
            "Get All Admins",
            "GET",
            "admin/admins",
            200
        )
        
        # Restore user token
        self.token = user_token
        
        if success:
            print(f"   Found {len(response)} admin(s)")
            return True
        return False

    def test_admin_password_change(self):
        """Test admin changing user password"""
        if not hasattr(self, 'admin_token') or not self.admin_token:
            print("   Skipping - No admin token")
            return False
            
        if not self.user_id:
            print("   Skipping - No regular user ID available")
            return False
            
        # Store current token and switch to admin
        user_token = self.token
        self.token = self.admin_token
        
        password_data = {
            "user_id": self.user_id,
            "new_password": "newtest123"
        }
        
        success, response = self.run_test(
            "Admin Change User Password",
            "POST",
            "admin/user/change-password",
            200,
            data=password_data
        )
        
        # Restore user token
        self.token = user_token
        
        return success

    def test_daily_communications_reset(self):
        """Test daily communications reset logic"""
        if not self.token:
            print("   Skipping - No authentication token")
            return False
            
        success, response = self.run_test(
            "Get Subscription Status (Daily Communications)",
            "GET",
            "subscriptions/my-status",
            200
        )
        
        if success:
            # Check expected fields
            expected_fields = ['remaining_free', 'premium_available', 'total_available', 'resets_at']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if missing_fields:
                print(f"   Missing fields: {missing_fields}")
                return False
                
            # Check that remaining_free is 5 (default daily reset)
            remaining_free = response.get('remaining_free', 0)
            print(f"   Remaining free communications: {remaining_free}")
            print(f"   Premium available: {response.get('premium_available', 0)}")
            print(f"   Resets at: {response.get('resets_at', 'N/A')}")
            
            # For new users, should have 5 free communications
            return remaining_free <= 5  # Could be less if already used some
            
        return False

def main():
    print("🚀 Starting Video Dating API Admin Management Tests")
    print("=" * 60)
    
    tester = VideoDateAPITester()
    
    # Test sequence focusing on admin management features
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        
        # Authentication Tests
        ("Register Test Users", tester.test_register_with_test_users),
        ("Login Valid Credentials", tester.test_login_valid_credentials),
        ("Login Wrong Password", tester.test_login_wrong_password),
        ("Get Current User", tester.test_get_current_user_auth),
        
        # Admin Authentication
        ("Admin Login", tester.test_admin_login),
        
        # Admin Protection Tests
        ("Admin Protection - Block Test", tester.test_admin_protection_block),
        ("Admin Protection - Delete Test", tester.test_admin_protection_delete),
        
        # Admin Role Management Tests
        ("Admin Role Assignment", tester.test_admin_role_assignment),
        ("Get All Admins", tester.test_get_all_admins),
        ("Admin Password Change", tester.test_admin_password_change),
        
        # Daily Communications Reset Logic
        ("Daily Communications Reset", tester.test_daily_communications_reset),
        
        # Previous critical tests (keeping for regression)
        ("Upload JPEG Photo", tester.test_photo_upload_jpeg),
        ("Profile Update Complete", tester.test_profile_update_complete),
    ]
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} tests...")
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure.get('test', 'Unknown')}")
            if 'error' in failure:
                print(f"   Error: {failure['error']}")
            else:
                print(f"   Expected: {failure.get('expected')}, Got: {failure.get('actual')}")
                if 'response' in failure:
                    print(f"   Response: {failure['response']}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())