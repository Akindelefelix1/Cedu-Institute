import React, { useEffect, useState } from "react";
import { Avatar } from "../components/ui";
import { institutionRequest } from "../services/institutionApi";

const PAGE_SIZE = 15;
const timeAgo = value => { const date = new Date(value); if (Number.isNaN(date.getTime())) return "Recently"; const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000)); if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`; const days = Math.floor(hours / 24); return `${days} day${days === 1 ? "" : "s"} ago`; };
const categoryFor = event => event.startsWith("institution.question") || event.includes("level") || event.includes("category") ? "Content" : event.includes("join") || event.includes("member") ? "Access" : "Institution";

export default function Activity() {
  const params = new URLSearchParams(window.location.search);
  const levelId = params.get("levelId");
  const className = params.get("className");
  const [activities, setActivities] = useState([]), [filter, setFilter] = useState("all"), [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [latestAt, setLatestAt] = useState(null), [retentionDays, setRetentionDays] = useState(15), [savedRetention, setSavedRetention] = useState(15);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(""), [saveMessage, setSaveMessage] = useState(""), [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), category: filter });
    if (levelId) query.set("levelId", levelId);
    institutionRequest(`/institutions/activity?${query.toString()}`).then(data => {
      if (!active) return;
      setActivities(data.activities || []);
      setPagination(data.pagination || { page, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setLatestAt(data.latestAt || null);
      const days = Number(data.retentionDays) || 15;
      setRetentionDays(days); setSavedRetention(days);
    }).catch(requestError => { if (active) setError(requestError.message || "Could not load activity."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, filter, levelId, revision]);

  const saveRetention = async () => {
    setSaving(true); setSaveMessage(""); setError("");
    try {
      const data = await institutionRequest("/institutions/activity-retention", { method: "PUT", body: JSON.stringify({ retentionDays }) });
      const days = Number(data.retentionDays) || retentionDays;
      setRetentionDays(days); setSavedRetention(days); setSaveMessage(`Activity is retained for ${days} days.`);
      setPage(1); setRevision(current => current + 1);
    } catch (requestError) { setError(requestError.message || "Could not update activity retention."); }
    finally { setSaving(false); }
  };

  const rangeStart = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);
  const displayedActivities = activities;

  return <div className="activity-log-page">
    <section className="activity-log-summary"><div><span className="activity-summary-icon">↗</span><div><strong>{className ? `${className} activity` : "Workspace activity"}</strong><p>{className ? `A record of content and changes connected to ${className}.` : "A clear record of what is happening across your institution."}</p></div></div><div className="activity-summary-stats"><span><strong>{pagination.total}</strong>recent events</span><span><strong>{latestAt ? timeAgo(latestAt) : "—"}</strong>latest update</span></div></section>
    <section className="activity-log-card">
      <div className="activity-log-header"><div><h2>Recent activity</h2><p>Stay up to date with important actions and changes.</p></div><label className="activity-filter"><span>Showing</span><select value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }} aria-label="Filter activity"><option value="all">All activity</option><option value="content">Content</option><option value="access">Access</option><option value="institution">Institution</option></select></label></div>
      <div className="activity-retention-controls"><div><strong>Activity history</strong><p>Older events are automatically deleted. Choose how long to keep this institution’s activity, up to 30 days.</p></div><label><span>Keep activity for</span><select value={retentionDays} onChange={event => setRetentionDays(Number(event.target.value))} aria-label="Activity retention period"><option value={15}>15 days (default)</option><option value={30}>30 days (maximum)</option></select></label><button type="button" onClick={saveRetention} disabled={saving || retentionDays === savedRetention}>{saving ? "Saving…" : "Save"}</button></div>
      {saveMessage && <div className="activity-retention-message" role="status">{saveMessage}</div>}
      {loading ? <div className="activity-empty-state">Loading live activity...</div> : error ? <div className="activity-empty-state" role="alert">{error}</div> : <>
        <div className="activity-log-list">{displayedActivities.length ? displayedActivities.map(item => { const category = categoryFor(item.event_type); return <article className="activity-log-item" key={item.id}><div className={`activity-log-marker ${category.toLowerCase()}`}><Avatar initials={(item.actor_name || "IN").slice(0, 2).toUpperCase()} color={category.toLowerCase()} /></div><div className="activity-log-content"><div className="activity-log-title"><strong>{item.title}</strong><span className="activity-category">{category}</span></div><p>{item.description}</p></div><time>{timeAgo(item.created_at)}</time></article>; }) : <div className="activity-empty-state">{className ? `No activity has been recorded for ${className} yet.` : "No activity has been recorded yet."}</div>}</div>
        <div className="activity-pagination"><span>Showing {rangeStart}–{rangeEnd} of {pagination.total}</span><div><button type="button" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={pagination.page <= 1}>Previous</button><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span><button type="button" onClick={() => setPage(current => Math.min(pagination.totalPages, current + 1))} disabled={pagination.page >= pagination.totalPages}>Next</button></div></div>
      </>}
    </section>
  </div>;
}
