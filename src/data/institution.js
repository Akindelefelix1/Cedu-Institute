export const initialQuestions = [
  { id: 1, text: "Which planet is known as the Red Planet?", subject: "Basic Science", type: "Multiple choice", status: "Published", updated: "Today", plays: 84 },
  { id: 2, text: "What is 8 × 7?", subject: "Mathematics", type: "Multiple choice", status: "Published", updated: "Yesterday", plays: 61 },
  { id: 3, text: "Complete the sentence: The sun rises in the ___ .", subject: "English", type: "Fill in the blank", status: "Needs review", updated: "2 days ago", plays: 0 },
  { id: 4, text: "Name one way to keep your environment clean.", subject: "Civic Education", type: "Short answer", status: "Draft", updated: "3 days ago", plays: 0 },
];

export const students = [
  { name: "Amaka Nwosu", initials: "AN", className: "Primary 5 Gold", progress: 78, lastSeen: "Today, 9:42 AM", status: "Active" },
  { name: "Daniel Adeyemi", initials: "DA", className: "Primary 5 Gold", progress: 64, lastSeen: "Today, 8:17 AM", status: "Active" },
  { name: "Fatima Bello", initials: "FB", className: "Primary 6 Blue", progress: 91, lastSeen: "Yesterday", status: "Active" },
  { name: "Ifeanyi Okoro", initials: "IO", className: "Primary 4 Green", progress: 42, lastSeen: "Sep 28, 2026", status: "Inactive" },
  { name: "Tomiwa Akinola", initials: "TA", className: "Primary 6 Blue", progress: 86, lastSeen: "Sep 27, 2026", status: "Active" },
];

export const institutionClasses = [
  { name: "Primary 5 Gold", learners: 32, subjects: ["Mathematics", "English"], tone: "purple", questions: 42, progress: 78 },
  { name: "Primary 6 Blue", learners: 28, subjects: ["Basic Science", "English"], tone: "blue", questions: 31, progress: 72 },
  { name: "Primary 4 Green", learners: 24, subjects: ["Mathematics", "Civic Education"], tone: "green", questions: 29, progress: 64 },
];

export const navigationGroups = [
  { label: "Workspace", items: [["dashboard", "Overview"], ["students", "Students"]] },
  { label: "Content studio", items: [["questions", "Question bank"], ["structure", "Classes & levels"], ["practice", "Practice sessions"], ["resources", "Resource bank"]] },
  { label: "Institution", items: [["invite", "Invitations"], ["staff", "Staff & permissions"], ["activity", "Activity log"], ["settings", "Settings"]] },
];

export const pageRoutes = { dashboard: "/dashboard", students: "/students", questions: "/question-bank", structure: "/classes-levels", practice: "/practice-sessions", resources: "/resources", invite: "/invitations", staff: "/staff-permissions", activity: "/activity-log", settings: "/settings" };
export const routePages = Object.fromEntries(Object.entries(pageRoutes).map(([page, route]) => [route, page]));
