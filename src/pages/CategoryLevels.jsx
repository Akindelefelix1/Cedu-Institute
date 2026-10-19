import React, { useState } from "react";
import { Badge, Button, Icon } from "../components/ui";
import { Dialog } from "../components/modals";

export default function CategoryLevels({ category, levels, labels, onBack, openClass, onCreateLevel, notify }) {
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const sectionLevels = levels.filter((level) => level.categoryId === category.id || level.category === category.name);

  const submitLevel = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    setSaving(true);
    try {
      await onCreateLevel({ categoryId: category.id, name, code: String(form.get("code") || "").trim(), learnerCount: Number(form.get("learners") || 0), subjects: String(form.get("subjects") || "").split(",").map((item) => item.trim()).filter(Boolean) });
      setDialog(null);
    } catch (error) { notify(error.message); } finally { setSaving(false); }
  };

  return <div className="nested-structure-page">
    <button className="back-link" onClick={onBack}><Icon name="arrow-left" /> Back to {labels.category.toLowerCase()}s</button>
    <div className="nested-breadcrumb"><span>Classes & levels</span><b>›</b><strong>{category.name}</strong></div>
    <section className="nested-page-heading"><div><Badge tone="purple">{labels.category.toUpperCase()}</Badge><h1>{category.name}</h1><p>{category.description || `Manage ${labels.level.toLowerCase()}s inside this ${labels.category.toLowerCase()}.`}</p></div><Button icon="plus" onClick={() => setDialog("level")}>Add {labels.level.toLowerCase()}</Button></section>
    <div className="nested-page-summary"><strong>{sectionLevels.length} {labels.level.toLowerCase()}{sectionLevels.length === 1 ? "" : "s"}</strong><span>Organise learner placements and their learning areas.</span></div>
    <section className="nested-level-table"><div className="nested-level-table-head"><span>{labels.level}</span><span>{labels.subject}</span><span>{labels.learner}</span><span>Actions</span></div>{sectionLevels.length ? sectionLevels.map((level, index) => <article className="nested-level-row" key={level.id}><div className="nested-level-name"><span>{index + 1}</span><div><strong>{level.name}</strong><small>{level.code || `${labels.level} ${index + 1}`}</small></div></div><div className="nested-level-subjects">{level.subjects?.length ? level.subjects.join(" · ") : "No learning areas added"}</div><div className="nested-level-learners">{level.learners} {labels.learner.toLowerCase()}</div><div className="nested-level-actions"><button onClick={() => openClass({ ...level, structureLabels: labels })}>Open</button><button onClick={() => notify(`${level.name} editor opened`)}>Edit</button></div></article>) : <div className="nested-empty-state"><h3>No {labels.level.toLowerCase()}s yet</h3><p>Create the first learner placement inside {category.name}.</p><Button icon="plus" onClick={() => setDialog("level")}>Add {labels.level.toLowerCase()}</Button></div>}</section>
    {dialog === "level" && <Dialog title={`Add a ${labels.level.toLowerCase()}`} subtitle={`Create a named learner placement inside ${category.name}.`} onClose={() => setDialog(null)}><form onSubmit={submitLevel}><label>{labels.level} name<input name="name" required autoFocus placeholder="e.g. Primary 5 Gold, Year 2 or Cohort A" /></label><div className="form-grid"><label>Internal code<input name="code" placeholder="e.g. P5-GOLD" /></label><label>{labels.learner} count<input name="learners" type="number" min="0" defaultValue="0" /></label></div><label>{labels.subject}<span className="field-hint">Separate with commas.</span><input name="subjects" placeholder="Mathematics, English" /></label><div className="structure-modal-note"><span>✦</span><p>Use the naming system your institution already understands.</p></div><div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setDialog(null)} disabled={saving}>Cancel</button><Button type="submit" loading={saving} loadingText={`Creating ${labels.level.toLowerCase()}...`}>Create {labels.level.toLowerCase()}</Button></div></form></Dialog>}
  </div>;
}
