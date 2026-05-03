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
- `GET /api/stats` - Dashboard stats
- `GET /api/students` - List (search by name, filter by standard)
- `POST /api/students` - Create student
- `GET /api/students/{id}` - Get detail
- `PUT /api/students/{id}` - Update
- `DELETE /api/students/{id}` - Delete
- `GET /api/students/export/csv` - Export CSV (includes Gender, School, Exam Type columns)
- `GET /api/standards` - Unique standards list
- `GET /api/progress?name=&school=` - All records for a student (for progress tracking)

### Student Data Model Fields
- `name`, `standard`, `exam_type`, `gender`, `school`, `profile_picture`, `subjects[]`, `roll_number`="-"

### Frontend Pages
- **/** Dashboard — VSchool Smart Centre branding, stats, top performers, recent students
- **/students** — Searchable list with profile pic, exam type badge, gender, school
- **/students/:id** — Full detail with subject cards, bar chart, progress tracker, print slip
- **/overview** — Class overview comparison table (all students in a standard side-by-side)

### Components
- **Navbar** — VSS logo + "VSchool Smart Centre / Bandar Tek Kajang" + 3 nav links
- **StudentForm** — Profile pic upload, Name, Standard, Gender (Male/Female), School dropdown, Exam Type pills, 5 fixed subjects + Add Other Subject
- **ClassOverview** — Standard filter + Exam type filter, color-coded comparison table with Class Avg row
- **ProgressTracker** — Line chart (recharts) showing subject improvement across exam types; auto-appears when ≥2 records with different exam_types exist for same student name
- **PrintSlip** — VSchool branded result slip (hidden on screen, visible on print)
- **sounds.js** — Web Audio API sounds (success, delete, open, click, error)

### Schools configured
- SJKC Yu Hua, SJKC Sin Ming, SJKC Bandar Kajang 2, Others

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
