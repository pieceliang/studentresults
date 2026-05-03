import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test student ID for cleanup
created_ids = []

class TestStudentCRUD:
    """Student result recorder API tests"""

    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/students")
        assert r.status_code == 200
        print("API reachable")

    def test_create_student_no_roll_number(self):
        """Create student with fixed 5 subjects, roll_number set to '-'"""
        payload = {
            "name": "TEST_Alice",
            "standard": "Class 5",
            "roll_number": "-",
            "subjects": [
                {"name": "BC", "marks": 85, "max_marks": 100},
                {"name": "EN", "marks": 90, "max_marks": 100},
                {"name": "BM", "marks": 78, "max_marks": 100},
                {"name": "MM", "marks": 92, "max_marks": 100},
                {"name": "SN", "marks": 88, "max_marks": 100},
            ]
        }
        r = requests.post(f"{BASE_URL}/api/students", json=payload)
        assert r.status_code in [200, 201], f"Expected 200/201, got {r.status_code}: {r.text}"
        data = r.json()
        assert data["name"] == "TEST_Alice"
        assert data["standard"] == "Class 5"
        assert data["roll_number"] == "-"
        assert len(data["subjects"]) == 5
        created_ids.append(data["id"])
        print(f"Created student: {data['id']}")

    def test_get_student_verifies_subjects(self):
        """Fetch student and verify 5 subjects"""
        assert created_ids, "No student created yet"
        r = requests.get(f"{BASE_URL}/api/students/{created_ids[0]}")
        assert r.status_code == 200
        data = r.json()
        subject_names = [s["name"] for s in data["subjects"]]
        for subj in ["BC", "EN", "BM", "MM", "SN"]:
            assert subj in subject_names, f"Subject {subj} missing"
        print(f"Subjects verified: {subject_names}")

    def test_update_student_marks(self):
        """Update marks and verify persistence"""
        assert created_ids, "No student created yet"
        payload = {
            "name": "TEST_Alice",
            "standard": "Class 5",
            "roll_number": "-",
            "subjects": [
                {"name": "BC", "marks": 95, "max_marks": 100},
                {"name": "EN", "marks": 88, "max_marks": 100},
                {"name": "BM", "marks": 72, "max_marks": 100},
                {"name": "MM", "marks": 99, "max_marks": 100},
                {"name": "SN", "marks": 80, "max_marks": 100},
            ]
        }
        r = requests.put(f"{BASE_URL}/api/students/{created_ids[0]}", json=payload)
        assert r.status_code == 200
        # Verify with GET
        r2 = requests.get(f"{BASE_URL}/api/students/{created_ids[0]}")
        data = r2.json()
        bc = next(s for s in data["subjects"] if s["name"] == "BC")
        assert bc["marks"] == 95, f"Expected 95, got {bc['marks']}"
        print("Update verified")

    def test_list_students(self):
        """List students returns array"""
        r = requests.get(f"{BASE_URL}/api/students")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"Listed {len(data)} students")

    def test_export_csv(self):
        """CSV export endpoint"""
        r = requests.get(f"{BASE_URL}/api/students/export/csv")
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "") or len(r.content) > 0
        print("CSV export working")

    def test_standards_endpoint(self):
        """Standards list endpoint"""
        r = requests.get(f"{BASE_URL}/api/standards")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"Standards: {data}")

    def test_delete_student(self):
        """Delete student and verify 404"""
        assert created_ids, "No student created yet"
        r = requests.delete(f"{BASE_URL}/api/students/{created_ids[0]}")
        assert r.status_code in [200, 204]
        # Verify gone
        r2 = requests.get(f"{BASE_URL}/api/students/{created_ids[0]}")
        assert r2.status_code == 404
        print("Delete verified")
