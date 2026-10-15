import React, { useState } from "react";
import { Button } from "./ui";

export function Dialog({ title, subtitle, onClose, children }) {
  return <div className="modal-scrim" onMouseDown={onClose}><div className="modal-card" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="modal-close" onClick={onClose} aria-label="Close dialog">×</button></div>{children}</div></div>;
}

export function ConfirmDialog({ title, message, confirmLabel = "Confirm", tone = "danger", onClose, onConfirm }) {
  return <div className="modal-scrim" onMouseDown={onClose}><div className="confirm-card" role="alertdialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className={`confirm-icon confirm-${tone}`}>{tone === "danger" ? "!" : "✓"}</div><h2>{title}</h2><p>{message}</p><div className="modal-footer"><button className="button button-outline" onClick={onClose}>Cancel</button><button className={`button ${tone === "danger" ? "button-danger" : "button-primary"}`} onClick={onConfirm}>{confirmLabel}</button></div></div></div>;
}

export function InviteCodeModal({ onClose, onSave }) {
  return <Dialog title="Create an invite code" subtitle="Generate a code students can use to request access." onClose={onClose}><label>Code name<input defaultValue="PRIMARY-7-26" /></label><div className="form-grid"><label>For class<select><option>All classes</option><option>Primary 5 Gold</option><option>Primary 6 Blue</option></select></label><label>Expires<select><option>Never</option><option>In 7 days</option><option>In 30 days</option></select></label></div><div className="invite-preview"><span>YOUR NEW CODE</span><strong>PRIMARY-7-26</strong><small>Students can enter this code in their Cedu app.</small></div><div className="modal-footer"><button className="button button-outline" onClick={onClose}>Cancel</button><Button onClick={onSave}>Generate code</Button></div></Dialog>;
}

export function StudentInviteModal({ onClose, onSave }) {
  const [contact, setContact] = useState("");
  const submit = event => { event.preventDefault(); if (contact.trim()) onSave(contact.trim()); };
  return <Dialog title="Invite a family" subtitle="Send an invite to a parent or guardian by email or phone number." onClose={onClose}><form onSubmit={submit}><label>Parent or guardian email / phone<input autoFocus required value={contact} onChange={event => setContact(event.target.value)} placeholder="name@example.com or +234..." /></label><div className="family-invite-note"><span>♧</span><div><strong>The parent chooses who joins</strong><p>If this contact has more than one child on Cedu, they can choose one child or add all linked children.</p></div></div><div className="modal-footer"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><Button type="submit">Send family invite</Button></div></form></Dialog>;
}

export function StaffInviteModal({ onClose, onSave }) {
  const [role, setRole] = useState("Teacher");
  return <Dialog title="Invite a staff member" subtitle="Send an invitation and assign access before they join." onClose={onClose}><label>Work email or phone number<input autoFocus required placeholder="name@school.edu.ng or +234..." /></label><label>Assign role<select value={role} onChange={event => setRole(event.target.value)}><option>Teacher</option><option>Admin</option><option>Content editor</option><option>Viewer</option></select></label><div className="staff-invite-note"><span>✦</span><div><strong>{role} access</strong><p>Access follows the institution's publishing policy.</p></div></div><div className="modal-footer"><button className="button button-outline" onClick={onClose}>Cancel</button><Button onClick={() => onSave(role)}>Send invitation</Button></div></Dialog>;
}
