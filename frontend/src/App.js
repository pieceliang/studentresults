import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import StudentList from "@/components/StudentList";
import StudentDetail from "@/components/StudentDetail";
import ClassOverview from "@/components/ClassOverview";

function App() {
  return (
    <div className="App min-h-screen" style={{ backgroundColor: "#FDFBF7", fontFamily: "Nunito, sans-serif" }}>
      <BrowserRouter>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/overview" element={<ClassOverview />} />
          </Routes>
        </main>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;
