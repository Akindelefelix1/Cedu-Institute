import React, { useEffect, useState } from "react";
import { Avatar, Badge, Icon } from "../components/ui";
import { institutionRequest } from "../services/institutionApi";

const formatDate = value => value ? new Date(value).toLocaleString() : "Not available";

export default function StudentProfile({ studentId, institutionName, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setData(null);
    setLoading(true);
    setError("");
    institutionRequest(`/institutions/students/${encodeURIComponent(studentId)}`)
      .then(result => { if (active) setData(result); })
      .catch(requestError => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId]);

  const student = data?.student;
  const summary = data?.summary;

  return <div className="student-profile-page"><div className="student-profile-inner">
    <button className="back-link" onClick={onBack}><Icon name="arrow-left" /> Back to students</button>
    {loading ? <section className="panel loading-state" role="status"><span className="loading-spinner" aria-hidden="true" />Loading student details...</section> : error ? <section className="panel no-results" role="alert">{error}</section> : student && <>
      <section className="student-profile-hero"><div className="student-profile-identity"><Avatar initials={student.initials} /><div><p>STUDENT PROFILE</p><h1>{student.name}</h1><small>{student.username ? `@${student.username}` : "Learner"} · {institutionName}</small></div></div><Badge tone="green">{student.status}</Badge></section>
      <div className="profile-stat-grid">{[["Practice attempts", summary.attempts, "Recorded gameplay sessions"], ["Average score", summary.averageScore == null ? "No data" : `${summary.averageScore}%`, "Across recorded attempts"], ["Passed", summary.passed, "Successful attempts"], ["Total XP", student.totalXp, "Earned in Cedu"]].map(([label, value, note]) => <div className="panel" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
      <section className="panel"><div className="panel-header"><div><h2>Student details</h2><p className="panel-copy">Account and institution membership information.</p></div></div><div className="profile-detail-grid">{[["Email", student.email || "Not provided"], ["Phone", student.phone || "Not provided"], ["Age", student.age ?? "Not provided"], ["Class", "Not assigned"], ["Joined institution", formatDate(student.joinedAt)], ["Last practice activity", formatDate(student.lastPracticeAt)], ["Membership", student.status], ["Username", student.username ? `@${student.username}` : "Not set"]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
      <section className="panel"><div className="panel-header"><div><h2>Recent learning activity</h2><p className="panel-copy">Latest recorded attempts in Cedu.</p></div></div>{data.recentActivity.length ? <div className="student-activity-list">{data.recentActivity.map(item => <div className="student-activity-item" key={item.id}><div><strong>{item.activity}</strong><span>{item.levelName || "Learning activity"}</span></div><div><Badge tone={item.passed ? "green" : "yellow"}>{item.score}%</Badge><small>{formatDate(item.createdAt)}</small></div></div>)}</div> : <div className="empty-panel">No learning activity has been recorded yet.</div>}</section>
    </>}
  </div></div>;
}
