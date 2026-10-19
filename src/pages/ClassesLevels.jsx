import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Icon } from "../components/ui";
import { Dialog } from "../components/modals";
import { institutionRequest } from "../services/institutionApi";
import CategoryLevels from "./CategoryLevels";

const defaultLabels = { category: "Section", level: "Class", learner: "Learners", subject: "Learning areas" };

export default function ClassesLevels({ notify, openClass }) {
  const [categories, setCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [labels, setLabels] = useState(defaultLabels);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStructure = () => {
    setLoading(true);
    institutionRequest("/institutions/structure")
      .then((data) => { setLabels(data.labels || defaultLabels); setCategories(data.categories || []); setLevels(data.levels || []); })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadStructure, []);

  const selected = selectedCategory && categories.find((category) => category.id === selectedCategory.id);
  const levelCount = useMemo(() => levels.length, [levels]);
  const learnerCount = useMemo(() => levels.reduce((sum, item) => sum + Number(item.learners || 0), 0), [levels]);

  const saveLabels = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextLabels = {
      category: String(form.get("category") || defaultLabels.category).trim() || defaultLabels.category,
      level: String(form.get("level") || defaultLabels.level).trim() || defaultLabels.level,
      learner: String(form.get("learner") || defaultLabels.learner).trim() || defaultLabels.learner,
      subject: String(form.get("subject") || defaultLabels.subject).trim() || defaultLabels.subject,
    };
    return institutionRequest("/institutions/structure/settings", { method: "PUT", body: JSON.stringify({ categoryLabel: nextLabels.category, levelLabel: nextLabels.level, learnerLabel: nextLabels.learner, subjectLabel: nextLabels.subject }) })
      .then(() => { setLabels(nextLabels); setDialog(null); notify("Structure naming updated"); });
  };

  const saveCategory = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) return Promise.resolve();
    return institutionRequest("/institutions/structure/categories", { method: "POST", body: JSON.stringify({ name, description: String(form.get("description") || "").trim() }) })
      .then((data) => { setCategories((current) => [...current, data.category]); setDialog(null); notify(name + " section created successfully"); });
  };

  const saveLevel = (payload) => institutionRequest("/institutions/structure/levels", { method: "POST", body: JSON.stringify(payload) })
    .then((data) => { setLevels((current) => [data.level, ...current]); setCategories((current) => current.map((item) => item.id === payload.categoryId ? { ...item, levels: Number(item.levels || 0) + 1 } : item)); notify(data.level.name + " created successfully"); });

  if (loading) return <div className="structure-loading">Loading your institution structure...</div>;
  if (error) return <div className="structure-error"><p>{error}</p><Button onClick={loadStructure}>Try again</Button></div>;
  if (selected) return <CategoryLevels category={selected} levels={levels} labels={labels} onBack={() => setSelectedCategory(null)} openClass={openClass} onCreateLevel={saveLevel} notify={notify} />;

  return <div className="content-stack structure-content">
    <section className="structure-intro"><div><Badge tone="purple">LEARNING STRUCTURE</Badge><h2>Build your institution’s learning structure</h2><p>Start with Sections, then open each Section to create and manage its Classes.</p></div><div className="structure-intro-stats"><span><strong>{categories.length}</strong>{labels.category}s</span><span><strong>{levelCount}</strong>{labels.level}s</span><span><strong>{learnerCount}</strong>{labels.learner.toLowerCase()}</span></div></section>
    <section className="structure-guide panel"><div className="structure-guide-icon">✦</div><div><strong>How the hierarchy works</strong><p><b>{labels.category}</b> is the broad grouping, such as Primary, Secondary, Department or Programme. Open a {labels.category.toLowerCase()} to create its {labels.level.toLowerCase()}s.</p></div><button onClick={() => setDialog("labels")}>Customise names <Icon name="arrow" /></button></section>
    <div className="nested-breadcrumb structure-root-breadcrumb"><strong>{labels.category}s</strong><span>›</span><span>{labels.level}s are managed inside each {labels.category.toLowerCase()}</span></div>
    <section className="structure-section"><div className="structure-toolbar"><div><h2>{labels.category} directory</h2><p>Create broad learning groupings before adding learner placements.</p></div><Button onClick={() => setDialog("category")} icon="plus">Create {labels.category.toLowerCase()}</Button></div><div className="structure-category-grid">{categories.length ? categories.map((category) => <article className="structure-category-card" key={category.id}><div className={"structure-category-icon " + (category.tone || "purple")}>▦</div><div><Badge tone="purple">ACTIVE {labels.category.toUpperCase()}</Badge><h3>{category.name}</h3><p>{category.description || `Learner groupings for ${category.name}.`}</p><div className="structure-category-footer"><span>{category.levels || 0} {labels.level.toLowerCase()}{category.levels === 1 ? "" : "s"}</span><button onClick={() => setSelectedCategory(category)}>Open {labels.level.toLowerCase()}s <Icon name="arrow" /></button></div></div></article>) : <div className="nested-empty-state"><h3>No {labels.category.toLowerCase()}s yet</h3><p>Create your first Section before adding Classes.</p><Button icon="plus" onClick={() => setDialog("category")}>Create {labels.category.toLowerCase()}</Button></div>}</div></section>
    {dialog === "labels" && <Dialog title="Name your structure" subtitle="Choose the words your institution uses across the nested learning pages." onClose={() => setDialog(null)}><form onSubmit={saveLabels} className="structure-label-form"><p className="structure-modal-help">Examples: Section, Grade, Cohort, Stream, Programme, House, Stage or Year.</p>{[["category", "Broad grouping", labels.category, "e.g. Section or Programme"], ["level", "Learner placement", labels.level, "e.g. Class or Cohort"], ["learner", "People count", labels.learner, "e.g. Learners or Students"], ["subject", "Content grouping", labels.subject, "e.g. Subjects or Learning areas"]].map(([name, title, value, placeholder]) => <label key={name}>{title}<input name={name} defaultValue={value} placeholder={placeholder} /></label>)}<div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setDialog(null)}>Cancel</button><Button type="submit">Save naming</Button></div></form></Dialog>}
    {dialog === "category" && <Dialog title={`Create a ${labels.category.toLowerCase()}`} subtitle="Add the first level of your institution’s learning hierarchy." onClose={() => setDialog(null)}><form onSubmit={saveCategory}><label>{labels.category} name<input name="name" required autoFocus placeholder="e.g. Primary, Junior School, STEM" /></label><label>Description<span className="field-hint">Explain which learners belong here.</span><textarea name="description" placeholder="e.g. Foundation and primary learning years." /></label><div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setDialog(null)}>Cancel</button><Button type="submit">Create {labels.category.toLowerCase()}</Button></div></form></Dialog>}
  </div>;
}
