import { useState, useEffect } from "react";
import type { Goal, Roadmap, RoadmapNode, Task, Note, Habit } from "../types/lifeOs";
import { calculateNodeProgress } from "../utils/calculators";

interface Props {
  goal: Goal;
  onClose: () => void;
  roadmaps: Roadmap[];
  roadmapNodes: RoadmapNode[];
  tasks: Task[];
  notes: Note[];
  habits: Habit[];
  saveGoal: (goal: Goal) => void;
  saveRoadmap: (roadmap: Roadmap, nodes: RoadmapNode[]) => void;
  saveTask: (task: Task) => void;
  saveNote: (note: Note) => void;
  saveHabit: (habit: Habit) => void;
  deleteEntity: (
    type: "goals" | "roadmaps" | "tasks" | "projects" | "learningItems" | "notes" | "journals" | "habits",
    id: string
  ) => void;
}

export function GoalWorkspace({
  goal,
  onClose,
  roadmaps,
  roadmapNodes,
  tasks,
  notes,
  habits,
  saveGoal,
  saveRoadmap,
  saveTask,
  saveNote,
  saveHabit,
  deleteEntity,
}: Props) {
  const [activeTab, setActiveTab] = useState<"roadmap" | "tree" | "timeline" | "progress" | "resources">("roadmap");
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [rescheduleNotification, setRescheduleNotification] = useState<string | null>(null);

  // Folder resource states
  const [collapsedFolders, setCollapsedFolders] = useState<{ [category: string]: boolean }>({});
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceContent, setNewResourceContent] = useState("");
  const [newResourceCategory, setNewResourceCategory] = useState("Unclassified");
  const [showAddResourceForm, setShowAddResourceForm] = useState(false);
  const [activeResourceNote, setActiveResourceNote] = useState<Note | null>(null);

  // Side Panel Inline Form States
  const [newSubgoalTitle, setNewSubgoalTitle] = useState("");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [selectedHabitToLink, setSelectedHabitToLink] = useState("");
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitFreq, setNewHabitFreq] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [newChildNodeTitle, setNewChildNodeTitle] = useState("");
  const [newChildNodeDesc, setNewChildNodeDesc] = useState("");

  // Node Editing States
  const [editingNodeTitle, setEditingNodeTitle] = useState("");
  const [editingNodeDesc, setEditingNodeDesc] = useState("");
  const [editingNodeResources, setEditingNodeResources] = useState("");
  const [editingNodeDeadline, setEditingNodeDeadline] = useState("");
  const [editingNodeStatus, setEditingNodeStatus] = useState<RoadmapNode["status"]>("NOT_STARTED");

  // Find the roadmap for this goal
  const roadmap = roadmaps.find((r) => r.goalId === goal.id);
  const activeNodes = roadmap ? roadmapNodes.filter((n) => n.roadmapId === roadmap.id) : [];

  // Update inline form fields when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setEditingNodeTitle(selectedNode.title);
      setEditingNodeDesc(selectedNode.description || "");
      setEditingNodeResources(selectedNode.resources || "");
      setEditingNodeDeadline(selectedNode.deadline || "");
      setEditingNodeStatus(selectedNode.status);
    } else {
      setEditingNodeTitle("");
      setEditingNodeDesc("");
      setEditingNodeResources("");
      setEditingNodeDeadline("");
      setEditingNodeStatus("NOT_STARTED");
    }
  }, [selectedNode]);

  // Dynamic Timeline Rescheduling (GPS Rerouting)
  useEffect(() => {
    if (!roadmap || activeNodes.length === 0) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const goalTasks = tasks.filter((t) => t.goalId === goal.id);

    let maxOverdueDays = 0;
    let overdueDetected = false;

    // Detect overdue tasks/milestones
    goalTasks.forEach((t) => {
      if (t.status !== "DONE" && t.dueDate) {
        const dateStr = t.dueDate.split("T")[0];
        if (dateStr < todayStr) {
          overdueDetected = true;
          const diff = new Date(todayStr).getTime() - new Date(dateStr).getTime();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          if (days > maxOverdueDays) maxOverdueDays = days;
        }
      }
    });

    // Detect overdue roadmap nodes
    activeNodes.forEach((n) => {
      if (n.status !== "COMPLETED" && n.deadline) {
        const dateStr = n.deadline.split("T")[0];
        if (dateStr < todayStr) {
          overdueDetected = true;
          const diff = new Date(todayStr).getTime() - new Date(dateStr).getTime();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          if (days > maxOverdueDays) maxOverdueDays = days;
        }
      }
    });

    if (overdueDetected && maxOverdueDays > 0) {
      // Shift overdue and future items
      // 1. Shift Tasks
      goalTasks.forEach((t) => {
        if (t.dueDate) {
          const originalDate = new Date(t.dueDate);
          const dateStr = t.dueDate.split("T")[0];
          const timePart = t.dueDate.includes("T") ? t.dueDate.split("T")[1] : "12:00:00";

          if (t.status !== "DONE" && dateStr < todayStr) {
            t.dueDate = `${todayStr}T${timePart}`;
            saveTask(t);
          } else if (dateStr >= todayStr) {
            originalDate.setDate(originalDate.getDate() + maxOverdueDays);
            t.dueDate = `${originalDate.toISOString().split("T")[0]}T${timePart}`;
            saveTask(t);
          }
        }
      });

      // 2. Shift Nodes
      let nodesChanged = false;
      const updatedNodes = activeNodes.map((n) => {
        if (n.deadline) {
          const originalDate = new Date(n.deadline);
          const dateStr = n.deadline.split("T")[0];
          if (n.status !== "COMPLETED" && dateStr < todayStr) {
            n.deadline = todayStr;
            nodesChanged = true;
          } else if (dateStr >= todayStr) {
            originalDate.setDate(originalDate.getDate() + maxOverdueDays);
            n.deadline = originalDate.toISOString().split("T")[0];
            nodesChanged = true;
          }
        }
        return n;
      });

      if (nodesChanged) {
        saveRoadmap(roadmap, updatedNodes);
      }

      // 3. Shift Goal target date
      if (goal.targetDate) {
        const goalDate = new Date(goal.targetDate);
        goalDate.setDate(goalDate.getDate() + maxOverdueDays);
        saveGoal({
          ...goal,
          targetDate: goalDate.toISOString().split("T")[0],
        });
      }

      setRescheduleNotification(
        `Overdue milestones detected. Auto-shifted remaining dates by ${maxOverdueDays} days to preserve path structure.`
      );
    }
  }, [goal.id, roadmap]);

  const handleInitializeRoadmap = () => {
    const newRoadmapId = crypto.randomUUID();
    const roadmapData: Roadmap = {
      id: newRoadmapId,
      title: `${goal.title} Roadmap`,
      description: `Structured roadmap for ${goal.title}`,
      goalId: goal.id,
      isTemplate: false,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveRoadmap(roadmapData, []);
  };

  const handleAddRootNode = () => {
    if (!roadmap) return;
    const newNode: RoadmapNode = {
      id: crypto.randomUUID(),
      roadmapId: roadmap.id,
      title: "New Roadmap Node",
      description: "Define this roadmap step node.",
      resources: "",
      status: "NOT_STARTED",
      orderIndex: activeNodes.length,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveRoadmap(roadmap, [...activeNodes, newNode]);
  };

  const handleUpdateNode = () => {
    if (!selectedNode || !roadmap) return;
    const updated: RoadmapNode = {
      ...selectedNode,
      title: editingNodeTitle,
      description: editingNodeDesc,
      resources: editingNodeResources,
      deadline: editingNodeDeadline || undefined,
      status: editingNodeStatus,
      updatedAt: new Date().toISOString(),
    };

    const newNodes = activeNodes.map((n) => (n.id === selectedNode.id ? updated : n));
    saveRoadmap(roadmap, newNodes);
    setSelectedNode(updated);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!roadmap) return;
    // Remove node, and set parentNodeId = null for its child nodes
    const updatedNodes = activeNodes
      .filter((n) => n.id !== nodeId)
      .map((n) => (n.parentNodeId === nodeId ? { ...n, parentNodeId: undefined } : n));
    saveRoadmap(roadmap, updatedNodes);
    setSelectedNode(null);
  };

  // Node tasks handlers
  const handleAddSubgoal = () => {
    if (!selectedNode || !newSubgoalTitle.trim()) return;
    saveTask({
      id: crypto.randomUUID(),
      goalId: goal.id,
      roadmapNodeId: selectedNode.id,
      title: newSubgoalTitle.trim(),
      description: "Subgoal created in workspace node details",
      status: "TODO",
      priority: "MEDIUM",
      isRecurring: false,
      estimatedTime: 0,
      actualTime: 0,
      lifeArea: goal.lifeArea,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewSubgoalTitle("");
  };

  const handleAddMilestone = () => {
    if (!selectedNode || !newMilestoneTitle.trim() || !newMilestoneDate) return;
    saveTask({
      id: crypto.randomUUID(),
      goalId: goal.id,
      roadmapNodeId: selectedNode.id,
      title: `[Milestone] ${newMilestoneTitle.trim()}`,
      description: "Milestone created in workspace node details",
      status: "TODO",
      priority: "HIGH",
      dueDate: `${newMilestoneDate}T12:00:00`,
      isRecurring: false,
      estimatedTime: 0,
      actualTime: 0,
      lifeArea: goal.lifeArea,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewMilestoneTitle("");
    setNewMilestoneDate("");
  };

  const handleToggleTask = (task: Task) => {
    saveTask({
      ...task,
      status: task.status === "DONE" ? "TODO" : "DONE",
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteEntity("tasks", taskId);
  };


  // Node habits handlers
  const handleLinkHabit = () => {
    if (!selectedNode || !selectedHabitToLink) return;
    const habit = habits.find((h) => h.id === selectedHabitToLink);
    if (!habit) return;

    if (!habit.description?.includes(`[Linked Node: ${selectedNode.id}]`)) {
      const updatedDesc = habit.description
        ? `${habit.description}\n[Linked Node: ${selectedNode.id}]`
        : `[Linked Node: ${selectedNode.id}]`;
      saveHabit({
        ...habit,
        description: updatedDesc,
        updatedAt: new Date().toISOString(),
      });
    }
    setSelectedHabitToLink("");
  };

  const handleCreateAndLinkHabit = () => {
    if (!selectedNode || !newHabitTitle.trim()) return;
    saveHabit({
      id: crypto.randomUUID(),
      title: newHabitTitle.trim(),
      description: `[Linked Node: ${selectedNode.id}] Linked to step: ${selectedNode.title}`,
      frequency: newHabitFreq,
      streak: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewHabitTitle("");
  };

  const handleUnlinkHabit = (habitId: string) => {
    if (!selectedNode) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    if (habit.description) {
      const updatedDesc = habit.description
        .replace(`\n[Linked Node: ${selectedNode.id}]`, "")
        .replace(`[Linked Node: ${selectedNode.id}]`, "")
        .trim();
      saveHabit({
        ...habit,
        description: updatedDesc,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleAddChildNode = () => {
    if (!selectedNode || !roadmap || !newChildNodeTitle.trim()) return;
    const newNode: RoadmapNode = {
      id: crypto.randomUUID(),
      roadmapId: roadmap.id,
      parentNodeId: selectedNode.id,
      title: newChildNodeTitle.trim(),
      description: newChildNodeDesc.trim() || "Sub-step node.",
      resources: "",
      status: "NOT_STARTED",
      orderIndex: activeNodes.length,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveRoadmap(roadmap, [...activeNodes, newNode]);
    setNewChildNodeTitle("");
    setNewChildNodeDesc("");
  };

  // Render tree helper
  const renderTreeNodes = (parentTaskId: string | undefined, depth: number = 0) => {
    const childTasks = tasks.filter(
      (t) => t.goalId === goal.id && !t.title.startsWith("[Milestone]") && t.parentTaskId === parentTaskId
    );
    if (childTasks.length === 0) return null;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginLeft: depth > 0 ? "20px" : "0",
          borderLeft: depth > 0 ? "1px dashed var(--surface-border)" : "none",
          paddingLeft: depth > 0 ? "12px" : "0",
        }}
      >
        {childTasks.map((task) => (
          <div key={task.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={task.status === "DONE"}
                onChange={() => handleToggleTask(task)}
                style={{ width: "15px", height: "15px", accentColor: "var(--primary)", cursor: "pointer" }}
              />
              <span
                style={{
                  textDecoration: task.status === "DONE" ? "line-through" : "none",
                  color: task.status === "DONE" ? "var(--text-muted)" : "inherit",
                  flexGrow: 1,
                }}
              >
                {task.title}
              </span>
              <button
                className="btn"
                style={{ padding: "2px 6px", fontSize: "11px", color: "var(--danger)", background: "transparent" }}
                onClick={() => handleDeleteTask(task.id)}
              >
                ✕
              </button>
            </div>
            {renderTreeNodes(task.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  // Render Roadmap View Step
  // Render Roadmap View Step
  const renderRoadmapNode = (node: RoadmapNode, index: number) => {
    const nodeProgress = calculateNodeProgress(node.id, activeNodes, tasks);

    return (
      <div key={node.id} style={{ position: "relative", width: "100%" }}>
        {/* Timeline dot */}
        <div
          style={{
            position: "absolute",
            left: "-39px",
            top: "22px",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            backgroundColor:
              node.status === "COMPLETED"
                ? "var(--success)"
                : node.status === "IN_PROGRESS"
                ? "var(--primary)"
                : "var(--text-muted)",
            border: "3px solid var(--bg)",
            zIndex: 2,
          }}
        />

        <div
          className={`roadmap-node-card ${
            node.status === "COMPLETED" ? "completed" : node.status === "IN_PROGRESS" ? "in_progress" : ""
          }`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
            maxWidth: "600px",
            padding: "18px",
            backgroundColor: "var(--card-bg)",
            borderRadius: "var(--border-radius)",
            border: "1px solid var(--surface-border)",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onClick={() => setSelectedNode(node)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Step {index + 1}
            </span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span
                className="tag"
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  backgroundColor:
                    node.status === "COMPLETED"
                      ? "rgba(16, 185, 129, 0.1)"
                      : node.status === "IN_PROGRESS"
                      ? "var(--primary-light)"
                      : "var(--surface-border)",
                  color:
                    node.status === "COMPLETED"
                      ? "var(--success)"
                      : node.status === "IN_PROGRESS"
                      ? "var(--primary)"
                      : "var(--text-muted)",
                }}
              >
                {node.status.replace("_", " ")}
              </span>
            </div>
          </div>
          <div>
            <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "600" }}>{node.title}</h4>
            {node.description && (
              <p style={{ margin: "0", fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.4" }}>{node.description}</p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
            <div className="progress-bar-container" style={{ flexGrow: 1, height: "6px", backgroundColor: "var(--surface-border)" }}>
              <div className="progress-bar" style={{ width: `${nodeProgress}%`, height: "100%", backgroundColor: "var(--primary)" }}></div>
            </div>
            <span style={{ fontSize: "12px", fontWeight: "600", minWidth: "30px", textAlign: "right" }}>
              {nodeProgress}%
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            {node.deadline ? (
              <span>
                Target: <strong>{new Date(node.deadline).toLocaleDateString()}</strong>
              </span>
            ) : (
              <span />
            )}
            <span style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "underline" }}>
              Manage Step Details &rarr;
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Build Chronological Timeline Items
  const timelineItems = [
    ...(goal.targetDate ? [{ date: goal.targetDate, title: goal.title, type: "Goal", status: goal.status, id: goal.id }] : []),
    ...activeNodes
      .filter((n) => n.deadline)
      .map((n) => ({ date: n.deadline!, title: n.title, type: "Step Node", status: n.status, id: n.id, node: n })),
    ...tasks
      .filter((t) => t.goalId === goal.id && t.dueDate)
      .map((t) => ({
        date: t.dueDate!,
        title: t.title.startsWith("[Milestone]") ? t.title.replace("[Milestone] ", "") : t.title,
        type: t.title.startsWith("[Milestone]") ? "Milestone" : "Subgoal",
        status: t.status,
        id: t.id,
        task: t,
      })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // Tree View Indented Nodes list
  const renderTreeItem = (node: RoadmapNode, depth: number = 0) => {
    const children = activeNodes
      .filter((n) => n.parentNodeId === node.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const nodeTasks = tasks.filter((t) => t.roadmapNodeId === node.id && !t.title.startsWith("[Milestone]"));
    const nodeMilestones = tasks.filter((t) => t.roadmapNodeId === node.id && t.title.startsWith("[Milestone]"));

    return (
      <div
        key={node.id}
        style={{
          marginLeft: `${depth * 20}px`,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          borderLeft: "1px dashed var(--surface-border)",
          paddingLeft: "16px",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>Step: {node.title}</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            ({calculateNodeProgress(node.id, activeNodes, tasks)}%)
          </span>
          <button
            className="btn"
            style={{ padding: "2px 6px", fontSize: "11px", color: "var(--primary)", background: "transparent" }}
            onClick={() => setSelectedNode(node)}
          >
            details
          </button>
        </div>

        {nodeMilestones.map((m) => (
          <div key={m.id} style={{ marginLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
            <input
              type="checkbox"
              checked={m.status === "DONE"}
              onChange={() => handleToggleTask(m)}
              style={{ accentColor: "var(--success)" }}
            />
            <span
              style={{
                textDecoration: m.status === "DONE" ? "line-through" : "none",
                color: m.status === "DONE" ? "var(--text-muted)" : "var(--danger)",
                fontWeight: "500",
              }}
            >
              [Milestone] {m.title.replace("[Milestone] ", "")}{" "}
              {m.dueDate && `(${new Date(m.dueDate).toLocaleDateString()})`}
            </span>
          </div>
        ))}

        {nodeTasks.map((t) => (
          <div key={t.id} style={{ marginLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
            <input
              type="checkbox"
              checked={t.status === "DONE"}
              onChange={() => handleToggleTask(t)}
              style={{ accentColor: "var(--primary)" }}
            />
            <span
              style={{
                textDecoration: t.status === "DONE" ? "line-through" : "none",
                color: t.status === "DONE" ? "var(--text-muted)" : "inherit",
              }}
            >
              {t.title}
            </span>
          </div>
        ))}

        {children.map((child) => renderTreeItem(child, depth + 1))}
      </div>
    );
  };

  // Progress metrics calculation
  const totalSteps = activeNodes.length;
  const completedSteps = activeNodes.filter((n) => n.status === "COMPLETED").length;

  const goalTasks = tasks.filter((t) => t.goalId === goal.id);
  const totalMilestones = goalTasks.filter((t) => t.title.startsWith("[Milestone]")).length;
  const completedMilestones = goalTasks.filter((t) => t.title.startsWith("[Milestone]") && t.status === "DONE").length;

  const totalSubgoals = goalTasks.filter((t) => !t.title.startsWith("[Milestone]")).length;
  const completedSubgoals = goalTasks.filter((t) => !t.title.startsWith("[Milestone]") && t.status === "DONE").length;

  const getRemainingDays = (targetDate?: string) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    target.setHours(23, 59, 59, 999);
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAllocatedDays = (createdAt?: string, targetDate?: string) => {
    if (!targetDate) return null;
    const start = createdAt ? new Date(createdAt) : new Date();
    const target = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    target.setHours(23, 59, 59, 999);
    const diffTime = target.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getGroupedNotes = (notesList: Note[]) => {
    const groups: { [category: string]: Note[] } = {};
    notesList.forEach((note) => {
      const cat = note.category || "Unclassified";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(note);
    });
    return groups;
  };

  const renderResourceFoldersSection = (nodeId?: string) => {
    const filterNotes = notes.filter((n) => 
      nodeId 
        ? n.roadmapNodeId === nodeId 
        : (n.goalId === goal.id && !n.roadmapNodeId)
    );

    const groupedNotes = getGroupedNotes(filterNotes);
    const folderNames = Object.keys(groupedNotes).sort();

    const handleCreateResource = () => {
      if (!newResourceTitle.trim()) return;
      saveNote({
        id: crypto.randomUUID(),
        goalId: goal.id,
        roadmapNodeId: nodeId,
        title: newResourceTitle.trim(),
        content: newResourceContent,
        category: newResourceCategory.trim() || "Unclassified",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setNewResourceTitle("");
      setNewResourceContent("");
      setNewResourceCategory("Unclassified");
      setShowAddResourceForm(false);
    };

    return (
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--surface-border)", paddingBottom: "10px", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0" }}>Resource Folders</h3>
          <button
            className="btn btn-secondary"
            style={{ padding: "4px 8px", fontSize: "12px" }}
            onClick={() => setShowAddResourceForm(!showAddResourceForm)}
          >
            {showAddResourceForm ? "Cancel" : "+ Add Resource"}
          </button>
        </div>

        {showAddResourceForm && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", border: "1px solid var(--surface-border)", borderRadius: "var(--border-radius-sm)", backgroundColor: "var(--bg)", marginBottom: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>Resource Title</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Study Guide, Reference Link..."
                value={newResourceTitle}
                onChange={(e) => setNewResourceTitle(e.target.value)}
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>Folder / Category</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Folder name..."
                  value={newResourceCategory}
                  onChange={(e) => setNewResourceCategory(e.target.value)}
                  style={{ flexGrow: 1 }}
                />
                <select
                  className="select"
                  value={newResourceCategory}
                  onChange={(e) => setNewResourceCategory(e.target.value)}
                  style={{ width: "120px" }}
                >
                  <option value="Unclassified">Unclassified</option>
                  {folderNames.filter(f => f !== "Unclassified").map(folder => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>Content / Link URL</label>
              <textarea
                className="textarea"
                rows={2}
                placeholder="Paste reference link or resource notes..."
                value={newResourceContent}
                onChange={(e) => setNewResourceContent(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" onClick={handleCreateResource} disabled={!newResourceTitle.trim()} style={{ alignSelf: "flex-end" }}>
              Save Resource
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {folderNames.map((folder) => {
            const isCollapsed = collapsedFolders[folder] === true;
            const folderNotes = groupedNotes[folder] || [];

            return (
              <div key={folder} style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    padding: "6px 8px",
                    backgroundColor: "rgba(var(--primary-rgb), 0.04)",
                    borderRadius: "4px",
                    fontWeight: "600",
                    fontSize: "13px",
                    userSelect: "none",
                  }}
                  onClick={() =>
                    setCollapsedFolders((prev) => ({ ...prev, [folder]: !isCollapsed }))
                  }
                >
                  <span style={{ display: "inline-flex", alignItems: "center", width: "12px" }}>
                    {isCollapsed ? "▶" : "▼"}
                  </span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span style={{ flexGrow: 1 }}>{folder}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>({folderNotes.length})</span>
                </div>

                {!isCollapsed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "24px", marginTop: "4px", borderLeft: "1px dashed var(--surface-border)" }}>
                    {folderNotes.map((note) => (
                      <div
                        key={note.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 8px",
                          fontSize: "13px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        onClick={() => setActiveResourceNote(note)}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <span style={{ flexGrow: 1, textDecoration: note.content.startsWith("http") ? "underline" : "none", color: note.content.startsWith("http") ? "var(--primary)" : "inherit" }}>
                          {note.title}
                        </span>
                        <button
                          style={{ border: "none", background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: "12px", padding: "2px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete resource "${note.title}"?`)) {
                              deleteEntity("notes", note.id);
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {folderNotes.length === 0 && (
                      <span style={{ padding: "4px 8px", fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Empty folder</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {folderNames.length === 0 && (
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "12px" }}>No folders or resources created yet.</span>
          )}
        </div>
      </div>
    );
  };

  const renderNodeView = () => {
    if (!selectedNode) return null;

    const nodeTasks = tasks.filter((t) => t.roadmapNodeId === selectedNode.id);
    const nodeMilestones = nodeTasks.filter((t) => t.title.startsWith("[Milestone]"));
    const nodeSubgoals = nodeTasks.filter((t) => !t.title.startsWith("[Milestone]"));

    const nodeProgress = calculateNodeProgress(selectedNode.id, activeNodes, tasks);

    return (
      <div className="workspace-fullscreen" style={{ overflowY: "auto", paddingBottom: "40px" }}>
        <div className="workspace-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--surface-border)", paddingBottom: "16px", marginBottom: "20px" }}>
          <div>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedNode(null)}
              style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "13px" }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Goal Workspace</span>
            </button>
            <h2 style={{ fontSize: "22px", fontWeight: "700" }}>{selectedNode.title}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "4px 0 0" }}>
              Detailed step and roadmap node settings.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span
              className="tag"
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                backgroundColor:
                  selectedNode.status === "COMPLETED"
                    ? "rgba(16, 185, 129, 0.1)"
                    : selectedNode.status === "IN_PROGRESS"
                    ? "var(--primary-light)"
                    : "var(--surface-border)",
                color:
                  selectedNode.status === "COMPLETED"
                    ? "var(--success)"
                    : selectedNode.status === "IN_PROGRESS"
                    ? "var(--primary)"
                    : "var(--text-muted)",
              }}
            >
              {selectedNode.status.replace("_", " ")}
            </span>
            <span style={{ fontSize: "13px", fontWeight: "600" }}>Progress: {nodeProgress}%</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid var(--surface-border)", paddingBottom: "10px", margin: "0" }}>Step Settings</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Step Title</label>
                <input
                  type="text"
                  className="input"
                  value={editingNodeTitle}
                  onChange={(e) => setEditingNodeTitle(e.target.value)}
                  onBlur={handleUpdateNode}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Description</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={editingNodeDesc}
                  onChange={(e) => setEditingNodeDesc(e.target.value)}
                  onBlur={handleUpdateNode}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Target Deadline</label>
                  <input
                    type="date"
                    className="input"
                    value={editingNodeDeadline}
                    onChange={(e) => setEditingNodeDeadline(e.target.value)}
                    onBlur={handleUpdateNode}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Status</label>
                  <select
                    className="select"
                    value={editingNodeStatus}
                    onChange={(e) => {
                      setEditingNodeStatus(e.target.value as any);
                    }}
                    onBlur={handleUpdateNode}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--surface-border)", paddingTop: "14px", marginTop: "6px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Sub-steps Timeline</h4>
                {activeNodes.filter((n) => n.parentNodeId === selectedNode.id).length === 0 ? (
                  <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "12px" }}>
                    No nested sub-steps defined yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    {activeNodes
                      .filter((n) => n.parentNodeId === selectedNode.id)
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((child) => (
                        <div
                          key={child.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--surface-border)",
                            borderRadius: "var(--border-radius-sm)",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flexGrow: 1 }}>
                            <span style={{ fontSize: "13px", fontWeight: "600" }}>{child.title}</span>
                            {child.description && (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{child.description}</span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                              onClick={() => setSelectedNode(child)}
                            >
                              Open
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "11px", color: "var(--danger)" }}
                              onClick={() => handleDeleteNode(child.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px solid var(--surface-border)", paddingTop: "14px", marginTop: "6px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>Add Nested Child Node</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Child step title..."
                    value={newChildNodeTitle}
                    onChange={(e) => setNewChildNodeTitle(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Child step description..."
                    value={newChildNodeDesc}
                    onChange={(e) => setNewChildNodeDesc(e.target.value)}
                  />
                  <button className="btn btn-secondary" onClick={handleAddChildNode}>
                    Add Child Step Node
                  </button>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid var(--surface-border)", paddingBottom: "10px", margin: "0 0 16px" }}>Linked Habits</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {habits
                  .filter((h) => h.description?.includes(`[Linked Node: ${selectedNode.id}]`))
                  .map((habit) => (
                    <div
                      key={habit.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "13px",
                        padding: "8px 12px",
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--surface-border)",
                        borderRadius: "var(--border-radius-sm)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>{habit.title}</span>
                      </div>
                      <button
                        className="btn"
                        style={{ padding: "4px 8px", color: "var(--danger)", background: "transparent", fontSize: "12px", border: "none", cursor: "pointer" }}
                        onClick={() => handleUnlinkHabit(habit.id)}
                      >
                        Unlink
                      </button>
                    </div>
                  ))}
                {habits.filter((h) => h.description?.includes(`[Linked Node: ${selectedNode.id}]`)).length === 0 && (
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>No habits linked yet.</span>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <select
                  className="select"
                  value={selectedHabitToLink}
                  onChange={(e) => setSelectedHabitToLink(e.target.value)}
                  style={{ flexGrow: 1 }}
                >
                  <option value="">-- Link existing habit --</option>
                  {habits
                    .filter((h) => !h.description?.includes(`[Linked Node: ${selectedNode.id}]`))
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title}
                      </option>
                    ))}
                </select>
                <button className="btn btn-secondary" onClick={handleLinkHabit} disabled={!selectedHabitToLink}>
                  Link
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--surface-border)", paddingTop: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Or Create & Link New Habit</span>
                <input
                  type="text"
                  className="input"
                  placeholder="Habit title..."
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    className="select"
                    value={newHabitFreq}
                    onChange={(e) => setNewHabitFreq(e.target.value as any)}
                    style={{ flexGrow: 1 }}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                  <button className="btn btn-primary" onClick={handleCreateAndLinkHabit} disabled={!newHabitTitle.trim()}>
                    Create
                  </button>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "16px", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
              <button
                className="btn btn-danger"
                style={{ width: "100%", padding: "10px" }}
                onClick={() => handleDeleteNode(selectedNode.id)}
              >
                Delete Step Node
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid var(--surface-border)", paddingBottom: "10px", margin: "0 0 16px" }}>Node Milestones</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {nodeMilestones.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", padding: "6px 0" }}>
                    <input
                      type="checkbox"
                      checked={m.status === "DONE"}
                      onChange={() => handleToggleTask(m)}
                    />
                    <span style={{ flexGrow: 1, textDecoration: m.status === "DONE" ? "line-through" : "none" }}>
                      {m.title.replace("[Milestone] ", "")}{" "}
                      {m.dueDate && <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>({m.dueDate.split("T")[0]})</span>}
                    </span>
                    <button
                      style={{ border: "none", background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: "14px" }}
                      onClick={() => handleDeleteTask(m.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {nodeMilestones.length === 0 && (
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>No milestones defined for this step.</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--surface-border)", paddingTop: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Add Milestone</span>
                <input
                  type="text"
                  className="input"
                  placeholder="Milestone title..."
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="date"
                    className="input"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    style={{ flexGrow: 1 }}
                  />
                  <button className="btn btn-primary" onClick={handleAddMilestone} disabled={!newMilestoneTitle.trim() || !newMilestoneDate}>
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid var(--surface-border)", paddingBottom: "10px", margin: "0 0 16px" }}>Subgoals Checklist</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {nodeSubgoals.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", padding: "6px 0" }}>
                    <input
                      type="checkbox"
                      checked={t.status === "DONE"}
                      onChange={() => handleToggleTask(t)}
                    />
                    <span style={{ flexGrow: 1, textDecoration: t.status === "DONE" ? "line-through" : "none" }}>
                      {t.title}
                    </span>
                    <button
                      style={{ border: "none", background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: "14px" }}
                      onClick={() => handleDeleteTask(t.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {nodeSubgoals.length === 0 && (
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>No checklist items.</span>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--surface-border)", paddingTop: "12px" }}>
                <input
                  type="text"
                  className="input"
                  placeholder="New subgoal checklist item..."
                  value={newSubgoalTitle}
                  onChange={(e) => setNewSubgoalTitle(e.target.value)}
                  style={{ flexGrow: 1 }}
                />
                <button className="btn btn-primary" onClick={handleAddSubgoal} disabled={!newSubgoalTitle.trim()}>
                  Add
                </button>
              </div>
            </div>

            {renderResourceFoldersSection(selectedNode.id)}
          </div>
        </div>
      </div>
    );
  };

  if (selectedNode) {
    return (
      <>
        {renderNodeView()}
        {activeResourceNote && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ width: "500px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="modal-header">
                <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Edit Resource</h2>
                <button
                  className="btn"
                  style={{ padding: "4px 8px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "18px" }}
                  onClick={() => setActiveResourceNote(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600" }}>Title</label>
                  <input
                    type="text"
                    className="input"
                    value={activeResourceNote.title}
                    onChange={(e) => setActiveResourceNote({ ...activeResourceNote, title: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600" }}>Folder / Category</label>
                  <input
                    type="text"
                    className="input"
                    value={activeResourceNote.category}
                    onChange={(e) => setActiveResourceNote({ ...activeResourceNote, category: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600" }}>Content / Link URL</label>
                  <textarea
                    className="textarea"
                    rows={6}
                    value={activeResourceNote.content}
                    onChange={(e) => setActiveResourceNote({ ...activeResourceNote, content: e.target.value })}
                  />
                </div>
                
                {activeResourceNote.content.startsWith("http") && (
                  <div style={{ marginTop: "4px" }}>
                    <a
                      href={activeResourceNote.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "12px", padding: "6px 12px" }}
                    >
                      <span>Open Link</span>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button className="btn btn-secondary" onClick={() => setActiveResourceNote(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    saveNote(activeResourceNote);
                    setActiveResourceNote(null);
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="workspace-fullscreen">
      <div className="workspace-header">
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span className="tag" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
              {goal.lifeArea}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Workspace</span>
            {(() => {
              const remaining = getRemainingDays(goal.targetDate);
              const allocated = getAllocatedDays(goal.createdAt, goal.targetDate);
              if (remaining === null) return null;
              return (
                <span className="tag" style={{ backgroundColor: remaining <= 2 ? "rgba(239, 68, 68, 0.1)" : "var(--primary-light)", color: remaining <= 2 ? "var(--danger)" : "var(--primary)", fontWeight: "600" }}>
                  {remaining} {remaining === 1 ? "day" : "days"} remaining {allocated !== null && `(of ${allocated} allocated)`}
                </span>
              );
            })()}
          </div>
          <h2 style={{ fontSize: "20px", marginTop: "4px" }}>{goal.title}</h2>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ display: "flex", border: "1px solid var(--surface-border)", borderRadius: "6px", overflow: "hidden" }}>
            <button
              className="btn"
              style={{
                borderRadius: "0",
                backgroundColor: activeTab === "roadmap" ? "var(--primary-light)" : "var(--surface)",
                color: activeTab === "roadmap" ? "var(--primary)" : "var(--text)",
                border: "none",
                padding: "8px 16px",
                fontSize: "13px",
              }}
              onClick={() => setActiveTab("roadmap")}
            >
              Roadmap
            </button>
            <button
              className="btn"
              style={{
                borderRadius: "0",
                backgroundColor: activeTab === "tree" ? "var(--primary-light)" : "var(--surface)",
                color: activeTab === "tree" ? "var(--primary)" : "var(--text)",
                border: "none",
                padding: "8px 16px",
                fontSize: "13px",
              }}
              onClick={() => setActiveTab("tree")}
            >
              Tree Outline
            </button>
            <button
              className="btn"
              style={{
                borderRadius: "0",
                backgroundColor: activeTab === "timeline" ? "var(--primary-light)" : "var(--surface)",
                color: activeTab === "timeline" ? "var(--primary)" : "var(--text)",
                border: "none",
                padding: "8px 16px",
                fontSize: "13px",
              }}
              onClick={() => setActiveTab("timeline")}
            >
              Timeline
            </button>
            <button
              className="btn"
              style={{
                borderRadius: "0",
                backgroundColor: activeTab === "progress" ? "var(--primary-light)" : "var(--surface)",
                color: activeTab === "progress" ? "var(--primary)" : "var(--text)",
                border: "none",
                padding: "8px 16px",
                fontSize: "13px",
              }}
              onClick={() => setActiveTab("progress")}
            >
              Progress Report
            </button>
            <button
              className="btn"
              style={{
                borderRadius: "0",
                backgroundColor: activeTab === "resources" ? "var(--primary-light)" : "var(--surface)",
                color: activeTab === "resources" ? "var(--primary)" : "var(--text)",
                border: "none",
                padding: "8px 16px",
                fontSize: "13px",
              }}
              onClick={() => setActiveTab("resources")}
            >
              Goal Resources
            </button>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Exit Workspace
          </button>
        </div>
      </div>

      <div className="workspace-body" style={{ position: "relative" }}>
        {rescheduleNotification && (
          <div
            style={{
              marginBottom: "24px",
              padding: "12px 18px",
              backgroundColor: "rgba(220, 38, 38, 0.04)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--border-radius-sm)",
              fontSize: "13px",
              color: "var(--danger)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{rescheduleNotification}</span>
            <button
              style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontWeight: "bold" }}
              onClick={() => setRescheduleNotification(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === "roadmap" && (
          <div>
            {!roadmap ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <h3 style={{ marginBottom: "8px" }}>No roadmap initialized for this goal</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
                  Create a structured execution path with phases and milestones.
                </p>
                <button className="btn btn-primary" onClick={handleInitializeRoadmap}>
                  Create Roadmap
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "flex-start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "600px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Roadmap Flow Nodes</h3>
                  <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={handleAddRootNode}>
                    + Add Step Node
                  </button>
                </div>

                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px", position: "relative", paddingLeft: "32px", borderLeft: "2px solid var(--surface-border)", marginLeft: "10px" }}>
                  {activeNodes.filter((n) => !n.parentNodeId).length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>No root steps. Click Add Step Node.</div>
                  ) : (
                    activeNodes
                      .filter((n) => !n.parentNodeId)
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((node, index) => renderRoadmapNode(node, index))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "tree" && (
          <div style={{ maxWidth: "800px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Hierarchical Outline</h3>
            {activeNodes.filter((n) => !n.parentNodeId).length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                No steps or milestones defined. Go to the Roadmap tab to add nodes.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {activeNodes
                  .filter((n) => !n.parentNodeId)
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((rootNode) => renderTreeItem(rootNode))}
              </div>
            )}

            {tasks.filter((t) => t.goalId === goal.id && !t.roadmapNodeId && !t.title.startsWith("[Milestone]")).length > 0 && (
              <div style={{ marginTop: "24px", borderTop: "1px solid var(--surface-border)", paddingTop: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Unassigned Goal Subgoals</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {tasks
                    .filter((t) => t.goalId === goal.id && !t.roadmapNodeId && !t.title.startsWith("[Milestone]"))
                    .map((t) => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                        <input
                          type="checkbox"
                          checked={t.status === "DONE"}
                          onChange={() => handleToggleTask(t)}
                        />
                        <span style={{ textDecoration: t.status === "DONE" ? "line-through" : "none" }}>{t.title}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div style={{ maxWidth: "700px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "24px" }}>Execution Timeline</h3>
            {timelineItems.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>No scheduled deadlines in this workspace.</div>
            ) : (
              <div style={{ position: "relative", paddingLeft: "30px", borderLeft: "2px solid var(--surface-border)" }}>
                {timelineItems.map((item, idx) => (
                  <div key={item.id + idx} style={{ position: "relative", marginBottom: "28px" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "-37px",
                        top: "4px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor:
                          item.status === "COMPLETED" || item.status === "DONE" ? "var(--success)" : "var(--primary)",
                        border: "2px solid var(--bg)",
                      }}
                    />
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
                      {new Date(item.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <span
                        className="tag"
                        style={{
                          fontSize: "10px",
                          padding: "1px 5px",
                          backgroundColor:
                            item.type === "Goal"
                              ? "rgba(139, 92, 246, 0.1)"
                              : item.type === "Step Node"
                              ? "var(--primary-light)"
                              : item.type === "Milestone"
                              ? "rgba(239, 68, 68, 0.08)"
                              : "var(--surface-border)",
                          color:
                            item.type === "Goal"
                              ? "var(--accent)"
                              : item.type === "Step Node"
                              ? "var(--primary)"
                              : item.type === "Milestone"
                              ? "var(--danger)"
                              : "var(--text-muted)",
                        }}
                      >
                        {item.type}
                      </span>
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          textDecoration:
                            item.status === "COMPLETED" || item.status === "DONE" ? "line-through" : "none",
                          color:
                            item.status === "COMPLETED" || item.status === "DONE" ? "var(--text-muted)" : "var(--text)",
                        }}
                      >
                        {item.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "progress" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Workspace Progress</h3>

            <div className="grid-cols-3" style={{ gap: "16px" }}>
              <div className="card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>ROADMAP STEPS</span>
                <div style={{ fontSize: "28px", fontWeight: "700", margin: "8px 0" }}>
                  {completedSteps} / {totalSteps}
                </div>
                <div className="progress-bar-container" style={{ height: "6px" }}>
                  <div
                    className="progress-bar"
                    style={{ width: `${totalSteps ? (completedSteps / totalSteps) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>MILESTONES REACHED</span>
                <div style={{ fontSize: "28px", fontWeight: "700", margin: "8px 0" }}>
                  {completedMilestones} / {totalMilestones}
                </div>
                <div className="progress-bar-container" style={{ height: "6px" }}>
                  <div
                    className="progress-bar"
                    style={{ width: `${totalMilestones ? (completedMilestones / totalMilestones) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>SUBGOALS COMPLETED</span>
                <div style={{ fontSize: "28px", fontWeight: "700", margin: "8px 0" }}>
                  {completedSubgoals} / {totalSubgoals}
                </div>
                <div className="progress-bar-container" style={{ height: "6px" }}>
                  <div
                    className="progress-bar"
                    style={{ width: `${totalSubgoals ? (completedSubgoals / totalSubgoals) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px" }}>Remaining Roadmap Milestones</h4>
              {goalTasks.filter((t) => t.title.startsWith("[Milestone]") && t.status !== "DONE").length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
                  All milestones achieved!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {goalTasks
                    .filter((t) => t.title.startsWith("[Milestone]") && t.status !== "DONE")
                    .map((m) => (
                      <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: "500" }}>{m.title.replace("[Milestone] ", "")}</span>
                        {m.dueDate && (
                          <span style={{ fontSize: "12px", color: "var(--danger)", fontWeight: "600" }}>
                            Target: {new Date(m.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "resources" && (
          <div style={{ maxWidth: "800px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Goal Resources Directory</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>
              Store, organize, and categorize learning materials, tutorials, cheatsheets, and document links for this goal.
            </p>
            {renderResourceFoldersSection(undefined)}
          </div>
        )}
      </div>

      {activeResourceNote && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ width: "500px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Edit Resource</h2>
              <button
                className="btn"
                style={{ padding: "4px 8px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "18px" }}
                onClick={() => setActiveResourceNote(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600" }}>Title</label>
                <input
                  type="text"
                  className="input"
                  value={activeResourceNote.title}
                  onChange={(e) => setActiveResourceNote({ ...activeResourceNote, title: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600" }}>Folder / Category</label>
                <input
                  type="text"
                  className="input"
                  value={activeResourceNote.category}
                  onChange={(e) => setActiveResourceNote({ ...activeResourceNote, category: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600" }}>Content / Link URL</label>
                <textarea
                  className="textarea"
                  rows={6}
                  value={activeResourceNote.content}
                  onChange={(e) => setActiveResourceNote({ ...activeResourceNote, content: e.target.value })}
                />
              </div>
              
              {activeResourceNote.content.startsWith("http") && (
                <div style={{ marginTop: "4px" }}>
                  <a
                    href={activeResourceNote.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "12px", padding: "6px 12px" }}
                  >
                    <span>Open Link</span>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
              <button className="btn btn-secondary" onClick={() => setActiveResourceNote(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  saveNote(activeResourceNote);
                  setActiveResourceNote(null);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
