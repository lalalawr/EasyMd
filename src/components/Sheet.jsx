import React from "react";

export default function Sheet({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="ink-sheet-backdrop" onClick={onClose}>
      <div className="ink-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ink-sheet-grip" />
        {title && <div className="ink-sheet-title">{title}</div>}
        {children}
      </div>
    </div>
  );
}
