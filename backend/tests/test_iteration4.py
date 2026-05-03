"""
Iteration 4: Backend tests for gender/school fields, /api/progress endpoint, CSV with Gender+School, overview filter
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestNewFields:
    """Test gender/school fields in student CRUD"""

    def test_create_student_with_gender_school(self):
        payload = {
            "name": "TEST_GenderSchool",
            "standard": "Standard 3",
            "exam_type": "Mid-term",
            "gender": "Female",
            "school": "SJKC Yu Hua",
            "subjects": [{"name": "BC", "marks": 85, "max_marks": 100}]
        }
        r = requests.post(f"{BASE_URL}/api/students", json=payload)
        assert r.status_code == 201
        data = r.json()
        assert data["gender"] == "Female"
        assert data["school"] == "SJKC Yu Hua"
        assert data["exam_type"] == "Mid-term"
        # cleanup
        requests.delete(f"{BASE_URL}/api/students/{data['id']}")

    def test_create_student_male_gender(self):
        payload = {
            "name": "TEST_MaleStudent",
            "standard": "Standard 4",
            "gender": "Male",
            "school": "SJKC Bandar Kajang 2",
            "subjects": [{"name": "EN", "marks": 70, "max_marks": 100}]
        }
        r = requests.post(f"{BASE_URL}/api/students", json=payload)
        assert r.status_code == 201
        data = r.json()
        assert data["gender"] == "Male"
        assert data["school"] == "SJKC Bandar Kajang 2"
        requests.delete(f"{BASE_URL}/api/students/{data['id']}")


class TestProgressEndpoint:
    """Test /api/progress endpoint"""

    created_ids = []

    def setup_method(self):
        self.__class__.created_ids = []

    def test_progress_endpoint_returns_records(self):
        # Create 2 records for same student name
        name = "TEST_ProgressStudent"
        for exam in ["Mid-term", "Final"]:
            r = requests.post(f"{BASE_URL}/api/students", json={
                "name": name,
                "standard": "Standard 5",
                "exam_type": exam,
                "school": "SJKC Yu Hua",
                "subjects": [{"name": "BC", "marks": 75 if exam == "Mid-term" else 90, "max_marks": 100}]
            })
            assert r.status_code == 201
            self.__class__.created_ids.append(r.json()["id"])

        # Test progress endpoint
        r = requests.get(f"{BASE_URL}/api/progress", params={"name": name})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 2
        exam_types = [d["exam_type"] for d in data]
        assert "Mid-term" in exam_types
        assert "Final" in exam_types

        # cleanup
        for sid in self.__class__.created_ids:
            requests.delete(f"{BASE_URL}/api/students/{sid}")

    def test_progress_endpoint_with_school_filter(self):
        name = "TEST_ProgressSchool"
        for school, exam in [("SJKC Yu Hua", "Pre-test"), ("SJKC Sin Ming", "Post-test")]:
            r = requests.post(f"{BASE_URL}/api/students", json={
                "name": name,
                "standard": "Standard 5",
                "exam_type": exam,
                "school": school,
                "subjects": [{"name": "MM", "marks": 80, "max_marks": 100}]
            })
            assert r.status_code == 201
            self.__class__.created_ids.append(r.json()["id"])

        # With school filter, should return only 1
        r = requests.get(f"{BASE_URL}/api/progress", params={"name": name, "school": "SJKC Yu Hua"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1
        assert data[0]["school"] == "SJKC Yu Hua"

        # cleanup
        for sid in self.__class__.created_ids:
            requests.delete(f"{BASE_URL}/api/students/{sid}")

    def test_progress_name_required(self):
        r = requests.get(f"{BASE_URL}/api/progress")
        assert r.status_code == 422  # name is required


class TestCSVExport:
    """Test CSV has Gender and School columns"""

    def test_csv_has_gender_school_columns(self):
        # Create a student with gender+school
        r = requests.post(f"{BASE_URL}/api/students", json={
            "name": "TEST_CSVExport",
            "standard": "Standard 1",
            "gender": "Female",
            "school": "Others",
            "subjects": [{"name": "BC", "marks": 65, "max_marks": 100}]
        })
        assert r.status_code == 201
        sid = r.json()["id"]

        csv_r = requests.get(f"{BASE_URL}/api/students/export/csv")
        assert csv_r.status_code == 200
        content = csv_r.text
        assert "Gender" in content
        assert "School" in content
        assert "TEST_CSVExport" in content
        assert "Female" in content
        assert "Others" in content

        requests.delete(f"{BASE_URL}/api/students/{sid}")


class TestStudentsFilter:
    """Test /api/students?standard= filter for Overview"""

    def test_filter_by_standard(self):
        # Create student with unique standard
        r = requests.post(f"{BASE_URL}/api/students", json={
            "name": "TEST_FilterStd",
            "standard": "Form 3",
            "subjects": [{"name": "BC", "marks": 78, "max_marks": 100}]
        })
        assert r.status_code == 201
        sid = r.json()["id"]

        r2 = requests.get(f"{BASE_URL}/api/students", params={"standard": "Form 3"})
        assert r2.status_code == 200
        names = [s["name"] for s in r2.json()]
        assert "TEST_FilterStd" in names

        requests.delete(f"{BASE_URL}/api/students/{sid}")
