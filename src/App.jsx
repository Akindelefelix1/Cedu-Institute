import React, { useEffect, useState } from "react";
import { navigationGroups as nav, initialQuestions, institutionClasses, pageRoutes, routePages, students } from "./data/institution";
import { Avatar, Button, Icon } from "./components/ui";
import { ConfirmDialog, InviteCodeModal, StaffInviteModal, StudentInviteModal } from "./components/modals";
import RichQuestionStudio from "./components/question-editor/RichQuestionModal";
import InstitutionQuestionModal from "./components/question-editor/InstitutionQuestionModal";
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
import { clearInstitutionSession, getInstitutionAccount, getInstitutionToken, institutionRequest } from "./services/institutionApi";

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
  const [account, setAccount] = useState(getInstitutionAccount);
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0);
  const [sessionChecked, setSessionChecked] = useState(() => !getInstitutionAccount() || !getInstitutionToken());
  const [studentProfile, setStudentProfile] = useState(studentFromLocation);
  const [classProfile, setClassProfile] = useState(classFromLocation);

  useEffect(() => {
    const path = normalizedPath();
    if (window.location.pathname !== path) window.history.replaceState({}, "", path);
    const handlePopState = () => { setPage(pageFromLocation()); setStudentProfile(studentFromLocation()); setClassProfile(classFromLocation()); };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleAccountUpdate = event => setAccount(event.detail);
    const handlePendingCount = event => setPendingInvitationCount(Number(event.detail || 0));
    window.addEventListener("institution-account-updated", handleAccountUpdate);
    window.addEventListener("institution-pending-count-updated", handlePendingCount);
    return () => { window.removeEventListener("institution-account-updated", handleAccountUpdate); window.removeEventListener("institution-pending-count-updated", handlePendingCount); };
  }, []);

  useEffect(() => {
    if (!account || !getInstitutionToken()) { if (account) { clearInstitutionSession(); setAccount(null); } setSessionChecked(true); return undefined; }
    let active = true;
    institutionRequest("/auth/institution/me")
      .then(data => { if (active) setAccount(data.account); })
      .catch(() => { if (active) { clearInstitutionSession(); setAccount(null); } })
      .finally(() => { if (active) setSessionChecked(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!account || !getInstitutionToken()) return undefined;
    let active = true;
    institutionRequest("/institutions/dashboard").then(data => { if (active) setPendingInvitationCount(Number(data.metrics?.pending_requests || 0)); }).catch(() => { if (active) setPendingInvitationCount(0); });
    institutionRequest("/institutions/questions").then(data => { if (active) setQuestions(data.questions || []); }).catch(() => { if (active) setQuestions([]); });
    return () => { active = false; };
  }, [account]);

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
  const editingQuestion = modal && typeof modal === "object" && modal.type === "question" ? (modal.question || modal.initialQuestion) : null;
  const saveQuestion = question => { setQuestions(current => editingQuestion ? current.map(item => item.id === editingQuestion.id ? { ...item, ...question, id: item.id, status: question.publishStatus || item.status } : item) : [{ ...question, status: question.publishStatus || "Draft" }, ...current]); setModal(null); notify(editingQuestion ? "Question updated successfully" : "Question saved successfully"); };
  const saveInstitutionQuestion = async question => { if (!question.levelId) throw new Error("This class is not connected to the institution structure. Refresh and try again."); await institutionRequest(`/institutions/structure/levels/${question.levelId}/questions`, { method: "POST", body: JSON.stringify({ subject: question.subject, questionText: question.text, explanation: question.explanation, options: question.options, status: "draft" }) }); setQuestions(current => [{ ...question, status: "Draft" }, ...current]); setModal(null); notify("Question saved successfully"); };

  if (welcome === "learner") return <LearnerPreview onBack={() => setWelcome(null)} onOnboarding={() => setWelcome("auth")} />;
  if (!sessionChecked) return <main className="app-error-state"><div><span>…</span><h1>Restoring your workspace</h1><p>Checking your secure institution session.</p></div></main>;
  if (!account || welcome === "auth") return <AuthPage onOpen={() => setWelcome(null)} onAuthenticated={nextAccount => { setAccount(nextAccount); setWelcome(null); }} />;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <button className="sidebar-brand" onClick={() => setWelcome("auth")} aria-label="Open sign in"><img src={logo} alt="Cedu" /><span className="brand-pill">INSTITUTION</span></button>
      <div className="institution-switch"><Avatar initials={(account.institutionName || "IN").slice(0, 2).toUpperCase()} color="yellow" /><div><strong>{account.institutionName}</strong><span>{account.publicAccess ? "Public · request to join" : `Invite only · ${account.inviteCode || "code unavailable"}`}</span></div></div>
      <nav className="nav-groups">{nav.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(([key, label]) => <button className={`nav-item ${page === key ? "active" : ""}`} key={key} onClick={() => selectPage(key)}><Icon name={key} /><span>{label}</span>{key === "invite" && pendingInvitationCount > 0 && <i className="nav-dot">{pendingInvitationCount > 99 ? "99+" : pendingInvitationCount}</i>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><button className="logout" onClick={() => confirm("Sign out of Cedu?", "You will return to the sign-in page.", "Sign out", () => { clearInstitutionSession(); setAccount(null); setWelcome(null); })}>↪ Sign out</button></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">☰</button><div className="breadcrumbs"><span>{account.institutionName}</span><b>/</b><strong>{studentProfile ? "Student profile" : classProfile ? "Class workspace" : titles[page]}</strong></div><div className="top-actions"><button className="preview-button" onClick={() => setWelcome("learner")}>Preview learner view <Icon name="arrow" /></button><button className="icon-button" onClick={() => notify("No new notifications") } aria-label="View notifications"><Icon name="bell" /></button><div className="profile"><Avatar initials={(account.ownerName || "IN").slice(0, 2).toUpperCase()} /><div><strong>{account.ownerName}</strong><span>Institution owner</span></div><button aria-label="Sign out" onClick={() => { clearInstitutionSession(); setAccount(null); setWelcome(null); }}>⌄</button></div></div></header>
      <div className="page-content">
        {studentProfile ? <StudentProfile student={studentProfile} onBack={closeProfile} notify={notify} /> : classProfile ? <ClassDetailsPage classItem={classProfile} onBack={closeClass} notify={notify} selectPage={selectPage} setModal={setModal} /> : <><PageHeading page={page} onAction={setModal} account={account} />{page === "dashboard" && <DashboardPage selectPage={selectPage} setModal={setModal} notify={notify} confirm={confirm} />}{page === "students" && <StudentsPage notify={notify} />}{page === "questions" && <QuestionBankPage questions={questions} setQuestions={setQuestions} setModal={setModal} notify={notify} confirm={confirm} onDelete={async id => { await institutionRequest(`/institutions/questions/${id}`, { method: "DELETE" }); setQuestions(current => current.filter(item => item.id !== id)); notify("Question deleted"); }} />}{page === "structure" && <ClassesLevelsPage notify={notify} openClass={openClass} />}{page === "practice" && <PracticeSessionsPage notify={notify} />}{page === "resources" && <ResourcesPage notify={notify} />}{page === "invite" && <InvitationsPage notify={notify} />}{page === "staff" && <StaffPermissionsPage notify={notify} />}{page === "activity" && <ActivityPage />}{page === "settings" && <SettingsPage notify={notify} />}</>}
      </div>
    </main>
    {(modal === "question" || editingQuestion) && <RichQuestionStudio initialQuestion={editingQuestion} onClose={() => setModal(null)} onSave={saveQuestion} />}{modal?.type === "institutionQuestion" && <InstitutionQuestionModal levelId={modal.levelId} section={modal.section} className={modal.className} learningArea={modal.learningArea} onClose={() => setModal(null)} onSave={saveInstitutionQuestion} />}{modal === "invite" && <InviteCodeModal onClose={() => setModal(null)} onSave={() => { setModal(null); notify("New invite code generated"); }} />}{modal === "student" && <StudentInviteModal onClose={() => setModal(null)} onSave={() => { setModal(null); notify("Family invite sent"); }} />}{modal === "staff" && <StaffInviteModal onClose={() => setModal(null)} onSave={role => { setModal(null); notify(`${role} invitation sent`); }} />}{confirmation && <ConfirmDialog {...confirmation} onClose={() => setConfirmation(null)} onConfirm={async () => { await confirmation.onConfirm(); setConfirmation(null); }} />}{toast && <div className="toast" role="status"><span className="toast-check">✓</span>{toast}</div>}
  </div>;
}

function PageHeading({ page, onAction, account }) { const action = page === "questions" ? ["New question", "question"] : page === "invite" ? ["Create invite", "invite"] : page === "students" ? ["Invite student", "student"] : page === "staff" ? ["Invite staff", "staff"] : null; const hour = new Date().getHours(); const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"; return <div className="page-heading"><div><p className="eyebrow">{page === "dashboard" ? greeting : "INSTITUTION WORKSPACE"}</p><h1>{page === "dashboard" ? `Welcome to ${account?.institutionName || "your institution"}` : titles[page]}</h1><p className="subheading">{page === "dashboard" ? `Here is what is happening across ${account?.institutionName || "your learning community"}.` : page === "questions" ? "Create, organise and publish personalised practice for your learners." : page === "students" ? `Keep track of every learner connected to ${account?.institutionName || "your institution"}.` : "Manage your institution workspace with confidence."}</p></div>{action && <Button icon="plus" onClick={() => onAction(action[1])}>{action[0]}</Button>}</div>; }




