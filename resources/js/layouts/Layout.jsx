import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Bounce, toast, ToastContainer } from "react-toastify";
import { usePage } from "@inertiajs/react";

/** ===========
 *  UI Helpers
 *  =========== */
const IconSearch = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.3-4.3"></path>
  </svg>
);

const IconClose = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const GRADIENT = "linear-gradient(180deg, #1e4d2b 0%, #35a952 100%)";
const PRIMARY = "#1e4d2b";

const previewText = (content) => (content || "").replace(/\s+/g, " ").trim();
const safeJSON = (raw, fallback) => {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export default function Layout({ children }) {
  const { auth, flash } = usePage().props;
  const user = auth?.user;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =========================
  // MULTI-NOTE NOTEPAD (MINI)
  // - Mobile: fully different app-style screens
  // - Desktop: split panel
  // - Same color code (green gradient)
  // =========================
  const STORAGE_KEY = useMemo(() => {
    const uid = user?.id ?? "guest";
    return `floating_notes_pixel_v2_${uid}`;
  }, [user?.id]);

  const [noteOpen, setNoteOpen] = useState(false);
  const [mobileView, setMobileView] = useState("list"); // list | editor

  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [listQuery, setListQuery] = useState("");
  const [noteQuery, setNoteQuery] = useState("");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved

  const saveTimerRef = useRef(null);
  const textareaRef = useRef(null);
  const titleRef = useRef(null);
  const listSearchRef = useRef(null);
  const noteSearchRef = useRef(null);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeId) ?? null,
    [notes, activeId]
  );

  const filteredNotes = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => (`${n.title}\n${n.content}`.toLowerCase() || "").includes(q));
  }, [notes, listQuery]);

  const stats = useMemo(() => {
    const text = activeNote?.content ?? "";
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    return { words, chars: text.length };
  }, [activeNote?.content]);

  const matchCount = useMemo(() => {
    const q = noteQuery.trim().toLowerCase();
    if (!q || !activeNote?.content) return 0;
    const hay = activeNote.content.toLowerCase();
    let idx = 0,
      count = 0;
    while (true) {
      const found = hay.indexOf(q, idx);
      if (found === -1) break;
      count += 1;
      idx = found + q.length;
    }
    return count;
  }, [noteQuery, activeNote?.content]);

  const makeId = () =>
    crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const persist = (nextNotes, nextActiveId) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ notes: nextNotes, activeId: nextActiveId ?? null })
      );
    } catch {
      toast.error("Could not save notes (storage issue).");
    }
  };

  const withNotes = (updater) => {
    setNotes((prev) => {
      const next = updater(prev);
      // keep activeId if it still exists, otherwise pick first
      const nextActive = next.some((n) => n.id === activeId) ? activeId : next[0]?.id ?? null;
      setActiveId(nextActive);
      persist(next, nextActive);
      return next;
    });
  };

  const ensureStarter = () => {
    const now = new Date().toISOString();
    const id = makeId();
    const starter = { id, title: "Quick note", content: "", createdAt: now, updatedAt: now };
    setNotes([starter]);
    setActiveId(id);
    persist([starter], id);
  };

  const createNote = () => {
    const now = new Date().toISOString();
    const id = makeId();
    const newNote = { id, title: "Untitled", content: "", createdAt: now, updatedAt: now };

    setNotes((prev) => {
      const next = [newNote, ...prev];
      setActiveId(id);
      persist(next, id);
      return next;
    });

    setMobileView("editor");
    setTimeout(() => {
      titleRef.current?.focus();
      titleRef.current?.select?.();
    }, 50);
    toast.success("New note created!");
  };

  const deleteNote = (id) => {
    const n = notes.find((x) => x.id === id);
    if (!window.confirm(`Delete "${n?.title ?? "this note"}"?`)) return;

    setNotes((prev) => {
      const next = prev.filter((x) => x.id !== id);
      const nextActive = id === activeId ? next[0]?.id ?? null : activeId;
      setActiveId(nextActive);
      persist(next, nextActive);
      return next;
    });

    toast.success("Note deleted.");
    if (window.innerWidth < 1024) setMobileView("list");
  };

  const renameNotePrompt = (id) => {
    const n = notes.find((x) => x.id === id);
    const title = window.prompt("Rename note:", n?.title ?? "");
    if (title === null) return;
    const cleaned = title.trim() || "Untitled";
    withNotes((prev) =>
      prev.map((x) => (x.id === id ? { ...x, title: cleaned, updatedAt: new Date().toISOString() } : x))
    );
  };

  const updateActiveTitle = (title) => {
    if (!activeId) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === activeId ? { ...n, title, updatedAt: new Date().toISOString() } : n))
    );
  };

  const updateActiveContent = (content) => {
    if (!activeId) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === activeId ? { ...n, content, updatedAt: new Date().toISOString() } : n))
    );
  };

  const manualSave = () => {
    persist(notes, activeId);
    setSaveState("saved");
    toast.success("Saved!");
  };

  const exportTxt = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content ?? ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(activeNote.title || "note").replace(/[^\w\-]+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!activeNote) return;
    try {
      await navigator.clipboard.writeText(activeNote.content ?? "");
      toast.success("Copied!");
    } catch {
      toast.error("Copy failed.");
    }
  };

  const clearActive = () => {
    if (!activeNote) return;
    if (!window.confirm("Clear this note? This cannot be undone.")) return;
    updateActiveContent("");
    toast.success("Note cleared!");
  };

  // Load notes
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ensureStarter();

    const parsed = safeJSON(raw, null);
    const loadedNotes = Array.isArray(parsed?.notes) ? parsed.notes : [];
    const loadedActive = parsed?.activeId ?? loadedNotes?.[0]?.id ?? null;

    if (!loadedNotes.length) return ensureStarter();

    setNotes(loadedNotes);
    setActiveId(loadedActive);
  }, [STORAGE_KEY]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave while modal open
  useEffect(() => {
    if (!noteOpen) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState("saving");

    saveTimerRef.current = setTimeout(() => {
      persist(notes, activeId);
      setSaveState("saved");
    }, 350);

    return () => saveTimerRef.current && clearTimeout(saveTimerRef.current);
  }, [notes, activeId, noteOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when modal open (mobile fix)
  useEffect(() => {
    if (!noteOpen) return;

    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      top: document.body.style.top,
    };
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.width = prev.width;
      document.body.style.top = prev.top;
      window.scrollTo(0, scrollY);
    };
  }, [noteOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!noteOpen) return;

    const onKeyDown = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === "Escape") {
        e.preventDefault();
        if (window.innerWidth < 1024 && mobileView === "editor") return setMobileView("list");
        return setNoteOpen(false);
      }

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        return manualSave();
      }

      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        return createNote();
      }

      if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          return mobileView === "list"
            ? listSearchRef.current?.focus()
            : noteSearchRef.current?.focus();
        }
        noteSearchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [noteOpen, mobileView, notes, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flash
  useEffect(() => {
    if (flash?.error) toast.error(flash.error);
    if (flash?.success) toast.success(flash.success);
  }, [flash]);

  const openNotes = () => {
    setNoteOpen(true);
    setMobileView("list");
    setTimeout(() => listSearchRef.current?.focus(), 120);
  };

  const openEditor = (id) => {
    setActiveId(id);
    setMobileView("editor");
    setTimeout(() => textareaRef.current?.focus(), 60);
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAF5] font-sans overflow-x-hidden"
      style={{ fontFamily: "'Public Sans', sans-serif" }}
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* =======================
          NOTEPAD MODAL
         ======================= */}
      {noteOpen && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onMouseDown={(e) => e.target === e.currentTarget && setNoteOpen(false)}
          />

          {/* MOBILE (different full-screen view) */}
          <div className="absolute inset-0 lg:hidden bg-[#F7F7FA]">
            <div className="h-[env(safe-area-inset-top)] bg-[#F7F7FA]" />

            <div className="h-[calc(100svh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] min-h-0 flex flex-col">
              {/* LIST */}
              {mobileView === "list" && (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="px-4 pt-3 pb-3 bg-[#F7F7FA] border-b border-black/5">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setNoteOpen(false)}
                        className="h-10 px-3 rounded-xl active:scale-[0.99] transition flex items-center gap-2 text-[#1e4d2b]"
                      >
                        <span className="text-base">←</span>
                        <span className="text-sm font-semibold">Close</span>
                      </button>

                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900 leading-tight">Notes</div>
                        <div className="text-[11px] text-gray-500 leading-tight">
                          {notes.length} {notes.length === 1 ? "note" : "notes"}
                        </div>
                      </div>

                      <button
                        onClick={createNote}
                        className="h-10 px-3 rounded-xl text-white text-sm font-semibold shadow-sm active:scale-[0.99] transition"
                        style={{ background: GRADIENT }}
                      >
                        + New
                      </button>
                    </div>

                    <div className="mt-3 relative">
                      <input
                        ref={listSearchRef}
                        value={listQuery}
                        onChange={(e) => setListQuery(e.target.value)}
                        className="h-11 w-full rounded-2xl bg-white px-11 pr-4 text-sm border border-black/10 focus:outline-none focus:ring-2 focus:ring-green-200"
                        placeholder="Search notes"
                      />
                      <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3">
                    <div className="space-y-3">
                      {filteredNotes.map((n) => {
                        const active = n.id === activeId;
                        return (
                          <button
                            key={n.id}
                            onClick={() => openEditor(n.id)}
                            className={`
                              w-full text-left rounded-3xl p-4 border shadow-sm transition active:scale-[0.995]
                              ${active ? "bg-[#EAF6EE] border-green-200" : "bg-white border-black/5"}
                            `}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-[15px] font-semibold text-gray-900 truncate">
                                  {n.title || "Untitled"}
                                </div>
                                <div className="mt-1 text-[12px] text-gray-500 line-clamp-2">
                                  {previewText(n.content) || "No content"}
                                </div>
                                <div className="mt-3 text-[11px] text-gray-400">
                                  {n.updatedAt ? new Date(n.updatedAt).toLocaleString() : ""}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    renameNotePrompt(n.id);
                                  }}
                                  className="h-9 w-9 rounded-2xl bg-gray-50 border border-black/5 text-gray-700 active:scale-[0.98]"
                                  title="Rename"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteNote(n.id);
                                  }}
                                  className="h-9 w-9 rounded-2xl bg-red-50 border border-red-100 text-red-600 active:scale-[0.98]"
                                  title="Delete"
                                >
                                  🗑
                                </button>
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {!filteredNotes.length && (
                        <div className="rounded-3xl bg-white border border-black/5 p-5 text-sm text-gray-500">
                          No notes found.
                        </div>
                      )}
                    </div>

                    <div className="h-6" />
                  </div>
                </div>
              )}

              {/* EDITOR */}
              {mobileView === "editor" && (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="px-4 pt-3 pb-3 bg-white border-b border-black/5">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setMobileView("list")}
                        className="h-10 px-3 rounded-xl active:scale-[0.99] transition flex items-center gap-2 text-[#1e4d2b]"
                      >
                        <span className="text-base">←</span>
                        <span className="text-sm font-semibold">Notes</span>
                      </button>

                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900 leading-tight">
                          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Ready"}
                        </div>
                        <div className="text-[11px] text-gray-500 leading-tight">
                          {stats.words} words • {stats.chars} chars
                        </div>
                      </div>

                      <button
                        onClick={manualSave}
                        className="h-10 px-3 rounded-xl text-white text-sm font-semibold shadow-sm active:scale-[0.99] transition"
                        style={{ background: GRADIENT }}
                      >
                        Save
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <input
                        ref={titleRef}
                        value={activeNote?.title ?? ""}
                        onChange={(e) => updateActiveTitle(e.target.value)}
                        className="h-11 flex-1 rounded-2xl bg-[#F7F7FA] px-4 text-[15px] font-semibold border border-black/5 focus:outline-none focus:ring-2 focus:ring-green-200"
                        placeholder="Untitled"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="h-11 w-11 rounded-2xl bg-[#F7F7FA] border border-black/5 active:scale-[0.98]"
                        title="Copy"
                      >
                        ⧉
                      </button>
                      <button
                        onClick={exportTxt}
                        className="h-11 w-11 rounded-2xl bg-[#F7F7FA] border border-black/5 active:scale-[0.98]"
                        title="Export"
                      >
                        ⇩
                      </button>
                    </div>

                    <div className="mt-2 relative">
                      <input
                        ref={noteSearchRef}
                        value={noteQuery}
                        onChange={(e) => setNoteQuery(e.target.value)}
                        className="h-11 w-full rounded-2xl bg-[#F7F7FA] px-11 pr-10 text-sm border border-black/5 focus:outline-none focus:ring-2 focus:ring-green-200"
                        placeholder="Search in note"
                      />
                      <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      {noteQuery.trim() && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">
                          {matchCount}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 bg-[#F7F7FA]">
                    <div className="rounded-3xl bg-white border border-black/5 shadow-sm">
                      <textarea
                        ref={textareaRef}
                        value={activeNote?.content ?? ""}
                        onChange={(e) => updateActiveContent(e.target.value)}
                        className="w-full min-h-[58svh] p-4 text-[15px] leading-relaxed rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-green-200"
                        placeholder="Start writing…"
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={clearActive}
                        className="h-11 flex-1 rounded-2xl bg-white border border-red-200 text-red-700 text-sm font-semibold active:scale-[0.99]"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => activeId && deleteNote(activeId)}
                        className="h-11 flex-1 rounded-2xl bg-white border border-black/10 text-gray-700 text-sm font-semibold active:scale-[0.99]"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="h-6" />
                  </div>
                </div>
              )}

              <div className="h-[env(safe-area-inset-bottom)] bg-[#F7F7FA]" />
            </div>
          </div>

          {/* DESKTOP (previous stable style, same colors) */}
          <div className="hidden lg:flex absolute inset-0 items-center justify-center px-6 py-8">
            <div className="w-full max-w-6xl h-[85vh] bg-white rounded-[28px] shadow-2xl border border-black/10 overflow-hidden flex">
              {/* Left */}
              <div className="w-[380px] border-r border-black/10 bg-[#FAFBF7] flex flex-col min-h-0">
                <div className="p-4 border-b border-black/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Notes</div>
                      <div className="text-xs text-gray-500">{notes.length} total</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={createNote}
                        className="h-10 px-4 rounded-2xl text-white text-sm font-semibold"
                        style={{ background: GRADIENT }}
                      >
                        + New
                      </button>
                      <button
                        onClick={() => setNoteOpen(false)}
                        className="h-10 w-10 rounded-2xl bg-white border border-black/10 hover:bg-gray-50"
                        title="Close"
                      >
                        <IconClose className="mx-auto text-gray-700" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 relative">
                    <input
                      value={listQuery}
                      onChange={(e) => setListQuery(e.target.value)}
                      className="h-11 w-full rounded-2xl bg-white px-11 pr-4 text-sm border border-black/10 focus:outline-none focus:ring-2 focus:ring-green-200"
                      placeholder="Search notes…"
                    />
                    <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3">
                  {filteredNotes.map((n) => {
                    const active = n.id === activeId;
                    return (
                      <div
                        key={n.id}
                        onClick={() => setActiveId(n.id)}
                        className={`cursor-pointer rounded-3xl p-4 border transition ${
                          active ? "bg-[#EAF6EE] border-green-200" : "bg-white border-black/5 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {n.title || "Untitled"}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                              {previewText(n.content) || "No content"}
                            </div>
                            <div className="mt-3 text-[11px] text-gray-400">
                              {n.updatedAt ? new Date(n.updatedAt).toLocaleString() : ""}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                renameNotePrompt(n.id);
                              }}
                              className="h-9 w-9 rounded-2xl bg-gray-50 border border-black/5"
                              title="Rename"
                            >
                              ✎
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(n.id);
                              }}
                              className="h-9 w-9 rounded-2xl bg-red-50 border border-red-100 text-red-600"
                              title="Delete"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {!filteredNotes.length && (
                    <div className="rounded-3xl bg-white border border-black/5 p-5 text-sm text-gray-500">
                      No notes found.
                    </div>
                  )}
                </div>
              </div>

              {/* Right */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 border-b border-black/10 bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold text-gray-900 truncate">
                        {activeNote?.title || "Select a note"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Ready") +
                          ` • ${stats.words} words • ${stats.chars} chars`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          value={noteQuery}
                          onChange={(e) => setNoteQuery(e.target.value)}
                          className="h-10 w-[220px] rounded-2xl bg-[#FAFBF7] px-11 pr-10 text-sm border border-black/10 focus:outline-none focus:ring-2 focus:ring-green-200"
                          placeholder="Search…"
                        />
                        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        {noteQuery.trim() && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">
                            {matchCount}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={manualSave}
                        className="h-10 px-4 rounded-2xl text-white text-sm font-semibold"
                        style={{ background: GRADIENT }}
                      >
                        Save
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="h-10 px-4 rounded-2xl bg-white border border-black/10 text-sm"
                      >
                        Copy
                      </button>
                      <button
                        onClick={exportTxt}
                        className="h-10 px-4 rounded-2xl bg-white border border-black/10 text-sm"
                      >
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={activeNote?.title ?? ""}
                      onChange={(e) => updateActiveTitle(e.target.value)}
                      className="h-11 w-full max-w-[560px] rounded-2xl bg-[#FAFBF7] px-4 text-sm font-semibold border border-black/10 focus:outline-none focus:ring-2 focus:ring-green-200"
                      placeholder="Untitled"
                      disabled={!activeId}
                    />
                    <button
                      onClick={clearActive}
                      className="h-11 px-4 rounded-2xl bg-white border border-red-200 text-red-700 text-sm font-semibold disabled:opacity-50"
                      disabled={!activeId}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => activeId && deleteNote(activeId)}
                      className="h-11 px-4 rounded-2xl bg-white border border-black/10 text-sm font-semibold disabled:opacity-50"
                      disabled={!activeId}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 bg-[#F7F7FA]">
                  <div className="rounded-3xl bg-white border border-black/10 shadow-sm">
                    <textarea
                      value={activeNote?.content ?? ""}
                      onChange={(e) => updateActiveContent(e.target.value)}
                      className="w-full min-h-[520px] p-5 text-sm leading-relaxed rounded-3xl resize-y focus:outline-none focus:ring-2 focus:ring-green-200"
                      placeholder={activeId ? "Write here…" : "Select or create a note…"}
                      disabled={!activeId}
                    />
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-black/10 bg-white text-xs text-gray-500 flex justify-between">
                  <span>
                    {activeNote?.updatedAt ? `Updated: ${new Date(activeNote.updatedAt).toLocaleString()}` : "—"}
                  </span>
                  <span>Ctrl/⌘+N • Ctrl/⌘+S • Esc</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Sidebar status={sidebarOpen} setStatus={setSidebarOpen} />

      {/* Main content */}
      <main
        className={`lg:ml-72 flex-1 min-h-screen transition-all flex flex-col ${
          sidebarOpen ? "ml-0" : ""
        }`}
      >
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="p-4 lg:p-8 space-y-8 flex-1">{children}</div>
      </main>

      {/* Floating notepad button (previous color code) */}
      <button
        onClick={openNotes}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all cursor-pointer z-[9998]"
        style={{ background: GRADIENT }}
        title="Open Notepad"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-notebook-pen"
        >
          <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />
          <path d="M2 6h4" />
          <path d="M2 10h4" />
          <path d="M2 14h4" />
          <path d="M2 18h4" />
          <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
        </svg>
      </button>

      <ToastContainer
        position="bottom-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        draggable
        pauseOnHover
        theme="colored"
        transition={Bounce}
      />
    </div>
  );
}
