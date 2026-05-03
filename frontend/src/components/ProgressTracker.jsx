import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EXAM_ORDER = ["Pre-test", "Monthly", "Mid-term", "Final", "Post-test", "General"];
const SUBJECT_COLORS = ["#4ade80", "#60a5fa", "#f97316", "#a78bfa", "#f43f5e", "#34d399", "#fbbf24"];

export default function ProgressTracker({ studentName, school }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = { name: studentName };
    if (school) params.school = school;
    axios.get(`${API}/progress`, { params })
      .then((r) => setRecords(r.data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [studentName, school]); // eslint-disable-line

  if (loading) return null;

  const uniqueExamTypes = [...new Set(records.map((r) => r.exam_type))];
  if (uniqueExamTypes.length < 2) return null;

  const allSubjects = [...new Set(records.flatMap((r) => r.subjects.map((s) => s.name)))];

  // Order exam types by EXAM_ORDER, append unlisted ones
  const sortedExams = [
    ...EXAM_ORDER.filter((t) => uniqueExamTypes.includes(t)),
    ...uniqueExamTypes.filter((t) => !EXAM_ORDER.includes(t)),
  ];

  const chartData = sortedExams.map((examType) => {
    const rec = records.find((r) => r.exam_type === examType);
    const point = { examType };
    if (rec) {
      allSubjects.forEach((subj) => {
        const sub = rec.subjects.find((s) => s.name === subj);
        if (sub) point[subj] = Math.round((sub.marks / sub.max_marks) * 1000) / 10;
      });
    }
    return point;
  });

  return (
    <div
      className="bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-sm no-print"
      data-testid="progress-chart"
    >
      <h2 className="text-2xl font-black text-emerald-900 mb-1">Progress Tracker</h2>
      <p className="text-sm text-emerald-500 font-semibold mb-6">
        {uniqueExamTypes.length} exam records found — showing improvement over time
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
          <XAxis
            dataKey="examType"
            tick={{ fill: "#047857", fontFamily: "Nunito", fontWeight: 700, fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#047857", fontFamily: "Nunito", fontWeight: 700, fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "2px solid #d1fae5", fontFamily: "Nunito", fontWeight: 600 }}
            formatter={(v, name) => [`${v}%`, name]}
          />
          <Legend wrapperStyle={{ fontFamily: "Nunito", fontWeight: 700, fontSize: 13 }} />
          {allSubjects.map((subj, i) => (
            <Line
              key={subj}
              type="monotone"
              dataKey={subj}
              stroke={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 5, fill: SUBJECT_COLORS[i % SUBJECT_COLORS.length], strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 7 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
