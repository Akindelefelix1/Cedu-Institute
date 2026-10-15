import React, { useState } from "react";
import { Badge, Button, Icon } from "../components/ui";
import { Dialog } from "../components/modals";
import { institutionClasses } from "../data/institution";

export default function ClassesLevels({ notify, openClass }) {
  const [classes, setClasses] = useState(institutionClasses);
  const [creating, setCreating] = useState(false);

  const createClass = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const learners = String(form.get("learners") || "0").trim();
    const subjects = String(form.get("subjects") || "").trim();
    if (!name || !subjects) return;
    setClasses(current => [{ name, learners: Number(learners || 0), subjects: subjects.split("·").map(item => item.trim()).filter(Boolean), tone: "purple", questions: 0, progress: 0 }, ...current]);
    setCreating(false);
    notify(`${name} created successfully`);
  };

  return <div className="content-stack structure-content"><div className="structure-toolbar"><p>Organise learners and their learning placement.</p><Button onClick={() => setCreating(true)} icon="plus">Create class</Button></div><div className="structure-grid">{classes.map(classItem => <article className="structure-card" key={`${classItem.name}-${classItem.learners}`}><div className={`structure-card-icon ${classItem.tone}`}><span>▦</span></div><div className="structure-card-main"><div className="structure-card-heading"><div><Badge tone="purple">ACTIVE CLASS</Badge><h3>{classItem.name}</h3></div><span className="structure-learners"><strong>{classItem.learners}</strong> learners</span></div><p className="structure-subjects">{classItem.subjects.join(" · ")}</p><div className="structure-card-footer"><span>Learning placement</span><button onClick={() => openClass(classItem)}>Manage class <Icon name="arrow" /></button></div></div></article>)}</div>{creating && <Dialog title="Create a class" subtitle="Set up a learning group for your institution." onClose={() => setCreating(false)}><form onSubmit={createClass}><label>Class name<input name="name" autoFocus required placeholder="e.g. Primary 3 Emerald" /></label><div className="form-grid"><label>Level<select name="level" defaultValue="Primary"><option>Early years</option><option>Primary</option><option>Secondary</option></select></label><label>Learners<input name="learners" type="number" min="0" defaultValue="0" /></label></div><label>Subjects<input name="subjects" required placeholder="e.g. Mathematics · English" /></label><div className="structure-modal-note"><span>✦</span><p>You can add levels, subjects, and learners to this class later.</p></div><div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setCreating(false)}>Cancel</button><Button type="submit">Create class</Button></div></form></Dialog>}</div>;
}
