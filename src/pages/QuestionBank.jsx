import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Icon } from "../components/ui";
import { institutionRequest } from "../services/institutionApi";

const csvHeaders = ["Questions", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Time Limit (seconds)"];

export default function QuestionBank({ questions, setQuestions, confirm, onDelete, onEdit, selectPage, notify, publishingPolicy }) {
  const [filter, setFilter] = useState("All questions"), [query, setQuery] = useState("");
  const [preview, setPreview] = useState(null), [bulkOpen, setBulkOpen] = useState(false);
  const shown = useMemo(() => questions.filter(question => filter === "All questions" || question.status === filter).filter(question => `${question.text} ${question.subject}`.toLowerCase().includes(query.toLowerCase())), [questions, filter, query]);
  const remove = question => confirm("Remove this question?", "This question will be removed from the institution question bank.", "Remove", () => onDelete ? onDelete(question.id) : setQuestions(current => current.filter(item => item.id !== question.id)));
  const refreshQuestions = async () => {
    const data = await institutionRequest("/institutions/questions");
    setQuestions(data.questions || []);
  };
  return <div className="content-stack">
    <div className="toolbar"><div className="search-box"><Icon name="search" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search your question bank" aria-label="Search question bank" /></div><select value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filter questions"><option>All questions</option><option>Published</option><option>Needs review</option><option>Draft</option></select><Button variant="outline" onClick={() => setBulkOpen(true)}>Bulk upload</Button><Button variant="outline" onClick={() => selectPage("structure")}>Add from a class</Button></div>
    <div className="question-list">{shown.map(question => <article className="question-card" key={question.id}><div className="question-number">Q</div><div className="question-body"><div className="question-meta"><Badge tone={question.status === "Published" ? "green" : question.status === "Needs review" ? "yellow" : "gray"}>{question.status}</Badge><span>{question.subject}</span><span>·</span><span>{question.type}</span><span>·</span><span>{question.timeLimitSeconds || 30}s per question</span></div><h3 dangerouslySetInnerHTML={{ __html: question.text || "" }} />{question.status === "Needs review" && question.reviewNotes && <p className="question-review-note"><strong>Admin feedback: </strong>{question.reviewNotes}</p>}<p>Updated {question.updated ? new Date(question.updated).toLocaleString() : "Recently"} · {question.plays ? `${question.plays} student plays` : "Not used yet"}</p></div><div className="question-actions">{question.status === "Needs review" && <button onClick={() => onEdit?.(question)}>Edit &amp; resubmit</button>}<button onClick={() => setPreview(question)}>Preview</button><button type="button" className="question-delete-button" aria-label={`Delete question: ${question.text?.replace(/<[^>]*>/g, "") || "Untitled"}`} onClick={() => remove(question)}><svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5h11M6 4.5V3h4v1.5m2 0-.55 8.1a1 1 0 0 1-1 .9h-5a1 1 0 0 1-1-.9L4 4.5m2.5 2v4m3-4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Delete</span></button></div></article>)}{!shown.length && <div className="no-results">No questions match this search or filter.</div>}<button className="empty-add" onClick={() => selectPage("structure")}><span>+</span><strong>Add another question</strong><small>Choose a class and learning area for the question</small></button></div>
    {preview && <QuestionPreview question={preview} onClose={() => setPreview(null)} />}
    {bulkOpen && <InstitutionBulkUpload publishingPolicy={publishingPolicy} onClose={() => setBulkOpen(false)} onComplete={async message => { let notice = message; try { await refreshQuestions(); } catch { notice = "Questions uploaded. Refresh the question bank to see the latest list."; } finally { setBulkOpen(false); } notify?.(notice); }} />}
  </div>;
}

function InstitutionBulkUpload({ publishingPolicy, onClose, onComplete }) {
  const [levels, setLevels] = useState([]), [levelId, setLevelId] = useState(""), [subject, setSubject] = useState(""), [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState(publishingPolicy || "admin_review");
  const [file, setFile] = useState(null), [questions, setParsedQuestions] = useState([]), [errors, setErrors] = useState([]), [busy, setBusy] = useState(false), [status, setStatus] = useState("published");
  useEffect(() => {
    institutionRequest("/institutions/structure").then(data => { setLevels(data.levels || []); setPolicy(data.publishingPolicy || "admin_review"); }).catch(error => setErrors([error.message || "Classes could not be loaded."])).finally(() => setLoading(false));
  }, [publishingPolicy]);
  const downloadTemplate = () => {
    const rows = [csvHeaders, ["What is 2 + 3?", "4", "5", "6", "7", "Option B", "30"], ["Which animal says meow?", "Dog", "Cat", "Cow", "Duck", "Option B", "45"]];
    const escape = value => `"${String(value).replace(/"/g, '""')}"`;
    const blob = new Blob(["\uFEFF", rows.map(row => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = "cedu-institution-question-bulk-upload-template.csv"; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const chooseFile = async event => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setFile(selected); setErrors([]); setParsedQuestions([]);
    try { const parsed = parseBulkCsv(await selected.text()); setParsedQuestions(parsed.questions); setErrors(parsed.errors); }
    catch { setErrors(["The selected CSV file could not be read."]); }
  };
  const canUpload = Boolean(file && levelId && questions.length && !errors.length && !busy);
  const submit = async event => {
    event.preventDefault();
    if (!canUpload) return;
    setBusy(true);
    const body = new FormData(); body.append("file", file); body.append("levelId", levelId); body.append("subject", subject); body.append("status", status);
    try {
      const result = await institutionRequest("/institutions/questions/bulk", { method: "POST", body });
      await onComplete(result.message || `${result.count} questions uploaded.`);
    } catch (error) { setErrors(error.errors || [error.message || "Questions could not be uploaded."]); }
    finally { setBusy(false); }
  };
  const selectedLevel = levels.find(level => level.id === levelId);
  return <div className="question-preview-scrim" onMouseDown={onClose}><form className="question-preview-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="bulk-upload-title" onMouseDown={event => event.stopPropagation()}>
    <header><div><span>INSTITUTION CONTENT</span><h2 id="bulk-upload-title">Bulk upload questions</h2></div><button type="button" onClick={onClose} aria-label="Close bulk upload">×</button></header>
    <div className="question-preview-prompt"><p>Upload questions with the same validated CSV workflow used in Admin. The exact six-column Admin template is accepted; the downloaded institution template adds an optional per-question timer.</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">Class placement<select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm" value={levelId} disabled={loading} onChange={event => { const next = levels.find(level => level.id === event.target.value); setLevelId(event.target.value); setSubject(next?.subjects?.[0] || next?.name || ""); }}><option value="">{loading ? "Loading classes…" : "Select a class"}</option>{levels.map(level => <option key={level.id} value={level.id}>{level.category ? `${level.category} · ` : ""}{level.name}</option>)}</select></label><label className="block text-sm font-bold">Subject<select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm" value={subject} disabled={!levelId || !selectedLevel?.subjects?.length} onChange={event => setSubject(event.target.value)}><option value="">{selectedLevel?.subjects?.length ? "Select a subject" : selectedLevel ? "Uses class name" : "Select a class first"}</option>{(selectedLevel?.subjects || []).map(item => <option key={item} value={item}>{item}</option>)}</select></label><label className="block text-sm font-bold">Publishing<select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm" value={status} onChange={event => setStatus(event.target.value)}><option value="published">{policy === "auto_publish" ? "Publish immediately" : "Submit for admin review"}</option><option value="draft">Save as drafts</option></select></label><div className="flex items-end"><button type="button" onClick={downloadTemplate} className="w-full rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700">↓ Download CSV template</button></div></div>
    <label className="mt-4 block cursor-pointer rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-6 text-center"><strong className="block text-sm">{file ? file.name : "Choose a completed CSV file"}</strong><span className="mt-1 block text-xs text-slate-500">CSV format · up to 500 questions</span><input type="file" accept=".csv,text/csv" onChange={chooseFile} className="sr-only" /></label>
    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600"><strong>Template columns:</strong> Questions, Option A, Option B, Option C, Option D, Correct Answer, Time Limit (seconds). For the Admin template, timers default to 30 seconds. Correct answer must be Option A, B, C, or D; timer range is 5–600 seconds.</div>
    {selectedLevel && <p className="mt-3 text-xs text-slate-500">Questions will be assigned to <strong>{selectedLevel.name}</strong> under subject <strong>{subject || selectedLevel.name}</strong>. {policy === "auto_publish" ? "Your policy allows immediate publishing." : "Your policy sends published questions to Admin for review."}</p>}
    {errors.length > 0 && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><strong>Fix these CSV issues:</strong><ul className="mt-2 list-disc space-y-1 pl-5">{errors.slice(0, 8).map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>{errors.length > 8 && <p className="mt-1">And {errors.length - 8} more.</p>}</div>}
    {questions.length > 0 && !errors.length && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><strong>{questions.length} questions are ready</strong><div className="mt-3 max-h-48 overflow-auto rounded-lg bg-white/70"><table className="min-w-[700px] w-full text-left text-xs"><thead><tr className="border-b"><th className="p-2">Question</th><th className="p-2">Option A</th><th className="p-2">Option B</th><th className="p-2">Option C</th><th className="p-2">Option D</th><th className="p-2">Correct</th><th className="p-2">Time</th></tr></thead><tbody>{questions.slice(0, 10).map((question, index) => <tr key={`${index}-${question.text}`} className="border-b last:border-0"><td className="p-2 font-semibold">{question.text}</td>{question.options.map((option, optionIndex) => <td key={optionIndex} className={`p-2 ${optionIndex === question.correctAnswer ? "font-bold text-emerald-700" : ""}`}>{option}</td>)}<td className="p-2 font-bold">Option {String.fromCharCode(65 + question.correctAnswer)}</td><td className="p-2">{question.timeLimitSeconds}s</td></tr>)}</tbody></table></div>{questions.length > 10 && <p className="mt-2 text-xs">Showing the first 10 rows.</p>}</div>}
    <footer className="mt-5 flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><button type="submit" disabled={!canUpload} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Uploading…" : "Upload questions"}</button></footer>
  </form></div>;
}

function parseBulkCsv(source) {
  const rows = []; let row = [], cell = "", quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') { if (quoted && source[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted; }
    else if (character === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) { if (character === "\r" && source[index + 1] === "\n") index += 1; row.push(cell.trim()); cell = ""; if (row.some(Boolean)) rows.push(row); row = []; }
    else cell += character;
  }
  if (cell || row.length) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); }
  const headers = (rows.shift() || []).map(value => value.replace(/^\uFEFF/, "").toLowerCase());
  const required = csvHeaders.slice(0, 6).map(value => value.toLowerCase());
  const hasTimer = headers.length === 7 && headers[6] === "time limit (seconds)";
  const errors = ((!hasTimer && headers.length !== 6) || required.some((value, index) => headers[index] !== value)) ? ["The headings must match the downloadable template or the six-column Admin template."] : [];
  const questions = rows.map((values, index) => {
    const line = index + 2;
    if (values.length !== headers.length) { errors.push(`Row ${line} must contain exactly ${headers.length} columns.`); return null; }
    const correctAnswer = ["option a", "option b", "option c", "option d"].indexOf((values[5] || "").toLowerCase().replace(/\s+/g, " "));
    if (correctAnswer < 0) { errors.push(`Row ${line} must use Option A, Option B, Option C, or Option D.`); return null; }
    if (!(values[0] || "").trim() || values[0].length > 500 || values.slice(1, 5).some(value => !value || value.length > 180)) { errors.push(`Row ${line} needs a question (up to 500 characters) and four options (up to 180 characters each).`); return null; }
    const timeLimitSeconds = hasTimer && values[6] ? Number(values[6]) : 30;
    if (!Number.isInteger(timeLimitSeconds) || timeLimitSeconds < 5 || timeLimitSeconds > 600) { errors.push(`Row ${line} timer must be a whole number from 5 to 600 seconds.`); return null; }
    return { text: values[0], options: values.slice(1, 5), correctAnswer, timeLimitSeconds };
  }).filter(Boolean);
  if (!questions.length && !errors.length) errors.push("The CSV contains no question rows.");
  if (rows.length > 500) errors.push("Upload no more than 500 questions in one file.");
  return { questions, errors };
}

function QuestionPreview({ question, onClose }) {
  const media = (url, type) => {
    if (!url) return null;
    if (type === "image") return <img className="question-preview-media" src={url} alt="Question attachment" />;
    if (type === "audio") return <audio className="question-preview-media" controls src={url} />;
    if (type === "video") return <video className="question-preview-media" controls src={url} />;
    return <a className="question-preview-document" href={url} target="_blank" rel="noreferrer">Open attached document</a>;
  };
  return <div className="question-preview-scrim" onMouseDown={onClose}><section className="question-preview-modal" role="dialog" aria-modal="true" aria-label="Question preview" onMouseDown={event => event.stopPropagation()}><header><div><span>LEARNER PREVIEW · {question.subject}</span><h2>Preview question</h2></div><button type="button" onClick={onClose} aria-label="Close preview">×</button></header><div className="question-preview-prompt" dangerouslySetInnerHTML={{ __html: question.text || "" }} />{question.shapeType && <ShapePreview type={question.shapeType} color={question.shapeColor} />}{media(question.mediaUrl, question.mediaType)}<div className="question-preview-options">{(question.options || []).map((option, index) => <article className={option.isCorrect ? "correct" : ""} key={`${question.id}-${index}`}><b>{String.fromCharCode(65 + index)}</b><div><div className="rich-content" dangerouslySetInnerHTML={{ __html: option.text || "" }} />{option.shapeType && <ShapePreview type={option.shapeType} color={option.shapeColor} compact />}{media(option.mediaUrl, option.mediaType)}</div>{option.isCorrect && <span className="question-preview-correct">Correct answer</span>}</article>)}</div>{question.explanation && <div className="question-preview-explanation"><strong>Answer explanation</strong><p>{question.explanation}</p></div>}<footer><Button onClick={onClose}>Close preview</Button></footer></section></div>;
}

function ShapePreview({ type, color = "#7442ae", compact = false }) { const clips = { circle: "circle(50%)", square: "none", rectangle: "none", triangle: "polygon(50% 0,100% 100%,0 100%)", star: "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 93%,50% 72%,21% 93%,32% 57%,2% 35%,39% 35%)", hexagon: "polygon(25% 7%,75% 7%,100% 50%,75% 93%,25% 93%,0 50%)" }; return <span className="question-preview-shape" aria-label={`${type} shape`} role="img" style={{ display: "block", width: compact ? 42 : 58, height: compact ? 42 : 58, margin: "10px 0", background: color, clipPath: clips[type] || clips.circle, borderRadius: type === "circle" ? "50%" : 2 }} />; }
