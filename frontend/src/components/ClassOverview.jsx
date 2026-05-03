import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { getGradeByPct } from "@/utils/grading";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SUBJECTS_ORDER = ["BC", "EN", "BM", "MM", "SN"];
const EXAM_TYPES = ["General", "Pre-test", "Monthly", "Mid-term", "Final", "Post-test"];

const cellStyle = (pct) => {
  if (pct === null || pct === undefined) return "bg-gray-50 text-gray-300";
  const g = getGradeByPct(pct);
  return `${g.bg} ${g.text}`;
};

const getSubjectPct = (student, name) => {
  const sub = student.subjects.find((s) => s.name === name);
  if (!sub) return null;
  return Math.round((sub.marks / sub.max_marks) * 1000) / 10;
};

const getAvg = (student) => {
  if (!student.subjects.length) return null;
  const sum = student.subjects.reduce((a, s) => a + (s.marks / s.max_marks) * 100, 0);
  return Math.round((sum / student.subjects.length) * 10) / 10;
};

export default function ClassOverview() {
  const [standards, setStandards] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/standards`).then((r) => setStandards(r.data));
  }, []);

  useEffect(() => {
    if (!selectedStandard) { setStudents([]); return; }
    setLoading(true);
    axios.get(`${API}/students`, { params: { standard: selectedStandard } })
      .then((r) => {
        let filtered = r.data;
        if (examFilter) filtered = filtered.filter((s) => s.exam_type === examFilter);
        if (schoolFilter) filtered = filtered.filter((s) => (s.school || "") === schoolFilter);
        setStudents(filtered);
      })
      .finally(() => setLoading(false));
  }, [selectedStandard, examFilter, schoolFilter]);

  // Unique schools present overall for the school filter dropdown
  const [schoolOptions, setSchoolOptions] = useState([]);
  useEffect(() => {
    axios.get(`${API}/schools`).then((r) => setSchoolOptions(r.data)).catch(() => {});
  }, []);

  // Build ordered subject list: fixed first, then extras
  const allSubjects = [...new Set(students.flatMap((s) => s.subjects.map((sub) => sub.name)))];
  const orderedSubjects = [
    ...SUBJECTS_ORDER.filter((s) => allSubjects.includes(s)),
    ...allSubjects.filter((s) => !SUBJECTS_ORDER.includes(s)),
  ];

  // Summary stats per subject
  const subjectAvgs = orderedSubjects.map((subj) => {
    const values = students.map((s) => getSubjectPct(s, subj)).filter((v) => v !== null);
    return values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;
  });

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-4xl font-black text-emerald-900">Class Overview 📊</h1>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedStandard}
            onChange={(e) => { setSelectedStandard(e.target.value); setExamFilter(""); setSchoolFilter(""); }}
            className="bg-white border-2 border-emerald-100 rounded-2xl h-12 px-4 text-emerald-900 focus:outline-none focus:border-emerald-400 font-medium cursor-pointer"
            data-testid="overview-standard-filter"
          >
            <option value="">Select Standard...</option>
            {standards.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {selectedStandard && (
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="bg-white border-2 border-emerald-100 rounded-2xl h-12 px-4 text-emerald-900 focus:outline-none focus:border-emerald-400 font-medium cursor-pointer"
              data-testid="overview-exam-filter"
            >
              <option value="">All Exams</option>
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          {selectedStandard && schoolOptions.length > 0 && (
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="bg-white border-2 border-emerald-100 rounded-2xl h-12 px-4 text-emerald-900 focus:outline-none focus:border-emerald-400 font-medium cursor-pointer"
              data-testid="overview-school-filter"
            >
              <option value="">All Schools</option>
              {schoolOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Empty prompt */}
      {!selectedStandard && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-emerald-100" data-testid="overview-empty">
          <div className="text-8xl mb-4">📊</div>
          <h2 className="text-2xl font-black text-emerald-900 mb-2">Select a Standard</h2>
          <p className="text-emerald-600">Choose a standard above to compare student results.</p>
        </div>
      )}

      {selectedStandard && loading && (
        <div className="text-center py-16 text-emerald-600 text-2xl font-bold">Loading... 📚</div>
      )}

      {selectedStandard && !loading && students.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-emerald-100">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-emerald-600 font-semibold">No students found for {selectedStandard}{examFilter ? ` · ${examFilter}` : ""}{schoolFilter ? ` · ${schoolFilter}` : ""}.</p>
        </div>
      )}

      {selectedStandard && !loading && students.length > 0 && (
        <div className="bg-white border-2 border-emerald-100 rounded-3xl overflow-hidden shadow-[0_8px_24px_rgba(167,243,208,0.4)]" data-testid="overview-table">
          {/* Table Header Info */}
          <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-emerald-900">{selectedStandard}</h2>
              <p className="text-sm text-emerald-500 font-semibold">
                {students.length} student{students.length !== 1 ? "s" : ""}
                {examFilter ? ` · ${examFilter}` : " · All Exams"}
                {schoolFilter ? ` · ${schoolFilter}` : ""}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="text-left px-4 py-3 font-black text-emerald-800 border-b border-emerald-100 sticky left-0 bg-emerald-50 min-w-[180px] z-10">
                    Student
                  </th>
                  {!examFilter && (
                    <th className="text-center px-3 py-3 font-black text-emerald-800 border-b border-emerald-100 min-w-[90px]">
                      Exam
                    </th>
                  )}
                  {orderedSubjects.map((subj) => (
                    <th key={subj} className="text-center px-3 py-3 font-black text-emerald-800 border-b border-emerald-100 min-w-[70px]">
                      {subj}
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 font-black text-emerald-800 border-b border-emerald-100 min-w-[70px] bg-emerald-100/60">
                    Avg
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const avg = getAvg(student);
                  return (
                    <tr key={student.id} className={idx % 2 === 0 ? "bg-white" : "bg-emerald-50/20"}>
                      <td className="px-4 py-3 border-b border-emerald-50 sticky left-0 bg-inherit z-10">
                        <Link
                          to={`/students/${student.id}`}
                          className="flex items-center gap-2 group"
                          data-testid={`overview-student-${student.id}`}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-100 shrink-0 flex items-center justify-center font-black text-emerald-500 text-sm">
                            {student.profile_picture ? (
                              <img src={student.profile_picture} alt={student.name} className="w-full h-full object-cover" />
                            ) : student.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors truncate max-w-[120px]">
                              {student.name}
                            </div>
                            {student.school && (
                              <div className="text-xs text-emerald-400 truncate max-w-[120px]">{student.school}</div>
                            )}
                          </div>
                        </Link>
                      </td>
                      {!examFilter && (
                        <td className="px-3 py-3 border-b border-emerald-50 text-center">
                          <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {student.exam_type || "General"}
                          </span>
                        </td>
                      )}
                      {orderedSubjects.map((subj) => {
                        const pct = getSubjectPct(student, subj);
                        return (
                          <td key={subj} className={`px-3 py-3 border-b border-emerald-50 text-center font-bold ${cellStyle(pct)}`}>
                            {pct !== null ? `${pct}` : "—"}
                          </td>
                        );
                      })}
                      <td className={`px-3 py-3 border-b border-emerald-50 text-center font-black ${cellStyle(avg)}`}>
                        {avg !== null ? `${avg}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Averages row */}
              <tfoot>
                <tr className="bg-emerald-100/60">
                  <td className="px-4 py-3 font-black text-emerald-800 sticky left-0 bg-emerald-100/60 z-10">
                    Class Avg
                  </td>
                  {!examFilter && <td className="px-3 py-3"></td>}
                  {subjectAvgs.map((avg, i) => (
                    <td key={i} className={`px-3 py-3 text-center font-black text-sm ${cellStyle(avg)}`}>
                      {avg !== null ? `${avg}%` : "—"}
                    </td>
                  ))}
                  <td className={`px-3 py-3 text-center font-black ${cellStyle(
                    students.length ? Math.round(students.map(getAvg).filter(Boolean).reduce((a, b) => a + b, 0) / students.map(getAvg).filter(Boolean).length * 10) / 10 : null
                  )}`}>
                    {students.length && students.map(getAvg).filter(Boolean).length > 0
                      ? `${Math.round(students.map(getAvg).filter(Boolean).reduce((a, b) => a + b, 0) / students.map(getAvg).filter(Boolean).length * 10) / 10}%`
                      : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
