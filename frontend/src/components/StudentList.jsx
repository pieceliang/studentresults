import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Search, Plus, Download, Upload, Edit2, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import StudentForm from "./StudentForm";
import BatchImport from "./BatchImport";
import { playDelete, playOpen, playClick } from "@/utils/sounds";
import { getGradeByPct } from "@/utils/grading";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const gradeFromSubjects = (subjects) => {
  if (!subjects?.length) return { grade: "-", emoji: "📋", avg: 0, color: "text-emerald-500" };
  const avg = subjects.reduce((acc, s) => acc + (s.marks / s.max_marks) * 100, 0) / subjects.length;
  const rounded = Math.round(avg * 10) / 10;
  const g = getGradeByPct(avg);
  return { grade: g.grade, emoji: g.emoji, avg: rounded, color: g.text };
};

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStandard, setFilterStandard] = useState("");
  const [standards, setStandards] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStandard) params.standard = filterStandard;
      const r = await axios.get(`${API}/students`, { params });
      setStudents(r.data);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [search, filterStandard]);

  useEffect(() => {
    axios.get(`${API}/standards`).then((r) => setStandards(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/students/${id}`);
      playDelete();
      toast.success("Student deleted!");
      setDeleteConfirm(null);
      fetchStudents();
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (filterStandard) params.append("standard", filterStandard);
    window.open(`${API}/students/export/csv?${params}`, "_blank");
  };

  const handleFormClose = (saved) => {
    setShowForm(false);
    setEditStudent(null);
    if (saved) fetchStudents();
  };

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-4xl font-black text-emerald-900">Students 🎒</h1>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => { playOpen(); setShowImport(true); }}
            className="flex items-center gap-2 bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-full hover:bg-emerald-200 transition-colors text-sm"
            data-testid="import-csv-btn"
          >
            <Upload size={15} /> Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-full hover:bg-emerald-200 transition-colors text-sm"
            data-testid="export-csv-btn"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={() => { setEditStudent(null); playOpen(); setShowForm(true); }}
            className="flex items-center gap-2 bg-emerald-400 text-white font-bold px-5 py-2 rounded-full hover:bg-emerald-500 shadow-md hover:-translate-y-0.5 transition-all text-sm"
            data-testid="add-student-btn"
          >
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-2 border-emerald-100 rounded-2xl h-12 pl-11 pr-4 text-emerald-900 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 font-medium"
            data-testid="search-input"
          />
        </div>
        <select
          value={filterStandard}
          onChange={(e) => setFilterStandard(e.target.value)}
          className="bg-white border-2 border-emerald-100 rounded-2xl h-12 px-4 text-emerald-900 focus:outline-none focus:border-emerald-400 font-medium cursor-pointer"
          data-testid="filter-standard"
        >
          <option value="">All Standards</option>
          {standards.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Students count */}
      {!loading && students.length > 0 && (
        <p className="text-sm text-emerald-500 font-semibold" data-testid="student-count">
          Showing {students.length} student{students.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-emerald-600 text-2xl font-bold">Loading... 📚</div>
      ) : students.length === 0 ? (
        <div
          className="text-center py-16 bg-white rounded-3xl border-2 border-emerald-100"
          data-testid="no-students"
        >
          <div className="text-8xl mb-4">🔍</div>
          <h2 className="text-2xl font-black text-emerald-900 mb-2">No students found!</h2>
          <p className="text-emerald-600">Try adjusting your search or add a new student.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4" data-testid="students-list">
          {students.map((student) => {
            const { grade, emoji, avg, color } = gradeFromSubjects(student.subjects);
            return (
              <div
                key={student.id}
                className="bg-white border-2 border-emerald-100 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4"
                data-testid={`student-card-${student.id}`}
              >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center shrink-0">
                {student.profile_picture ? (
                  <img src={student.profile_picture} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{emoji}</span>
                )}
              </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-emerald-900 text-lg truncate">{student.name}</div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-sm text-emerald-600 font-semibold">{student.standard}</span>
                    {student.exam_type && student.exam_type !== "General" && (
                      <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        {student.exam_type}
                      </span>
                    )}
                    {student.gender && (
                      <span className="text-xs font-bold text-emerald-500">
                        {student.gender === "Male" ? "♂" : "♀"} {student.gender}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-emerald-400">
                    {student.school ? `${student.school} · ` : ""}{student.subjects?.length ?? 0} subjects</div>
                </div>
                <div className="text-right mr-2 hidden sm:block">
                  <div className={`text-2xl font-black ${color}`}>
                    {avg > 0 ? `${avg}%` : "-"}
                  </div>
                  <div className="text-sm font-bold text-emerald-500">{grade}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { playOpen(); setEditStudent(student); setShowForm(true); }}
                    className="p-2 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
                    data-testid={`edit-student-${student.id}`}
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => { playClick(); setDeleteConfirm(student.id); }}
                    className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition-colors"
                    data-testid={`delete-student-${student.id}`}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                  <Link
                    to={`/students/${student.id}`}
                    className="p-2 rounded-full bg-emerald-400 hover:bg-emerald-500 text-white transition-colors"
                    data-testid={`view-student-${student.id}`}
                    title="View details"
                  >
                    <ChevronRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          data-testid="delete-confirm-modal"
        >
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl bounce-in">
            <div className="text-5xl mb-4 text-center">🗑️</div>
            <h3 className="text-xl font-black text-emerald-900 text-center mb-2">Delete Student?</h3>
            <p className="text-emerald-600 text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-emerald-100 text-emerald-800 font-bold py-3 rounded-full hover:bg-emerald-200 transition-colors"
                data-testid="cancel-delete-btn"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-400 text-white font-bold py-3 rounded-full hover:bg-red-500 transition-colors"
                data-testid="confirm-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Form Modal */}
      {showForm && (
        <StudentForm student={editStudent} onClose={handleFormClose} />
      )}

      {/* Batch Import Modal */}
      {showImport && (
        <BatchImport
          onClose={(imported) => {
            setShowImport(false);
            if (imported) fetchStudents();
          }}
        />
      )}
    </div>
  );
}
