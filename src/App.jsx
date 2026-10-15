import React, { useEffect, useState } from "react";
import { navigationGroups as nav, initialQuestions, institutionClasses, pageRoutes, routePages, students } from "./data/institution";
import { Avatar, Button, Icon } from "./components/ui";
import { ConfirmDialog, InviteCodeModal, StaffInviteModal, StudentInviteModal } from "./components/modals";
import RichQuestionStudio from "./components/question-editor/RichQuestionModal";
import DashboardPage from "./pages/Dashboard";
import StudentsPage from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import QuestionBankPage from "./pages/QuestionBank";
import ResourcesPage from "./pages/Resources";
import ActivityPage from "./pages/Activity";
import SettingsPage from "./pages/Settings";
import PracticeSessionsPage from "./pages/PracticeSessions";
import InvitationsPage from "./pages/Invitations";
import ClassesLevelsPage from "./pages/ClassesLevels";
import ClassDetailsPage from "./pages/ClassDetails";
import StaffPermissionsPage from "./pages/StaffPermissions";
import { AuthPage, LearnerPreview } from "./pages/Auth";

const logo = "/Cedu Logo.png";
const titles = { dashboard: "Overview", students: "Students", questions: "Question bank", structure: "Classes & levels", practice: "Practice sessions", resources: "Resource bank", invite: "Invitations", staff: "Staff & permissions", activity: "Activity log", settings: "Institution settings" };
const normalizedPath = () => window.location.pathname.replace(/\/+$/, "") || "/dashboard";
const pageFromLocation = () => { const path = normalizedPath(); return path.startsWith("/students/") || path.startsWith("/classes/") ? (path.startsWith("/classes/") ? "structure" : "students") : routePages[path] || "dashboard"; };
const studentFromLocation = () => { const path = normalizedPath(); if (!path.startsWith("/students/")) return null; const slug = decodeURIComponent(path.slice("/students/".length)); return students.find(student => student.name.toLowerCase().replace(/\s+/g, "-") === slug) || null; };
const classFromLocation = () => { const path = normalizedPath(); if (!path.startsWith("/classes/")) return null; const slug = decodeURIComponent(path.slice("/classes/".length)); return institutionClasses.find(item => item.name.toLowerCase().replace(/\s+/g, "-") === slug) || { name: slug.replace(/-/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()), learners: 0, subjects: ["Mathematics", "English"], tone: "purple", questions: 0, progress: 0 }; };

export default function App() {
  const [page, setPage] = useState(pageFromLocation);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [questions, setQuestions] = useState(initialQuestions);
  const [toast, setToast] = useState("");
  const [welcome, setWelcome] = useState(null);
  const [studentProfile, setStudentProfile] = useState(studentFromLocation);
  const [classProfile, setClassProfile] = useState(classFromLocation);

  useEffect(() => {
    const path = normalizedPath();
    if (window.location.pathname !== path) window.history.replaceState({}, "", path);
    const handlePopState = () => { setPage(pageFromLocation()); setStudentProfile(studentFromLocation()); setClassProfile(classFromLocation()); };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const notify = message => {
    const raw = String(message);
    const match = raw.match(/^(.+)'s profile(?: profile)? opened$/);
    if (match) {
      const student = students.find(item => item.name === match[1]);
      if (student) { const slug = student.name.toLowerCase().replace(/\s+/g, "-"); window.history.pushState({}, "", `/students/${slug}`); setPage("students"); setStudentProfile(student); return; }
    }
    setToast(raw.replace(/ profile profile opened$/, " profile opened"));
    window.setTimeout(() => setToast(""), 2600);
  };

  const selectPage = next => { const safePage = pageRoutes[next] ? next : "dashboard"; const route = pageRoutes[safePage]; if (window.location.pathname !== route) window.history.pushState({}, "", route); setPage(safePage); setStudentProfile(null); setClassProfile(null); setMobileOpen(false); };
  const openClass = classItem => { const slug = classItem.name.toLowerCase().replace(/\s+/g, "-"); window.history.pushState({}, "", `/classes/${slug}`); setPage("structure"); setClassProfile(classItem); setStudentProfile(null); setMobileOpen(false); };
  const closeClass = () => selectPage("structure");
  const confirm = (title, message, confirmLabel, onConfirm, tone = "danger") => setConfirmation({ title, message, confirmLabel, onConfirm, tone });
  const closeProfile = () => selectPage("students");
  const editingQuestion = modal && typeof modal === "object" && modal.type === "question" ? modal.question : null;
  const saveQuestion = question => { setQuestions(current => editingQuestion ? current.map(item => item.id === editingQuestion.id ? { ...item, ...question, id: item.id, status: question.publishStatus || item.status } : item) : [{ ...question, status: question.publishStatus || "Draft" }, ...current]); setModal(null); notify(editingQuestion ? "Question updated successfully" : "Question saved successfully"); };

  if (welcome === "learner") return <LearnerPreview onBack={() => setWelcome(null)} onOnboarding={() => setWelcome("auth")} />;
  if (welcome === "auth") return <AuthPage onOpen={() => setWelcome(null)} />;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <button className="sidebar-brand" onClick={() => setWelcome("auth")} aria-label="Open sign in"><img src={logo} alt="Cedu" /><span className="brand-pill">INSTITUTION</span></button>
      <div className="institution-switch"><Avatar initials="GW" color="yellow" /><div><strong>Greenfield Academy</strong><span>Institution workspace</span></div></div>
      <nav className="nav-groups">{nav.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(([key, label]) => <button className={`nav-item ${page === key ? "active" : ""}`} key={key} onClick={() => selectPage(key)}><Icon name={key} /><span>{label}</span>{key === "invite" && <i className="nav-dot">3</i>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><button className="logout" onClick={() => confirm("Sign out of Cedu?", "You will return to the sign-in page.", "Sign out", () => setWelcome("auth"))}>↪ Sign out</button></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">☰</button><div className="breadcrumbs"><span>Greenfield Academy</span><b>/</b><strong>{studentProfile ? "Student profile" : classProfile ? "Class workspace" : titles[page]}</strong></div><div className="top-actions"><button className="preview-button" onClick={() => setWelcome("learner")}>Preview learner view <Icon name="arrow" /></button><button className="icon-button" onClick={() => notify("You have 3 new notifications")} aria-label="View notifications"><Icon name="bell" /><i /></button><div className="profile"><Avatar initials="AO" /><div><strong>Ada Okafor</strong><span>Institution owner</span></div><span>⌄</span></div></div></header>
      <div className="page-content">
        {studentProfile ? <StudentProfile student={studentProfile} onBack={closeProfile} notify={notify} /> : classProfile ? <ClassDetailsPage classItem={classProfile} onBack={closeClass} notify={notify} selectPage={selectPage} /> : <><PageHeading page={page} onAction={setModal} />{page === "dashboard" && <DashboardPage selectPage={selectPage} setModal={setModal} notify={notify} confirm={confirm} />}{page === "students" && <StudentsPage notify={notify} />}{page === "questions" && <QuestionBankPage questions={questions} setQuestions={setQuestions} setModal={setModal} notify={notify} confirm={confirm} />}{page === "structure" && <ClassesLevelsPage notify={notify} openClass={openClass} />}{page === "practice" && <PracticeSessionsPage notify={notify} />}{page === "resources" && <ResourcesPage notify={notify} />}{page === "invite" && <InvitationsPage notify={notify} />}{page === "staff" && <StaffPermissionsPage notify={notify} />}{page === "activity" && <ActivityPage />}{page === "settings" && <SettingsPage notify={notify} />}</>}
      </div>
    </main>
    {(modal === "question" || editingQuestion) && <RichQuestionStudio initialQuestion={editingQuestion} onClose={() => setModal(null)} onSave={saveQuestion} />}{modal === "invite" && <InviteCodeModal onClose={() => setModal(null)} onSave={() => { setModal(null); notify("New invite code generated"); }} />}{modal === "student" && <StudentInviteModal onClose={() => setModal(null)} onSave={() => { setModal(null); notify("Family invite sent"); }} />}{modal === "staff" && <StaffInviteModal onClose={() => setModal(null)} onSave={role => { setModal(null); notify(`${role} invitation sent`); }} />}{confirmation && <ConfirmDialog {...confirmation} onClose={() => setConfirmation(null)} onConfirm={() => { setConfirmation(null); confirmation.onConfirm(); }} />}{toast && <div className="toast" role="status"><span className="toast-check">✓</span>{toast}</div>}
  </div>;
}

function PageHeading({ page, onAction }) { const action = page === "questions" ? ["New question", "question"] : page === "invite" ? ["Create invite", "invite"] : page === "students" ? ["Invite student", "student"] : page === "staff" ? ["Invite staff", "staff"] : null; return <div className="page-heading"><div><p className="eyebrow">{page === "dashboard" ? "GOOD MORNING" : "INSTITUTION WORKSPACE"}</p><h1>{page === "dashboard" ? "Welcome, Ada" : titles[page]}</h1><p className="subheading">{page === "dashboard" ? "Here is what is happening across your learning community today." : page === "questions" ? "Create, organise and publish personalised practice for your students." : page === "students" ? "Keep track of every learner connected to Greenfield Academy." : "Manage your institution workspace with confidence."}</p></div>{action && <Button icon="plus" onClick={() => onAction(action[1])}>{action[0]}</Button>}</div>; }
