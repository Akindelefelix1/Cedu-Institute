import React from "react";
import { Avatar, Badge } from "../components/ui";

export default function StaffPermissions({ notify }) {
  const staff = [["Ada Okafor", "AO", "Institution owner"], ["Musa Bello", "MB", "Teacher"], ["Chiamaka Nwosu", "CN", "Content editor"]];
  return <div className="content-stack staff-page">
    <section className="panel staff-list-panel">
      <div className="panel-header staff-list-heading">
        <div>
          <h2>People with access</h2>
          <p className="panel-subtitle">Review roles and manage workspace permissions.</p>
        </div>
        <span className="staff-member-count">{staff.length} members</span>
      </div>
      <div className="staff-table">
        {staff.map(([name, initials, role]) => <div className="staff-row" key={name}>
          <Avatar initials={initials} />
          <div className="staff-person"><strong>{name}</strong><span>{role}</span></div>
          <Badge tone={role === "Institution owner" ? "purple" : "green"}>{role}</Badge>
          <button className="staff-manage" onClick={() => notify(`${name} permissions opened`)}>Manage</button>
        </div>)}
      </div>
    </section>
  </div>;
}
