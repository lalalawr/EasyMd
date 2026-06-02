import React from "react";
import { ArrowUpDown, Plus, Folder, Clock, FileText, ListChecks, ChevronRight } from "lucide-react";
import DocRow from "../components/DocRow.jsx";
import FolderRow from "../components/FolderRow.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { relTime } from "../lib/utils.js";

export default function LibraryView({
  breadcrumb,
  subfolders,
  docs,
  recent,
  folderItemCount,
  navigateTo,
  tagName,
  onOpen,
  onFav,
  onDelete,
  onLong,
  onFolderLong,
  selectionMode,
  isSelected,
  onToggleSelect,
  enterSelect,
  exitSelect,
  openSort,
  openNew,
}) {
  const atRoot = breadcrumb.length === 0;
  const title = atRoot ? "文件库" : breadcrumb[breadcrumb.length - 1].name;

  return (
    <div className="ink-page">
      <header className="ink-header">
        <h1 className="ink-h1">{title}</h1>
        <div className="ink-header-actions">
          {selectionMode ? (
            <button className="ink-text-btn" onClick={exitSelect}>完成</button>
          ) : (
            <>
              <button className="ink-icon-btn" onClick={enterSelect} disabled={docs.length === 0}>
                <ListChecks size={20} />
              </button>
              <button className="ink-icon-btn" onClick={openSort}>
                <ArrowUpDown size={20} />
              </button>
              <button className="ink-icon-btn primary" onClick={openNew}>
                <Plus size={22} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* 面包屑 */}
      {!atRoot && (
        <div className="ink-breadcrumb">
          <button onClick={() => navigateTo(null)}>全部</button>
          {breadcrumb.map((f, i) => (
            <React.Fragment key={f.id}>
              <ChevronRight size={13} />
              {i === breadcrumb.length - 1 ? (
                <span className="cur">{f.name}</span>
              ) : (
                <button onClick={() => navigateTo(f.id)}>{f.name}</button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* 最近阅读（仅根目录、非选择模式） */}
      {atRoot && !selectionMode && recent.length > 0 && (
        <section className="ink-section">
          <div className="ink-section-title">
            <Clock size={14} /> 最近阅读
          </div>
          <div className="ink-recent-strip">
            {recent.map((d) => (
              <button key={d.id} className="ink-recent-card" onClick={() => onOpen(d.id)}>
                <FileText size={16} className="ink-recent-icon" />
                <div className="ink-recent-title">{d.title}</div>
                <div className="ink-recent-prog">
                  <div style={{ width: Math.round((d.readingProgress.scrollRatio || 0) * 100) + "%" }} />
                </div>
                <div className="ink-recent-meta">{relTime(d.lastOpenedAt)}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 子文件夹 */}
      {!selectionMode && subfolders.length > 0 && (
        <section className="ink-section">
          <div className="ink-section-title">
            <Folder size={14} /> 文件夹 <span className="ink-count">{subfolders.length}</span>
          </div>
          <div className="ink-list">
            {subfolders.map((f) => (
              <FolderRow
                key={f.id}
                folder={f}
                count={folderItemCount(f.id)}
                onOpen={() => navigateTo(f.id)}
                onLongPress={() => onFolderLong(f)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 文件 */}
      <section className="ink-section">
        <div className="ink-section-title">
          <FileText size={14} /> 文件 <span className="ink-count">{docs.length}</span>
        </div>
        {docs.length === 0 && subfolders.length === 0 ? (
          <EmptyState
            icon={<FileText size={34} />}
            title={atRoot ? "还没有文档" : "这个文件夹是空的"}
            desc="导入、新建，或把文件移动到这里"
            action={
              <button className="ink-btn" onClick={openNew}>
                <Plus size={16} /> 添加
              </button>
            }
          />
        ) : (
          <div className="ink-list">
            {docs.map((d) => (
              <DocRow
                key={d.id}
                doc={d}
                folderName={null}
                tagNames={d.tags.map(tagName)}
                onOpen={() => onOpen(d.id)}
                onFav={() => onFav(d.id)}
                onDelete={() => onDelete(d.id)}
                onLongPress={() => onLong(d)}
                selectionMode={selectionMode}
                selected={isSelected(d.id)}
                onToggleSelect={() => onToggleSelect(d.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
