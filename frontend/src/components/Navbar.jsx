import { Link, useLocation } from "react-router-dom";
import { BookOpen, LayoutDashboard, Users } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const active = (path) =>
    location.pathname === path
      ? "bg-emerald-400 text-white shadow-sm"
      : "text-emerald-700 hover:bg-emerald-100";

  return (
    <nav className="bg-white border-b-2 border-emerald-100 shadow-sm no-print sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-emerald-800 font-black text-xl hover:text-emerald-600 transition-colors"
          data-testid="nav-logo"
        >
          <BookOpen size={24} className="text-emerald-500" />
          <span>ResultsHub</span>
        </Link>

        <div className="flex gap-2">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${active("/")}`}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link
            to="/students"
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${active("/students")}`}
            data-testid="nav-students"
          >
            <Users size={16} />
            <span className="hidden sm:inline">Students</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
