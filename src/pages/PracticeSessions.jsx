import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Pagination } from "../components/ui";
import { institutionRequest } from "../services/institutionApi";

export default function PracticeSessions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 9;
  useEffect(() => {
    let active = true;
    institutionRequest("/institutions/questions")
      .then(data => { if (active) setQuestions(data.questions || []); })
      .catch(requestError => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const groups = useMemo(() => {
    const published = questions.filter(question => question.status === "Published");
    const grouped = new Map();
    published.forEach(question => {
      const key = `${question.levelId}:${question.subject}`;
      const group = grouped.get(key) || { key, level: question.level, subject: question.subject, questions: [] };
      group.questions.push(question);
      grouped.set(key, group);
    });
    return [...grouped.values()];
  }, [questions]);
  const pageCount = Math.max(1, Math.ceil(groups.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageGroups = groups.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const openQuestions = () => {
    window.history.pushState({}, "", "/question-bank");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return <div className="content-stack">
    <section className="practice-hero"><div><Badge tone="purple">LEARNER PRACTICE</Badge><h2>Published practice content</h2><p>Only published institution questions are available to learners in their institution learning area. Drafts and review requests stay out of learner practice.</p><Button onClick={openQuestions}>Manage questions</Button></div></section>
    {loading ? <div className="loading-state" role="status"><span className="loading-spinner" aria-hidden="true" />Loading published questions…</div>
      : error ? <div className="app-error-state"><div><h2>Practice content unavailable</h2><p>{error}</p><Button onClick={() => window.location.reload()}>Try again</Button></div></div>
      : groups.length ? <><div className="section-title"><h2>Available to learners</h2><Badge tone="green">{groups.reduce((total, group) => total + group.questions.length, 0)} published questions</Badge></div><div className="session-grid">{pageGroups.map(group => <article className="session-card" key={group.key}><Badge tone="green">Published</Badge><h3>{group.subject}</h3><p>{group.level}</p><div className="session-bottom"><span>{group.questions.length} question{group.questions.length === 1 ? "" : "s"}</span><strong>Visible in learner view</strong></div><ul className="practice-question-list">{group.questions.slice(0, 3).map(question => <li key={question.id}>{question.text}</li>)}</ul>{group.questions.length > 3 && <small>and {group.questions.length - 3} more</small>}</article>)}</div><Pagination total={groups.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} label="practice groups" /></>
      : <div className="empty-panel"><h3>No published practice yet</h3><p>Publish or get approval for institution questions to make them available to learners.</p><Button onClick={openQuestions}>Open question bank</Button></div>}
  </div>;
}
