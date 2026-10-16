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

export function Button({ children, variant = "primary", onClick, icon, type = "button", disabled = false }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`button button-${variant}`}>
    {icon && <Icon name={icon} />}{children}
  </button>;
}

export function Avatar({ initials, color = "purple" }) {
  return <span className={`avatar avatar-${color}`}>{initials}</span>;
}
