import React, { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Button, Icon, Pagination } from "../components/ui";
import { institutionRequest } from "../services/institutionApi";

export default function Students({ notify, onOpenStudent }) {
  const [students, setStudents] = useState([]), [query, setQuery] = useState(""), [page, setPage] = useState(1), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const pageSize = 15;
  useEffect(() => { institutionRequest("/institutions/students").then(data => setStudents(data.students || [])).catch(error => setError(error.message)).finally(() => setLoading(false)); }, []);
  const visible = useMemo(() => students.filter(student => `${student.name} ${student.email} ${student.className}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStudents = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const exportList = () => {
    if (!students.length) return notify("There are no connected learners to export yet.");
    const columns = ["Name", "Email", "Username", "Class", "Progress", "Status"];
    const escape = value => { const text = String(value ?? ""); const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text; return `"${safe.replace(/"/g, '""')}"`; };
    const rows = visible.map(student => [student.name, student.email, student.username ? `@${student.username}` : "", student.className || "Not assigned", student.progress > 0 ? `${student.progress}%` : "Not tracked", student.status]);
    const csv = [columns, ...rows].map(row => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "institution-learners.csv"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
    notify(`Exported ${visible.length} learner${visible.length === 1 ? "" : "s"}.`);
  };
  return <div className="content-stack"><div className="toolbar"><div className="search-box"><Icon name="search" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search connected learners" aria-label="Search students" /></div><Button variant="outline" onClick={exportList} disabled={loading || Boolean(error)}>Export list</Button></div><div className="filter-chips"><button className="selected">All <span>{students.length}</span></button></div><div className="table-panel">{loading ? <div className="loading-state" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" />Loading connected learners...</div> : error ? <div className="no-results">{error}</div> : <table><thead><tr><th>Student</th><th>Email</th><th>Class</th><th>Progress</th><th>Status</th></tr></thead><tbody>{pageStudents.map(student => <tr key={student.id} className="student-table-row" onClick={() => onOpenStudent(student)} tabIndex={0} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpenStudent(student); } }} aria-label={`View ${student.name}'s details`}><td><div className="table-person"><Avatar initials={student.initials} /><strong>{student.name}</strong></div></td><td className="muted">{student.email || `@${student.username}`}</td><td>{student.className || "Not assigned"}</td><td>{student.progress > 0 ? <div className="progress-cell"><div><i style={{ width: `${student.progress}%` }} /></div><span>{student.progress}%</span></div> : <span className="muted">Not tracked</span>}</td><td><Badge tone="green">{student.status}</Badge></td></tr>)}</tbody></table>}{!loading && !error && !visible.length && <div className="no-results">No connected learners match this search.</div>}<Pagination total={visible.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} label="learners" /><div className="table-footer"><span>Showing {pageStudents.length} of {visible.length} matching learners</span></div></div></div>;
}
