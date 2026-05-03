# ResultsHub - Student Result Recorder PRD

## Original Problem Statement
"I want a student result recorder"

## User Choices & Configuration
- **Users**: Teachers/Admins (no login). Students can view own results.
- **Subjects**: Fixed 5 subjects (BC, EN, BM, MM, SN) + custom extras
- **Fields**: name, standard, gender, school, exam_type, profile_picture, subjects[] with per-subject comment
- **Features**: Add/edit/delete/search/filter, CSV export, CSV batch import, printable result slip, class overview, progress tracker
- **Auth**: No login required
- **Design**: Green emerald palette, cute style, Nunito font, sound effects

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn UI + recharts (port 3000)
- **Backend**: FastAPI + Motor async MongoDB (port 8001)
- **Database**: MongoDB

## VSS Grading Rubric (custom)
| % | Grade | Label |
|---|-------|-------|
| 82–100 | A | Excellent |
| 66–81  | B | Credit |
| 50–65  | C | Good |
| 35–49  | D | Satisfactory |
| 20–34  | E | Meets Minimum Requirement |
| 0–19   | F | Does Not Meet Minimum Requirement |

## Backend API (server.py)
- `GET /api/stats` — dashboard stats
- `GET /api/students` — list (search + standard filter)
- `POST /api/students` — create (subjects now accept `comment`)
- `GET /api/students/{id}` — detail
- `PUT /api/students/{id}` — update
- `DELETE /api/students/{id}` — delete
- `GET /api/students/export/csv` — export (includes Comment column)
- `GET /api/students/import/template` — downloadable CSV template
- `POST /api/students/import` — multipart CSV batch import with {imported, errors}
- `GET /api/standards` — unique standards list
- `GET /api/progress?name=&school=` — records for a student for progress tracking

## Data Model (Subject)
```
{ name, marks, max_marks=100, comment: "" }
```

## Frontend
- **/** Dashboard — branded hero, stats, top performers, recent students
- **/students** — Import CSV + Export CSV + Add Student, list with profile pic, grade badges
- **/students/:id** — Subject cards (italic comment below), bar chart, progress tracker, print slip (with italic comment line below each subject)
- **/overview** — Standard + Exam + **School** filter, color-coded comparison table

### Components
- Navbar (new logo: kn6egpfc_11.png), Dashboard (new logo), StudentList, StudentForm, StudentDetail, ClassOverview, ProgressTracker, **BatchImport (new)**, sounds.js
- utils/grading.js — shared VSS rubric (GRADE_SCALE, getGradeByPct, getGradeInfo, autoComment)

## CHANGELOG
### Feb 03, 2026 (iter-5)
- New navbar/dashboard/print logo URL
- Custom school text input when "Others" is selected
- Custom exam type text input when "Others" is selected
- Per-subject comments with 💬 toggle + ✨ auto-generate from VSS rubric
- Replaced 90=A+ grade map with VSS rubric (82–100 A … 0–19 F)
- School filter on Class Overview (auto-shows when schools exist for standard)
- Batch import: CSV template download + /api/students/import endpoint + BatchImport modal
- Fixed: Subject Pydantic model missing `comment` field (data was being silently dropped by Pydantic)

### Earlier
- Core CRUD, printable slip, exam types, profile pics, VSS branding, gender & school, class overview, progress tracker chart, CSV export, sound effects

## Prioritized Backlog
### P1
- Real PDF export (not just print-to-PDF)
- Bulk edit/delete (select multiple, apply changes)
- GET /api/schools endpoint so StudentForm can suggest beyond hardcoded list

### P2
- Date/semester field per exam entry (beyond exam_type string)
- Class average, top/bottom deltas per subject on ClassOverview
- Email result slips to parents (integration: Resend / SendGrid)

### P3
- Admin PIN or password to protect destructive actions
- Student self-login to view own results only
- Mobile offline mode (PWA)

## Test Credentials
N/A — no authentication
