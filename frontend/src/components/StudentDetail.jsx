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
import ProgressTracker from "./ProgressTracker";
import { playDelete, playOpen, playSuccess } from "@/utils/sounds";
import { getGradeInfo } from "@/utils/grading";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
          <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-300 to-emerald-500 flex items-center justify-center shadow-lg shrink-0">
            {student.profile_picture ? (
              <img src={student.profile_picture} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">{overallInfo.emoji}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-emerald-900" data-testid="student-name">
              {student.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-emerald-600 font-semibold text-lg">{student.standard}</span>
              {student.exam_type && student.exam_type !== "General" && (
                <span className="text-sm font-bold bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full" data-testid="exam-type-badge">
                  {student.exam_type}
                </span>
              )}
            </div>
            {(student.gender || student.school) && (
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {student.gender && (
                  <span className="text-sm font-bold text-emerald-500" data-testid="student-gender">
                    {student.gender === "Male" ? "♂" : "♀"} {student.gender}
                  </span>
                )}
                {student.school && (
                  <span className="text-sm font-semibold text-emerald-500" data-testid="student-school">
                    {student.school}
                  </span>
                )}
              </div>
            )}
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
                  {subject.comment && (
                    <p
                      className="mt-2 text-xs italic text-emerald-600 leading-relaxed border-t border-emerald-50 pt-2"
                      data-testid={`subject-comment-${i}`}
                    >
                      💬 {subject.comment}
                    </p>
                  )}
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
            onClick={() => { playOpen(); setShowEdit(true); }}
            className="mt-4 bg-emerald-400 text-white font-bold px-6 py-2 rounded-full hover:bg-emerald-500 transition-colors"
            data-testid="add-subjects-btn"
          >
            Add Subjects
          </button>
        </div>
      )}

      {/* Progress Tracker — shows when student has multiple exam records */}
      <ProgressTracker studentName={student.name} school={student.school} />

      {/* Print Slip — hidden on screen, shown only when printing */}
      <div className="print-only" data-testid="print-slip">
        <div className="border-4 border-emerald-300 rounded-2xl overflow-hidden font-sans">
          {/* Header */}
          <div className="bg-emerald-500 text-white text-center py-5 flex items-center justify-center gap-4">
            <div className="bg-white rounded-lg p-1 w-10 h-10 flex items-center justify-center shrink-0">
              <img src="https://customer-assets.emergentagent.com/job_marks-manager-16/artifacts/kn6egpfc_11%20%282048px%29%20%281%29.png" alt="VSS" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-black text-xl tracking-wide">VSchool Smart Centre</div>
              <div className="font-bold text-sm opacity-90">Bandar Tek Kajang — Student Result Slip</div>
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-emerald-50 px-6 py-4 flex gap-5 items-center border-b-2 border-emerald-200">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-emerald-200 shrink-0 flex items-center justify-center">
              {student.profile_picture ? (
                <img src={student.profile_picture} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <div>
              <div className="text-xl font-black text-emerald-900">{student.name}</div>
              <div className="text-emerald-700 font-bold">{student.standard}</div>
              {student.school && <div className="text-emerald-600 font-semibold">{student.school}</div>}
              <div className="flex gap-3 mt-0.5">
                {student.gender && <div className="text-emerald-500 text-sm font-semibold">{student.gender === "Male" ? "♂" : "♀"} {student.gender}</div>}
                {student.exam_type && <div className="text-emerald-600 text-sm font-semibold">Exam: {student.exam_type}</div>}
              </div>
              <div className="text-emerald-400 text-xs mt-1">
                {new Date().toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
          </div>

          {/* Subjects Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-100">
                {["Subject", "Marks", "Max", "%", "Grade"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-emerald-800 font-black border-b-2 border-emerald-200 text-left first:text-left text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {student.subjects.map((s, i) => {
                const pct = Math.round((s.marks / s.max_marks) * 1000) / 10;
                const { grade } = getGradeInfo(s.marks, s.max_marks);
                return (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-emerald-50/40"}>
                    <td className="px-4 py-2.5 font-bold text-emerald-900 border-b border-emerald-100 align-top">
                      {s.name}
                      {s.comment && (
                        <div className="italic text-xs text-emerald-600 font-normal mt-0.5">
                          {s.comment}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-800 border-b border-emerald-100 align-top">{s.marks}</td>
                    <td className="px-4 py-2.5 text-center text-emerald-500 border-b border-emerald-100 align-top">{s.max_marks}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-700 border-b border-emerald-100 align-top">{pct}%</td>
                    <td className="px-4 py-2.5 text-center font-black text-emerald-800 border-b border-emerald-100 align-top">{grade}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Summary */}
          <div className="bg-emerald-50 px-6 py-4 flex justify-between items-center border-t-2 border-emerald-200">
            <div>
              <div className="font-bold text-emerald-700">Total Marks: {totalMarks} / {totalMax}</div>
              <div className="font-bold text-emerald-700">Average: {overallPct}%</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-emerald-800">{overallInfo.grade}</div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Overall Grade</div>
            </div>
          </div>

          {/* Signatures */}
          <div className="px-8 py-5 flex justify-between border-t border-emerald-100 bg-white">
            <div className="text-center">
              <div className="h-10 border-b-2 border-emerald-300 w-36 mb-1"></div>
              <div className="text-xs text-emerald-500 font-semibold">Teacher's Signature</div>
            </div>
            <div className="text-center">
              <div className="h-10 border-b-2 border-emerald-300 w-36 mb-1"></div>
              <div className="text-xs text-emerald-500 font-semibold">Parent's Signature</div>
            </div>
          </div>
        </div>
      </div>

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
