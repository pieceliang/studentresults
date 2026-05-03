import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Edit2, Trash2, Printer, Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { toast } from "sonner";
import StudentForm from "./StudentForm";
import { playDelete, playOpen, playSuccess } from "@/utils/sounds";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getGradeInfo = (marks, maxMarks) => {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return { grade: "A+", emoji: "🌟", color: "#4ade80", bg: "bg-emerald-100", text: "text-emerald-700" };
  if (pct >= 80) return { grade: "A", emoji: "⭐", color: "#22c55e", bg: "bg-green-100", text: "text-green-700" };
  if (pct >= 70) return { grade: "B+", emoji: "🎯", color: "#84cc16", bg: "bg-lime-100", text: "text-lime-700" };
  if (pct >= 60) return { grade: "B", emoji: "👍", color: "#eab308", bg: "bg-yellow-100", text: "text-yellow-700" };
  if (pct >= 50) return { grade: "C", emoji: "📖", color: "#f97316", bg: "bg-orange-100", text: "text-orange-700" };
  if (pct >= 40) return { grade: "D", emoji: "⚠️", color: "#f59e0b", bg: "bg-amber-100", text: "text-amber-700" };
  return { grade: "F", emoji: "😰", color: "#ef4444", bg: "bg-red-100", text: "text-red-700" };
};

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/students/${id}`);
      setStudent(r.data);
    } catch {
      toast.error("Student not found");
      navigate("/students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]); // eslint-disable-line

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/students/${id}`);
      playDelete();
      toast.success("Student deleted!");
      navigate("/students");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleExportCSV = () => {
    if (!student) return;
    const rows = [
      ["Student Name", "Standard", "Subject", "Marks", "Max Marks", "Percentage", "Grade"],
      ...student.subjects.map((s) => {
        const pct = Math.round((s.marks / s.max_marks) * 1000) / 10;
        const { grade } = getGradeInfo(s.marks, s.max_marks);
        return [student.name, student.standard, s.name, s.marks, s.max_marks, `${pct}%`, grade];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${student.name.replace(/ /g, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    playSuccess();
    toast.success("CSV downloaded! 📥");
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-emerald-600 text-2xl font-bold">
        Loading... 📚
      </div>
    );
  }

  if (!student) return null;

  const totalMarks = student.subjects.reduce((acc, s) => acc + s.marks, 0);
  const totalMax = student.subjects.reduce((acc, s) => acc + s.max_marks, 0);
  const overallPct = totalMax > 0 ? Math.round((totalMarks / totalMax) * 1000) / 10 : 0;
  const overallInfo = totalMax > 0 ? getGradeInfo(totalMarks, totalMax) : { grade: "-", emoji: "📋" };

  const chartData = student.subjects.map((s) => ({
    name: s.name.length > 10 ? s.name.substring(0, 10) + "…" : s.name,
    fullName: s.name,
    percentage: Math.round((s.marks / s.max_marks) * 1000) / 10,
    ...getGradeInfo(s.marks, s.max_marks),
  }));

  return (
    <div className="space-y-6 fade-in-up" data-testid="student-detail-page">
      {/* Back */}
      <button
        onClick={() => navigate("/students")}
        className="flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-800 transition-colors"
        data-testid="back-btn"
      >
        <ArrowLeft size={18} /> Back to Students
      </button>

      {/* Student Header Card */}
      <div className="bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-[0_8px_24px_rgba(167,243,208,0.4)] print-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded-3xl flex items-center justify-center text-5xl shadow-lg shrink-0">
            {overallInfo.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-emerald-900" data-testid="student-name">
              {student.name}
            </h1>
            <p className="text-emerald-600 font-semibold text-lg">{student.standard}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="bg-emerald-50 rounded-2xl px-4 py-2">
                <span className="text-2xl font-black text-emerald-700" data-testid="overall-pct">
                  {overallPct}%
                </span>
                <span className="text-sm text-emerald-500 ml-2">Overall</span>
              </div>
              <div className="bg-emerald-50 rounded-2xl px-4 py-2">
                <span className="text-2xl font-black text-emerald-700" data-testid="overall-grade">
                  {overallInfo.grade}
                </span>
                <span className="text-sm text-emerald-500 ml-2">Grade</span>
              </div>
              <div className="bg-emerald-50 rounded-2xl px-4 py-2">
                <span className="text-2xl font-black text-emerald-700">
                  {student.subjects.length}
                </span>
                <span className="text-sm text-emerald-500 ml-2">Subjects</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap no-print">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-full hover:bg-emerald-200 transition-colors text-sm"
              data-testid="export-student-csv-btn"
            >
              <Download size={15} /> CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-full hover:bg-emerald-200 transition-colors text-sm"
              data-testid="print-btn"
            >
              <Printer size={15} /> Print
            </button>
            <button
              onClick={() => { playOpen(); setShowEdit(true); }}
              className="flex items-center gap-2 bg-emerald-400 text-white font-bold px-4 py-2 rounded-full hover:bg-emerald-500 transition-colors text-sm"
              data-testid="edit-btn"
            >
              <Edit2 size={15} /> Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 bg-red-400 text-white font-bold px-4 py-2 rounded-full hover:bg-red-500 transition-colors text-sm"
              data-testid="delete-btn"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Subject Cards */}
      {student.subjects.length > 0 && (
        <div>
          <h2 className="text-2xl font-black text-emerald-900 mb-4">📚 Subject Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" data-testid="subject-cards">
            {student.subjects.map((subject, i) => {
              const pct = Math.round((subject.marks / subject.max_marks) * 1000) / 10;
              const { grade, emoji, bg, text } = getGradeInfo(subject.marks, subject.max_marks);
              return (
                <div
                  key={i}
                  className="bg-white border-2 border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all print-card"
                  data-testid={`subject-card-${i}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-black text-emerald-900 text-lg leading-tight">{subject.name}</h3>
                    <span className="text-3xl ml-2">{emoji}</span>
                  </div>
                  <div className="flex items-end gap-1 mb-3">
                    <span className="text-3xl font-black text-emerald-900">{subject.marks}</span>
                    <span className="text-emerald-400 font-semibold mb-1">/ {subject.max_marks}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-emerald-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-emerald-400 transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${bg} ${text}`}>
                      {grade}
                    </span>
                  </div>
                  <div className="text-right text-sm font-bold text-emerald-400 mt-1">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <div
          className="bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-sm no-print"
          data-testid="performance-chart"
        >
          <h2 className="text-2xl font-black text-emerald-900 mb-6">📊 Performance Chart</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#047857", fontFamily: "Nunito", fontWeight: 700, fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#047857", fontFamily: "Nunito", fontWeight: 700, fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(val, _, props) => [`${val}%`, props.payload.fullName]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "2px solid #d1fae5",
                  fontFamily: "Nunito",
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* No subjects state */}
      {student.subjects.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-emerald-100" data-testid="no-subjects">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-emerald-600 font-semibold">No subjects added yet.</p>
          <button
            onClick={() => setShowEdit(true)}
            className="mt-4 bg-emerald-400 text-white font-bold px-6 py-2 rounded-full hover:bg-emerald-500 transition-colors"
            data-testid="add-subjects-btn"
          >
            Add Subjects
          </button>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          data-testid="delete-confirm-modal"
        >
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl bounce-in">
            <div className="text-5xl mb-4 text-center">🗑️</div>
            <h3 className="text-xl font-black text-emerald-900 text-center mb-2">
              Delete {student.name}?
            </h3>
            <p className="text-emerald-600 text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-emerald-100 text-emerald-800 font-bold py-3 rounded-full hover:bg-emerald-200 transition-colors"
                data-testid="cancel-delete-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-400 text-white font-bold py-3 rounded-full hover:bg-red-500 transition-colors"
                data-testid="confirm-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {showEdit && (
        <StudentForm
          student={student}
          onClose={(saved) => {
            setShowEdit(false);
            if (saved) fetchStudent();
          }}
        />
      )}
    </div>
  );
}
