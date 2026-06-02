import React from "react";
import { Undo2 } from "lucide-react";

export default function Toast({ toast, onUndo }) {
  if (!toast) return null;
  return (
    <div className="ink-toast">
      <span>{toast.msg}</span>
      {toast.undo && (
        <button className="ink-toast-undo" onClick={onUndo}>
          <Undo2 size={14} /> 撤销
        </button>
      )}
    </div>
  );
}
