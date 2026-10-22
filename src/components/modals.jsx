import React, { useState } from "react";

export function Dialog({ title, subtitle, onClose, children }) {
  return <div className="modal-scrim" onMouseDown={onClose}><div className="modal-card" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="modal-close" onClick={onClose} aria-label="Close dialog">×</button></div>{children}</div></div>;
}

export function ConfirmDialog({ title, message, confirmLabel = "Confirm", tone = "danger", onClose, onConfirm }) {
  const [pending, setPending] = useState(false);
  const confirm = async () => {
    if (pending) return;
    const result = onConfirm?.();
    if (result && typeof result.then === "function") {
      setPending(true);
      try { await result; } finally { setPending(false); }
    }
  };
  return <div className="modal-scrim" onMouseDown={pending ? undefined : onClose}><div className="confirm-card" role="alertdialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className={`confirm-icon confirm-${tone}`}>{tone === "danger" ? "!" : "✓"}</div><h2>{title}</h2><p>{message}</p><div className="modal-footer"><button className="button button-outline" onClick={onClose} disabled={pending}>Cancel</button><button className={`button ${tone === "danger" ? "button-danger" : "button-primary"}`} onClick={confirm} disabled={pending} aria-busy={pending || undefined}>{pending && <span className="button-spinner" aria-hidden="true" />}{pending ? "Saving..." : confirmLabel}</button></div></div></div>;
}
