import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "../components/ui";
import { institutionRequest, saveInstitutionSession } from "../services/institutionApi";

export function AuthPage({ onOpen, onAuthenticated }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ institutionName: "", institutionType: "", ownerName: "", email: "", phone: "", address: "", city: "", state: "", country: "Nigeria", publicAccess: false, password: "", confirmPassword: "" });
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState(""); const [recoveryCode, setRecoveryCode] = useState(""); const [recoveryToken, setRecoveryToken] = useState(""); const [resendCooldown, setResendCooldown] = useState(0);
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  useEffect(() => { if (!resendCooldown) return undefined; const timer = window.setTimeout(() => setResendCooldown(seconds => Math.max(0, seconds - 1)), 1000); return () => window.clearTimeout(timer); }, [resendCooldown]);
  const submit = async event => {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      if (tab === "forgot") {
        const email = recoveryEmail.trim().toLowerCase();
        await institutionRequest("/auth/institution/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
        setRecoveryEmail(email); setRecoveryCode(""); setResendCooldown(60); setMessage("If the account exists, you should receive a six-digit recovery code. Check your inbox and spam folder."); setTab("verify"); return;
      }
      if (tab === "verify") {
        const data = await institutionRequest("/auth/institution/verify-reset-code", { method: "POST", body: JSON.stringify({ email: recoveryEmail, otp: recoveryCode }) });
        setRecoveryToken(data.resetToken); setTab("reset"); return;
      }
      if (tab === "reset") {
        if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
        await institutionRequest("/auth/institution/reset-password", { method: "POST", headers: { Authorization: `Bearer ${recoveryToken}` }, body: JSON.stringify({ newPassword: form.password }) });
        setRecoveryToken(""); setForm(current => ({ ...current, email: recoveryEmail, password: "", confirmPassword: "" })); setTab("login"); setMessage("Password reset successfully. Sign in with your new password."); return;
      }
      if (tab === "create" && form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
      const payload = tab === "login" ? { email: form.email.trim(), password: form.password } : { institutionName: form.institutionName.trim(), institutionType: form.institutionType.trim(), ownerName: form.ownerName.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim(), city: form.city.trim(), state: form.state.trim(), country: form.country.trim(), publicAccess: form.publicAccess, password: form.password };
      const data = await institutionRequest(`/auth/institution/${tab === "login" ? "login" : "register"}`, { method: "POST", body: JSON.stringify(payload) });
      saveInstitutionSession(data.token, data.account); onAuthenticated(data.account);
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  const resendCode = async () => {
    setError(""); setMessage(""); setLoading(true);
    try { await institutionRequest("/auth/institution/forgot-password", { method: "POST", body: JSON.stringify({ email: recoveryEmail }) }); setResendCooldown(60); setMessage("If the account exists, a new recovery code was sent or will be available shortly."); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  const recovery = ["forgot", "verify", "reset"].includes(tab);
  return <div className="welcome-screen"><section className="auth-welcome-card"><div className="welcome-copy"><Badge tone="purple">INSTITUTION WORKSPACE</Badge><h1>Give every learner a better place to grow.</h1><p>Manage your classes, questions, invitations and institution activity from one calm workspace.</p><div className="welcome-orb"><b>CEDU</b></div></div><form className={`auth-card ${tab === "create" ? "auth-card-create" : ""}`} onSubmit={submit}>
    <img src="/Cedu Logo.png" alt="Cedu" />
    {!recovery && <div className="auth-tabs"><button type="button" className={tab === "login" ? "active" : ""} onClick={() => { setTab("login"); setError(""); setMessage(""); }}>Sign in</button><button type="button" className={tab === "create" ? "active" : ""} onClick={() => { setTab("create"); setError(""); setMessage(""); }}>Create account</button></div>}
    <h2>{tab === "login" ? "Welcome back" : tab === "create" ? "Create your workspace" : tab === "forgot" ? "Forgot password?" : tab === "verify" ? "Check your email" : "Set a new password"}</h2>
    <p>{tab === "login" ? "Sign in to continue managing your institution." : tab === "create" ? "Tell us a little about your institution to get started." : tab === "forgot" ? "Enter your account email and we will send a six-digit recovery code." : tab === "verify" ? `Enter the six-digit code sent to ${recoveryEmail}. It expires in 15 minutes.` : "Choose a new password for your institution account."}</p>
    {error && <div className="auth-error" role="alert">{error}</div>}{message && <div className="auth-success" role="status">{message}</div>}
    {tab === "create" && <><div className="auth-section-label">Institution details</div><div className="auth-form-grid"><label>Institution name<input name="institutionName" value={form.institutionName} onChange={update} required placeholder="Greenfield Academy" /></label><label>Institution type<select name="institutionType" value={form.institutionType} onChange={update} required><option value="">Select type</option><option>Primary school</option><option>Secondary school</option><option>College / university</option><option>Tutorial centre</option><option>Other</option></select></label><label>Phone number<input name="phone" type="tel" value={form.phone} onChange={update} required placeholder="08012345678" /></label><label>Country<select name="country" value={form.country} onChange={update}><option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>Other</option></select></label><label className="auth-field-wide">Address <span>(optional)</span><input name="address" value={form.address} onChange={update} placeholder="12 Learning Avenue" /></label><label>City <span>(optional)</span><input name="city" value={form.city} onChange={update} placeholder="Lagos" /></label><label>State / region <span>(optional)</span><input name="state" value={form.state} onChange={update} placeholder="Lagos" /></label><label className="auth-field-wide auth-access-option"><span>Student access</span><select name="publicAccess" value={form.publicAccess ? "public" : "private"} onChange={event => setForm(current => ({ ...current, publicAccess: event.target.value === "public" }))}><option value="private">Invite code only</option><option value="public">Public directory + approval</option></select><small>{form.publicAccess ? "Students can find your institution publicly and request to join." : "Students must use your institution invite code to find you."}</small></label></div><div className="auth-section-label">Account owner</div><div className="auth-form-grid"><label>Owner name<input name="ownerName" value={form.ownerName} onChange={update} required placeholder="Ada Okafor" /></label><label>Email address<input name="email" type="email" value={form.email} onChange={update} required placeholder="you@school.edu.ng" /></label></div></>}
    {tab === "login" && <label>Email address<input name="email" type="email" value={form.email} onChange={update} required placeholder="you@school.edu.ng" /></label>}
    {tab === "forgot" && <label>Email address<input type="email" value={recoveryEmail} onChange={event => setRecoveryEmail(event.target.value)} required autoComplete="email" placeholder="you@school.edu.ng" /></label>}
    {tab === "verify" && <label>Six-digit code<input className="auth-recovery-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={recoveryCode} onChange={event => setRecoveryCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required placeholder="000000" /></label>}
    {(tab === "login" || tab === "create" || tab === "reset") && <label>{tab === "reset" ? "New password" : "Password"}<PasswordInput name="password" value={form.password} onChange={update} required minLength="8" maxLength="128" placeholder="At least 8 characters" autoComplete={tab === "login" ? "current-password" : "new-password"} /></label>}
    {(tab === "create" || tab === "reset") && <label>{tab === "reset" ? "Confirm new password" : "Confirm password"}<PasswordInput name="confirmPassword" value={form.confirmPassword} onChange={update} required minLength="8" maxLength="128" placeholder="Repeat your password" autoComplete="new-password" /></label>}
    {tab === "login" && <button type="button" className="auth-forgot-link" onClick={() => { setRecoveryEmail(form.email.trim()); setForm(current => ({ ...current, password: "", confirmPassword: "" })); setError(""); setMessage(""); setRecoveryToken(""); setTab("forgot"); }}>Forgot password?</button>}
    <Button type="submit" disabled={loading || (tab === "verify" && recoveryCode.length !== 6) || (tab === "reset" && form.password !== form.confirmPassword)}>{loading ? "Please wait..." : tab === "login" ? "Sign in" : tab === "create" ? "Create workspace" : tab === "forgot" ? "Send recovery code" : tab === "verify" ? "Verify code" : "Reset password"}</Button>
    {tab === "verify" && <button type="button" className="auth-recovery-link" disabled={loading || resendCooldown > 0} onClick={resendCode}>{resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}</button>}
    {recovery && <button type="button" className="auth-recovery-link" onClick={() => { setError(""); setMessage(""); setRecoveryCode(""); setRecoveryToken(""); setTab("login"); }}>Back to sign in</button>}
    {!recovery && <small>Institution access is managed securely by Cedu.</small>}
  </form></section></div>;
}

function PasswordInput({ name, value, onChange, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-password-control">
    <input {...inputProps} name={name} value={value} onChange={onChange} type={visible ? "text" : "password"} />
    <button type="button" onClick={() => setVisible(current => !current)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {visible ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.3 4.3 9 7-.3 1.1-1.1 2.5-2.3 3.7M6.2 6.2C4.4 7.3 3.3 9.3 3 12c.7 2.7 4 7 9 7 1.1 0 2.1-.2 3-.6" /></> : <><path d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7z" /><circle cx="12" cy="12" r="3" /></>}
      </svg>
    </button>
  </div>;
}

export function LearnerPreview({ onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    institutionRequest("/institutions/questions")
      .then(data => { if (active) setQuestions((data.questions || []).filter(question => question.status === "Published")); })
      .catch(requestError => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const groups = useMemo(() => {
    const grouped = new Map();
    questions.forEach(question => {
      const key = `${question.level}:${question.subject}`;
      const group = grouped.get(key) || { key, level: question.level, subject: question.subject, questions: [] };
      group.questions.push(question);
      grouped.set(key, group);
    });
    return [...grouped.values()];
  }, [questions]);
  return <div className="learner-screen"><header className="learner-top"><button onClick={onBack}>← Back to institution</button><div className="learner-brand"><img src="/Cedu Logo.png" alt="Cedu" /><Badge tone="purple">LEARNER VIEW PREVIEW</Badge></div><span>Published content only</span></header><main className="learner-content"><div className="learner-greeting"><div><p>INSTITUTION LEARNING</p><h1>What learners can access</h1><p>This preview uses the institution’s published questions. Learner-specific progress is not shown here.</p></div></div>{loading ? <div className="loading-state" role="status">Loading published learning content…</div> : error ? <div className="empty-panel" role="alert"><h2>Could not load learner content</h2><p>{error}</p></div> : groups.length ? <><div className="learner-section-head"><h2>Published learning</h2><span>{questions.length} questions</span></div><div className="learner-set-grid">{groups.map(group => <article className="learner-set" key={group.key}><div className="learner-set-icon">✦</div><h3>{group.subject}</h3><p>{group.level} · {group.questions.length} question{group.questions.length === 1 ? "" : "s"}</p><ul>{group.questions.slice(0, 3).map(question => <li key={question.id}>{question.text}</li>)}</ul></article>)}</div></> : <div className="empty-panel"><h2>No published learning content yet</h2><p>Questions appear here after they are published or approved.</p></div>}</main></div>;
}
