import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Library, Search, Star, Settings as SettingsIcon, Plus, Check, ArrowUpDown,
  Folder, FolderPlus, FolderInput, Pencil, Trash2, Tag as TagIcon, Upload, FileText, Hash, X,
} from "lucide-react";

import { useStore } from "./hooks/useStore.js";
import { useSettings } from "./hooks/useSettings.js";
import { uid, now, deriveTitle, countWords, extractHeadings } from "./lib/utils.js";
import { makeDoc } from "./data/seed.js";
import { exportAll, replaceAll, clearAll } from "./db/idb.js";

import Sheet from "./components/Sheet.jsx";
import Toast from "./components/Toast.jsx";
import LibraryView from "./views/LibraryView.jsx";
import SearchView from "./views/SearchView.jsx";
import FavoritesView from "./views/FavoritesView.jsx";
import SettingsView from "./views/SettingsView.jsx";
import Reader from "./views/Reader.jsx";
import Editor from "./views/Editor.jsx";

function TagPill({ name, onClick, active }) {
  return (
    <button className={"ink-tagpill" + (active ? " on" : "")} onClick={onClick}>
      <Hash size={11} />
      {name}
    </button>
  );
}

function NameForm({ initial, onSave }) {
  const [v, setV] = useState(initial);
  return (
    <div className="ink-folder-create">
      <input autoFocus className="ink-input" value={v} onChange={(e) => setV(e.target.value)} />
      <button className="ink-btn" onClick={() => onSave(v)}>
        <Check size={16} /> 保存
      </button>
    </div>
  );
}

function downloadJSON(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const {
    ready, docs, folders, tags,
    upsertDoc, upsertDocs, upsertManyDocs, removeDoc, removeManyDocs,
    upsertFolder, removeFolder, reload,
  } = useStore();
  const { settings, setSettings } = useSettings();

  const [tab, setTab] = useState("library");
  const [readerId, setReaderId] = useState(null);
  const [editorId, setEditorId] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [sortKey, setSortKey] = useState("updatedAt");
  const [sortOpen, setSortOpen] = useState(false);

  const [actionDoc, setActionDoc] = useState(null);
  const [renameDoc, setRenameDoc] = useState(null);
  const [tagDoc, setTagDoc] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [moveIds, setMoveIds] = useState(null); // 数组：单个或批量复用

  const [folderAction, setFolderAction] = useState(null);
  const [folderRename, setFolderRename] = useState(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmBatchDel, setConfirmBatchDel] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [folderInput, setFolderInput] = useState("");
  const [toast, setToast] = useState(null);
  const lastDeleted = useRef(null);

  // 系统深色检测
  const [sysDark, setSysDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSysDark(mq.matches);
    const h = (e) => setSysDark(e.matches);
    mq.addEventListener?.("change", h);
    return () => mq.removeEventListener?.("change", h);
  }, []);
  const isDark = settings.theme === "dark" || (settings.theme === "system" && sysDark);
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#1A1816" : "#FAF9F6");
  }, [isDark]);

  const showToast = useCallback((msg, undo = false) => {
    setToast({ msg, undo });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), undo ? 4200 : 1800);
  }, []);

  const folderName = (id) => folders.find((f) => f.id === id)?.name;
  const tagName = (id) => tags.find((t) => t.id === id)?.name || id;
  const getDoc = (id) => docs.find((d) => d.id === id);

  /* ---- 文档写操作 ---- */
  const patchDoc = (id, patch) => {
    const d = getDoc(id);
    if (d) upsertDoc({ ...d, ...patch });
  };
  const toggleFav = (id) => {
    const d = getDoc(id);
    if (!d) return;
    upsertDoc({ ...d, favorite: !d.favorite });
    showToast(d.favorite ? "已取消收藏" : "已收藏");
  };
  const doDelete = (id) => {
    const d = getDoc(id);
    lastDeleted.current = d;
    removeDoc(id);
    if (readerId === id) setReaderId(null);
    if (editorId === id) setEditorId(null);
    showToast("已删除「" + (d?.title || "") + "」", true);
  };
  const undoDelete = () => {
    if (lastDeleted.current) {
      upsertDoc(lastDeleted.current);
      lastDeleted.current = null;
      setToast(null);
    }
  };
  const rename = (id, name) => {
    const d = getDoc(id);
    if (!d) return;
    const fn = name.endsWith(".md") ? name : name + ".md";
    upsertDoc({ ...d, filename: fn, title: deriveTitle(d.content, fn), updatedAt: now() });
    setRenameDoc(null);
    showToast("已重命名");
  };
  const setDocTags = (id, t) => patchDoc(id, { tags: t });
  const openReader = (id) => {
    patchDoc(id, { lastOpenedAt: now() });
    setReaderId(id);
  };
  const openEditor = (id) => {
    setReaderId(null);
    setEditorId(id);
  };
  const saveContent = (id, content) => {
    const d = getDoc(id);
    if (!d) return;
    upsertDoc({
      ...d,
      content,
      title: deriveTitle(content, d.filename),
      wordCount: countWords(content),
      characterCount: content.length,
      extractedHeadings: extractHeadings(content),
      updatedAt: now(),
    });
  };
  const saveProgress = (id, ratio) => {
    const d = getDoc(id);
    if (!d) return;
    upsertDoc({ ...d, readingProgress: { ...d.readingProgress, scrollRatio: ratio, updatedAt: now() } });
  };

  /* ---- 移动（单个 / 批量复用 moveIds） ---- */
  const applyMove = (ids, folderId) => {
    const updated = ids.map((id) => getDoc(id)).filter(Boolean).map((d) => ({ ...d, folderId, updatedAt: now() }));
    upsertManyDocs(updated);
    setMoveIds(null);
    if (selectionMode) exitSelect();
    showToast(folderId ? "已移动到「" + folderName(folderId) + "」" : "已移出文件夹");
  };

  /* ---- 文件夹 ---- */
  const createFolder = () => {
    const n = folderInput.trim();
    if (!n) return;
    upsertFolder({ id: uid(), name: n, parentId: activeFolder, createdAt: now(), sort: folders.length });
    setFolderInput("");
    showToast("已创建文件夹");
  };
  const renameFolder = (f, name) => {
    const n = name.trim();
    if (n) upsertFolder({ ...f, name: n });
    setFolderRename(null);
    showToast("已重命名文件夹");
  };
  const deleteFolder = (f) => {
    const parent = f.parentId;
    const movedDocs = docs.filter((d) => d.folderId === f.id).map((d) => ({ ...d, folderId: parent, updatedAt: now() }));
    if (movedDocs.length) upsertManyDocs(movedDocs);
    folders.filter((c) => c.parentId === f.id).forEach((c) => upsertFolder({ ...c, parentId: parent }));
    removeFolder(f.id);
    if (activeFolder === f.id) setActiveFolder(parent);
    setFolderAction(null);
    showToast("已删除文件夹（内容移至上级）");
  };

  /* ---- 新建 / 导入 ---- */
  const createDoc = () => {
    const id = uid();
    const content = "# 新建文档\n\n开始书写…";
    upsertDoc(makeDoc({ id, filename: "untitled.md", content, folderId: activeFolder, createdAt: now(), updatedAt: now() }));
    setNewOpen(false);
    openEditor(id);
    showToast("已新建");
  };
  const onImport = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const TEXT_EXT = /\.(md|markdown|mdown|mkd|txt|text|mdx)$/i;
    const BINARY_EXT = /\.(png|jpe?g|gif|webp|heic|pdf|zip|mp[34]|mov|docx?|xlsx?|pptx?|key|numbers|pages)$/i;
    const picked = files.filter((f) => TEXT_EXT.test(f.name) || !BINARY_EXT.test(f.name));
    const skipped = files.length - picked.length;
    if (picked.length === 0) {
      setNewOpen(false);
      showToast("未发现可导入的文本/Markdown 文件");
      e.target.value = "";
      return;
    }
    const added = [];
    for (const f of picked) {
      try {
        const text = await f.text();
        added.push(makeDoc({ id: uid(), filename: f.name, content: text, folderId: activeFolder, createdAt: now(), updatedAt: now() }));
      } catch {
        /* 跳过读取失败的文件 */
      }
    }
    if (added.length) upsertDocs(added);
    setNewOpen(false);
    showToast("已导入 " + added.length + " 个文件" + (skipped > 0 ? "，跳过 " + skipped + " 个" : ""));
    e.target.value = "";
  };

  /* ---- 备份 ---- */
  const onExportBackup = async () => {
    const data = await exportAll();
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadJSON("inkwell-backup-" + stamp + ".json", { app: "inkwell", version: 1, exportedAt: now(), settings, ...data });
    showToast("已导出备份");
  };
  const onImportBackup = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.docs)) throw new Error("格式不正确");
      await replaceAll({ docs: data.docs, folders: data.folders, tags: data.tags, settings: data.settings });
      await reload();
      if (data.settings) setSettings((s) => ({ ...s, ...data.settings }));
      setReaderId(null);
      setEditorId(null);
      setActiveFolder(null);
      showToast("已从备份恢复");
    } catch {
      showToast("导入失败：文件格式不正确");
    }
  };
  const onClearData = () => setConfirmClear(true);
  const doClear = async () => {
    await clearAll();
    await reload();
    setReaderId(null);
    setEditorId(null);
    setActiveFolder(null);
    setConfirmClear(false);
    showToast("已清空所有数据");
  };

  /* ---- 选择模式 ---- */
  const enterSelect = () => { setSelectionMode(true); setSelectedIds([]); };
  const exitSelect = () => { setSelectionMode(false); setSelectedIds([]); };
  const toggleSelect = (id) => setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const isSelected = (id) => selectedIds.includes(id);
  const batchFav = () => {
    const updated = selectedIds.map((id) => getDoc(id)).filter(Boolean).map((d) => ({ ...d, favorite: true }));
    upsertManyDocs(updated);
    showToast("已收藏 " + updated.length + " 个");
    exitSelect();
  };
  const batchDelete = () => {
    removeManyDocs(selectedIds);
    showToast("已删除 " + selectedIds.length + " 个");
    setConfirmBatchDel(false);
    exitSelect();
  };

  /* ---- 视图数据 ---- */
  const sorted = useMemo(() => {
    const arr = [...docs];
    arr.sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title, "zh");
      if (sortKey === "createdAt") return b.createdAt - a.createdAt;
      if (sortKey === "lastOpenedAt") return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
      return b.updatedAt - a.updatedAt;
    });
    return arr;
  }, [docs, sortKey]);

  const childFolders = (pid) =>
    folders.filter((f) => (f.parentId ?? null) === (pid ?? null)).sort((a, b) => (a.sort - b.sort) || (a.createdAt - b.createdAt));
  const subfolders = childFolders(activeFolder);
  const nodeDocs = sorted.filter((d) => (d.folderId ?? null) === (activeFolder ?? null));
  const folderItemCount = (fid) =>
    docs.filter((d) => d.folderId === fid).length + folders.filter((f) => f.parentId === fid).length;
  const breadcrumb = useMemo(() => {
    const path = [];
    let id = activeFolder;
    while (id) {
      const f = folders.find((x) => x.id === id);
      if (!f) break;
      path.unshift(f);
      id = f.parentId;
    }
    return path;
  }, [activeFolder, folders]);
  const recent = useMemo(
    () => docs.filter((d) => d.lastOpenedAt).sort((a, b) => b.lastOpenedAt - a.lastOpenedAt).slice(0, 6),
    [docs]
  );
  // 移动选择器：扁平化的文件夹树（带缩进层级）
  const folderTree = useMemo(() => {
    const acc = [];
    const walk = (pid, depth) => {
      folders.filter((f) => (f.parentId ?? null) === (pid ?? null)).sort((a, b) => (a.sort - b.sort) || (a.createdAt - b.createdAt))
        .forEach((f) => { acc.push({ f, depth }); walk(f.id, depth + 1); });
    };
    walk(null, 0);
    return acc;
  }, [folders]);

  const reader = getDoc(readerId) || null;
  const editor = getDoc(editorId) || null;
  const overlay = reader || editor;
  const tagDocCurrent = tagDoc ? getDoc(tagDoc.id) : null;

  return (
    <div className="ink-stage">
      <div className="ink-root" data-theme={isDark ? "dark" : "light"} data-font={settings.readerFontFamily}>
        <div className="ink-statusbar">
          <span>9:41</span>
          <span className="ink-sb-dots">●●● ◗ ▮</span>
        </div>

        <div className="ink-body">
          {!ready ? (
            <div className="ink-splash">EasyMd</div>
          ) : (
            <>
              {!overlay && tab === "library" && (
                <LibraryView
                  breadcrumb={breadcrumb}
                  subfolders={subfolders}
                  docs={nodeDocs}
                  recent={recent}
                  folderItemCount={folderItemCount}
                  navigateTo={setActiveFolder}
                  tagName={tagName}
                  onOpen={openReader}
                  onFav={toggleFav}
                  onDelete={(id) => setConfirmDel(getDoc(id))}
                  onLong={setActionDoc}
                  onFolderLong={setFolderAction}
                  selectionMode={selectionMode}
                  isSelected={isSelected}
                  onToggleSelect={toggleSelect}
                  enterSelect={enterSelect}
                  exitSelect={exitSelect}
                  openSort={() => setSortOpen(true)}
                  openNew={() => setNewOpen(true)}
                />
              )}
              {!overlay && tab === "search" && (
                <SearchView
                  docs={docs}
                  folderName={folderName}
                  tagName={tagName}
                  onOpen={openReader}
                  onFav={toggleFav}
                  onDelete={(id) => setConfirmDel(getDoc(id))}
                  onLong={setActionDoc}
                />
              )}
              {!overlay && tab === "favorites" && (
                <FavoritesView
                  docs={docs}
                  tags={tags}
                  folderName={folderName}
                  tagName={tagName}
                  onOpen={openReader}
                  onFav={toggleFav}
                  onDelete={(id) => setConfirmDel(getDoc(id))}
                  onLong={setActionDoc}
                />
              )}
              {!overlay && tab === "settings" && (
                <SettingsView
                  settings={settings}
                  setSettings={setSettings}
                  docs={docs}
                  folders={folders}
                  tags={tags}
                  onExportBackup={onExportBackup}
                  onImportBackup={onImportBackup}
                  onClearData={onClearData}
                />
              )}
              {reader && (
                <Reader
                  key={reader.id}
                  doc={reader}
                  settings={settings}
                  setSettings={setSettings}
                  onBack={() => setReaderId(null)}
                  onProgress={(r) => saveProgress(reader.id, r)}
                  onFav={() => toggleFav(reader.id)}
                  onEdit={() => openEditor(reader.id)}
                />
              )}
              {editor && (
                <Editor
                  key={editor.id}
                  doc={editor}
                  onSave={(content) => saveContent(editor.id, content)}
                  onBack={() => setEditorId(null)}
                />
              )}
            </>
          )}
        </div>

        {/* 批量操作条 */}
        {selectionMode && selectedIds.length > 0 && !overlay && (
          <div className="ink-batchbar">
            <span className="ink-batch-count">{selectedIds.length} 项</span>
            <button onClick={batchFav}><Star size={18} /> 收藏</button>
            <button onClick={() => setMoveIds(selectedIds)}><FolderInput size={18} /> 移动</button>
            <button className="danger" onClick={() => setConfirmBatchDel(true)}><Trash2 size={18} /> 删除</button>
          </div>
        )}

        {!overlay && ready && !(selectionMode && selectedIds.length > 0) && (
          <nav className="ink-tabbar">
            {[
              ["library", Library, "文件库"],
              ["search", Search, "搜索"],
              ["favorites", Star, "收藏"],
              ["settings", SettingsIcon, "设置"],
            ].map(([k, Icon, label]) => (
              <button key={k} className={"ink-tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
                <Icon size={22} strokeWidth={tab === k ? 2.4 : 1.9} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* 文档操作面板 */}
        {actionDoc && (
          <Sheet open onClose={() => setActionDoc(null)} title={actionDoc.title}>
            <div className="ink-menu">
              <button className="ink-menu-item" onClick={() => { openEditor(actionDoc.id); setActionDoc(null); }}>
                <Pencil size={18} /> 编辑
              </button>
              <button className="ink-menu-item" onClick={() => { setRenameDoc(actionDoc); setActionDoc(null); }}>
                <FileText size={18} /> 重命名
              </button>
              <button className="ink-menu-item" onClick={() => { setMoveIds([actionDoc.id]); setActionDoc(null); }}>
                <FolderInput size={18} /> 移动到…
              </button>
              <button className="ink-menu-item" onClick={() => { setTagDoc(actionDoc); setActionDoc(null); }}>
                <TagIcon size={18} /> 标签
              </button>
              <button className="ink-menu-item" onClick={() => { toggleFav(actionDoc.id); setActionDoc(null); }}>
                <Star size={18} fill={actionDoc.favorite ? "currentColor" : "none"} /> {actionDoc.favorite ? "取消收藏" : "收藏"}
              </button>
              <button className="ink-menu-item danger" onClick={() => { setConfirmDel(actionDoc); setActionDoc(null); }}>
                <Trash2 size={18} /> 删除
              </button>
            </div>
          </Sheet>
        )}

        {/* 文件夹操作面板 */}
        {folderAction && (
          <Sheet open onClose={() => setFolderAction(null)} title={folderAction.name}>
            <div className="ink-menu">
              <button className="ink-menu-item" onClick={() => { setFolderRename(folderAction); setFolderAction(null); }}>
                <Pencil size={18} /> 重命名
              </button>
              <button className="ink-menu-item danger" onClick={() => deleteFolder(folderAction)}>
                <Trash2 size={18} /> 删除文件夹
              </button>
            </div>
          </Sheet>
        )}

        {/* 排序 */}
        <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="排序方式">
          <div className="ink-menu">
            {[
              ["updatedAt", "最近更新"],
              ["createdAt", "创建时间"],
              ["lastOpenedAt", "最近打开"],
              ["title", "名称"],
            ].map(([k, l]) => (
              <button key={k} className="ink-menu-item" onClick={() => { setSortKey(k); setSortOpen(false); }}>
                <ArrowUpDown size={18} /> {l} {sortKey === k && <Check size={18} className="ink-ml-auto" />}
              </button>
            ))}
          </div>
        </Sheet>

        {/* 新建 / 导入 */}
        <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="添加内容">
          <div className="ink-menu">
            <label className="ink-menu-item" htmlFor="ink-import-input">
              <Upload size={18} /> 导入 Markdown 文件
            </label>
            <button className="ink-menu-item" onClick={createDoc}>
              <FileText size={18} /> 新建空白文档
            </button>
            <div className="ink-folder-create">
              <input className="ink-input" placeholder={breadcrumb.length ? "在此文件夹下新建文件夹" : "新建文件夹名称"} value={folderInput} onChange={(e) => setFolderInput(e.target.value)} />
              <button className="ink-btn" onClick={createFolder}>
                <FolderPlus size={16} /> 创建
              </button>
            </div>
          </div>
          <input id="ink-import-input" type="file" multiple onChange={onImport} className="ink-visually-hidden" />
        </Sheet>

        {/* 重命名文档 */}
        <Sheet open={!!renameDoc} onClose={() => setRenameDoc(null)} title="重命名">
          {renameDoc && <NameForm initial={renameDoc.filename.replace(/\.md$/, "")} onSave={(n) => rename(renameDoc.id, n)} />}
        </Sheet>

        {/* 重命名文件夹 */}
        <Sheet open={!!folderRename} onClose={() => setFolderRename(null)} title="重命名文件夹">
          {folderRename && <NameForm initial={folderRename.name} onSave={(n) => renameFolder(folderRename, n)} />}
        </Sheet>

        {/* 移动（单个 / 批量） */}
        <Sheet open={moveIds !== null} onClose={() => setMoveIds(null)} title={moveIds && moveIds.length > 1 ? "移动 " + moveIds.length + " 项到" : "移动到"}>
          {moveIds !== null && (
            <div className="ink-menu">
              <button className="ink-menu-item" onClick={() => applyMove(moveIds, null)}>
                <Folder size={18} /> 根目录（移出文件夹）
              </button>
              {folderTree.map(({ f, depth }) => (
                <button key={f.id} className="ink-menu-item" style={{ paddingLeft: 8 + depth * 18 }} onClick={() => applyMove(moveIds, f.id)}>
                  <Folder size={18} /> {f.name}
                </button>
              ))}
            </div>
          )}
        </Sheet>

        {/* 标签 */}
        <Sheet open={!!tagDoc} onClose={() => setTagDoc(null)} title="标签">
          {tagDocCurrent && (
            <div className="ink-tag-editor">
              {tags.map((t) => {
                const on = (tagDocCurrent.tags || []).includes(t.id);
                return (
                  <TagPill key={t.id} name={t.name} active={on} onClick={() => {
                    const cur = tagDocCurrent.tags || [];
                    setDocTags(tagDocCurrent.id, on ? cur.filter((x) => x !== t.id) : [...cur, t.id]);
                  }} />
                );
              })}
            </div>
          )}
        </Sheet>

        {/* 删除确认（单个） */}
        {confirmDel && (
          <div className="ink-sheet-backdrop" onClick={() => setConfirmDel(null)}>
            <div className="ink-confirm" onClick={(e) => e.stopPropagation()}>
              <div className="ink-confirm-title">删除文档</div>
              <div className="ink-confirm-desc">确定删除「{confirmDel.title}」吗？删除后仍可短暂撤销。</div>
              <div className="ink-confirm-actions">
                <button className="ink-btn ghost" onClick={() => setConfirmDel(null)}>取消</button>
                <button className="ink-btn danger" onClick={() => { doDelete(confirmDel.id); setConfirmDel(null); }}>删除</button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认（批量） */}
        {confirmBatchDel && (
          <div className="ink-sheet-backdrop" onClick={() => setConfirmBatchDel(false)}>
            <div className="ink-confirm" onClick={(e) => e.stopPropagation()}>
              <div className="ink-confirm-title">删除 {selectedIds.length} 个文档</div>
              <div className="ink-confirm-desc">此操作不可撤销，确定继续吗？</div>
              <div className="ink-confirm-actions">
                <button className="ink-btn ghost" onClick={() => setConfirmBatchDel(false)}>取消</button>
                <button className="ink-btn danger" onClick={batchDelete}>删除</button>
              </div>
            </div>
          </div>
        )}

        {/* 清空确认 */}
        {confirmClear && (
          <div className="ink-sheet-backdrop" onClick={() => setConfirmClear(false)}>
            <div className="ink-confirm" onClick={(e) => e.stopPropagation()}>
              <div className="ink-confirm-title">清空所有数据</div>
              <div className="ink-confirm-desc">将删除全部文档、文件夹与标签，且不可撤销。建议先导出备份。</div>
              <div className="ink-confirm-actions">
                <button className="ink-btn ghost" onClick={() => setConfirmClear(false)}>取消</button>
                <button className="ink-btn danger" onClick={doClear}>清空</button>
              </div>
            </div>
          </div>
        )}

        <Toast toast={toast} onUndo={undoDelete} />
        <div className="ink-home-indicator" />
      </div>
    </div>
  );
}
