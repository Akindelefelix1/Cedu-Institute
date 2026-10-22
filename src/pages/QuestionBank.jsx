import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Icon, Pagination } from "../components/ui";
import { institutionRequest } from "../services/institutionApi";

const csvHeaders = ["Questions", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Time Limit (seconds)"];

export default function QuestionBank({ questions, setQuestions, confirm, onDelete, onEdit, selectPage, notify, publishingPolicy, bulkPage = false }) {
  const [filter, setFilter] = useState("All questions"), [query, setQuery] = useState(""), [page, setPage] = useState(1);
  const pageSize = 10;
  const [preview, setPreview] = useState(null);
  const shown = useMemo(() => questions.filter(question => filter === "All questions" || question.status === filter).filter(question => `${question.text} ${question.subject}`.toLowerCase().includes(query.toLowerCase())), [questions, filter, query]);
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageQuestions = shown.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const remove = question => confirm("Remove this question?", "This question will be removed from the institution question bank.", "Remove", () => onDelete ? onDelete(question.id) : setQuestions(current => current.filter(item => item.id !== question.id)));
  const refreshQuestions = async () => {
    const data = await institutionRequest("/institutions/questions");
    setQuestions(data.questions || []);
  };
  const completeBulkUpload = async message => { let notice = message; try { await refreshQuestions(); } catch { notice = "Questions uploaded. Refresh the question bank to see the latest list."; } finally { selectPage("questions"); } notify?.(notice); };
  if (bulkPage) return <InstitutionBulkUpload publishingPolicy={publishingPolicy} onClose={() => selectPage("questions")} onComplete={completeBulkUpload} />;
  return <div className="content-stack">
    <div className="toolbar"><div className="search-box"><Icon name="search" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search your question bank" aria-label="Search question bank" /></div><select value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }} aria-label="Filter questions"><option>All questions</option><option>Published</option><option>Needs review</option><option>Draft</option></select><Button variant="outline" onClick={() => selectPage("bulkUpload")}>Bulk upload</Button><Button variant="outline" onClick={() => selectPage("structure")}>Add from a class</Button></div>
    <div className="question-list">{pageQuestions.map(question => <article className="question-card" key={question.id}><div className="question-number">Q</div><div className="question-body"><div className="question-meta"><Badge tone={question.status === "Published" ? "green" : question.status === "Needs review" ? "yellow" : "gray"}>{question.status}</Badge><span>{question.subject}</span><span>·</span><span>{question.type}</span><span>·</span><span>{question.timeLimitSeconds || 30}s per question</span></div><h3 dangerouslySetInnerHTML={{ __html: question.text || "" }} />{question.status === "Needs review" && question.reviewNotes && <p className="question-review-note"><strong>Admin feedback: </strong>{question.reviewNotes}</p>}<p>Updated {question.updated ? new Date(question.updated).toLocaleString() : "Recently"} · {question.plays ? `${question.plays} student plays` : "Not used yet"}</p></div><div className="question-actions">{question.status === "Needs review" && <button onClick={() => onEdit?.(question)}>Edit &amp; resubmit</button>}<button onClick={() => setPreview(question)}>Preview</button><button type="button" className="question-delete-button" aria-label={`Delete question: ${question.text?.replace(/<[^>]*>/g, "") || "Untitled"}`} onClick={() => remove(question)}><svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5h11M6 4.5V3h4v1.5m2 0-.55 8.1a1 1 0 0 1-1 .9h-5a1 1 0 0 1-1-.9L4 4.5m2.5 2v4m3-4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Delete</span></button></div></article>)}{!shown.length && <div className="no-results">No questions match this search or filter.</div>}<Pagination total={shown.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} label="questions" /><button className="empty-add" onClick={() => selectPage("structure")}><span>+</span><strong>Add another question</strong><small>Choose a class and learning area for the question</small></button></div>
    {preview && <QuestionPreview question={preview} onClose={() => setPreview(null)} />}
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
  return <div className="bulk-upload-page">
    <button type="button" className="bulk-back-link" onClick={onClose}><Icon name="arrow-left" /> Back to question bank</button>
    <section className="bulk-upload-hero"><div><span>INSTITUTION CONTENT</span><h2 id="bulk-upload-title">Bulk upload questions</h2><p>Prepare a CSV, check its questions, and add them to a class in one upload.</p></div><div className="bulk-upload-limit"><strong>500</strong><span>questions per upload</span></div></section>
    <div className="bulk-upload-layout">
      <form className="bulk-upload-form" onSubmit={submit} aria-labelledby="bulk-upload-title">
        <section className="bulk-upload-card"><div className="bulk-section-heading"><span>01</span><div><h3>Choose where questions belong</h3><p>All rows in this file will use the selected class and learning area.</p></div></div><div className="bulk-upload-fields"><label className="bulk-field">Class placement<select value={levelId} disabled={loading} onChange={event => { const next = levels.find(level => level.id === event.target.value); setLevelId(event.target.value); setSubject(next?.subjects?.[0] || next?.name || ""); }}><option value="">{loading ? "Loading classes..." : "Select a class"}</option>{levels.map(level => <option key={level.id} value={level.id}>{level.category ? `${level.category} / ` : ""}{level.name}</option>)}</select></label><label className="bulk-field">Subject<select value={subject} disabled={!levelId || !selectedLevel?.subjects?.length} onChange={event => setSubject(event.target.value)}><option value="">{selectedLevel?.subjects?.length ? "Select a subject" : selectedLevel ? "Uses class name" : "Select a class first"}</option>{(selectedLevel?.subjects || []).map(item => <option key={item} value={item}>{item}</option>)}</select></label></div>{selectedLevel && <p className="bulk-assignment-note">Target: <strong>{selectedLevel.category ? `${selectedLevel.category} / ` : ""}{selectedLevel.name}</strong><span>{subject || selectedLevel.name}</span></p>}</section>
        <section className="bulk-upload-card"><div className="bulk-section-heading"><span>02</span><div><h3>Set publishing preference</h3><p>Choose whether the uploaded questions should be reviewed or saved as drafts.</p></div></div><label className="bulk-field">Publishing<select value={status} onChange={event => setStatus(event.target.value)}><option value="published">{policy === "auto_publish" ? "Publish immediately" : "Submit for admin review"}</option><option value="draft">Save as drafts</option></select></label><p className="bulk-policy-note">{policy === "auto_publish" ? "Your institution policy allows immediate publishing." : "Published uploads are sent to the Admin review queue before learners can use them."}</p></section>
        <section className="bulk-upload-card"><div className="bulk-section-heading"><span>03</span><div><h3>Add your CSV file</h3><p>Use a template to keep the column order and answer format correct.</p></div></div><label className={`bulk-file-drop${file ? " has-file" : ""}`}><span className="bulk-file-icon">↑</span><strong>{file ? file.name : "Choose a completed CSV file"}</strong><span>{file ? "Choose another file to replace it" : "Select a .csv file from your device"}</span><input type="file" accept=".csv,text/csv" onChange={chooseFile} /></label><div className="bulk-file-facts"><span>CSV format</span><span>Up to 500 questions</span><span>Admin six-column template supported</span></div></section>
        {errors.length > 0 && <div role="alert" className="bulk-errors"><strong>Check the CSV before uploading</strong><ul>{errors.slice(0, 8).map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>{errors.length > 8 && <p>And {errors.length - 8} more issues.</p>}</div>}
        {questions.length > 0 && !errors.length && <section className="bulk-preview-card"><div className="bulk-preview-heading"><div><span>FILE CHECK</span><h3>{questions.length} questions ready</h3></div><span className="bulk-ready-badge">Ready</span></div><div className="bulk-preview-table-wrap"><table className="bulk-preview-table"><thead><tr><th>Question</th><th>Option A</th><th>Option B</th><th>Option C</th><th>Option D</th><th>Correct</th><th>Time</th></tr></thead><tbody>{questions.slice(0, 10).map((question, index) => <tr key={`${index}-${question.text}`}><td>{question.text}</td>{question.options.map((option, optionIndex) => <td key={optionIndex}>{option}</td>)}<td className="correct-answer">Option {String.fromCharCode(65 + question.correctAnswer)}</td><td>{question.timeLimitSeconds}s</td></tr>)}</tbody></table></div>{questions.length > 10 && <p className="bulk-preview-footnote">Showing the first 10 rows. All {questions.length} validated questions will be uploaded.</p>}</section>}
        <footer className="bulk-upload-actions"><button type="button" className="button button-outline" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" disabled={!canUpload} className="bulk-submit-button">{busy ? "Uploading questions..." : `Upload ${questions.length || "questions"}`}</button></footer>
      </form>
      <aside className="bulk-upload-guide"><section className="bulk-guide-card bulk-template-card"><span className="bulk-guide-kicker">START HERE</span><h3>Download the CSV template</h3><p>Fill in a row for each question. Two example rows are included so you can see the expected format.</p><button type="button" onClick={downloadTemplate}>↓ Download CSV template</button></section><section className="bulk-guide-card"><h3>Template columns</h3><ol className="bulk-column-list">{csvHeaders.map((header, index) => <li key={header}><span>{String(index + 1).padStart(2, "0")}</span><strong>{header}</strong>{index === 6 && <small>Optional for Admin template</small>}</li>)}</ol><p className="bulk-guide-note">Correct answer must be Option A, B, C, or D. Timer range is 5-600 seconds. Admin's six-column template defaults to 30 seconds per question.</p></section><section className="bulk-guide-card bulk-guide-steps"><h3>How it works</h3><p><b>1</b> Download and fill the template.</p><p><b>2</b> Choose the destination class and subject.</p><p><b>3</b> Review the preview, then upload.</p></section></aside>
    </div>
  </div>;
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
