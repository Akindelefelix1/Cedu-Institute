import React from "react";
import { Avatar } from "../components/ui";

export default function Activity() {
  const events = [
    ["AN", "Amaka Nwosu completed a practice set", "Mathematics · Primary 5 Gold", "10 min ago", "purple", "Learning"],
    ["Q", "You published 8 new questions", "Basic Science · Question bank", "42 min ago", "pink", "Content"],
    ["DB", "Daniel Bello requested to join", "Student request", "1 hr ago", "green", "Access"],
    ["AO", "You created a new invite code", "GREENFIELD-26", "Yesterday", "yellow", "Invitations"]
  ];

  return <div className="activity-log-page">
    <section className="activity-log-summary">
      <div><span className="activity-summary-icon">↗</span><div><strong>Workspace activity</strong><p>A clear record of what is happening across your institution.</p></div></div>
      <div className="activity-summary-stats"><span><strong>4</strong>recent events</span><span><strong>Today</strong>latest update</span></div>
    </section>
    <section className="activity-log-card">
      <div className="activity-log-header"><div><h2>Recent activity</h2><p>Stay up to date with important actions and changes.</p></div><label className="activity-filter"><span>Showing</span><select defaultValue="all" aria-label="Filter activity"><option value="all">All activity</option><option value="learning">Learning</option><option value="content">Content</option><option value="access">Access</option></select></label></div>
      <div className="activity-log-list">{events.map(([avatar, title, detail, time, color, category]) => <article className="activity-log-item" key={title}><div className={`activity-log-marker ${color}`}><Avatar initials={avatar} color={color} /></div><div className="activity-log-content"><div className="activity-log-title"><strong>{title}</strong><span className="activity-category">{category}</span></div><p>{detail}</p></div><time>{time}</time></article>)}</div>
    </section>
  </div>;
}
