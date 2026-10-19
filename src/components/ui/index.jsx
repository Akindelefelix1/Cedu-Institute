import React from "react";

const icons = {
  dashboard: "▦", students: "♙", questions: "✦", structure: "▦", book: "▥", invite: "⌁", staff: "♙", resources: "▤", settings: "⚙",
  activity: "↗", game: "◉", search: "⌕", arrow: "→", "arrow-left": "←", plus: "+", bell: "♢"
};

export function Icon({ name, className = "" }) {
  return <span className={`icon ${className}`}>{icons[name] || icons.dashboard}</span>;
}

export function Badge({ children, tone = "purple" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Button({ children, variant = "primary", onClick, icon, type = "button", disabled = false, loading = false, loadingText = "Saving...", className = "" }) {
  const [pending, setPending] = React.useState(false);
  const busy = loading || pending;
  const handleClick = async (event) => {
    if (!onClick || busy) return;
    const result = onClick(event);
    if (result && typeof result.then === "function") {
      setPending(true);
      try { await result; } finally { setPending(false); }
    }
  };
  return <button type={type} onClick={handleClick} disabled={disabled || busy} aria-busy={busy || undefined} className={`button button-${variant} ${className}`}>
    {busy ? <><span className="button-spinner" aria-hidden="true" />{loadingText}</> : <>{icon && <Icon name={icon} />}{children}</>}
  </button>;
}

export function Avatar({ initials, color = "purple" }) {
  return <span className={`avatar avatar-${color}`}>{initials}</span>;
}
