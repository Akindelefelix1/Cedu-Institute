import React from "react";
import { Avatar, Badge } from "../components/ui";
import { getInstitutionAccount } from "../services/institutionApi";

export default function StaffPermissions({ notify }) {
  const account = getInstitutionAccount();
  return <div className="content-stack staff-page"><section className="panel staff-list-panel"><div className="panel-header staff-list-heading"><div><h2>People with access</h2><p className="panel-subtitle">Review roles and manage workspace permissions.</p></div><span className="staff-member-count">1 owner</span></div><div className="staff-table"><div className="staff-row"><Avatar initials={(account?.ownerName || "IN").slice(0, 2).toUpperCase()} /><div className="staff-person"><strong>{account?.ownerName || "Institution owner"}</strong><span>{account?.email || "Owner account"}</span></div><Badge tone="purple">Institution owner</Badge><button className="staff-manage" onClick={() => notify("Owner permissions are managed by the institution account.")}>Manage</button></div></div><div className="empty-panel">Staff invitations and role management will appear here when staff accounts are connected to this institution.</div></section></div>;
}
