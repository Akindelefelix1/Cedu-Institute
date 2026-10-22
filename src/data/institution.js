export const navigationGroups = [
  { label: "Workspace", items: [["dashboard", "Overview"], ["students", "Students"]] },
  { label: "Content studio", items: [["questions", "Question bank"], ["structure", "Classes & levels"], ["practice", "Learner practice"], ["resources", "Question media"]] },
  { label: "Institution", items: [["invite", "Invitations"], ["staff", "Staff & permissions"], ["activity", "Activity log"], ["settings", "Settings"]] },
];

export const pageRoutes = { dashboard: "/dashboard", students: "/students", questions: "/question-bank", bulkUpload: "/question-bank/bulk-upload", structure: "/classes-levels", practice: "/practice-sessions", resources: "/resources", invite: "/invitations", staff: "/staff-permissions", activity: "/activity-log", settings: "/settings" };
export const routePages = Object.fromEntries(Object.entries(pageRoutes).map(([page, route]) => [route, page]));
