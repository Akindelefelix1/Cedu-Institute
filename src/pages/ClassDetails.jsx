import React, { useState } from "react";
import { Badge, Button, Icon } from "../components/ui";
import { Dialog } from "../components/modals";

export default function ClassDetails({ classItem, onBack, notify, selectPage, setModal, onUpdateClass }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const className = classItem?.name || "Class workspace";
  const labels = classItem?.structureLabels || { level: "Class", learner: "Learners", subject: "Subjects" };
  const subjects = Array.isArray(classItem?.subjects) ? classItem.subjects : [];
  const learners = classItem?.learners || 0;
  const questions = classItem?.questions || 0;
  const addQuestion = subject => setModal?.({ type: "institutionQuestion", levelId: classItem?.id, section: classItem?.category, className, learningArea: subject });
  const saveSettings = async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      categoryId: classItem.categoryId,
      name: String(form.get("name") || "").trim(),
      code: String(form.get("code") || "").trim(),
      learnerCount: Number(form.get("learners") || 0),
      subjects: String(form.get("subjects") || "").split(",").map(value => value.trim()).filter(Boolean),
      sortOrder: Number(classItem.sortOrder || 0),
    };
    setSaving(true);
    try { await onUpdateClass(payload); setEditing(false); }
    catch (error) { notify(error.message || "Could not update this learning group."); }
    finally { setSaving(false); }
  };

  return <div className="class-workspace">
    <button className="back-link" onClick={onBack}><Icon name="arrow-left" /> Back to {labels.level.toLowerCase()}s & structure</button>
    <section className="class-header-card"><div><Badge tone="purple">{labels.level.toUpperCase()} WORKSPACE</Badge><h2>{className}</h2><p>Organise learning placement, monitor learners and manage the content assigned to this {labels.level.toLowerCase()}.</p><div className="class-card-meta"><span>Active {labels.level.toLowerCase()}</span><span>{subjects.length} {labels.subject.toLowerCase()}</span><span>Institution managed</span></div></div><div className="class-header-actions"><Button onClick={() => selectPage("students")} variant="outline">View learners</Button><Button onClick={() => setEditing(true)}>{labels.level} settings</Button></div><div className="class-stats"><span><strong>{learners}</strong> {labels.learner.toLowerCase()}</span><span><strong>{questions}</strong> questions</span><span><strong>{classItem?.progress || 0}%</strong> average progress</span><span><strong>{subjects.length}</strong> {labels.subject.toLowerCase()}</span></div></section>
    <div className="class-flow-grid"><section className="panel class-flow-panel"><div className="panel-heading"><div><h3>Learning placement</h3><p>Saved learning areas and questions connected to this {labels.level.toLowerCase()}.</p></div><button className="text-action" onClick={() => selectPage("questions")}>Question bank <Icon name="arrow" /></button></div>{subjects.length ? subjects.map(subject => <div className="class-subject" key={subject}><div className="class-subject-head"><div><span className="class-subject-icon">✦</span><div><strong>{subject}</strong><small>Learning area connected to this class</small></div></div><div className="class-subject-actions"><Button variant="outline" className="button-small" onClick={() => selectPage("questions")}>Browse content</Button><Button className="button-small" icon="plus" onClick={() => addQuestion(subject)}>Add question</Button></div></div><div className="class-level"><div><span>↗</span><div><strong>{classItem.category || labels.level} / {className}</strong><small>This saved learning area belongs to this class placement.</small></div></div><button onClick={() => setEditing(true)}>Manage learning areas <Icon name="arrow" /></button></div></div>) : <div className="class-empty"><span>✦</span><strong>No learning areas assigned</strong><p>Add the learning areas used by this class. They will stay connected to this placement after you reload.</p><Button onClick={() => setEditing(true)}>Add learning areas</Button></div>}</section><aside className="panel class-quick-panel"><div className="panel-heading"><div><h3>Class actions</h3><p>Common tasks for this learning group.</p></div></div><button className="class-route-card direct" onClick={() => selectPage("students")}><span>♙</span><div><strong>View learners</strong><small>Review progress and open a learner profile.</small></div><Icon name="arrow" /></button><button className="class-route-card structured" onClick={() => selectPage("invite")}><span>⌁</span><div><strong>Invite learners</strong><small>Share an institution code or invite a family.</small></div><Icon name="arrow" /></button><button className="class-route-card direct" onClick={() => selectPage("activity", { levelId: classItem.id, className })}><span>↗</span><div><strong>View class activity</strong><small>See recent learning and access events.</small></div><Icon name="arrow" /></button></aside></div>
    {editing && <Dialog title={`Edit ${labels.level.toLowerCase()} settings`} subtitle="Update this learning group's details and learning areas." onClose={() => !saving && setEditing(false)}><form onSubmit={saveSettings}><label>{labels.level} name<input name="name" required autoFocus defaultValue={classItem.name || ""} /></label><div className="form-grid"><label>Internal code<input name="code" defaultValue={classItem.code || ""} /></label><label>{labels.learner} count<input name="learners" type="number" min="0" defaultValue={classItem.learners || 0} /></label></div><label>{labels.subject}<span className="field-hint">Separate learning areas with commas.</span><input name="subjects" defaultValue={subjects.join(", ")} /></label><div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</button><Button type="submit" loading={saving} loadingText="Saving...">Save changes</Button></div></form></Dialog>}
  </div>;
}
