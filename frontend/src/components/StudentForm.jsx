import { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { toast } from "sonner";
import { playSuccess, playError, playClick } from "@/utils/sounds";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STANDARDS = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
  "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
];

const FIXED_SUBJECTS = ["BC", "EN", "BM", "MM", "SN"];

const initMarks = (existing) =>
  FIXED_SUBJECTS.reduce((acc, name) => {
    const found = existing?.find((s) => s.name === name);
    acc[name] = found ? String(found.marks) : "";
    return acc;
  }, {});

export default function StudentForm({ student, onClose }) {
  const isEdit = !!student;
  const [name, setName] = useState(student?.name || "");
  const [standard, setStandard] = useState(student?.standard || "");
  const [marks, setMarks] = useState(() => initMarks(student?.subjects));
  const [saving, setSaving] = useState(false);

  const updateMark = (subj, value) =>
    setMarks((prev) => ({ ...prev, [subj]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !standard.trim()) {
      playError();
      toast.error("Please fill all required fields");
      return;
    }

    const filledSubjects = FIXED_SUBJECTS.filter((s) => marks[s] !== "");
    if (filledSubjects.length === 0) {
      playError();
      toast.error("Please enter marks for at least one subject");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        standard: standard.trim(),
        roll_number: "-",
        subjects: filledSubjects.map((s) => ({
          name: s,
          marks: parseFloat(marks[s]) || 0,
          max_marks: 100,
        })),
      };

      if (isEdit) {
        await axios.put(`${API}/students/${student.id}`, payload);
        playSuccess();
        toast.success("Student updated! ✏️");
      } else {
        await axios.post(`${API}/students`, payload);
        playSuccess();
        toast.success("Student added! 🎉");
      }
      onClose(true);
    } catch {
      playError();
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto"
      data-testid="student-form-modal"
    >
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full my-8 shadow-2xl bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-emerald-900">
            {isEdit ? "✏️ Edit Student" : "🎉 Add New Student"}
          </h2>
          <button
            onClick={() => { playClick(); onClose(false); }}
            className="p-2 rounded-full hover:bg-emerald-100 transition-colors"
            data-testid="form-close-btn"
          >
            <X size={20} className="text-emerald-700" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold uppercase tracking-widest text-emerald-600 block mb-2">
                Student Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ahmad bin Ali"
                className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl h-12 px-4 text-emerald-900 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 font-medium"
                data-testid="student-name-input"
                required
              />
            </div>
            <div>
              <label className="text-sm font-bold uppercase tracking-widest text-emerald-600 block mb-2">
                Standard / Class *
              </label>
              <input
                type="text"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                placeholder="e.g. Class 5"
                list="standards-list"
                className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl h-12 px-4 text-emerald-900 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 font-medium"
                data-testid="student-standard-input"
                required
              />
              <datalist id="standards-list">
                {STANDARDS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          {/* Fixed 5 Subjects */}
          <div>
            <label className="text-sm font-bold uppercase tracking-widest text-emerald-600 block mb-4">
              Marks (out of 100)
            </label>
            <div className="space-y-3">
              {FIXED_SUBJECTS.map((subj) => (
                <div key={subj} className="flex items-center gap-4" data-testid={`subject-row-${subj}`}>
                  <div className="w-16 h-11 bg-emerald-400 rounded-2xl flex items-center justify-center font-black text-white text-sm shrink-0">
                    {subj}
                  </div>
                  <input
                    type="number"
                    value={marks[subj]}
                    onChange={(e) => updateMark(subj, e.target.value)}
                    placeholder="—"
                    min="0"
                    max="100"
                    className="flex-1 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl h-11 px-4 text-emerald-900 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 font-bold text-lg"
                    data-testid={`marks-${subj}`}
                  />
                  {marks[subj] !== "" && (
                    <span className="text-sm font-bold text-emerald-400 w-10 text-right shrink-0">
                      {marks[subj]}%
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-emerald-400 mt-3 font-medium">
              💡 Leave blank if the subject was not taken
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { playClick(); onClose(false); }}
              className="flex-1 bg-emerald-100 text-emerald-800 font-bold py-3 rounded-full hover:bg-emerald-200 transition-colors"
              data-testid="form-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-400 text-white font-bold py-3 rounded-full hover:bg-emerald-500 disabled:opacity-60 shadow-md hover:-translate-y-0.5 transition-all"
              data-testid="form-save-btn"
            >
              {saving ? "Saving..." : isEdit ? "Update Student" : "Add Student 🎉"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
