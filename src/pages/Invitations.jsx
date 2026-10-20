import React, { useEffect, useState } from "react";
import { Badge, Button } from "../components/ui";
import { ConfirmDialog } from "../components/modals";
import { getInstitutionAccount, institutionRequest } from "../services/institutionApi";

export default function Invitations({ notify }) {
  const account = getInstitutionAccount();
  const [target, setTarget] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const send = async () => {
    const contact = target.trim();
    if (!contact) return notify("Enter an email address or phone number first.");
    try {
      const data = await institutionRequest("/institutions/invitations", { method: "POST", body: JSON.stringify({ target: contact }) });
      setTarget("");
      if (data.channel === "phone") {
        const phone = contact.replace(/[\s()-]/g, "");
        const message = `Join ${account?.institutionName || "our institution"} on Cedu: ${data.inviteLink}`;
        window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
      }
      notify(data.message);
    } catch (error) { notify(error.message); }
  };
  const copyCode = async () => { try { if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable"); await navigator.clipboard.writeText(account?.inviteCode || ""); notify("Invite code copied to clipboard"); } catch { notify("Invite code is ready to copy"); } };
  useEffect(() => { institutionRequest("/institutions/requests").then((data) => { const next = data.requests || []; setRequests(next); window.dispatchEvent(new CustomEvent("institution-pending-count-updated", { detail: next.filter(item => item.status === "pending").length })); }).catch((error) => setRequestError(error.message)).finally(() => setLoading(false)); }, []);
  const updateRequest = async (id, status) => {
    setUpdating({ id, status });
    try {
      const data = await institutionRequest(`/institutions/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setRequests((current) => { const next = current.map((item) => item.id === id ? { ...item, ...data.membership } : item); window.dispatchEvent(new CustomEvent("institution-pending-count-updated", { detail: next.filter(item => item.status === "pending").length })); return next; });
      notify(data.message);
    } catch (error) { notify(error.message); }
    finally { setUpdating(null); }
  };
  const askToUpdate = (request, status) => setConfirmation({ request, status });
  const confirmUpdate = () => { if (!confirmation) return Promise.resolve(); const { request, status } = confirmation; setConfirmation(null); return updateRequest(request.id, status); };
  return <div className="content-stack"><section className="invite-hero"><div><Badge>YOUR INSTITUTION CODE</Badge><h2>{account?.inviteCode || "Generating..."}</h2><p>{account?.publicAccess ? "Your institution is visible in the public directory. Students can also use this code." : "Your institution is invite-only. Students need this code to find and request access."}</p><div className="invite-actions"><Button onClick={copyCode} disabled={!account?.inviteCode}>Copy code</Button></div></div><div className="qr-placeholder"><div>¦</div><span>{account?.publicAccess ? "Public directory" : "Invite only"}</span></div></section><section className="panel"><div className="panel-header"><h2>Invite by email or phone</h2></div><p className="panel-copy">Send a personal invitation to a student, teacher or parent.</p><div className="invite-input"><input value={target} onChange={event => setTarget(event.target.value)} placeholder="name@example.com or phone number" aria-label="Invite email or phone number" /><Button onClick={send}>Send invite</Button></div></section><section className="panel"><div className="panel-header"><div><h2>Join requests</h2><p className="panel-copy">Review learners asking to join your institution.</p></div><Badge tone="yellow">{requests.filter(item => item.status === "pending").length} pending</Badge></div>{requestError && <p className="auth-error" role="alert">{requestError}</p>}{loading ? <p className="panel-copy">Loading join requests...</p> : !requests.length ? <div className="empty-panel">No join requests yet.</div> : <div className="request-list">{requests.map(request => { const isApproving = updating?.id === request.id && updating.status === "active"; const isRejecting = updating?.id === request.id && updating.status === "rejected"; return <div key={request.id} className="request-row"><div><strong>{request.name}</strong><span>{request.email} · @{request.username}</span><small>{request.source === "invite_code" ? "Invitation code" : "Public directory"} · {new Date(request.requested_at).toLocaleDateString()}</small></div>{request.status === "pending" ? <div className="request-actions"><button disabled={Boolean(updating)} onClick={() => askToUpdate(request, "rejected")} aria-busy={isRejecting || undefined}>{isRejecting ? <><span className="button-spinner" aria-hidden="true" />Rejecting...</> : "Reject"}</button><Button onClick={() => askToUpdate(request, "active")} disabled={Boolean(updating)}>{isApproving ? "Saving..." : "Approve"}</Button></div> : <Badge tone={request.status === "active" ? "green" : "pink"}>{request.status}</Badge>}</div>; })}</div>}</section>{confirmation && <ConfirmDialog title={confirmation.status === "active" ? "Approve join request?" : "Reject join request?"} message={confirmation.status === "active" ? "Give " + confirmation.request.name + " access to your institution?" : "Decline " + confirmation.request.name + " request to join your institution?"} confirmLabel={confirmation.status === "active" ? "Approve request" : "Reject request"} tone={confirmation.status === "active" ? "success" : "danger"} onClose={() => setConfirmation(null)} onConfirm={confirmUpdate} />}</div>;
}
