from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, BeforeValidator
from typing import List, Optional, Annotated
from datetime import datetime, timezone
import csv
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class Subject(BaseModel):
    name: str
    marks: float
    max_marks: float = 100.0


class StudentBase(BaseModel):
    name: str
    standard: str
    roll_number: str = "-"
    exam_type: str = "General"
    gender: str = ""
    school: str = ""
    profile_picture: str = ""
    subjects: List[Subject] = []


class StudentCreate(StudentBase):
    pass


class StudentUpdate(StudentBase):
    pass


class StudentResponse(BaseModel):
    id: str
    name: str
    standard: str
    roll_number: str = "-"
    exam_type: str = "General"
    gender: str = ""
    school: str = ""
    profile_picture: str = ""
    subjects: List[Subject] = []
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_mongo(cls, doc):
        return cls(
            id=str(doc['_id']),
            name=doc['name'],
            standard=doc['standard'],
            roll_number=doc.get('roll_number', '-'),
            exam_type=doc.get('exam_type', 'General'),
            gender=doc.get('gender', ''),
            school=doc.get('school', ''),
            profile_picture=doc.get('profile_picture', ''),
            subjects=doc.get('subjects', []),
            created_at=doc['created_at'],
            updated_at=doc['updated_at']
        )


def calc_average(subjects):
    if not subjects:
        return 0.0
    return sum(s['marks'] / s['max_marks'] * 100 for s in subjects) / len(subjects)


GRADE_MAP = [(90, 'A+'), (80, 'A'), (70, 'B+'), (60, 'B'), (50, 'C'), (40, 'D'), (0, 'F')]


def get_grade(pct):
    return next(g for threshold, g in GRADE_MAP if pct >= threshold)


@api_router.get("/")
async def root():
    return {"message": "Student Result Recorder API"}


@api_router.get("/stats")
async def get_stats():
    students = await db.students.find({}).to_list(1000)
    total = len(students)

    if total == 0:
        return {"total_students": 0, "average_score": 0.0, "top_performers": [], "recent_students": []}

    enriched = []
    for s in students:
        avg = calc_average(s.get('subjects', []))
        enriched.append({
            'id': str(s['_id']),
            'name': s['name'],
            'standard': s['standard'],
            'exam_type': s.get('exam_type', 'General'),
            'profile_picture': s.get('profile_picture', ''),
            'average': round(avg, 1),
            'subjects_count': len(s.get('subjects', [])),
            'created_at': s.get('created_at')
        })

    overall_avg = sum(e['average'] for e in enriched) / total
    top_performers = sorted(enriched, key=lambda x: x['average'], reverse=True)[:5]
    recent = sorted(enriched, key=lambda x: x.get('created_at') or datetime.min, reverse=True)[:5]

    return {
        "total_students": total,
        "average_score": round(overall_avg, 1),
        "top_performers": top_performers,
        "recent_students": recent
    }


@api_router.get("/students/export/csv")
async def export_csv(standard: Optional[str] = Query(None)):
    query = {}
    if standard:
        query["standard"] = standard
    students = await db.students.find(query).sort("name", 1).to_list(1000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Student Name', 'Gender', 'School', 'Standard', 'Exam Type', 'Subject', 'Marks', 'Max Marks', 'Percentage', 'Grade'])

    for s in students:
        for sub in s.get('subjects', []):
            pct = round(sub['marks'] / sub['max_marks'] * 100, 1)
            grade = get_grade(pct)
            writer.writerow([s['name'], s.get('gender', ''), s.get('school', ''), s['standard'], s.get('exam_type', 'General'), sub['name'], sub['marks'], sub['max_marks'], f"{pct}%", grade])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_results.csv"}
    )


@api_router.get("/progress")
async def get_progress(
    name: str = Query(...),
    school: Optional[str] = Query(None)
):
    import re
    query = {"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}
    if school:
        query["school"] = school
    students = await db.students.find(query).sort("created_at", 1).to_list(100)
    return [StudentResponse.from_mongo(s) for s in students]


@api_router.get("/standards")
async def get_standards():
    standards = await db.students.distinct("standard")
    return sorted(standards)


@api_router.get("/students")
async def list_students(
    search: Optional[str] = Query(None),
    standard: Optional[str] = Query(None)
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"roll_number": {"$regex": search, "$options": "i"}}
        ]
    if standard:
        query["standard"] = standard

    students = await db.students.find(query).sort("created_at", -1).to_list(1000)
    return [StudentResponse.from_mongo(s) for s in students]


@api_router.post("/students", status_code=201)
async def create_student(student: StudentCreate):
    now = datetime.now(timezone.utc)
    doc = student.model_dump()
    doc['created_at'] = now
    doc['updated_at'] = now
    result = await db.students.insert_one(doc)
    created = await db.students.find_one({"_id": result.inserted_id})
    return StudentResponse.from_mongo(created)


@api_router.get("/students/{student_id}")
async def get_student(student_id: str):
    try:
        obj_id = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")

    student = await db.students.find_one({"_id": obj_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentResponse.from_mongo(student)


@api_router.put("/students/{student_id}")
async def update_student(student_id: str, student: StudentUpdate):
    try:
        obj_id = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")

    now = datetime.now(timezone.utc)
    doc = student.model_dump()
    doc['updated_at'] = now

    result = await db.students.update_one({"_id": obj_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")

    updated = await db.students.find_one({"_id": obj_id})
    return StudentResponse.from_mongo(updated)


@api_router.delete("/students/{student_id}", status_code=204)
async def delete_student(student_id: str):
    try:
        obj_id = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")

    result = await db.students.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
