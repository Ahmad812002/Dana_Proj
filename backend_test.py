#!/usr/bin/env python3
"""
VPerfumes Order Tracking System - Backend API Tests
Tests all endpoints including authentication, order management, and admin features.
"""

import requests
import sys
import json
from datetime import datetime
import time

class VPerfumesAPITester:
    def __init__(self, base_url="https://order-status-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.company_token = None
        self.company_user_id = None
        self.test_order_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = f"{status} - {name}"
        if details:
            result += f" | {details}"
        
        print(result)
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })
        return success

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_api_health(self):
        """Test API root endpoint"""
        print("\n🔍 Testing API Health...")
        success, response = self.make_request('GET', '')
        
        if success and response.get('message') == 'VPerfumes Order Tracking API':
            return self.log_test("API Health Check", True, "API is responding")
        else:
            return self.log_test("API Health Check", False, f"Response: {response}")

    def test_admin_login(self):
        """Test admin login with default credentials"""
        print("\n🔍 Testing Admin Login...")
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data)
        
        if success and 'token' in response and response['user']['role'] == 'admin':
            self.admin_token = response['token']
            return self.log_test("Admin Login", True, f"Admin user: {response['user']['username']}")
        else:
            return self.log_test("Admin Login", False, f"Response: {response}")

    def test_create_company(self):
        """Test admin creating a new company account"""
        print("\n🔍 Testing Company Creation...")
        
        if not self.admin_token:
            return self.log_test("Company Creation", False, "No admin token available")
        
        timestamp = int(time.time())
        company_data = {
            "username": f"testcompany_{timestamp}",
            "password": "company123",
            "role": "company",
            "company_name": f"Test Delivery Company {timestamp}"
        }
        
        success, response = self.make_request('POST', 'auth/register', company_data, self.admin_token, 200)
        
        if success and response.get('message') == 'User created successfully':
            self.test_company_username = company_data['username']
            self.test_company_password = company_data['password']
            self.test_company_name = company_data['company_name']
            return self.log_test("Company Creation", True, f"Created company: {company_data['company_name']}")
        else:
            return self.log_test("Company Creation", False, f"Response: {response}")

    def test_company_login(self):
        """Test company login"""
        print("\n🔍 Testing Company Login...")
        
        if not hasattr(self, 'test_company_username'):
            return self.log_test("Company Login", False, "No test company created")
        
        login_data = {
            "username": self.test_company_username,
            "password": self.test_company_password
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data)
        
        if success and 'token' in response and response['user']['role'] == 'company':
            self.company_token = response['token']
            self.company_user_id = response['user']['id']
            return self.log_test("Company Login", True, f"Company: {response['user']['company_name']}")
        else:
            return self.log_test("Company Login", False, f"Response: {response}")

    def test_create_order(self):
        """Test company creating an order"""
        print("\n🔍 Testing Order Creation...")
        
        if not self.company_token:
            return self.log_test("Order Creation", False, "No company token available")
        
        timestamp = int(time.time())
        order_data = {
            "order_number": f"ORD-{timestamp}",
            "customer_name": "أحمد محمد",
            "customer_phone": "0599123456",
            "delivery_area": "رام الله",
            "delivery_cost": 15.50,
            "status": "جاري",
            "order_date": "2025-01-15",
            "notes": "طلب تجريبي للاختبار"
        }
        
        success, response = self.make_request('POST', 'orders', order_data, self.company_token, 200)
        
        if success and 'id' in response:
            self.test_order_id = response['id']
            return self.log_test("Order Creation", True, f"Order ID: {response['id']}")
        else:
            return self.log_test("Order Creation", False, f"Response: {response}")

    def test_get_orders_company(self):
        """Test company getting their orders"""
        print("\n🔍 Testing Company Get Orders...")
        
        if not self.company_token:
            return self.log_test("Company Get Orders", False, "No company token available")
        
        success, response = self.make_request('GET', 'orders', token=self.company_token)
        
        if success and isinstance(response, list):
            order_count = len(response)
            return self.log_test("Company Get Orders", True, f"Retrieved {order_count} orders")
        else:
            return self.log_test("Company Get Orders", False, f"Response: {response}")

    def test_update_order(self):
        """Test company updating an order"""
        print("\n🔍 Testing Order Update...")
        
        if not self.company_token or not self.test_order_id:
            return self.log_test("Order Update", False, "No company token or order ID available")
        
        update_data = {
            "status": "تم",
            "notes": "تم التوصيل بنجاح - اختبار"
        }
        
        success, response = self.make_request('PUT', f'orders/{self.test_order_id}', update_data, self.company_token)
        
        if success and response.get('status') == 'تم':
            return self.log_test("Order Update", True, f"Updated order status to: {response['status']}")
        else:
            return self.log_test("Order Update", False, f"Response: {response}")

    def test_get_orders_admin(self):
        """Test admin getting all orders"""
        print("\n🔍 Testing Admin Get All Orders...")
        
        if not self.admin_token:
            return self.log_test("Admin Get All Orders", False, "No admin token available")
        
        success, response = self.make_request('GET', 'orders', token=self.admin_token)
        
        if success and isinstance(response, list):
            order_count = len(response)
            return self.log_test("Admin Get All Orders", True, f"Retrieved {order_count} orders from all companies")
        else:
            return self.log_test("Admin Get All Orders", False, f"Response: {response}")

    def test_order_history(self):
        """Test admin getting order history"""
        print("\n🔍 Testing Order History...")
        
        if not self.admin_token or not self.test_order_id:
            return self.log_test("Order History", False, "No admin token or order ID available")
        
        success, response = self.make_request('GET', f'orders/{self.test_order_id}/history', token=self.admin_token)
        
        if success and isinstance(response, list):
            history_count = len(response)
            return self.log_test("Order History", True, f"Retrieved {history_count} history entries")
        else:
            return self.log_test("Order History", False, f"Response: {response}")

    def test_stats_company(self):
        """Test company getting their stats"""
        print("\n🔍 Testing Company Stats...")
        
        if not self.company_token:
            return self.log_test("Company Stats", False, "No company token available")
        
        success, response = self.make_request('GET', 'stats', token=self.company_token)
        
        if success and 'total' in response:
            return self.log_test("Company Stats", True, f"Stats: {response}")
        else:
            return self.log_test("Company Stats", False, f"Response: {response}")

    def test_stats_admin(self):
        """Test admin getting global stats"""
        print("\n🔍 Testing Admin Stats...")
        
        if not self.admin_token:
            return self.log_test("Admin Stats", False, "No admin token available")
        
        success, response = self.make_request('GET', 'stats', token=self.admin_token)
        
        if success and 'total' in response:
            return self.log_test("Admin Stats", True, f"Global stats: {response}")
        else:
            return self.log_test("Admin Stats", False, f"Response: {response}")

    def test_delete_order(self):
        """Test company deleting an order"""
        print("\n🔍 Testing Order Deletion...")
        
        if not self.company_token or not self.test_order_id:
            return self.log_test("Order Deletion", False, "No company token or order ID available")
        
        success, response = self.make_request('DELETE', f'orders/{self.test_order_id}', token=self.company_token)
        
        if success and 'message' in response:
            return self.log_test("Order Deletion", True, f"Message: {response['message']}")
        else:
            return self.log_test("Order Deletion", False, f"Response: {response}")

    def test_unauthorized_access(self):
        """Test unauthorized access scenarios"""
        print("\n🔍 Testing Unauthorized Access...")
        
        # Test accessing orders without token
        success, response = self.make_request('GET', 'orders', expected_status=403)
        unauthorized_test1 = success  # Should get 403 (FastAPI HTTPBearer behavior)
        
        # Test company trying to create another company
        if self.company_token:
            company_data = {
                "username": "unauthorized_company",
                "password": "test123",
                "role": "company",
                "company_name": "Unauthorized Company"
            }
            success, response = self.make_request('POST', 'auth/register', company_data, self.company_token, 403)
            unauthorized_test2 = success  # Should get 403
        else:
            unauthorized_test2 = False
        
        overall_success = unauthorized_test1 and unauthorized_test2
        return self.log_test("Unauthorized Access", overall_success, "Proper access control enforced")

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("🚀 VPerfumes Backend API Testing Started")
        print("=" * 60)
        
        # Core API tests
        self.test_api_health()
        self.test_admin_login()
        self.test_create_company()
        self.test_company_login()
        
        # Order management tests
        self.test_create_order()
        self.test_get_orders_company()
        self.test_update_order()
        self.test_get_orders_admin()
        self.test_order_history()
        
        # Statistics tests
        self.test_stats_company()
        self.test_stats_admin()
        
        # Security tests
        self.test_unauthorized_access()
        
        # Cleanup
        self.test_delete_order()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed. Check the details above.")
            return 1

def main():
    """Main test execution"""
    tester = VPerfumesAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())