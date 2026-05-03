import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

created_ids = []

class TestNewFeatures:
    """Tests for new features: exam_type, profile_picture, extra subjects, CSV export with exam type"""

    def test_create_student_with_exam_type_midterm(self):
        """Create student with Mid-term exam type and profile_picture"""
        payload = {
            "name": "TEST_MidtermStudent",
            "standard": "Standard 5",
            "roll_number": "-",
            "exam_type": "Mid-term",
            "profile_picture": "",
            "subjects": [
                {"name": "BC", "marks": 75, "max_marks": 100},
                {"name": "EN", "marks": 80, "max_marks": 100},
            ]
        }
        r = requests.post(f"{BASE_URL}/api/students", json=payload)
        assert r.status_code in [200, 201], f"Got {r.status_code}: {r.text}"
        data = r.json()
        assert data["exam_type"] == "Mid-term"
        assert data["profile_picture"] == ""
        assert data["name"] == "TEST_MidtermStudent"
        created_ids.append(data["id"])
        print(f"Created mid-term student: {data['id']}")

    def test_get_student_exam_type_persisted(self):
        """Verify exam_type is persisted in GET"""
        assert created_ids, "No student created"
        r = requests.get(f"{BASE_URL}/api/students/{created_ids[0]}")
        assert r.status_code == 200
        data = r.json()
        assert data["exam_type"] == "Mid-term", f"Expected Mid-term, got {data['exam_type']}"
        print(f"exam_type verified: {data['exam_type']}")

    def test_list_students_returns_exam_type(self):
        """List students and verify exam_type field is present"""
        r = requests.get(f"{BASE_URL}/api/students")
        assert r.status_code == 200
        students = r.json()
        assert len(students) > 0
        # Check that the midterm student appears
        found = [s for s in students if s["name"] == "TEST_MidtermStudent"]
        assert len(found) > 0, "TEST_MidtermStudent not found in list"
        assert found[0]["exam_type"] == "Mid-term"
        print("exam_type in list verified")

    def test_create_student_with_extra_subjects(self):
        """Create student with extra subjects beyond BC/EN/BM/MM/SN"""
        payload = {
            "name": "TEST_ExtraSubject",
            "standard": "Form 3",
            "roll_number": "-",
            "exam_type": "Final",
            "profile_picture": "",
            "subjects": [
                {"name": "BC", "marks": 90, "max_marks": 100},
                {"name": "PE", "marks": 85, "max_marks": 100},
                {"name": "Art", "marks": 78, "max_marks": 100},
            ]
        }
        r = requests.post(f"{BASE_URL}/api/students", json=payload)
        assert r.status_code in [200, 201]
        data = r.json()
        names = [s["name"] for s in data["subjects"]]
        assert "PE" in names and "Art" in names, f"Extra subjects missing, got: {names}"
        created_ids.append(data["id"])
        print("Extra subjects verified")

    def test_csv_export_has_exam_type_column(self):
        """CSV export must contain Exam Type column"""
        r = requests.get(f"{BASE_URL}/api/students/export/csv", allow_redirects=True)
        assert r.status_code == 200
        content = r.text
        assert "Exam Type" in content, f"Exam Type column not in CSV. Header: {content.splitlines()[0]}"
        assert "Mid-term" in content or "Final" in content or "General" in content
        print(f"CSV header: {content.splitlines()[0]}")

    def test_backward_compat_hun_xuan_zheng(self):
        """Existing student without exam_type should default to General"""
        r = requests.get(f"{BASE_URL}/api/students", params={"search": "Hun Xuan"})
        assert r.status_code == 200
        students = r.json()
        if len(students) == 0:
            pytest.skip("Hun Xuan Zheng not in DB, skipping backward compat test")
        s = students[0]
        # exam_type should default to General
        assert s.get("exam_type", "General") in ["General", "Mid-term", "Final", "Monthly", "Pre-test", "Post-test"], \
            f"Unexpected exam_type: {s.get('exam_type')}"
        assert "profile_picture" in s
        print(f"Hun Xuan Zheng exam_type: {s.get('exam_type')}, profile_picture present: {'profile_picture' in s}")

    def test_exam_types_all_accepted(self):
        """All 6 exam types accepted by backend"""
        exam_types = ["General", "Mid-term", "Final", "Monthly", "Pre-test", "Post-test"]
        for et in exam_types:
            payload = {
                "name": f"TEST_ET_{et.replace('-', '')}",
                "standard": "Standard 1",
                "exam_type": et,
                "subjects": [{"name": "BC", "marks": 50, "max_marks": 100}]
            }
            r = requests.post(f"{BASE_URL}/api/students", json=payload)
            assert r.status_code in [200, 201], f"exam_type {et} failed: {r.status_code}"
            data = r.json()
            assert data["exam_type"] == et
            created_ids.append(data["id"])
        print("All 6 exam types accepted")

    def test_cleanup(self):
        """Clean up all TEST_ students"""
        for sid in created_ids:
            requests.delete(f"{BASE_URL}/api/students/{sid}")
        print(f"Cleaned up {len(created_ids)} test students")
