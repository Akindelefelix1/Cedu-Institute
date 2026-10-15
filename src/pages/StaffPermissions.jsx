import React from "react";
import { Avatar, Badge, Button } from "../components/ui";

export default function StaffPermissions({ notify }) {
  const staff = [["Ada Okafor", "AO", "Institution owner"], ["Musa Bello", "MB", "Teacher"], ["Chiamaka Nwosu", "CN", "Content editor"]];
  return <div className="content-stack"><div className="toolbar"><div><h2>Staff & permissions</h2><p>Control who can manage your institution workspace.</p></div><Button onClick={() => notify("Staff invitation form opened")} icon="plus">Invite staff</Button></div><section className="panel"><div className="staff-list">{staff.map(([name, initials, role]) => <div className="staff-row" key={name}><Avatar initials={initials} /><div><strong>{name}</strong><span>{role}</span></div><Badge tone={role === "Institution owner" ? "purple" : "green"}>{role}</Badge><button onClick={() => notify(`${name} permissions opened`)}>Manage</button></div>)}</div></section></div>;
}
