import React, { useRef } from "react";
import { Folder, ChevronRight, MoreHorizontal } from "lucide-react";

export default function FolderRow({ folder, count, onOpen, onLongPress }) {
  const pressTimer = useRef(null);
  const moved = useRef(false);

  const start = () => {
    moved.current = false;
    pressTimer.current = setTimeout(() => {
      moved.current = true;
      onLongPress();
    }, 480);
  };
  const cancel = () => clearTimeout(pressTimer.current);
  const click = () => {
    cancel();
    if (!moved.current) onOpen();
  };

  return (
    <div
      className="ink-folder-row"
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={start}
      onTouchMove={cancel}
      onTouchEnd={cancel}
      onClick={click}
    >
      <Folder size={18} className="ink-folder-row-icon" />
      <div className="ink-folder-row-name">{folder.name}</div>
      <span className="ink-folder-row-count">{count}</span>
      <MoreHorizontal
        size={18}
        className="ink-row-more"
        onClick={(e) => {
          e.stopPropagation();
          onLongPress();
        }}
      />
      <ChevronRight size={16} className="ink-folder-row-chev" />
    </div>
  );
}
