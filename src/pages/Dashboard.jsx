import React from "react";
import { Avatar, Badge, Button, Icon } from "../components/ui";

const metrics = [
  ["students", "Total students", "248", "+12.4%", "purple"],
  ["game", "Practice sessions", "1,892", "+8.2%", "pink"],
  ["questions", "Your questions", "126", "+24.6%", "orange"],
  ["activity", "Average progress", "74%", "+5.1%", "green"]
];

function Metric({ item }) {
  const [icon, label, value, change, tone] = item;
  return <div className={`metric-card metric-${tone}`}><div className="metric-top"><span className="metric-icon"><Icon name={icon} /></span><span className="metric-change">{change}</span></div><span className="metric-label">{label}</span><strong>{value}</strong><div className="metric-spark"><i /><i /><i /><i /><i /><i /><i /></div></div>;
}

export default function Dashboard({ selectPage, setModal, notify, confirm }) {
  return <div className="dashboard-grid">
    <section className="metric-grid">{metrics.map(item => <Metric key={item[1]} item={item} />)}</section>
    <section className="welcome-card"><div><Badge tone="yellow">SETUP 3 OF 5</Badge><h2>Make your workspace yours</h2><p>Add classes, invite your teachers and create the first practice set for your students.</p><div className="progress-line"><span style={{ width: "60%" }} /></div><small>60% complete</small></div><div className="welcome-illustration"><b>CEDU</b></div><button type="button" className="card-arrow" onClick={() => selectPage("settings")} aria-label="Open institution settings">→</button></section>
    <section className="panel activity-panel"><div className="panel-header"><h2>Recent activity</h2><button onClick={() => selectPage("activity")}>View all <Icon name="arrow" /></button></div><div className="activity-list"><Activity avatar="AN" title="Amaka Nwosu completed a practice set" detail="Mathematics · Primary 5 Gold" time="10 min ago" /><Activity avatar="Q" title="You published 8 new questions" detail="Basic Science · Question bank" time="42 min ago" /><Activity avatar="DB" title="Daniel Bello requested to join" detail="Awaiting your approval" time="1 hr ago" /></div></section>
    <section className="panel requests-panel"><div className="panel-header"><h2>Requests to join</h2><button onClick={() => selectPage("invite")}>Manage <Icon name="arrow" /></button></div><Request name="Daniel Bello" initials="DB" color="green" onAccept={() => notify("Daniel Bello accepted")} onReject={() => confirm("Decline join request?", "Daniel Bello will not be added to Greenfield Academy.", "Decline", () => notify("Request declined"))} /><Request name="Mary Ojo" initials="MO" color="yellow" onAccept={() => notify("Mary Ojo accepted")} onReject={() => notify("Request declined")} /></section>
    <section className="panel question-summary"><div className="panel-header"><h2>Question bank</h2><button onClick={() => selectPage("questions")}>Open bank <Icon name="arrow" /></button></div><div className="summary-total"><strong>126</strong><span>questions across 6 subjects</span><Badge tone="green">+24.6%</Badge></div>{[["Mathematics", "42", "86%", "purple"], ["Basic Science", "31", "66%", "pink"], ["English", "24", "51%", "orange"], ["Other subjects", "29", "61%", "green"]].map(([label, value, width, color]) => <div className="subject-row" key={label}><div><span>{label}</span><strong>{value}</strong></div><div className="subject-track"><i className={`track-${color}`} style={{ width }} /></div></div>)}</section>
    <section className="panel quick-panel"><div className="panel-header"><h2>Quick actions</h2></div><div className="quick-actions"><QuickAction icon="✦" tone="purple" title="Create a question" detail="Build personalised practice" onClick={() => setModal("question")} /><QuickAction icon="⌁" tone="yellow" title="Invite students" detail="Share your institution code" onClick={() => setModal("invite")} /><QuickAction icon="▤" tone="pink" title="Browse resources" detail="Use Cedu's resource bank" onClick={() => selectPage("resources")} /></div></section>
  </div>;
}

function Activity({ avatar, title, detail, time }) { return <div className="activity-row"><Avatar initials={avatar} /><div><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>; }
function Request({ name, initials, color, onAccept, onReject }) { return <div className="request-row"><Avatar initials={initials} color={color} /><div><strong>{name}</strong><span>Wants to join a class</span></div><button className="tiny-button accept" onClick={onAccept}>✓</button><button className="tiny-button reject" onClick={onReject}>×</button></div>; }
function QuickAction({ icon, tone, title, detail, onClick }) { return <button type="button" onClick={onClick}><span className={`quick-icon ${tone}-bg`}>{icon}</span><strong>{title}</strong><small>{detail}</small><Icon name="arrow" /></button>; }
