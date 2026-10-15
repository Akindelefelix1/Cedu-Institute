import React, { useState } from "react";
import { Badge, Button } from "../components/ui";
import { Dialog } from "../components/modals";

const starterResources = [
  ["Shapes and colours", "Mathematics", 2, "blue"],
  ["Plants around us", "Basic Science", 3, "green"],
  ["Counting objects", "Mathematics", 4, "purple"],
  ["Healthy habits", "Basic Science", 5, "pink"],
  ["Community helpers", "Mathematics", 6, "yellow"],
  ["Weather cards", "Basic Science", 7, "blue"]
];

export default function Resources({ notify }) {
  const [resources, setResources] = useState(starterResources);
  const [dialog, setDialog] = useState(null);
  const [accessRequested, setAccessRequested] = useState(false);

  const addResource = (name, subject) => {
    setResources(current => [[name, subject, 0, "purple"], ...current]);
    setDialog(null);
    notify(`${name} uploaded to your resource bank`);
  };

  return <div className="content-stack"><section className="resource-access"><div className="resource-symbol">▤</div><div><Badge>CEDU RESOURCE BANK</Badge><h2>Bring more variety to your lessons</h2><p>Request access to the admin resource bank to reuse images and learning materials in your questions.</p></div><Button variant="soft" onClick={() => accessRequested ? notify("Your resource bank request is already pending") : setDialog("access")}>{accessRequested ? "Request pending" : "Request access"}</Button></section><div className="resource-toolbar"><div><h2>Your institution resources</h2><p>Reusable resources uploaded by your team.</p></div><Button onClick={() => setDialog("upload")} icon="plus">Upload resource</Button></div><div className="resource-grid">{resources.map(([name, subject, uses, color], index) => <div className={`resource-card resource-${index + 1}`} key={`${name}-${index}`}><div className={`resource-art resource-art-${color}`}>▤</div><div><strong>{name}</strong><span>{subject} · Used {uses} times</span></div><button onClick={() => setDialog({ type: "preview", resource: { name, subject, uses } })}>Preview</button></div>)}</div>
    {dialog === "access" && <Dialog title="Request resource bank access" subtitle="Tell Cedu how your institution plans to use shared learning materials." onClose={() => setDialog(null)}><form onSubmit={event => { event.preventDefault(); setAccessRequested(true); setDialog(null); notify("Resource bank access request submitted"); }}><label>Reason for access<textarea required rows="4" placeholder="For example: We want to add approved images to Primary 5 science questions." /></label><label>Content area<select defaultValue="All subjects"><option>All subjects</option><option>Mathematics</option><option>Basic Science</option><option>English</option></select></label><div className="modal-footer"><button type="button" className="button button-outline" onClick={() => setDialog(null)}>Cancel</button><Button type="submit">Submit request</Button></div></form></Dialog>}
    {dialog === "upload" && <UploadResourceDialog onClose={() => setDialog(null)} onSave={addResource} />}
    {dialog?.type === "preview" && <ResourcePreviewDialog resource={dialog.resource} onClose={() => setDialog(null)} onUse={() => { setDialog(null); window.history.pushState({}, "", "/question-bank"); window.dispatchEvent(new PopStateEvent("popstate")); notify("Question bank opened to use this resource"); }} />}
  </div>;
}

function UploadResourceDialog({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  return <Dialog title="Upload a resource" subtitle="Add reusable learning material for your institution." onClose={onClose}><form onSubmit={event => { event.preventDefault(); if (name.trim()) onSave(name.trim(), subject); }}><label>Resource name<input autoFocus required value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Fractions worksheet" /></label><label>Subject<select value={subject} onChange={event => setSubject(event.target.value)}><option>Mathematics</option><option>Basic Science</option><option>English</option></select></label><label>File<input type="file" accept="image/*,.pdf,.doc,.docx" /></label><div className="modal-footer"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><Button type="submit">Upload resource</Button></div></form></Dialog>;
}

function ResourcePreviewDialog({ resource, onClose, onUse }) {
  return <Dialog title={resource.name} subtitle={`${resource.subject} · Institution resource`} onClose={onClose}><div className="resource-preview-art">▤</div><div className="resource-preview-meta"><span>Used in questions</span><strong>{resource.uses} times</strong></div><p className="resource-preview-copy">Preview this approved learning material before adding it to a question or practice activity.</p><div className="modal-footer"><button className="button button-outline" onClick={onClose}>Close</button><Button onClick={onUse}>Use in question</Button></div></Dialog>;
}
