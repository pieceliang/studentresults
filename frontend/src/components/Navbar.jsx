import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, BarChart2 } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_marks-manager-16/artifacts/kn6egpfc_11%20%282048px%29%20%281%29.png";

export default function Navbar() {
  const location = useLocation();
  const active = (path) =>
    location.pathname === path
      ? "bg-emerald-400 text-white shadow-sm"
      : "text-emerald-700 hover:bg-emerald-100";

  return (
    <nav className="bg-white border-b-2 border-emerald-100 shadow-sm no-print sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Logo + Title */}
        <Link to="/" className="flex items-center gap-3 shrink-0" data-testid="nav-logo">
          <div className="bg-gray-900 rounded-xl overflow-hidden w-11 h-11 flex items-center justify-center shrink-0">
            <img src={LOGO_URL} alt="VSS Logo" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="font-black text-emerald-800 text-base leading-tight">VSchool Smart Centre</div>
            <div className="text-xs font-bold text-emerald-500">Bandar Tek Kajang</div>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="flex gap-1.5">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold text-sm transition-all ${active("/")}`}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link
            to="/students"
            className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold text-sm transition-all ${active("/students")}`}
            data-testid="nav-students"
          >
            <Users size={16} />
            <span className="hidden sm:inline">Students</span>
          </Link>
          <Link
            to="/overview"
            className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold text-sm transition-all ${active("/overview")}`}
            data-testid="nav-overview"
          >
            <BarChart2 size={16} />
            <span className="hidden sm:inline">Overview</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
