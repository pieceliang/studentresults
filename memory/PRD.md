# ResultsHub - Student Result Recorder PRD

## Original Problem Statement
"I want a student result recorder"

## User Choices & Configuration
- **Users**: Teachers/Admins and Students can view results
- **Subjects**: Fixed 5 subjects: BC, EN, BM, MM, SN
- **Fields**: Student name + Standard/Class (no roll number)
- **Features**: Add/edit/delete results, search, filter, export CSV/Print
- **Auth**: No login required (open access)
- **Design**: Green color theme, cute/playful style (Nunito font, emerald palette)

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn UI (port 3000)
- **Backend**: FastAPI (port 8001)
- **Database**: MongoDB via Motor (async)

## What's Been Implemented (as of Feb 2026)

### Backend (server.py)
- `GET /api/stats` - Dashboard stats (total students, avg score, top performers, recent)
- `GET /api/students` - List all students (search by name, filter by standard)
- `POST /api/students` - Create new student
- `GET /api/students/{id}` - Get student detail
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student
- `GET /api/students/export/csv` - Export all students to CSV (includes Exam Type column)
- `GET /api/standards` - Get list of unique standards in DB

### Student Data Model Fields
- `name` - Student full name
- `standard` - Class/standard label (free text with suggestions)
- `exam_type` - General / Mid-term / Final / Monthly / Pre-test / Post-test
- `profile_picture` - Base64 JPEG avatar (resized to 240px max)
- `subjects` - Array of {name, marks, max_marks} — 5 fixed (BC/EN/BM/MM/SN) + custom extras
- `roll_number` - Legacy field, always "-"
- `created_at`, `updated_at`

### Frontend Components
- **Navbar** - Logo + Dashboard + Students navigation links
- **Dashboard** - Stats cards, top performers list, recently added students
- **StudentList** - Searchable/filterable list with profile pic avatar, exam type badge, edit/delete/view
- **StudentForm** - Modal with: profile pic upload (camera button + canvas resize), name, standard, exam type pills, 5 fixed subjects (BC/EN/BM/MM/SN), Add Other Subject for extras
- **StudentDetail** - Full profile with subject cards, bar chart, print + CSV export, print slip
- **sounds.js** - Web Audio API sound effects (success, delete, open, click, error)

### Print Slip
- Hidden on screen, visible when window.print() called
- Shows: ResultsHub header, student photo + info, subjects table with marks/grade, overall summary, signature lines for teacher + parent

## Prioritized Backlog

### P1 (Next Priority)
- Student result report card PDF (print-friendly layout already present)
- Bulk import via CSV upload
- Exam type field (e.g., Mid-term, Final)

### P2
- Class-level analytics (compare students in same standard)
- Date/semester field per result entry
- Teacher notes per student

### P3
- Password-protected admin section
- Student login to view own results only
- Email result cards to parents

## Test Credentials
- No authentication required - open access
