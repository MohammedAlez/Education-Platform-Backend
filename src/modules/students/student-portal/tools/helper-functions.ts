// Helper to calculate weighted average and status
export function calculateSubjectStats(grades: Array<{ value: number; maxValue: number; type: string }>) {
  if (grades.length === 0) {
    return { averageGrade: 0, status: "No Grades" };
  }

  // Calculate normalized average on a scale of 20
  const totalScaledGrade = grades.reduce(
    (sum, g) => sum + (g.value / g.maxValue) * 20,
    0
  );
  const averageGrade = Number((totalScaledGrade / grades.length).toFixed(1));

  let status = "Passing";
  if (averageGrade < 10) {
    status = "Failing";
  } else if (averageGrade < 12) {
    status = "At Risk";
  }

  return { averageGrade, status };
}

// Map GradeType Enum to display format and weight
export function formatAssessmentType(type: string): { label: string; weight: number } {
  switch (type) {
    case "QUIZ":
      return { label: "Quiz", weight: 10 };
    case "ASSIGNMENT":
      return { label: "Assignment", weight: 20 };
    case "TEST":
      return { label: "Test", weight: 30 };
    case "EXAM":
      return { label: "Exam", weight: 40 };
    default:
      return { label: type, weight: 10 };
  }
}