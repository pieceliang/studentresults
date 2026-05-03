import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { getGradeByPct } from "@/utils/grading";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const gradeFromPct = (pct) => {
  const g = getGradeByPct(pct);
  return { grade: g.grade, emoji: g.emoji };
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/stats`)
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-emerald-600 text-2xl font-bold">
        Loading... 📚
      </div>
    );
  }

  const avgInfo = stats ? gradeFromPct(stats.average_score) : { emoji: "📊" };

  return (
    <div className="space-y-8 fade-in-up">
      {/* Hero Header */}
      <div className="text-center py-10 bg-white rounded-3xl border-2 border-emerald-100 shadow-[0_8px_24px_rgba(167,243,208,0.4)] px-6">
        <div className="flex justify-center mb-4">
          <img
            src="https://customer-assets.emergentagent.com/job_marks-manager-16/artifacts/kn6egpfc_11%20%282048px%29%20%281%29.png"
            alt="VSS Logo"
            className="h-20 w-20 object-contain bg-gray-900 rounded-2xl p-1"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-emerald-900 mb-1">
          VSchool Smart Centre
        </h1>
        <p className="text-base font-bold text-emerald-600 mb-1">Bandar Tek Kajang</p>
        <p className="text-base text-emerald-500 font-semibold max-w-xl mx-auto">
          Student Result Management System
        </p>
        <Link
          to="/students"
          className="inline-block mt-6 bg-emerald-400 text-white font-bold px-8 py-3 rounded-full hover:bg-emerald-500 hover:-translate-y-0.5 transition-all shadow-md"
          data-testid="go-to-students-btn"
        >
          View All Students
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-[0_8px_24px_rgba(167,243,208,0.4)] hover:shadow-[0_12px_32px_rgba(167,243,208,0.6)] hover:-translate-y-1 transition-all duration-300"
          data-testid="stat-total-students"
        >
          <div className="text-5xl mb-4">👨‍🎓</div>
          <div className="text-4xl font-black text-emerald-900">{stats?.total_students ?? 0}</div>
          <div className="text-sm font-bold uppercase tracking-widest text-emerald-600 mt-1">
            Total Students
          </div>
        </div>

        <div
          className="bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-[0_8px_24px_rgba(167,243,208,0.4)] hover:shadow-[0_12px_32px_rgba(167,243,208,0.6)] hover:-translate-y-1 transition-all duration-300"
          data-testid="stat-average-score"
        >
          <div className="text-5xl mb-4">{avgInfo.emoji}</div>
          <div className="text-4xl font-black text-emerald-900">
            {stats?.average_score ?? 0}%
          </div>
          <div className="text-sm font-bold uppercase tracking-widest text-emerald-600 mt-1">
            Average Score
          </div>
        </div>

        <div
          className="bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-[0_8px_24px_rgba(167,243,208,0.4)] hover:shadow-[0_12px_32px_rgba(167,243,208,0.6)] hover:-translate-y-1 transition-all duration-300"
          data-testid="stat-top-performers"
        >
          <div className="text-5xl mb-4">🏆</div>
          <div className="text-4xl font-black text-emerald-900">
            {stats?.top_performers?.length ?? 0}
          </div>
          <div className="text-sm font-bold uppercase tracking-widest text-emerald-600 mt-1">
            Top Performers
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {stats?.top_performers?.length > 0 && (
        <div
          className="bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-[0_8px_24px_rgba(167,243,208,0.4)]"
          data-testid="top-performers-section"
        >
          <h2 className="text-2xl font-black text-emerald-900 mb-6">🏆 Top Performers</h2>
          <div className="space-y-3">
            {stats.top_performers.map((student, i) => {
              const { grade, emoji } = gradeFromPct(student.average);
              return (
                <Link
                  to={`/students/${student.id}`}
                  key={student.id}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-emerald-50 transition-colors group"
                  data-testid={`top-performer-${i}`}
                >
                  <div className="w-10 h-10 bg-emerald-400 rounded-full flex items-center justify-center font-black text-white text-lg shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors">
                      {student.name}
                    </div>
                    <div className="text-sm text-emerald-500">{student.standard}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">{emoji}</div>
                    <div className="font-black text-emerald-700">{student.average}%</div>
                    <div className="text-xs font-bold text-emerald-400">{grade}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Students */}
      {stats?.recent_students?.length > 0 && (
        <div
          className="bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-[0_8px_24px_rgba(167,243,208,0.4)]"
          data-testid="recent-students-section"
        >
          <h2 className="text-2xl font-black text-emerald-900 mb-6">🆕 Recently Added</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stats.recent_students.map((student) => (
              <Link
                to={`/students/${student.id}`}
                key={student.id}
                className="p-5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-400 hover:shadow-md transition-all"
                data-testid={`recent-student-${student.id}`}
              >
                <div className="text-3xl mb-2">🎒</div>
                <div className="font-bold text-emerald-900 truncate">{student.name}</div>
                <div className="text-sm text-emerald-600">{student.standard}</div>
                <div className="text-sm text-emerald-400 mt-1">{student.subjects_count} subjects</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats?.total_students === 0 && (
        <div
          className="text-center py-16 bg-white rounded-3xl border-2 border-emerald-100"
          data-testid="empty-dashboard"
        >
          <div className="text-8xl mb-6">📝</div>
          <h2 className="text-2xl font-black text-emerald-900 mb-3">No students yet!</h2>
          <p className="text-emerald-600 mb-8">Start by adding your first student result.</p>
          <Link
            to="/students"
            className="bg-emerald-400 text-white font-bold px-8 py-3 rounded-full hover:bg-emerald-500 transition-colors shadow-md inline-block"
            data-testid="add-first-student-btn"
          >
            Add First Student 🎉
          </Link>
        </div>
      )}
    </div>
  );
}
