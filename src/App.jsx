import React, { useEffect, useState } from "react";
import { navigationGroups as nav, initialQuestions, institutionClasses, pageRoutes, routePages } from "./data/institution";
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
import { clearInstitutionSession, getInstitutionAccount, getInstitutionToken, institutionRequest } from "./services/institutionApi";

const logo = "/Cedu Logo.png";
const titles = { dashboard: "Overview", students: "Students", questions: "Question bank", structure: "Classes & levels", practice: "Practice sessions", resources: "Resource bank", invite: "Invitations", staff: "Staff & permissions", activity: "Activity log", settings: "Institution settings" };
const normalizedPath = () => window.location.pathname.replace(/\/+$/, "") || "/dashboard";
const pageFromLocation = () => { const path = normalizedPath(); return path.startsWith("/students/") || path.startsWith("/classes/") ? (path.startsWith("/classes/") ? "structure" : "students") : routePages[path] || "dashboard"; };
const studentFromLocation = () => { const path = normalizedPath(); if (!path.startsWith("/students/")) return null; return decodeURIComponent(path.slice("/students/".length)); };
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
    setToast(raw);
    window.setTimeout(() => setToast(""), 2600);
  };

  const selectPage = (next, query = null) => { const safePage = pageRoutes[next] ? next : "dashboard"; const route = pageRoutes[safePage]; const search = query ? `?${new URLSearchParams(query)}` : ""; const destination = `${route}${search}`; if (`${window.location.pathname}${window.location.search}` !== destination) window.history.pushState({}, "", destination); setPage(safePage); setStudentProfile(null); setClassProfile(null); setMobileOpen(false); };
  const openClass = classItem => { const slug = classItem.name.toLowerCase().replace(/\s+/g, "-"); window.history.pushState({}, "", `/classes/${slug}`); setPage("structure"); setClassProfile(classItem); setStudentProfile(null); setMobileOpen(false); };
  const closeClass = () => selectPage("structure");
  const confirm = (title, message, confirmLabel, onConfirm, tone = "danger") => setConfirmation({ title, message, confirmLabel, onConfirm, tone });
  const closeProfile = () => selectPage("students");
  const openStudent = student => { window.history.pushState({}, "", `/students/${encodeURIComponent(student.id)}`); setPage("students"); setStudentProfile(student.id); setClassProfile(null); setMobileOpen(false); };
  const editingQuestion = modal && typeof modal === "object" && modal.type === "question" ? (modal.question || modal.initialQuestion) : null;
  const saveInstitutionQuestion = async question => { if (!question.levelId) throw new Error("This class is not connected to the institution structure. Refresh and try again."); const body = new FormData(); body.append("subject", question.subject); body.append("questionText", question.text); body.append("explanation", question.explanation); body.append("status", question.publishStatus === "Published" ? "published" : "draft"); body.append("readAloud", String(question.readAloud)); const shapeData = value => value ? JSON.stringify({ type: ({ "●": "circle", "■": "square", "▬": "rectangle", "▲": "triangle", "★": "star", "⬢": "hexagon" })[value] || value.type || "circle", color: value.color || "#7442ae" }) : "null"; body.append("questionShape", shapeData(question.shapes.question)); const options = question.options.map((option, index) => { const file = option.media?.file; if (file) body.append(`optionMedia${index}`, file, file.name); return { text: option.text, isCorrect: option.isCorrect, mediaType: option.media ? (option.media.type.startsWith("image/") ? "image" : option.media.type.startsWith("audio/") ? "audio" : option.media.type.startsWith("video/") ? "video" : "document") : null, shape: shapeData(option.shape) }; }); const questionFile = question.media.question?.file; if (questionFile) body.append("questionMedia", questionFile, questionFile.name); body.append("questionMediaType", question.media.question ? (question.media.question.type.startsWith("image/") ? "image" : question.media.question.type.startsWith("audio/") ? "audio" : question.media.question.type.startsWith("video/") ? "video" : "document") : ""); body.append("options", JSON.stringify(options)); const saved = await institutionRequest(`/institutions/structure/levels/${question.levelId}/questions`, { method: "POST", body }); const item = saved.question; setQuestions(current => [{ id: item.id, text: item.question_text, explanation: item.explanation, subject: item.subject, level: question.level, section: question.section, type: "Multiple choice", status: item.status === "published" ? "Published" : "Draft", updated: item.created_at, plays: 0, mediaUrl: item.media_url, mediaType: item.media_type, readAloud: item.read_aloud, shapeType: item.shape_type, shapeColor: item.shape_color, options: item.options }, ...current]); setModal(null); notify("Question saved successfully"); };

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
        {studentProfile ? <StudentProfile studentId={studentProfile} institutionName={account.institutionName} onBack={closeProfile} /> : classProfile ? <ClassDetailsPage classItem={classProfile} onBack={closeClass} notify={notify} selectPage={selectPage} setModal={setModal} onUpdateClass={async payload => { const data = await institutionRequest(`/institutions/structure/levels/${classProfile.id}`, { method: "PATCH", body: JSON.stringify(payload) }); const slug = data.level.name.toLowerCase().replace(/\s+/g, "-"); window.history.replaceState({}, "", `/classes/${slug}`); setClassProfile(current => ({ ...current, ...data.level, structureLabels: current.structureLabels })); notify(`${data.level.name} updated`); }} /> : <><PageHeading page={page} onAction={setModal} account={account} selectPage={selectPage} />{page === "dashboard" && <DashboardPage selectPage={selectPage} setModal={setModal} notify={notify} confirm={confirm} />}{page === "students" && <StudentsPage notify={notify} onOpenStudent={openStudent} />}{page === "questions" && <QuestionBankPage questions={questions} setQuestions={setQuestions} setModal={setModal} selectPage={selectPage} notify={notify} confirm={confirm} onDelete={async id => { await institutionRequest(`/institutions/questions/${id}`, { method: "DELETE" }); setQuestions(current => current.filter(item => item.id !== id)); notify("Question deleted"); }} />}{page === "structure" && <ClassesLevelsPage notify={notify} openClass={openClass} />}{page === "practice" && <PracticeSessionsPage notify={notify} />}{page === "resources" && <ResourcesPage notify={notify} />}{page === "invite" && <InvitationsPage notify={notify} />}{page === "staff" && <StaffPermissionsPage notify={notify} />}{page === "activity" && <ActivityPage />}{page === "settings" && <SettingsPage notify={notify} />}</>}
      </div>
    </main>
    {modal?.type === "institutionQuestion" && <RichQuestionStudio institutionPlacement={modal} onClose={() => setModal(null)} onSave={saveInstitutionQuestion} />}{modal === "invite" && <InviteCodeModal onClose={() => setModal(null)} onSave={() => { setModal(null); notify("New invite code generated"); }} />}{modal === "student" && <StudentInviteModal onClose={() => setModal(null)} onSave={() => { setModal(null); notify("Family invite sent"); }} />}{modal === "staff" && <StaffInviteModal onClose={() => setModal(null)} onSave={role => { setModal(null); notify(`${role} invitation sent`); }} />}{confirmation && <ConfirmDialog {...confirmation} onClose={() => setConfirmation(null)} onConfirm={async () => { await confirmation.onConfirm(); setConfirmation(null); }} />}{toast && <div className="toast" role="status"><span className="toast-check">✓</span>{toast}</div>}
  </div>;
}

function PageHeading({ page, onAction, account, selectPage }) { const action = page === "invite" ? ["Create invite", "invite"] : page === "students" ? ["Invite student", "student"] : page === "staff" ? ["Invite staff", "staff"] : null; const hour = new Date().getHours(); const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"; return <div className="page-heading"><div><p className="eyebrow">{page === "dashboard" ? greeting : "INSTITUTION WORKSPACE"}</p><h1>{page === "dashboard" ? `Welcome to ${account?.institutionName || "your institution"}` : titles[page]}</h1><p className="subheading">{page === "dashboard" ? `Here is what is happening across ${account?.institutionName || "your learning community"}.` : page === "questions" ? "Create, organise and publish personalised practice for your learners." : page === "students" ? `Keep track of every learner connected to ${account?.institutionName || "your institution"}.` : "Manage your institution workspace with confidence."}</p></div>{page === "questions" && <Button icon="plus" onClick={() => selectPage("structure")}>Add question</Button>}{action && <Button icon="plus" onClick={() => onAction(action[1])}>{action[0]}</Button>}</div>; }




