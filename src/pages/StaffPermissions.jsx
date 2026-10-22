import React from "react";
import { Avatar, Badge } from "../components/ui";
import { getInstitutionAccount } from "../services/institutionApi";

export default function StaffPermissions() {
  const account = getInstitutionAccount();
  return <div className="content-stack staff-page"><section className="panel staff-list-panel">
    <div className="panel-header staff-list-heading"><div><h2>Institution account access</h2><p className="panel-subtitle">Access is currently limited to the institution owner account.</p></div><Badge tone="purple">Owner</Badge></div>
    <div className="staff-table"><div className="staff-row"><Avatar initials={(account?.ownerName || "IN").slice(0, 2).toUpperCase()} /><div className="staff-person"><strong>{account?.ownerName || "Institution owner"}</strong><span>{account?.email || "Owner account"}</span></div><Badge tone="purple">Institution owner</Badge></div></div>
    <div className="empty-panel"><strong>Staff accounts are not enabled for institutions yet.</strong><p>This workspace has no staff invitation or role permission API, so additional people cannot be granted access here.</p></div>
  </section></div>;
}
