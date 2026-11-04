import React, { useEffect, useState } from "react";
import { Badge, Button, Pagination } from "../components/ui";
import { ConfirmDialog, Dialog } from "../components/modals";
import { getInstitutionAccount, institutionRequest } from "../services/institutionApi";

export default function Invitations({ notify, createOpen = false, onCloseCreate = () => undefined }) {
  const account = getInstitutionAccount();
  const [target, setTarget] = useState("");
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [sending, setSending] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    let active = true;
    institutionRequest("/institutions/requests")
      .then((data) => {
        if (!active) return;
        const next = data.requests || [];
        setRequests(next);
        window.dispatchEvent(new CustomEvent("institution-pending-count-updated", { detail: next.filter((item) => item.status === "pending").length }));
      })
      .catch((error) => { if (active) setRequestError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const send = async (event) => {
    event?.preventDefault();
    const contact = target.trim();
    if (!contact) return notify("Enter an email address or phone number first.");
    if (sending) return;
    setSending(true);
    try {
      const data = await institutionRequest("/institutions/invitations", { method: "POST", body: JSON.stringify({ target: contact }) });
      setTarget("");
      onCloseCreate();
      if (data.channel === "phone") {
        const phone = contact.replace(/[\s()-]/g, "");
        const message = `Join ${account?.institutionName || "our institution"} on Cedu: ${data.inviteLink}`;
        window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
      }
      notify(data.message || "Invitation created.");
    } catch (error) { notify(error.message || "The invitation could not be created."); }
    finally { setSending(false); }
  };

  const copyCode = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(account?.inviteCode || "");
      notify("Invite code copied to clipboard.");
    } catch { notify("Clipboard access was blocked. Select and copy the code shown above."); }
  };

  const updateRequest = async (id, status, expectedStatus) => {
    setUpdating({ id, status });
    try {
      const data = await institutionRequest(`/institutions/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status, expectedStatus }) });
      setRequests((current) => {
        const next = current.map((item) => item.id === id ? { ...item, ...data.membership } : item);
        window.dispatchEvent(new CustomEvent("institution-pending-count-updated", { detail: next.filter((item) => item.status === "pending").length }));
        return next;
      });
      notify(data.message);
    } catch (error) { notify(error.message); }
    finally { setUpdating(null); }
  };

  const askToUpdate = (request, status) => setConfirmation({ request, status });
  const confirmUpdate = () => {
    if (!confirmation) return Promise.resolve();
    const { request, status } = confirmation;
    setConfirmation(null);
    return updateRequest(request.id, status, request.status);
  };
  const pendingCount = requests.filter((item) => item.status === "pending").length;
  const pageCount = Math.max(1, Math.ceil(requests.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRequests = requests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <div className="content-stack">
    <section className="invite-hero">
      <div><Badge>YOUR INSTITUTION CODE</Badge><h2>{account?.inviteCode || "Generating..."}</h2><p>{account?.publicAccess ? "Your institution is visible in the public directory. Students can also use this code." : "Your institution is invite-only. Students need this code to find and request access."}</p><div className="invite-actions"><Button onClick={copyCode} disabled={!account?.inviteCode}>Copy code</Button></div></div>
      <div className="invite-access-summary"><strong>{account?.publicAccess ? "Public directory" : "Invite only"}</strong><span>{account?.publicAccess ? "Learners can find you and request to join." : "Learners need this code to request access."}</span></div>
    </section>

    <section className="panel">
      <div className="panel-header"><div><h2>Join requests</h2><p className="panel-subtitle">Review learners asking to join your institution.</p></div><Badge tone="yellow">{pendingCount} pending</Badge></div>
      {requestError && <p className="auth-error" role="alert">{requestError}</p>}
      {loading ? <p className="panel-copy">Loading join requests...</p> : !requests.length ? <div className="empty-panel">No join requests yet.</div> : <>
        <div className="request-list">{pageRequests.map((request) => {
          const isApproving = updating?.id === request.id && updating.status === "active";
          const isRejecting = updating?.id === request.id && updating.status === "rejected";
          const canReview = request.status === "pending" || request.status === "rejected";
          return <div key={request.id} className="request-row"><div><strong>{request.name}</strong><span>{request.email} · @{request.username}</span><small>{request.source === "invite_code" ? "Invitation code" : "Public directory"} · Latest request {new Date(request.requested_at).toLocaleDateString()}</small>{request.rejection_count > 0 && <small className="block font-bold text-red-700">Previously rejected {request.rejected_at ? `on ${new Date(request.rejected_at).toLocaleDateString()}` : ""} · {request.rejection_count} {request.rejection_count === 1 ? "rejection" : "rejections"}</small>}</div>{canReview ? <div className="request-actions"><button disabled={Boolean(updating)} onClick={() => askToUpdate(request, "rejected")} aria-busy={isRejecting || undefined}>{isRejecting ? <><span className="button-spinner" aria-hidden="true" />Rejecting...</> : "Reject"}</button><Button onClick={() => askToUpdate(request, "active")} disabled={Boolean(updating)}>{isApproving ? "Saving..." : "Approve"}</Button></div> : <Badge tone={request.status === "active" ? "green" : "pink"}>{request.status}</Badge>}</div>;
        })}</div>
        <Pagination total={requests.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} label="requests" />
      </>}
    </section>

    {confirmation && <ConfirmDialog title={confirmation.status === "active" ? "Approve join request?" : confirmation.request.status === "rejected" ? "Record another rejection?" : "Reject join request?"} message={confirmation.status === "active" ? `Give ${confirmation.request.name} access to your institution?` : confirmation.request.status === "rejected" ? `Record a new rejection for ${confirmation.request.name}? Their rejection history will be retained.` : `Decline ${confirmation.request.name}'s request to join your institution?`} confirmLabel={confirmation.status === "active" ? "Approve request" : confirmation.request.status === "rejected" ? "Reject again" : "Reject request"} tone={confirmation.status === "active" ? "success" : "danger"} onClose={() => setConfirmation(null)} onConfirm={confirmUpdate} />}
    {createOpen && <Dialog title="Create an invitation" subtitle="Send an invitation link to a learner, teacher, or parent." onClose={() => { if (!sending) onCloseCreate(); }}><form className="staff-invite-form" onSubmit={send}><label>Email address or phone number<input autoFocus type="text" inputMode="text" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="name@example.com or +234..." maxLength={320} required /></label><div className="staff-invite-note"><span>↗</span><div><strong>Invitation valid for 7 days</strong><p>Email invitations are sent directly. For phone numbers, Cedu opens a text message for you to send.</p></div></div><div className="modal-footer"><button className="button button-outline" type="button" onClick={onCloseCreate} disabled={sending}>Cancel</button><Button type="submit" loading={sending} loadingText="Creating...">Create invite</Button></div></form></Dialog>}
  </div>;
}
