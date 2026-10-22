import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Pagination } from "../components/ui";
import { institutionRequest } from "../services/institutionApi";

export default function Resources() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    let active = true;
    institutionRequest("/institutions/questions")
      .then(data => { if (active) setQuestions(data.questions || []); })
      .catch(requestError => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const assets = useMemo(() => questions.flatMap(question => {
    const attached = [];
    if (question.mediaUrl) attached.push({ url: question.mediaUrl, type: question.mediaType, label: "Question media" });
    (question.options || []).forEach((option, index) => {
      if (option.mediaUrl) attached.push({ url: option.mediaUrl, type: option.mediaType, label: `Option ${String.fromCharCode(65 + index)} media` });
    });
    return attached.map((asset, index) => ({ ...asset, id: `${question.id}-${index}`, question: question.text, subject: question.subject, level: question.level }));
  }), [questions]);
  const pageCount = Math.max(1, Math.ceil(assets.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageAssets = assets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openQuestions = () => {
    window.history.pushState({}, "", "/question-bank");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return <div className="content-stack">
    <section className="resource-toolbar">
      <div><h2>Media attached to questions</h2><p>These files were uploaded with institution questions and are available to learners when those questions are published.</p></div>
      <Button onClick={openQuestions}>Manage questions</Button>
    </section>
    {loading ? <div className="loading-state" role="status"><span className="loading-spinner" aria-hidden="true" />Loading institution question media…</div>
      : error ? <div className="app-error-state"><div><h2>Media library unavailable</h2><p>{error}</p><Button onClick={() => window.location.reload()}>Try again</Button></div></div>
      : assets.length ? <><div className="resource-grid">{pageAssets.map(asset => <article className="resource-card" key={asset.id}>
        <div className="resource-art">{asset.type === "image" ? <img src={asset.url} alt="" /> : <span aria-hidden="true">▤</span>}</div>
        <div className="resource-card-copy"><strong>{asset.label}</strong><span>{asset.subject} · {asset.level}</span><small title={asset.question}>{asset.question}</small></div>
        <a href={asset.url} target="_blank" rel="noreferrer">Open file</a>
      </article>)}</div><Pagination total={assets.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} label="files" /></>
      : <div className="empty-panel"><h3>No question media uploaded yet</h3><p>Add an image, audio clip, video, or document from the question editor. It will appear here after the question is saved.</p><Button onClick={openQuestions}>Open question bank</Button></div>}
    {!loading && !error && <p className="resource-count"><Badge tone="purple">{assets.length} attached file{assets.length === 1 ? "" : "s"}</Badge></p>}
  </div>;
}
