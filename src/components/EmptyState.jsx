import React from "react";

export default function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="ink-empty">
      <div className="ink-empty-icon">{icon}</div>
      <div className="ink-empty-title">{title}</div>
      {desc && <div className="ink-empty-desc">{desc}</div>}
      {action}
    </div>
  );
}
