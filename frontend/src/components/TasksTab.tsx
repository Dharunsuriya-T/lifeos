import { useState } from "react";
import type { Task, TaskPriority, TaskStatus, Goal, Project, RoadmapNode } from "../types/lifeOs";

interface Props {
  tasks: Task[];
  goals: Goal[];
  projects: Project[];
  roadmapNodes: RoadmapNode[];
  saveTask: (task: Task) => void;
  deleteTask: (type: "tasks", id: string) => void;
}

export function TasksTab({ tasks, goals, projects, roadmapNodes, saveTask, deleteTask }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("DAILY");
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [actualTime, setActualTime] = useState(0);
  const [lifeArea, setLifeArea] = useState("Personal Development");
  const [goalId, setGoalId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [roadmapNodeId, setRoadmapNodeId] = useState("");

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("lifeos_custom_categories") || "[]");
    } catch {
      return [];
    }
  });

  const lifeAreas = ["Personal Development", "Career", "Health & Fitness", "Finance", "Learning", "Relationships", ...customCategories];

  const [dueTime, setDueTime] = useState("12:00");

  const handleOpenAdd = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setStatus("TODO");
    setDueDate("");
    setDueTime("12:00");
    setIsRecurring(false);
    setRecurrencePattern("DAILY");
    setEstimatedTime(0);
    setActualTime(0);
    setLifeArea("Personal Development");
    setGoalId("");
    setProjectId("");
    setRoadmapNodeId("");
    setShowModal(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setDueTime(task.dueDate && task.dueDate.split("T").length > 1 ? task.dueDate.split("T")[1].slice(0, 5) : "12:00");
    setIsRecurring(task.isRecurring);
    setRecurrencePattern(task.recurrencePattern || "DAILY");
    setEstimatedTime(task.estimatedTime);
    setActualTime(task.actualTime);
    setLifeArea(task.lifeArea || "Personal Development");
    setGoalId(task.goalId || "");
    setProjectId(task.projectId || "");
    setRoadmapNodeId(task.roadmapNodeId || "");
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const taskData: Task = {
      id: editingTask?.id || crypto.randomUUID(),
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? `${dueDate}T${dueTime || "12:00"}:00` : undefined,
      isRecurring,
      recurrencePattern: isRecurring ? recurrencePattern : undefined,
      estimatedTime,
      actualTime,
      lifeArea,
      goalId: goalId || undefined,
      projectId: projectId || undefined,
      roadmapNodeId: roadmapNodeId || undefined,
      createdAt: editingTask?.createdAt,
    };

    saveTask(taskData);
    setShowModal(false);
  };

  const moveTask = (task: Task, targetStatus: TaskStatus) => {
    saveTask({
      ...task,
      status: targetStatus,
    });
  };

  const filterTasks = (colStatus: TaskStatus) => {
    return tasks.filter((t) => t.status === colStatus);
  };

  const columns: { label: string; status: TaskStatus; style: React.CSSProperties }[] = [
    { label: "To Do", status: "TODO", style: { borderTop: "3px solid var(--text-muted)" } },
    { label: "In Progress", status: "IN_PROGRESS", style: { borderTop: "3px solid var(--primary)" } },
    { label: "Done", status: "DONE", style: { borderTop: "3px solid var(--success)" } },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div className="header-row">
        <div className="title-section">
          <h1>Execution Layer (Tasks)</h1>
          <p>Execute daily priorities, schedule subtasks, track time metrics, and resolve goal steps.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + Create Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {columns.map((col) => {
          const colTasks = filterTasks(col.status);
          return (
            <div key={col.status} className="kanban-column" style={col.style}>
              <div className="column-header">
                <span className="column-title">{col.label}</span>
                <span className="column-count">{colTasks.length}</span>
              </div>

              {colTasks.length === 0 ? (
                <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  No tasks here
                </div>
              ) : (
                colTasks.map((task) => (
                  <div key={task.id} className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <span className="tag" style={{ fontSize: "9px", padding: "2px 6px" }}>{task.lifeArea}</span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {col.status !== "TODO" && (
                          <button
                            title="Move Back"
                            style={{ border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}
                            onClick={() => moveTask(task, col.status === "DONE" ? "IN_PROGRESS" : "TODO")}
                          >
                            ←
                          </button>
                        )}
                        {col.status !== "DONE" && (
                          <button
                            title="Move Forward"
                            style={{ border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}
                            onClick={() => moveTask(task, col.status === "TODO" ? "IN_PROGRESS" : "DONE")}
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>

                    <h4
                      style={{ fontSize: "15px", margin: 0, cursor: "pointer", textDecoration: col.status === "DONE" ? "line-through" : "none" }}
                      onClick={() => handleOpenEdit(task)}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                        {task.description.slice(0, 80)}
                        {task.description.length > 80 ? "..." : ""}
                      </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                      {task.dueDate && (
                        <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                      <span>⏱ {task.estimatedTime}m est</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--surface-border)", paddingTop: "8px", marginTop: "4px" }}>
                      <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => handleOpenEdit(task)}>
                        Details
                      </button>
                      <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: "11px", background: "transparent", color: "var(--danger)" }} onClick={() => deleteTask("tasks", task.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: "550px" }}>
            <div className="modal-header">
              <h2>{editingTask ? "Edit Task" : "Create Task"}</h2>
              <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Task Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Implement JWT Filters"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Description</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Write clear instructions for this task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Life Area / Category</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <select className="select" style={{ flexGrow: 1 }} value={lifeArea} onChange={(e) => setLifeArea(e.target.value)}>
                      {lifeAreas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "12px", height: "34px" }}
                      onClick={() => {
                        const newCat = prompt("Enter new custom category name:");
                        if (newCat && newCat.trim()) {
                          const trimmed = newCat.trim();
                          if (!customCategories.includes(trimmed)) {
                            const updated = [...customCategories, trimmed];
                            setCustomCategories(updated);
                            localStorage.setItem("lifeos_custom_categories", JSON.stringify(updated));
                            setLifeArea(trimmed);
                          } else {
                            setLifeArea(trimmed);
                          }
                        }
                      }}
                    >
                      + Custom
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Priority</label>
                  <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Due Date & Time</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="date"
                      className="input"
                      style={{ flex: 1 }}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                    <input
                      type="time"
                      className="input"
                      style={{ width: "100px" }}
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Status</label>
                  <select className="select" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="BACKLOG">Backlog</option>
                  </select>
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Estimated Time (minutes)</label>
                  <input
                    type="number"
                    className="input"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(Number(e.target.value))}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Actual Time Spent (minutes)</label>
                  <input
                    type="number"
                    className="input"
                    value={actualTime}
                    onChange={(e) => setActualTime(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", margin: "8px 0" }}>
                <input
                  type="checkbox"
                  id="chk-recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <label htmlFor="chk-recurring" style={{ fontSize: "13px", fontWeight: "600" }}>Recurring Task</label>
                {isRecurring && (
                  <select className="select" style={{ width: "120px", padding: "6px" }} value={recurrencePattern} onChange={(e) => setRecurrencePattern(e.target.value)}>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                )}
              </div>

              <div className="grid-cols-3" style={{ gap: "8px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600" }}>Goal Link</label>
                  <select className="select" style={{ padding: "6px" }} value={goalId} onChange={(e) => setGoalId(e.target.value)}>
                    <option value="">None</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600" }}>Project Link</label>
                  <select className="select" style={{ padding: "6px" }} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600" }}>Roadmap Step</label>
                  <select className="select" style={{ padding: "6px" }} value={roadmapNodeId} onChange={(e) => setRoadmapNodeId(e.target.value)}>
                    <option value="">None</option>
                    {roadmapNodes.map((rn) => (
                      <option key={rn.id} value={rn.id}>{rn.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
