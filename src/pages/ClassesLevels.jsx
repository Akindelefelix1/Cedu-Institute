import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Icon } from "../components/ui";
import { Dialog } from "../components/modals";
import { institutionClasses } from "../data/institution";
import { institutionRequest } from "../services/institutionApi";

const initialCategories = [
  { id: "primary", name: "Primary", description: "Foundation learning years for younger learners.", levels: 3, tone: "purple" },
  { id: "secondary", name: "Secondary", description: "Subject-focused learning for older learners.", levels: 0, tone: "blue" },
];

const initialLabels = { category: "Section", level: "Class", learner: "Learners", subject: "Learning areas" };

export default function ClassesLevels({ notify, openClass }) {
  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState(initialCategories);
  const [levels, setLevels] = useState(institutionClasses.map((item, index) => ({
    ...item,
    id: item.name + "-" + index,
    category: item.name.startsWith("Primary") ? "Primary" : "Secondary",
    code: "LVL-" + String(index + 1).padStart(2, "0"),
    status: "Active",
  })));
  const [labels, setLabels] = useState(initialLabels);
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const configuredLevels = useMemo(() => levels.length, [levels]);

  useEffect(() => {
    institutionRequest("/institutions/structure")
      .then((data) => { setLabels(data.labels || initialLabels); setCategories(data.categories || []); setLevels(data.levels || []); })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const saveLabels = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextLabels = {
      category: String(form.get("category") || initialLabels.category).trim() || initialLabels.category,
      level: String(form.get("level") || initialLabels.level).trim() || initialLabels.level,
      learner: String(form.get("learner") || initialLabels.learner).trim() || initialLabels.learner,
      subject: String(form.get("subject") || initialLabels.subject).trim() || initialLabels.subject,
    };
    institutionRequest("/institutions/structure/settings", { method: "PUT", body: JSON.stringify({ categoryLabel: nextLabels.category, levelLabel: nextLabels.level, learnerLabel: nextLabels.learner, subjectLabel: nextLabels.subject }) })
      .then(() => { setLabels(nextLabels); setDialog(null); notify("Structure naming updated"); })
      .catch((requestError) => notify(requestError.message));
  };

  const saveCategory = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    institutionRequest("/institutions/structure/categories", { method: "POST", body: JSON.stringify({ name, description: String(form.get("description") || "").trim() }) })
      .then((data) => { setCategories((current) => [...current, data.category]); setDialog(null); notify(name + " section created successfully"); })
      .catch((requestError) => notify(requestError.message));
  };

  const saveLevel = (event) => {
    event.preventDefault();
    if (!categories.length) { notify(`Create a ${labels.category.toLowerCase()} before creating a ${labels.level.toLowerCase()}.`); setActiveTab("categories"); setDialog(null); return; }
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    const category = String(form.get("category") || categories[0]?.name || "General");
    const categoryRecord = categories.find((item) => item.name === category);
    institutionRequest("/institutions/structure/levels", { method: "POST", body: JSON.stringify({ categoryId: categoryRecord?.id, name, code: String(form.get("code") || "").trim(), learnerCount: Number(form.get("learners") || 0), subjects: String(form.get("subjects") || "").split(",").map((item) => item.trim()).filter(Boolean) }) })
      .then((data) => { setLevels((current) => [data.level, ...current]); setCategories((current) => current.map((item) => item.name === category ? { ...item, levels: item.levels + 1 } : item)); setDialog(null); notify(name + " created successfully"); })
      .catch((requestError) => notify(requestError.message));
  };

  if (loading) return <div className="structure-loading">Loading your institution structure...</div>;
  if (error) return <div className="structure-error"><p>{error}</p><Button onClick={() => window.location.reload()}>Try again</Button></div>;
  return <div className="content-stack structure-content">
    <section className="structure-intro">
      <div><Badge tone="purple">LEARNING STRUCTURE</Badge><h2>Shape your institution’s learning structure</h2><p>Use the same clear hierarchy as CeduGames, while choosing names that match how your institution organises learners.</p></div>
      <div className="structure-intro-stats"><span><strong>{categories.length}</strong>{labels.category}s</span><span><strong>{configuredLevels}</strong>{labels.level}s</span><span><strong>{levels.reduce((sum, item) => sum + item.learners, 0)}</strong>{labels.learner.toLowerCase()}</span></div>
    </section>

    <section className="structure-guide panel"><div className="structure-guide-icon">✦</div><div><strong>How the hierarchy works</strong><p><b>{labels.category}</b> is the broad grouping, such as Primary, Secondary, Department or Programme. <b>{labels.level}</b> is the learner placement inside it, such as Primary 5 Gold, Year 2 or Cohort A.</p></div><button onClick={() => setDialog("labels")}>Customise names <Icon name="arrow" /></button></section>

    <div className="structure-tabs" role="tablist" aria-label="Learning structure sections"><button className={activeTab === "levels" ? "active" : ""} onClick={() => setActiveTab("levels")}><span>{levels.length}</span>{labels.level}s</button><button className={activeTab === "categories" ? "active" : ""} onClick={() => setActiveTab("categories")}><span>{categories.length}</span>{labels.category}s</button><button className={activeTab === "guide" ? "active" : ""} onClick={() => setActiveTab("guide")}><span>i</span>Setup guide</button></div>

    {activeTab === "levels" && <section className="structure-section"><div className="structure-toolbar"><div><h2>{labels.level} directory</h2><p>Place learners into named groups and connect their learning areas.</p></div><Button onClick={() => setDialog("level")} icon="plus">Create {labels.level.toLowerCase()}</Button></div><div className="structure-level-grid">{levels.map((level) => <article className="structure-level-card" key={level.id}><div className={"structure-level-icon " + (level.tone || "purple")}><span>▦</span></div><div className="structure-level-main"><div className="structure-level-top"><div><Badge tone="purple">{level.status.toUpperCase()} {labels.level.toUpperCase()}</Badge><h3>{level.name}</h3><p>{level.category} · {level.code}</p></div><span className="structure-learners"><strong>{level.learners}</strong>{labels.learner.toLowerCase()}</span></div><div className="structure-level-meta"><span>{level.subjects?.length || 0} {labels.subject.toLowerCase()}</span><span>{level.questions || 0} assigned questions</span></div><div className="structure-card-footer"><span>{labels.category}: {level.category}</span><button onClick={() => openClass(level)}>Manage {labels.level.toLowerCase()} <Icon name="arrow" /></button></div></div></article>)}</div></section>}

    {activeTab === "categories" && <section className="structure-section"><div className="structure-toolbar"><div><h2>{labels.category} directory</h2><p>Create broad learning groupings that keep your {labels.level.toLowerCase()}s organised.</p></div><Button onClick={() => setDialog("category")} icon="plus">Create {labels.category.toLowerCase()}</Button></div><div className="structure-category-grid">{categories.map((category) => <article className="structure-category-card" key={category.id}><div className={"structure-category-icon " + category.tone}>▦</div><div><Badge tone="purple">ACTIVE {labels.category.toUpperCase()}</Badge><h3>{category.name}</h3><p>{category.description}</p><div className="structure-category-footer"><span>{category.levels} {labels.level.toLowerCase()}{category.levels === 1 ? "" : "s"}</span><button onClick={() => { setActiveTab("levels"); notify("Showing " + category.name + " levels"); }}>View {labels.level.toLowerCase()}s <Icon name="arrow" /></button></div></div></article>)}</div></section>}

    {activeTab === "guide" && <section className="structure-section structure-guide-grid"><GuideCard number="1" title={"Name your " + labels.category.toLowerCase() + "s"} text="Choose the broad grouping your institution already understands: school section, programme, department, house or stage." /><GuideCard number="2" title={"Create your " + labels.level.toLowerCase() + "s"} text="Use names learners and staff recognise, then add a code, learner count and learning areas." /><GuideCard number="3" title="Connect learning content" text="Each level can be managed separately so questions, subjects, learners and progress stay easy to find." /></section>}

    {dialog === "labels" && <Dialog title="Name your structure" subtitle="Choose the words your institution uses. These labels guide every future category and level." onClose={() => setDialog(null)}><form onSubmit={saveLabels} className="structure-label-form"><p className="structure-modal-help">Examples: Section, Grade, Cohort, Stream, Programme, House, Stage or Year.</p>{[["category", "Broad grouping", labels.category, "e.g. Section or Programme"], ["level", "Learner placement", labels.level, "e.g. Class or Cohort"], ["learner", "People count", labels.learner, "e.g. Learners or Students"], ["subject", "Content grouping", labels.subject, "e.g. Subjects or Learning areas"]].map(([name, title, value, placeholder]) => <label key={name}>{title}<input name={name} defaultValue={value} placeholder={placeholder} /></label>)}<div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setDialog(null)}>Cancel</button><Button type="submit">Save naming</Button></div></form></Dialog>}

    {dialog === "category" && <Dialog title={"Create a " + labels.category.toLowerCase()} subtitle={"Add a broad grouping for your institution's learning structure."} onClose={() => setDialog(null)}><form onSubmit={saveCategory}><label>{labels.category} name<input name="name" required autoFocus placeholder="e.g. Primary, Junior School, STEM" /></label><label>Description<span className="field-hint">Explain which learners belong here.</span><textarea name="description" placeholder="e.g. Foundation and primary learning years." /></label><div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setDialog(null)}>Cancel</button><Button type="submit">Create {labels.category.toLowerCase()}</Button></div></form></Dialog>}

    {dialog === "level" && <Dialog title={"Create a " + labels.level.toLowerCase()} subtitle={"Add a named learner placement inside a " + labels.category.toLowerCase() + "."} onClose={() => setDialog(null)}><form onSubmit={saveLevel}><label>{labels.level} name<input name="name" required autoFocus placeholder="e.g. Primary 5 Gold, Year 2 or Cohort A" /></label><div className="form-grid"><label>{labels.category}<select name="category" defaultValue={categories[0]?.name}>{categories.map((category) => <option key={category.id}>{category.name}</option>)}</select></label><label>Internal code<input name="code" placeholder="e.g. P5-GOLD" /></label></div><div className="form-grid"><label>{labels.learner} count<input name="learners" type="number" min="0" defaultValue="0" /></label><label>{labels.subject}<span className="field-hint">Separate with commas.</span><input name="subjects" placeholder="Mathematics, English" /></label></div><div className="structure-modal-note"><span>✦</span><p>Names remain flexible. You can use any local naming system without changing how learner placement works.</p></div><div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setDialog(null)}>Cancel</button><Button type="submit">Create {labels.level.toLowerCase()}</Button></div></form></Dialog>}
  </div>;
}

function GuideCard({ number, title, text }) {
  return <article className="structure-guide-card"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>;
}
