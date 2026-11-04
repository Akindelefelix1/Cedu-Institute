import React, { useState } from "react";
import { institutionRequest, saveInstitutionSession } from "../services/institutionApi";

export default function StaffInvitationAccept({ onAuthenticated }) {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const accept = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const data = await institutionRequest("/auth/institution/staff-invitations/accept", { method: "POST", body: JSON.stringify({ token, name: name.trim(), password }) });
      saveInstitutionSession(data.token, data.account);
      window.history.replaceState({}, "", "/dashboard");
      onAuthenticated(data.account);
    } catch (requestError) { setError(requestError.message || "The invitation could not be accepted."); }
    finally { setSaving(false); }
  };

  return <main className="staff-accept-screen"><form className="staff-accept-card" onSubmit={accept}><img src="/Cedu Logo.png" alt="Cedu" /><p className="eyebrow">INSTITUTION STAFF</p><h1>Accept your invitation</h1><p className="panel-copy">Create your staff sign-in to access the institution workspace.</p>{!token && <p className="auth-error" role="alert">This invitation link is incomplete. Ask the institution owner to send a new invitation.</p>}{error && <p className="auth-error" role="alert">{error}</p>}<label>Your name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={160} required /></label><label>Create password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={10} maxLength={128} required /><small>Use at least 10 characters.</small></label><button className="button button-primary" type="submit" disabled={!token || saving}>{saving ? "Creating account..." : "Accept invitation"}</button></form></main>;
}
