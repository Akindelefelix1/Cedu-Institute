import React, { useState } from "react";
import { Button } from "../components/ui";
import { getInstitutionAccount, institutionRequest, saveInstitutionSession, getInstitutionToken } from "../services/institutionApi";

export default function Settings({ notify }) {
  const [account, setAccount] = useState(getInstitutionAccount);
  const [form, setForm] = useState(() => ({
    institutionName: getInstitutionAccount()?.institutionName || "",
    email: getInstitutionAccount()?.email || "",
    phone: getInstitutionAccount()?.phone || "",
    location: [getInstitutionAccount()?.city, getInstitutionAccount()?.state].filter(Boolean).join(", "),
    address: getInstitutionAccount()?.address || "",
  }));
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const publicAccess = Boolean(account?.publicAccess);

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const data = await institutionRequest("/auth/institution/profile", {
        method: "PATCH",
        body: JSON.stringify({
          institutionName: form.institutionName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          location: form.location.trim(),
        }),
      });
      setAccount(data.account);
      saveInstitutionSession(getInstitutionToken(), data.account);
      setForm((current) => ({ ...current, institutionName: data.account.institutionName, email: data.account.email, phone: data.account.phone || "", address: data.account.address || "", location: [data.account.city, data.account.state].filter(Boolean).join(", ") }));
      window.dispatchEvent(new CustomEvent("institution-account-updated", { detail: data.account }));
      notify(data.message || "Institution profile updated.");
    } catch (error) {
      notify(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

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

  return <div className="content-stack settings-grid"><section className="panel settings-main"><div className="settings-cover"><div className="institution-logo"><img src="/Cedu Logo.png" alt="Cedu" /></div><button onClick={() => notify("Logo upload is not available yet.")}>Change logo</button></div><form className="settings-form" onSubmit={saveProfile}><div className="section-title"><h2>Institution profile</h2><span>Visible to students and teachers</span></div><div className="form-grid"><label>Institution name<input value={form.institutionName} onChange={updateField("institutionName")} required /></label><label>Institution email<input type="email" value={form.email} onChange={updateField("email")} required /></label><label>Phone number<input value={form.phone} onChange={updateField("phone")} /></label><label>Location<input value={form.location} onChange={updateField("location")} /></label></div><label>Address<textarea value={form.address} onChange={updateField("address")} placeholder="Street address or campus location" /></label><Button type="submit" loading={savingProfile} loadingText="Saving...">Save changes</Button></form></section><section className="panel settings-side"><div className="panel-header"><div><h2>Access & publishing</h2><p className="panel-copy">Choose how learners can find and request access to your institution.</p></div></div><div className="visibility-options"><button type="button" className={`visibility-option ${publicAccess ? "selected" : ""}`} onClick={() => updateVisibility(true)} disabled={savingVisibility}><strong>Public institution</strong><span>Appear in the public institution directory so learners can find and request access.</span>{publicAccess && <b>Current setting</b>}</button><button type="button" className={`visibility-option ${!publicAccess ? "selected" : ""}`} onClick={() => updateVisibility(false)} disabled={savingVisibility}><strong>Invite-only institution</strong><span>Stay hidden from the directory. Learners need your invitation code to request access.</span>{!publicAccess && <b>Current setting</b>}</button>{savingVisibility && <p className="panel-copy" role="status">Saving visibility...</p>}</div></section></div>;
}
