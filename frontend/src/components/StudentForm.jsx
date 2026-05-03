import { useState, useRef } from "react";
import axios from "axios";
import { X, Plus, Trash2, Camera, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { playSuccess, playError, playClick } from "@/utils/sounds";
import { autoComment } from "@/utils/grading";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STANDARDS = [
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5",
];

const SCHOOLS = ["SJKC Yu Hua", "SJKC Sin Ming", "SJKC Bandar Kajang 2", "Others"];
const EXAM_TYPES = ["General", "Mid-term", "Final", "Monthly", "Pre-test", "Post-test", "Others"];
const FIXED_SUBJECTS = ["BC", "EN", "BM", "MM", "SN"];

const initMarks = (existing) =>
  FIXED_SUBJECTS.reduce((acc, name) => {
    const found = existing?.find((s) => s.name === name);
    acc[name] = found ? String(found.marks) : "";
    return acc;
  }, {});

const initComments = (existing) =>
  FIXED_SUBJECTS.reduce((acc, name) => {
    const found = existing?.find((s) => s.name === name);
    acc[name] = found?.comment || "";
    return acc;
  }, {});

const initExtra = (existing) =>
  (existing || [])
    .filter((s) => !FIXED_SUBJECTS.includes(s.name))
    .map((s) => ({ name: s.name, marks: String(s.marks), comment: s.comment || "" }));

// Known schools/exam types pre-select "Others" when the stored value is custom
const isCustomValue = (value, list) => value && !list.includes(value);

const resizeImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = 240;
        const scale = Math.min(size / img.width, size / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

export default function StudentForm({ student, onClose }) {
  const isEdit = !!student;

  // school: either an item from SCHOOLS or "Others"; customSchool holds the free-text value
  const initialSchoolIsCustom = isCustomValue(student?.school, SCHOOLS.filter((s) => s !== "Others"));
  const initialExamIsCustom = isCustomValue(student?.exam_type, EXAM_TYPES.filter((s) => s !== "Others"));

  const [name, setName] = useState(student?.name || "");
  const [standard, setStandard] = useState(student?.standard || "");
  const [examType, setExamType] = useState(
    initialExamIsCustom ? "Others" : (student?.exam_type || "General")
  );
  const [customExam, setCustomExam] = useState(initialExamIsCustom ? student.exam_type : "");
  const [gender, setGender] = useState(student?.gender || "");
  const [school, setSchool] = useState(
    initialSchoolIsCustom ? "Others" : (student?.school || "")
  );
  const [customSchool, setCustomSchool] = useState(initialSchoolIsCustom ? student.school : "");
  const [marks, setMarks] = useState(() => initMarks(student?.subjects));
  const [comments, setComments] = useState(() => initComments(student?.subjects));
  const [extraSubjects, setExtraSubjects] = useState(() => initExtra(student?.subjects));
  const [profilePic, setProfilePic] = useState(student?.profile_picture || "");
  const [saving, setSaving] = useState(false);
  const [expandedComment, setExpandedComment] = useState(null); // e.g. "BC" or "extra-0"
  const fileRef = useRef();

  const updateMark = (subj, value) =>
    setMarks((prev) => ({ ...prev, [subj]: value }));

  const updateComment = (subj, value) =>
    setComments((prev) => ({ ...prev, [subj]: value }));

  const autoFillComment = (subj) => {
    const value = marks[subj];
    if (value === "") {
      playError();
      toast.error(`Please enter marks for ${subj} first`);
      return;
    }
    const generated = autoComment(parseFloat(value) || 0);
    updateComment(subj, generated);
    playClick();
  };

  const autoFillExtraComment = (i) => {
    const row = extraSubjects[i];
    if (row.marks === "") {
      playError();
      toast.error("Please enter marks first");
      return;
    }
    const generated = autoComment(parseFloat(row.marks) || 0);
    updateExtra(i, "comment", generated);
    playClick();
  };

  const addExtraSubject = () =>
    setExtraSubjects((prev) => [...prev, { name: "", marks: "", comment: "" }]);

  const removeExtraSubject = (i) =>
    setExtraSubjects((prev) => prev.filter((_, idx) => idx !== i));

  const updateExtra = (i, field, value) =>
    setExtraSubjects((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );

  const handlePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImage(file);
      setProfilePic(resized);
    } catch {
      toast.error("Failed to process image");
    }
  };

  const toggleComment = (key) => {
    playClick();
    setExpandedComment((cur) => (cur === key ? null : key));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !standard.trim()) {
      playError();
      toast.error("Please fill all required fields");
      return;
    }

    // Resolve school & exam type (custom or list value)
    const resolvedSchool = school === "Others" ? customSchool.trim() : school;
    if (school === "Others" && !resolvedSchool) {
      playError();
      toast.error("Please type the school name");
      return;
    }
    const resolvedExam = examType === "Others" ? customExam.trim() : examType;
    if (examType === "Others" && !resolvedExam) {
      playError();
      toast.error("Please type the exam name");
      return;
    }

    const fixedFilled = FIXED_SUBJECTS.filter((s) => marks[s] !== "");
    const extraFilled = extraSubjects.filter((s) => s.name.trim() && s.marks !== "");

    if (fixedFilled.length === 0 && extraFilled.length === 0) {
      playError();
      toast.error("Please enter marks for at least one subject");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        standard: standard.trim(),
        exam_type: resolvedExam || "General",
        gender,
        school: resolvedSchool,
        roll_number: "-",
        profile_picture: profilePic,
        subjects: [
          ...fixedFilled.map((s) => ({
            name: s,
            marks: parseFloat(marks[s]) || 0,
            max_marks: 100,
            comment: (comments[s] || "").trim(),
          })),
          ...extraFilled.map((s) => ({
            name: s.name.trim(),
            marks: parseFloat(s.marks) || 0,
            max_marks: 100,
            comment: (s.comment || "").trim(),
          })),
        ],
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
        <div className="flex items-center justify-between mb-6">
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture */}
          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-200 bg-emerald-50 flex items-center justify-center shadow-md">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center hover:bg-emerald-500 transition-colors shadow-md"
                data-testid="upload-pic-btn"
              >
                <Camera size={14} className="text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePicUpload}
                className="hidden"
                data-testid="pic-file-input"
              />
            </div>
          </div>

          {/* Name + Standard */}
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
                Standard *
              </label>
              <input
                type="text"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                placeholder="e.g. Standard 5"
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

          {/* Gender + School */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold uppercase tracking-widest text-emerald-600 block mb-2">
                Gender
              </label>
              <div className="flex gap-2">
                {["Male", "Female"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(gender === g ? "" : g)}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
                      gender === g
                        ? "bg-emerald-400 text-white shadow-sm"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                    data-testid={`gender-${g.toLowerCase()}`}
                  >
                    {g === "Male" ? "♂ Male" : "♀ Female"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold uppercase tracking-widest text-emerald-600 block mb-2">
                School
              </label>
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl h-12 px-4 text-emerald-900 focus:outline-none focus:border-emerald-400 font-medium cursor-pointer"
                data-testid="student-school-select"
              >
                <option value="">Select school...</option>
                {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Custom School Input (shown when "Others") */}
          {school === "Others" && (
            <div>
              <label className="text-sm font-bold uppercase tracking-widest text-emerald-600 block mb-2">
                School Name *
              </label>
              <input
                type="text"
                value={customSchool}
                onChange={(e) => setCustomSchool(e.target.value)}
                placeholder="Type the school name..."
                className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl h-12 px-4 text-emerald-900 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 font-medium"
                data-testid="custom-school-input"
              />
            </div>
          )}

          {/* Exam Type */}
          <div>
            <label className="text-sm font-bold uppercase tracking-widest text-emerald-600 block mb-2">
              Exam Type
            </label>
            <div className="flex flex-wrap gap-2">
              {EXAM_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setExamType(type)}
                  className={`px-3 py-1.5 rounded-full font-bold text-sm transition-all ${
                    examType === type
                      ? "bg-emerald-400 text-white shadow-sm scale-105"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  }`}
                  data-testid={`exam-type-${type}`}
                >
                  {type}
                </button>
              ))}
            </div>
            {examType === "Others" && (
              <input
                type="text"
                value={customExam}
                onChange={(e) => setCustomExam(e.target.value)}
                placeholder="Type the exam name (e.g. UPSR Trial)..."
                className="mt-3 w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl h-12 px-4 text-emerald-900 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 font-medium"
                data-testid="custom-exam-input"
              />
            )}
          </div>

          {/* Fixed Subjects with per-subject comment */}
          <div>
            <label className="text-sm font-bold uppercase tracking-widest text-emerald-600 block mb-3">
              Marks (out of 100)
            </label>
            <div className="space-y-2.5">
              {FIXED_SUBJECTS.map((subj) => {
                const isOpen = expandedComment === subj;
                const hasComment = (comments[subj] || "").trim().length > 0;
                return (
                  <div key={subj} data-testid={`subject-row-${subj}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 bg-emerald-400 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0">
                        {subj}
                      </div>
                      <input
                        type="number"
                        value={marks[subj]}
                        onChange={(e) => updateMark(subj, e.target.value)}
                        placeholder="—"
                        min="0"
                        max="100"
                        className="flex-1 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl h-10 px-3 text-emerald-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 font-bold"
                        data-testid={`marks-${subj}`}
                      />
                      {marks[subj] !== "" && (
                        <span className="text-xs font-bold text-emerald-400 w-8 text-right shrink-0">
                          {marks[subj]}%
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleComment(subj)}
                        className={`px-2 py-1 rounded-full text-xs font-bold transition-colors shrink-0 ${
                          hasComment || isOpen
                            ? "bg-emerald-400 text-white"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                        data-testid={`toggle-comment-${subj}`}
                        title="Add a comment"
                      >
                        💬
                      </button>
                    </div>
                    {isOpen && (
                      <div className="mt-2 ml-[68px] flex gap-2 items-start" data-testid={`comment-box-${subj}`}>
                        <textarea
                          value={comments[subj] || ""}
                          onChange={(e) => updateComment(subj, e.target.value)}
                          placeholder="Short comment (or click ✨ to auto-fill)"
                          rows={2}
                          className="flex-1 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl px-3 py-2 text-emerald-900 focus:outline-none focus:border-emerald-400 text-sm resize-none"
                          data-testid={`comment-${subj}`}
                        />
                        <button
                          type="button"
                          onClick={() => autoFillComment(subj)}
                          className="p-2 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors shrink-0"
                          title="Auto-generate comment"
                          data-testid={`auto-comment-${subj}`}
                        >
                          <Sparkles size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extra Subjects */}
          {extraSubjects.length > 0 && (
            <div>
              <label className="text-sm font-bold uppercase tracking-widest text-emerald-600 block mb-3">
                Other Subjects
              </label>
              <div className="space-y-2.5">
                {extraSubjects.map((subj, i) => {
                  const key = `extra-${i}`;
                  const isOpen = expandedComment === key;
                  const hasComment = (subj.comment || "").trim().length > 0;
                  return (
                    <div key={i} data-testid={`extra-row-${i}`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={subj.name}
                          onChange={(e) => updateExtra(i, "name", e.target.value)}
                          placeholder="Name"
                          className="w-20 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl h-10 px-3 text-emerald-900 focus:outline-none focus:border-emerald-400 font-bold text-sm shrink-0"
                          data-testid={`extra-name-${i}`}
                        />
                        <input
                          type="number"
                          value={subj.marks}
                          onChange={(e) => updateExtra(i, "marks", e.target.value)}
                          placeholder="—"
                          min="0"
                          max="100"
                          className="flex-1 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl h-10 px-3 text-emerald-900 focus:outline-none focus:border-emerald-400 font-bold"
                          data-testid={`extra-marks-${i}`}
                        />
                        {subj.marks !== "" && (
                          <span className="text-xs font-bold text-emerald-400 w-8 text-right shrink-0">
                            {subj.marks}%
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleComment(key)}
                          className={`px-2 py-1 rounded-full text-xs font-bold transition-colors shrink-0 ${
                            hasComment || isOpen
                              ? "bg-emerald-400 text-white"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          }`}
                          data-testid={`toggle-extra-comment-${i}`}
                        >
                          💬
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExtraSubject(i)}
                          className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-400 transition-colors shrink-0"
                          data-testid={`remove-extra-${i}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="mt-2 ml-[88px] flex gap-2 items-start">
                          <textarea
                            value={subj.comment || ""}
                            onChange={(e) => updateExtra(i, "comment", e.target.value)}
                            placeholder="Short comment (or click ✨ to auto-fill)"
                            rows={2}
                            className="flex-1 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl px-3 py-2 text-emerald-900 focus:outline-none focus:border-emerald-400 text-sm resize-none"
                            data-testid={`extra-comment-${i}`}
                          />
                          <button
                            type="button"
                            onClick={() => autoFillExtraComment(i)}
                            className="p-2 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors shrink-0"
                            title="Auto-generate comment"
                            data-testid={`auto-extra-comment-${i}`}
                          >
                            <Sparkles size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={addExtraSubject}
            className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-100 px-4 py-2 rounded-full hover:bg-emerald-200 transition-colors"
            data-testid="add-extra-subject-btn"
          >
            <Plus size={14} /> Add Other Subject
          </button>

          <p className="text-xs text-emerald-400 font-medium">
            💡 Tap 💬 to add a comment per subject, then ✨ to auto-generate one from the grade.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
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
