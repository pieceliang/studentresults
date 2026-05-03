import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Student CRUD tests

class TestHealthAndStats:
    def test_api_root(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200

    def test_stats_empty_or_valid(self):
        r = requests.get(f"{BASE_URL}/api/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total_students" in data
        assert "average_score" in data
        assert "top_performers" in data

    def test_standards_list(self):
        r = requests.get(f"{BASE_URL}/api/standards")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestStudentCRUD:
    student_id = None

    def test_create_student(self):
        payload = {
            "name": "TEST_Alice",
            "standard": "Grade 10",
            "roll_number": "TEST001",
            "subjects": [
                {"name": "Math", "marks": 90, "max_marks": 100},
                {"name": "Science", "marks": 80, "max_marks": 100}
            ]
        }
        r = requests.post(f"{BASE_URL}/api/students", json=payload)
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "TEST_Alice"
        assert data["standard"] == "Grade 10"
        assert "id" in data
        assert len(data["subjects"]) == 2
        TestStudentCRUD.student_id = data["id"]

    def test_get_student(self):
        assert TestStudentCRUD.student_id is not None
        r = requests.get(f"{BASE_URL}/api/students/{TestStudentCRUD.student_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "TEST_Alice"

    def test_list_students(self):
        r = requests.get(f"{BASE_URL}/api/students")
        assert r.status_code == 200
        students = r.json()
        assert isinstance(students, list)
        ids = [s["id"] for s in students]
        assert TestStudentCRUD.student_id in ids

    def test_search_students(self):
        r = requests.get(f"{BASE_URL}/api/students?search=TEST_Alice")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert data[0]["name"] == "TEST_Alice"

    def test_filter_by_standard(self):
        r = requests.get(f"{BASE_URL}/api/students?standard=Grade 10")
        assert r.status_code == 200
        data = r.json()
        assert all(s["standard"] == "Grade 10" for s in data)

    def test_update_student(self):
        assert TestStudentCRUD.student_id is not None
        payload = {
            "name": "TEST_Alice Updated",
            "standard": "Grade 10",
            "roll_number": "TEST001",
            "subjects": [
                {"name": "Math", "marks": 95, "max_marks": 100}
            ]
        }
        r = requests.put(f"{BASE_URL}/api/students/{TestStudentCRUD.student_id}", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "TEST_Alice Updated"
        assert data["subjects"][0]["marks"] == 95

    def test_export_csv(self):
        r = requests.get(f"{BASE_URL}/api/students/export/csv")
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")

    def test_delete_student(self):
        assert TestStudentCRUD.student_id is not None
        r = requests.delete(f"{BASE_URL}/api/students/{TestStudentCRUD.student_id}")
        assert r.status_code == 204

    def test_get_deleted_student_returns_404(self):
        r = requests.get(f"{BASE_URL}/api/students/{TestStudentCRUD.student_id}")
        assert r.status_code == 404

    def test_invalid_student_id(self):
        r = requests.get(f"{BASE_URL}/api/students/invalid_id")
        assert r.status_code == 400

    def test_stats_after_create(self):
        # Create student to verify stats updates
        payload = {
            "name": "TEST_StatsCheck",
            "standard": "Grade 9",
            "roll_number": "TEST002",
            "subjects": [{"name": "English", "marks": 85, "max_marks": 100}]
        }
        r = requests.post(f"{BASE_URL}/api/students", json=payload)
        assert r.status_code == 201
        sid = r.json()["id"]

        stats = requests.get(f"{BASE_URL}/api/stats").json()
        assert stats["total_students"] >= 1
        assert stats["average_score"] > 0

        # Cleanup
        requests.delete(f"{BASE_URL}/api/students/{sid}")
