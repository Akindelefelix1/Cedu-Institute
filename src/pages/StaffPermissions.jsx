import React, { useEffect, useState } from "react";
import { Avatar, Badge, Button } from "../components/ui";
import { Dialog } from "../components/modals";
import { getInstitutionAccount, institutionRequest } from "../services/institutionApi";

const roles = {
  teacher: { label: "Teacher", detail: "View learners and published learning content." },
  content_manager: { label: "Content manager", detail: "Manage classes, questions, and learning content." },
  viewer: { label: "Viewer", detail: "View institution overview, learners, and activity." },
};

export default function StaffPermissions({ notify }) {
  const account = getInstitutionAccount();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState("");

  const loadStaff = () => institutionRequest("/auth/institution/staff")
    .then((data) => { setStaff(data.staff || []); setError(""); })
    .catch((requestError) => setError(requestError.message || "Staff access could not be loaded."))
    .finally(() => setLoading(false));

  useEffect(() => { void loadStaff(); }, []);

  const invite = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const data = await institutionRequest("/auth/institution/staff", { method: "POST", body: JSON.stringify({ email: email.trim(), role }) });
      setEmail("");
      setRole("teacher");
      setInviteOpen(false);
      await loadStaff();
      notify(data.message || "Staff invitation sent.");
    } catch (requestError) { notify(requestError.message || "The invitation could not be sent."); }
    finally { setSaving(false); }
  };

  const changeRole = async (member, nextRole) => {
    if (!nextRole || nextRole === member.role || updating) return;
    setUpdating(member.id);
    try {
      const data = await institutionRequest(`/auth/institution/staff/${encodeURIComponent(member.id)}`, { method: "PATCH", body: JSON.stringify({ role: nextRole }) });
      setStaff((current) => current.map((item) => item.id === member.id ? { ...item, ...data.staff } : item));
      notify(data.message || "Staff role updated. Their access changes immediately.");
    } catch (requestError) { notify(requestError.message || "The role could not be updated."); }
    finally { setUpdating(""); }
  };

  const revoke = async (member) => {
    if (!window.confirm(`Revoke ${member.email}'s institution access?`)) return;
    setUpdating(member.id);
    try {
      const data = await institutionRequest(`/auth/institution/staff/${encodeURIComponent(member.id)}`, { method: "DELETE" });
      setStaff((current) => current.filter((item) => item.id !== member.id));
      notify(data.message || "Staff access revoked.");
    } catch (requestError) { notify(requestError.message || "Access could not be revoked."); }
    finally { setUpdating(""); }
  };

  const activeCount = staff.filter((item) => item.status === "active").length;
  const pendingCount = staff.filter((item) => item.status === "pending").length;

  return <div className="content-stack staff-page">
    <section className="staff-hero"><div><Badge>INSTITUTION WORKSPACE</Badge><h2>Bring your team together</h2><p>Invite staff and control the learning tools they can access.</p></div><Button onClick={() => setInviteOpen(true)} icon="plus">Invite staff</Button></section>
    <section className="staff-summary"><div><strong>{activeCount + 1}</strong><span>Account holders</span></div><div><strong>{activeCount}</strong><span>Active staff</span></div><div><strong>{pendingCount}</strong><span>Pending invitations</span></div></section>
    <section className="panel staff-list-panel">
      <div className="panel-header staff-list-heading"><div><h2>People with access</h2><p className="panel-subtitle">Update a staff role any time. Changes take effect on their next sign-in.</p></div><span className="staff-member-count">{staff.length + 1} people</span></div>
      <div className="staff-table">
        <div className="staff-row staff-owner-row"><Avatar initials={(account?.ownerName || "IN").slice(0, 2).toUpperCase()} color="purple" /><div className="staff-person"><strong>{account?.ownerName || "Institution owner"}</strong><span>{account?.email || "Owner account"}</span></div><Badge tone="purple">Institution owner</Badge><span className="staff-role">Full access</span></div>
        {loading ? <div className="loading-state"><span className="loading-spinner" aria-hidden="true" />Loading staff...</div> : error ? <div className="no-results" role="alert">{error}<button className="staff-retry" onClick={() => { setLoading(true); void loadStaff(); }}>Try again</button></div> : staff.map((member) => <div className="staff-row" key={member.id}>
          <Avatar initials={(member.name || member.email || "S").slice(0, 2).toUpperCase()} color={member.status === "active" ? "green" : "purple"} />
          <div className="staff-person"><strong>{member.name || member.email}</strong><span>{member.email}{member.status === "pending" ? " · Invitation pending" : ""}</span></div>
          <label className="staff-role-control"><span className="sr-only">Role for {member.email}</span><select aria-label={`Role for ${member.email}`} value={member.role} disabled={updating === member.id} onChange={(event) => void changeRole(member, event.target.value)}>{Object.entries(roles).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}</select></label>
          <Badge tone={member.status === "active" ? "green" : "yellow"}>{member.status === "active" ? "Active" : "Invited"}</Badge>
          <button className="staff-manage" disabled={Boolean(updating)} onClick={() => void revoke(member)}>{updating === member.id ? "Saving..." : member.status === "pending" ? "Cancel" : "Revoke"}</button>
        </div>)}
        {!loading && !error && staff.length === 0 && <div className="empty-panel"><strong>No staff added yet</strong><p>Invite a trusted colleague to help manage learning at your institution.</p></div>}
      </div>
    </section>
    <section className="panel permissions-panel"><div className="panel-header"><div><h2>Role access</h2><p className="panel-subtitle">Each role has a clear set of workspace permissions.</p></div></div><div className="role-guide-grid">{Object.entries(roles).map(([key, item]) => <article key={key}><span className="role-guide-icon">✦</span><div><strong>{item.label}</strong><p>{item.detail}</p></div></article>)}</div><div className="permission-note"><span>i</span><p>The institution owner keeps full control of profile, publishing, staff, and access settings. Staff permissions are checked by the backend.</p></div></section>
    {inviteOpen && <Dialog title="Invite a staff member" subtitle="Send an invitation and assign access before they join." onClose={() => { if (!saving) setInviteOpen(false); }}><form className="staff-invite-form" onSubmit={invite}><label>Work email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@school.edu.ng" autoComplete="email" required /></label><label>Assign role<select value={role} onChange={(event) => setRole(event.target.value)}>{Object.entries(roles).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}</select></label><div className="staff-invite-note"><span>✦</span><div><strong>{roles[role].label} access</strong><p>{roles[role].detail} Invitation links expire after 7 days.</p></div></div><div className="modal-footer"><button className="button button-outline" type="button" onClick={() => setInviteOpen(false)} disabled={saving}>Cancel</button><Button type="submit" loading={saving} loadingText="Sending...">Send invitation</Button></div></form></Dialog>}
  </div>;
}
