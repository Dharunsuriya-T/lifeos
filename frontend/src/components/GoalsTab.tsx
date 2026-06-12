import { useState } from "react";
import type { Goal, Roadmap, RoadmapNode, Task, Project, ProjectMilestone, Habit, Note } from "../types/lifeOs";


import { calculateGoalProgress } from "../utils/calculators";
import { GoalWorkspace } from "./GoalWorkspace";

interface Props {
  goals: Goal[];
  roadmaps: Roadmap[];
  roadmapNodes: RoadmapNode[];
  tasks: Task[];
  projects: Project[];
  projectMilestones: ProjectMilestone[];
  notes: Note[];
  habits: Habit[];
  saveGoal: (goal: Goal) => void;
  deleteGoal: (type: any, id: string) => void;
  saveTask: (task: Task) => void;
  saveRoadmap: (roadmap: Roadmap, nodes: RoadmapNode[]) => void;
  saveHabit: (habit: Habit) => void;
  saveNote: (note: Note) => void;
}

export const getGoalStructure = (goal: Goal): "SIMPLE" | "CHECKLIST" | "HIERARCHICAL" | "ROADMAP" => {
  if (goal.description?.includes("[Structure: SIMPLE]")) return "SIMPLE";
  if (goal.description?.includes("[Structure: CHECKLIST]")) return "CHECKLIST";
  if (goal.description?.includes("[Structure: HIERARCHICAL]")) return "HIERARCHICAL";
  if (goal.description?.includes("[Structure: ROADMAP]")) return "ROADMAP";
  return "SIMPLE";
};

export const getCleanDescription = (goal: Goal): string => {
  if (!goal.description) return "";
  return goal.description.replace(/\[Structure: (SIMPLE|CHECKLIST|HIERARCHICAL|ROADMAP)\]\s*/, "");
};

export const getRemainingDays = (targetDate?: string) => {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const today = new Date();
  target.setHours(23, 59, 59, 999);
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getAllocatedDays = (createdAt?: string, targetDate?: string) => {
  if (!targetDate) return null;
  const start = createdAt ? new Date(createdAt) : new Date();
  const target = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  target.setHours(23, 59, 59, 999);
  const diffTime = target.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};






export function GoalsTab({
  goals,
  roadmaps,
  roadmapNodes,
  tasks,
  projects,
  projectMilestones,
  notes,
  habits,
  saveGoal,
  deleteGoal,
  saveTask,
  saveRoadmap,
  saveHabit,
  saveNote,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);



  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [targetDate, setTargetDate] = useState("");




  // Expanded workspace state (opens GoalWorkspace overlay)
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);



  const handleOpenAdd = () => {
    setEditingGoal(null);
    setTitle("");
    setDescription("");
    setProgressPercentage(0);
    setTargetDate("");
    setShowModal(true);
  };




  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(getCleanDescription(goal));
    setProgressPercentage(goal.progressPercentage);
    setTargetDate(goal.targetDate ? goal.targetDate.split("T")[0] : "");
    setShowModal(true);
  };



  const handleSave = () => {
    if (!title.trim()) return;

    const goalData: Goal = {
      id: editingGoal?.id || crypto.randomUUID(),
      title,
      description: `[Structure: ROADMAP] ${description}`,
      priority: editingGoal?.priority || "MEDIUM",
      status: editingGoal?.status || "NOT_STARTED",
      progressPercentage: editingGoal ? progressPercentage : 0,
      targetDate: targetDate ? `${targetDate}T23:59:59` : undefined,
      lifeArea: editingGoal?.lifeArea || "General",
      motivation: editingGoal?.motivation || "",
      createdAt: editingGoal?.createdAt,
      updatedAt: new Date().toISOString(),
    };

    saveGoal(goalData);
    setShowModal(false);
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div className="header-row">
        <div className="title-section">
          <h1>Goals System</h1>
          <p>Define who you want to become and outline your target life transformations.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + New Goal
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="card" style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <h3 style={{ marginTop: "16px" }}>No goals defined yet</h3>
          <p style={{ margin: "8px 0 20px" }}>Create your first transformation goal to begin your personal growth journey.</p>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid-cols-2">
          {goals.map((goal) => {
            const { progress: computedProgress, status: computedStatus } = calculateGoalProgress(
              goal,
              roadmaps,
              roadmapNodes,
              tasks,
              projects,
              projectMilestones
            );
            return (
              <div key={goal.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className="tag" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                      {goal.lifeArea}
                    </span>
                    <span className="tag" style={{
                      backgroundColor: computedStatus === "COMPLETED" ? "rgba(16, 185, 129, 0.1)" : computedStatus === "IN_PROGRESS" ? "var(--primary-light)" : "var(--surface-border)",
                      color: computedStatus === "COMPLETED" ? "var(--success)" : computedStatus === "IN_PROGRESS" ? "var(--primary)" : "var(--text-muted)"
                    }}>
                      {computedStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => handleOpenEdit(goal)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: "12px", background: "transparent", color: "var(--danger)" }} onClick={() => deleteGoal("goals", goal.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: "20px", marginBottom: "6px" }}>{goal.title}</h3>
                  {goal.description && <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "12px" }}>{getCleanDescription(goal)}</p>}
                  {goal.motivation && (
                    <div style={{ padding: "10px 14px", backgroundColor: "var(--primary-light)", borderLeft: "3px solid var(--primary)", borderRadius: "4px", fontSize: "13px", fontStyle: "italic", margin: "8px 0" }}>
                      " {goal.motivation} "
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)" }}>
                  {(() => {
                    const remaining = getRemainingDays(goal.targetDate);
                    const allocated = getAllocatedDays(goal.createdAt, goal.targetDate);
                    return (
                      <>
                        {remaining !== null ? (
                          <span>
                            <strong>{remaining}</strong> {remaining === 1 ? "day" : "days"} remaining
                            {allocated !== null && <span style={{ color: "var(--text-muted)", fontSize: "11px" }}> (of {allocated} total)</span>}
                          </span>
                        ) : (
                          <span>No deadline set</span>
                        )}
                        {goal.targetDate && (
                          <span>Target: <strong>{new Date(goal.targetDate).toLocaleDateString()}</strong></span>
                        )}
                      </>
                    );
                  })()}
                </div>


                {/* Progress Bar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600" }}>
                    <span>Progress</span>
                    <span>{computedProgress}%</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: "8px" }}>
                    <div className="progress-bar" style={{ width: `${computedProgress}%` }}></div>
                  </div>
                </div>

                {/* Open Full Workspace Button */}
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "10px", marginTop: "6px", fontSize: "13px" }}
                  onClick={() => setExpandedGoalId(goal.id)}
                >
                  Open Goal Workspace
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Workspace Overlay */}
      {expandedGoalId && (() => {
        const activeGoal = goals.find(g => g.id === expandedGoalId);
        if (!activeGoal) return null;
        return (
          <GoalWorkspace
            goal={activeGoal}
            onClose={() => setExpandedGoalId(null)}
            roadmaps={roadmaps}
            roadmapNodes={roadmapNodes}
            tasks={tasks}
            notes={notes}
            habits={habits}
            saveGoal={saveGoal}
            saveRoadmap={saveRoadmap}
            saveTask={saveTask}
            saveNote={saveNote}
            saveHabit={saveHabit}
            deleteEntity={deleteGoal}
          />
        );
      })()}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingGoal ? "Edit Goal" : "New Goal"}</h2>
              <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Goal Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Become Backend Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Description</label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Explain what achieving this goal looks like..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Target Date / Deadline</label>
                <input
                  type="date"
                  className="input"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
