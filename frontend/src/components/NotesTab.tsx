import { useState, useEffect } from "react";
import type { Note, Goal, Task, Project, RoadmapNode } from "../types/lifeOs";

interface Props {
  notes: Note[];
  goals: Goal[];
  tasks: Task[];
  projects: Project[];
  roadmapNodes: RoadmapNode[];
  saveNote: (note: Note) => void;
  deleteNote: (type: "notes", id: string) => void;
}

export function NotesTab({ notes, goals, tasks, saveNote, deleteNote }: Props) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Unclassified");
  const [goalId, setGoalId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [roadmapNodeId, setRoadmapNodeId] = useState("");

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("lifeos_custom_categories") || "[]");
    } catch {
      return [];
    }
  });

  const categories = ["All", "Unclassified", "General", "Learning", "Work", "Ideas", "Reflections", ...customCategories];

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleSaveCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      setCategoryError("Name cannot be empty");
      return;
    }
    if (trimmed.length > 20) {
      setCategoryError("Max 20 characters");
      return;
    }
    if (trimmed.toLowerCase() === "all" || trimmed.toLowerCase() === "unclassified" || trimmed.toLowerCase() === "general") {
      setCategoryError("Reserved category name");
      return;
    }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError("Category already exists");
      return;
    }

    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    localStorage.setItem("lifeos_custom_categories", JSON.stringify(updated));
    setCategory(trimmed);
    setNewCategoryInput("");
    setIsAddingCategory(false);
    setCategoryError("");
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const noteCat = n.category || "Unclassified";
    const matchesCategory = selectedCategory === "All" || noteCat === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeNote = notes.find((n) => n.id === selectedNoteId);

  useEffect(() => {
    if (filteredNotes.length > 0 && !selectedNoteId && !isAddingNew) {
      setSelectedNoteId(filteredNotes[0].id);
    }
  }, [filteredNotes, selectedNoteId, isAddingNew]);

  const handleStartAdd = () => {
    setSelectedNoteId(null);
    setIsAddingNew(true);
    setTitle("New Note");
    setContent("");
    setCategory("Unclassified");
    setGoalId("");
    setTaskId("");
    setProjectId("");
    setRoadmapNodeId("");
    setIsEditing(true);
  };

  const handleStartEdit = (note: Note) => {
    setTitle(note.title);
    setContent(note.content || "");
    setCategory(note.category || "Unclassified");
    setGoalId(note.goalId || "");
    setTaskId(note.taskId || "");
    setProjectId(note.projectId || "");
    setRoadmapNodeId(note.roadmapNodeId || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const noteId = activeNote?.id || crypto.randomUUID();
    const noteData: Note = {
      id: noteId,
      title,
      content,
      category: category || "Unclassified",
      goalId: goalId || undefined,
      taskId: taskId || undefined,
      projectId: projectId || undefined,
      roadmapNodeId: roadmapNodeId || undefined,
      createdAt: activeNote?.createdAt,
    };

    saveNote(noteData);
    setSelectedNoteId(noteId);
    setIsEditing(false);
    setIsAddingNew(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div className="header-row">
        <div className="title-section">
          <h1>Notes</h1>
          <p>Capture ideas, write freeform thoughts, draft documents, and link them to tasks or roadmaps.</p>
        </div>
        <button className="btn btn-primary" onClick={handleStartAdd}>
          + New Note
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid-cols-3" style={{ alignItems: "start" }}>
        {/* Left column: search and list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Search bar */}
          <input
            type="text"
            className="input"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Categories Selector */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className="btn"
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  backgroundColor: selectedCategory === cat ? "var(--primary)" : "var(--surface)",
                  color: selectedCategory === cat ? "var(--text-inverse)" : "var(--text-muted)",
                  border: `1px solid ${selectedCategory === cat ? "var(--primary)" : "var(--surface-border)"}`,
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Notes List */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", maxHeight: "500px", overflowY: "auto" }}>
            {filteredNotes.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                No notes found.
              </div>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  className={`nav-item ${selectedNoteId === note.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setIsEditing(false);
                    setIsAddingNew(false);
                  }}
                  style={{
                    border: "1px solid var(--surface-border)",
                    backgroundColor: selectedNoteId === note.id ? "var(--primary-light)" : "var(--surface)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>{note.title}</span>
                      <span className="tag" style={{ fontSize: "9px", padding: "1px 5px", textTransform: "lowercase" }}>
                        {note.category}
                      </span>
                    </div>
                    {note.content && (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {note.content}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right column: active note view/edit */}
        <div className="card" style={{ gridColumn: "span 2", minHeight: "500px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {isEditing ? (
            /* EDITING INTERFACE */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <input
                  type="text"
                  className="input"
                  style={{ fontSize: "20px", fontWeight: "700" }}
                  placeholder="Note Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {!isAddingCategory ? (
                    <>
                      <select className="select" style={{ width: "130px" }} value={category} onChange={(e) => setCategory(e.target.value)}>
                        {categories.filter(c => c !== "All").map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "12px", height: "34px" }}
                        onClick={() => {
                          setIsAddingCategory(true);
                          setCategoryError("");
                        }}
                      >
                        + Custom
                      </button>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="New category..."
                          style={{ width: "130px", padding: "6px 10px", fontSize: "13px", height: "34px" }}
                          value={newCategoryInput}
                          onChange={(e) => {
                            setNewCategoryInput(e.target.value);
                            setCategoryError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCategory();
                          }}
                          autoFocus
                        />
                        <button
                          className="btn btn-primary"
                          style={{ padding: "6px 10px", fontSize: "11px", height: "34px" }}
                          onClick={handleSaveCategory}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", fontSize: "11px", height: "34px", color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                          onClick={() => {
                            setIsAddingCategory(false);
                            setNewCategoryInput("");
                            setCategoryError("");
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      {categoryError && (
                        <span style={{ fontSize: "10px", color: "var(--danger)", fontWeight: "600", marginTop: "2px" }}>
                          {categoryError}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <textarea
                className="textarea"
                rows={12}
                placeholder="Write markdown content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ fontFamily: "var(--mono)", fontSize: "14px", lineHeight: "150%" }}
              />

              {/* Connections config */}
              <div className="grid-cols-2" style={{ gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600" }}>Link to Goal</label>
                  <select className="select" style={{ padding: "6px" }} value={goalId} onChange={(e) => setGoalId(e.target.value)}>
                    <option value="">None</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600" }}>Link to Task</label>
                  <select className="select" style={{ padding: "6px" }} value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                    <option value="">None</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    if (isAddingNew) {
                      setIsAddingNew(false);
                      if (filteredNotes.length > 0) {
                        setSelectedNoteId(filteredNotes[0].id);
                      }
                    }
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  Save Note
                </button>
              </div>
            </div>
          ) : (
            /* VIEWING INTERFACE */
            activeNote ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ marginBottom: "6px" }}>{activeNote.title}</h2>
                    <span className="tag">{activeNote.category}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-secondary" onClick={() => handleStartEdit(activeNote)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ background: "transparent", color: "var(--danger)" }}
                      onClick={() => {
                        deleteNote("notes", activeNote.id);
                        setSelectedNoteId(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Content body */}
                <div
                  style={{
                    fontSize: "15px",
                    lineHeight: "160%",
                    whiteSpace: "pre-wrap",
                    padding: "16px",
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--border-radius-sm)",
                    flexGrow: 1,
                  }}
                >
                  {activeNote.content || <em style={{ color: "var(--text-muted)" }}>Empty note. Write some markdown content.</em>}
                </div>

                {/* Connections footer */}
                {(activeNote.goalId || activeNote.taskId) && (
                  <div style={{ borderTop: "1px solid var(--surface-border)", paddingTop: "14px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {activeNote.goalId && goals.find((g) => g.id === activeNote.goalId) && (
                      <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "600" }}>
                        Linked Goal: {goals.find((g) => g.id === activeNote.goalId)?.title}
                      </span>
                    )}
                    {activeNote.taskId && tasks.find((t) => t.id === activeNote.taskId) && (
                      <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "600" }}>
                        Linked Task: {tasks.find((t) => t.id === activeNote.taskId)?.title}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
                Select a note or create a new one.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
