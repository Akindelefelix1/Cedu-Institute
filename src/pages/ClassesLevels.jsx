import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Icon } from "../components/ui";
import { ConfirmDialog, Dialog } from "../components/modals";
import { institutionRequest } from "../services/institutionApi";
import CategoryLevels from "./CategoryLevels";

const defaultLabels = { category: "Section", level: "Class", learner: "Learners", subject: "Learning areas" };
const structureHelp = {
  category: {
    title: "Broad grouping",
    description: "The top-level stage or programme. Put related learner placements inside it, then assign people and learning areas within each placement.",
    examples: [
      { label: "Primary grouping", chain: ["Primary", "Year 1", "24 Students", "Mathematics"] },
      { label: "Secondary grouping", chain: ["Secondary", "JSS 1", "18 Students", "Basic Science"] },
    ],
  },
  level: {
    title: "Learner placement",
    description: "A specific class, cohort, or group inside a broad grouping. Learners are enrolled here, and its learning areas and questions are organised here too.",
    examples: [
      { label: "Primary example", chain: ["Primary", "Year 2", "24 Students", "Mathematics"] },
      { label: "Secondary example", chain: ["Secondary", "JSS 1", "18 Students", "English"] },
    ],
  },
  learner: {
    title: "People count",
    description: "Choose the word your institution uses for one learner. The number is entered on each placement; this word identifies who is being counted.",
    examples: [
      { label: "School", chain: ["Primary", "Year 2", "24 Students", "Mathematics"] },
      { label: "Learning club", chain: ["Chess Club", "Beginners", "12 Players", "Strategy"] },
    ],
  },
  subject: {
    title: "Content grouping",
    description: "The subject or learning area within a placement. Questions are assigned to one of these areas so learners can practise the right content.",
    examples: [
      { label: "Primary placement", chain: ["Primary", "Year 2", "24 Students", "Mathematics"] },
      { label: "Secondary placement", chain: ["Secondary", "JSS 1", "18 Students", "Basic Science"] },
    ],
  },
};

function StructureFieldHelp({ name, open, onToggle }) {
  const help = structureHelp[name];
  const tooltipId = `structure-help-${name}`;
  return <span className={`structure-help-wrap${open ? " is-open" : ""}`}>
    <button type="button" className="structure-help-mark" aria-label={`Explain ${help.title}`} aria-expanded={open} aria-describedby={tooltipId} onClick={event => { event.preventDefault(); onToggle(); }}>i</button>
    <span className="structure-help-popover" id={tooltipId} role="tooltip"><strong>{help.title}</strong><span>{help.description}</span><small>Two examples · follow the path from left to right</small><span className="structure-help-examples">{help.examples.map(example => <span className="structure-help-example" key={example.label}><b>{example.label}</b><span className="structure-help-chain">{example.chain.map((item, index) => <React.Fragment key={`${example.label}-${item}`}>{index > 0 && <i aria-hidden="true">›</i>}<em className={index === 0 ? "root" : index === example.chain.length - 1 ? "leaf" : ""}>{item}</em></React.Fragment>)}</span></span>)}</span></span>
  </span>;
}

export default function ClassesLevels({ notify, openClass }) {
  const [categories, setCategories] = useState([]), [levels, setLevels] = useState([]), [labels, setLabels] = useState(defaultLabels);
  const [selectedCategory, setSelectedCategory] = useState(null), [dialog, setDialog] = useState(null), [deleting, setDeleting] = useState(null);
  const [openLabelHelp, setOpenLabelHelp] = useState(null);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const loadStructure = () => { setLoading(true); setError(""); institutionRequest("/institutions/structure").then(data => { setLabels(data.labels || defaultLabels); setCategories(data.categories || []); setLevels(data.levels || []); }).catch(error => setError(error.message)).finally(() => setLoading(false)); };
  useEffect(loadStructure, []);
  const selected = selectedCategory && categories.find(category => category.id === selectedCategory.id);
  const learnerCount = useMemo(() => levels.reduce((sum, item) => sum + Number(item.learners || 0), 0), [levels]);
  const saveCategory = async event => { event.preventDefault(); const form = new FormData(event.currentTarget); const payload = { name: String(form.get("name") || "").trim(), description: String(form.get("description") || "").trim(), sortOrder: 0 }; if (!payload.name) return; setSaving(true); try { const editing = Boolean(dialog?.id); const data = await institutionRequest(editing ? `/institutions/structure/categories/${dialog.id}` : "/institutions/structure/categories", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) }); setCategories(current => editing ? current.map(item => item.id === dialog.id ? { ...data.category, levels: item.levels } : item) : [...current, data.category]); setDialog(null); notify(editing ? "Section updated" : `${payload.name} section created successfully`); } catch (error) { notify(error.message); } finally { setSaving(false); } };
  const saveLabels = async event => { event.preventDefault(); const form = new FormData(event.currentTarget); const next = { category: String(form.get("category") || defaultLabels.category).trim(), level: String(form.get("level") || defaultLabels.level).trim(), learner: String(form.get("learner") || defaultLabels.learner).trim(), subject: String(form.get("subject") || defaultLabels.subject).trim() }; setSaving(true); try { await institutionRequest("/institutions/structure/settings", { method: "PUT", body: JSON.stringify({ categoryLabel: next.category, levelLabel: next.level, learnerLabel: next.learner, subjectLabel: next.subject }) }); setLabels(next); setDialog(null); notify("Structure naming updated"); } catch (error) { notify(error.message); } finally { setSaving(false); } };
  const removeCategory = async () => { try { await institutionRequest(`/institutions/structure/categories/${deleting.id}`, { method: "DELETE" }); setCategories(current => current.filter(item => item.id !== deleting.id)); setDeleting(null); notify("Section deleted"); } catch (error) { notify(error.message); } };
  const saveLevel = payload => institutionRequest("/institutions/structure/levels", { method: "POST", body: JSON.stringify(payload) }).then(data => { setLevels(current => [data.level, ...current]); setCategories(current => current.map(item => item.id === payload.categoryId ? { ...item, levels: Number(item.levels || 0) + 1 } : item)); notify(`${data.level.name} created successfully`); });
  const updateLevel = (id, payload) => institutionRequest(`/institutions/structure/levels/${id}`, { method: "PATCH", body: JSON.stringify(payload) }).then(data => { setLevels(current => current.map(item => item.id === id ? data.level : item)); notify(`${data.level.name} updated`); return data.level; });
  const removeLevel = id => institutionRequest(`/institutions/structure/levels/${id}`, { method: "DELETE" }).then(() => { setLevels(current => current.filter(item => item.id !== id)); notify("Class deleted"); });
  if (loading) return <div className="structure-loading">Loading your institution structure...</div>;
  if (error) return <div className="structure-error"><p>{error}</p><Button onClick={loadStructure}>Try again</Button></div>;
  if (selected) return <CategoryLevels category={selected} levels={levels} labels={labels} onBack={() => setSelectedCategory(null)} openClass={openClass} onCreateLevel={saveLevel} onUpdateLevel={updateLevel} onDeleteLevel={removeLevel} notify={notify} />;
  return <div className="content-stack structure-content"><section className="structure-intro"><div><Badge tone="purple">LEARNING STRUCTURE</Badge><h2>Categories & levels</h2><p>Manage your institution&apos;s learning paths with the same clear flow as CeduGames.</p></div><div className="structure-intro-stats"><span><strong>{categories.length}</strong>{labels.category}s</span><span><strong>{levels.length}</strong>{labels.level}s</span><span><strong>{learnerCount}</strong>{labels.learner.toLowerCase()}</span></div></section><div className="nested-breadcrumb structure-root-breadcrumb"><strong>{labels.category}s</strong><span>›</span><span>Create and manage {labels.level.toLowerCase()}s inside each {labels.category.toLowerCase()}.</span></div><section className="structure-section"><div className="structure-toolbar"><div><h2>{labels.category}s</h2><p>Manage broad learning groupings and open their {labels.level.toLowerCase()}s.</p></div><Button onClick={() => setDialog({ type: "category" })} icon="plus">Add {labels.category}</Button></div><div className="institution-data-table"><div className="institution-data-table-head"><span>Card</span><span>Tag</span><span>Description</span><span>{labels.level}s</span><span>Actions</span></div>{categories.length ? categories.map(category => <article className="institution-data-row" key={category.id}><div className="institution-card-name"><span className="structure-category-icon">◆</span><strong>{category.name}</strong></div><div><Badge tone="purple">{labels.category}</Badge></div><p>{category.description || "No description provided."}</p><span>{category.levels || 0} {labels.level.toLowerCase()}{category.levels === 1 ? "" : "s"}</span><div className="institution-row-actions"><button onClick={() => setSelectedCategory(category)}><Icon name="activity" />Open</button><button className="purple-action" onClick={() => setDialog({ type: "category", ...category })}>✎ Edit</button><button className="red-action" onClick={() => setDeleting(category)}>♜ Delete</button></div></article>) : <div className="nested-empty-state"><h3>No {labels.category.toLowerCase()}s yet</h3><p>Create the first {labels.category.toLowerCase()} before adding {labels.level.toLowerCase()}s.</p><Button icon="plus" onClick={() => setDialog({ type: "category" })}>Add {labels.category}</Button></div>}</div></section><section className="structure-guide panel"><div className="structure-guide-icon">✦</div><div><strong>Customise the naming</strong><p>Use your own names for sections, classes, learners and learning areas without changing the workflow.</p></div><button onClick={() => setDialog({ type: "labels" })}>Customise names <Icon name="arrow" /></button></section>{dialog?.type === "category" && <Dialog title={dialog.id ? `Edit ${labels.category.toLowerCase()}` : `Add ${labels.category.toLowerCase()}`} subtitle="Create a broad learning grouping before adding learner placements." onClose={() => !saving && setDialog(null)}><form onSubmit={saveCategory}><label>{labels.category} name<input name="name" required autoFocus defaultValue={dialog.name || ""} placeholder="e.g. Primary, Junior School, STEM" /></label><label>Description<span className="field-hint">Explain which learners belong here.</span><textarea name="description" defaultValue={dialog.description || ""} placeholder="e.g. Foundation and primary learning years." /></label><div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setDialog(null)} disabled={saving}>Cancel</button><Button type="submit" loading={saving} loadingText="Saving...">{dialog.id ? "Save changes" : `Add ${labels.category}`}</Button></div></form></Dialog>}{dialog?.type === "labels" && <Dialog title="Name your structure" subtitle="Choose the words your institution uses across the nested pages." onClose={() => !saving && setDialog(null)}><form onSubmit={saveLabels} className="structure-label-form">{[["category", "Broad grouping", labels.category], ["level", "Learner placement", labels.level], ["learner", "People count", labels.learner], ["subject", "Content grouping", labels.subject]].map(([name, title, value]) => <label key={name}><span className="structure-label-heading">{title}<StructureFieldHelp name={name} open={openLabelHelp === name} onToggle={() => setOpenLabelHelp(current => current === name ? null : name)} /></span><input name={name} defaultValue={value} /></label>)}<div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setDialog(null)} disabled={saving}>Cancel</button><Button type="submit" loading={saving} loadingText="Saving...">Save naming</Button></div></form></Dialog>}{deleting && <ConfirmDialog title={`Delete ${labels.category.toLowerCase()}?`} message={`Delete ${deleting.name}? This section must not contain any ${labels.level.toLowerCase()}s.`} confirmLabel="Delete" onClose={() => setDeleting(null)} onConfirm={removeCategory} />}</div>;
}
