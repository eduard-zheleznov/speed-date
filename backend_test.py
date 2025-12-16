import requests
import sys
import json
from datetime import datetime

class VideoDateAPITester:
    def __init__(self, base_url="https://video-matches.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

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

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test_user_{timestamp}@example.com",
            "name": f"Test User {timestamp}",
            "password": "TestPass123!",
            "age_confirmed": True
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login(self):
        """Test user login with existing user"""
        # First register a user
        timestamp = datetime.now().strftime('%H%M%S')
        register_data = {
            "email": f"login_test_{timestamp}@example.com",
            "name": f"Login Test {timestamp}",
            "password": "TestPass123!",
            "age_confirmed": True
        }
        
        # Register first
        success, _ = self.run_test(
            "Register for Login Test",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if not success:
            return False
        
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return success and 'access_token' in response

    def test_get_current_user(self):
        """Test getting current user info"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)[0]

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

def main():
    print("🚀 Starting Video Dating API Tests")
    print("=" * 50)
    
    tester = VideoDateAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("User Registration", tester.test_register),
        ("User Login", tester.test_login),
        ("Get Current User", tester.test_get_current_user),
        ("Profile Operations", tester.test_profile_operations),
        ("Filters Operations", tester.test_filters_operations),
        ("Subscriptions", tester.test_subscriptions),
        ("Password Operations", tester.test_password_operations),
        ("Matching Flow", tester.test_matching_flow),
    ]
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} tests...")
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure.get('test', 'Unknown')}")
            if 'error' in failure:
                print(f"   Error: {failure['error']}")
            else:
                print(f"   Expected: {failure.get('expected')}, Got: {failure.get('actual')}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())