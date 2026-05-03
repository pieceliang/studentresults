// Custom VSS grading rubric
// 82-100 A Excellent, 66-81 B Credit, 50-65 C Good,
// 35-49 D Satisfactory, 20-34 E Meets Min, 0-19 F Does Not Meet Min

export const GRADE_SCALE = [
  {
    min: 82, max: 100, grade: "A", label: "Excellent",
    emoji: "🌟", color: "#059669",
    bg: "bg-emerald-100", text: "text-emerald-800",
    comment: "Excellent work — keep up the great effort!",
  },
  {
    min: 66, max: 81, grade: "B", label: "Credit",
    emoji: "⭐", color: "#22c55e",
    bg: "bg-green-100", text: "text-green-800",
    comment: "Credit-worthy performance. Well done!",
  },
  {
    min: 50, max: 65, grade: "C", label: "Good",
    emoji: "👍", color: "#eab308",
    bg: "bg-yellow-100", text: "text-yellow-800",
    comment: "Good effort. Keep practising to improve further.",
  },
  {
    min: 35, max: 49, grade: "D", label: "Satisfactory",
    emoji: "📖", color: "#f97316",
    bg: "bg-orange-100", text: "text-orange-800",
    comment: "Satisfactory. Needs more consistent practice.",
  },
  {
    min: 20, max: 34, grade: "E", label: "Meets Minimum Requirement",
    emoji: "⚠️", color: "#f59e0b",
    bg: "bg-amber-100", text: "text-amber-800",
    comment: "Minimum requirement met. Aim higher next time.",
  },
  {
    min: 0, max: 19, grade: "F", label: "Does Not Meet Minimum Requirement",
    emoji: "😰", color: "#ef4444",
    bg: "bg-red-100", text: "text-red-800",
    comment: "Needs immediate attention and extra support.",
  },
];

const fallback = GRADE_SCALE[GRADE_SCALE.length - 1];

export const getGradeByPct = (pct) => {
  if (pct === null || pct === undefined || isNaN(pct)) return fallback;
  return GRADE_SCALE.find((g) => pct >= g.min && pct <= g.max) || fallback;
};

export const getGradeInfo = (marks, maxMarks = 100) => {
  if (!maxMarks) return fallback;
  return getGradeByPct((marks / maxMarks) * 100);
};

export const autoComment = (marks, maxMarks = 100) =>
  getGradeInfo(marks, maxMarks).comment;
