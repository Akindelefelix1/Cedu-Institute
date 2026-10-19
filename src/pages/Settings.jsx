import React, { useState } from "react";
import { Button } from "../components/ui";
import { getInstitutionAccount, institutionRequest, saveInstitutionSession, getInstitutionToken } from "../services/institutionApi";

export default function Settings({ notify }) {
  const [account, setAccount] = useState(getInstitutionAccount);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const publicAccess = Boolean(account?.publicAccess);

  const updateVisibility = async (nextPublicAccess) => {
    if (nextPublicAccess === publicAccess || savingVisibility) return;
    setSavingVisibility(true);
    try {
      const data = await institutionRequest("/auth/institution/visibility", {
        method: "PATCH",
        body: JSON.stringify({ publicAccess: nextPublicAccess }),
      });
      setAccount(data.account);
      saveInstitutionSession(getInstitutionToken(), data.account);
      window.dispatchEvent(new CustomEvent("institution-account-updated", { detail: data.account }));
      notify(data.message);
    } catch (error) {
      notify(error.message);
    } finally {
      setSavingVisibility(false);
    }
  };

  return <div className="content-stack settings-grid"><section className="panel settings-main"><div className="settings-cover"><div className="institution-logo"><img src="/Cedu Logo.png" alt="Cedu" /></div><button onClick={() => notify("Logo upload is not available yet.")}>Change logo</button></div><div className="settings-form"><div className="section-title"><h2>Institution profile</h2><span>Visible to students and teachers</span></div><div className="form-grid"><label>Institution name<input defaultValue={account?.institutionName || ""} /></label><label>Institution email<input defaultValue={account?.email || ""} /></label><label>Phone number<input defaultValue={account?.phone || ""} /></label><label>Location<input defaultValue={[account?.city, account?.state].filter(Boolean).join(", ")} /></label></div><label>About your institution<textarea placeholder="Tell learners what makes your institution special." /></label><Button onClick={() => notify("Profile editing will be available soon.")}>Save changes</Button></div></section><section className="panel settings-side"><div className="panel-header"><div><h2>Access & publishing</h2><p className="panel-copy">Choose how learners can find and request access to your institution.</p></div></div><div className="visibility-options"><button type="button" className={`visibility-option ${publicAccess ? "selected" : ""}`} onClick={() => updateVisibility(true)} disabled={savingVisibility}><strong>Public institution</strong><span>Appear in the public institution directory so learners can find and request access.</span>{publicAccess && <b>Current setting</b>}</button><button type="button" className={`visibility-option ${!publicAccess ? "selected" : ""}`} onClick={() => updateVisibility(false)} disabled={savingVisibility}><strong>Invite-only institution</strong><span>Stay hidden from the directory. Learners need your invitation code to request access.</span>{!publicAccess && <b>Current setting</b>}</button>{savingVisibility && <p className="panel-copy" role="status">Saving visibility...</p>}</div></section></div>;
}
