import { useState } from "react";
import type { Roadmap, RoadmapNode, Goal, Task, Note, Habit } from "../types/lifeOs";
import { GoalWorkspace } from "./GoalWorkspace";

interface Props {
  roadmaps: Roadmap[];
  roadmapNodes: RoadmapNode[];
  goals: Goal[];
  tasks: Task[];
  notes: Note[];
  habits: Habit[];
  saveRoadmap: (roadmap: Roadmap, nodes: RoadmapNode[]) => void;
  deleteRoadmap: (type: "roadmaps", id: string) => void;
  saveTask: (task: Task) => void;
  saveNote: (note: Note) => void;
  saveHabit: (habit: Habit) => void;
  saveGoal: (goal: Goal) => void;
}

// Marketplace official templates
export const MARKETPLACE_TEMPLATES = [
  {
    id: "tpl-backend",
    title: "Backend Developer (Java Stack)",
    description: "Master corporate enterprise server development from foundations to cloud scaling.",
    isStatic: true,
    nodes: [
      { title: "Java & OOP Basics", description: "Learn variables, classes, inheritance, polymorphism.", resources: "- [Java Tutorials](https://dev.java/learn/)\n- [OOP Guide](https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/)" },
      { title: "Java Collections & Streams", description: "Master Lists, Sets, Maps, Lambdas, and Stream APIs.", resources: "- [Collections Overview](https://docs.oracle.com/javase/tutorial/collections/)" },
      { title: "Relational DBs & PostgreSQL", description: "Study SQL, indexing, joins, transactions, and foreign keys.", resources: "- [Postgres Tutorial](https://www.postgresqltutorial.com/)" },
      { title: "Spring Boot Foundations", description: "Spring IoC, dependency injection, and spring mvc rest controllers.", resources: "- [Spring Guides](https://spring.io/guides)" },
      { title: "Spring Security & JWT", description: "Configure token authentication, cors filters, and password encoders.", resources: "- [Spring Security Core](https://spring.io/projects/spring-security)" },
      { title: "Docker Containerization", description: "Write Dockerfiles and compose databases and backends together.", resources: "- [Docker Docs](https://docs.docker.com/)" },
      { title: "AWS Deployment", description: "Deploy backends on AWS EC2 or ECS and configure RDS databases.", resources: "- [AWS Server Tutorial](https://aws.amazon.com/)" }
    ]
  },
  {
    id: "tpl-frontend",
    title: "Modern Frontend Developer",
    description: "Master React, TypeScript, and modern styling architectures.",
    isStatic: true,
    nodes: [
      { title: "HTML5 & Semantic Structure", description: "Master semantic tags, accessibility (a11y), and DOM.", resources: "- [MDN HTML Guide](https://developer.mozilla.org/)" },
      { title: "Vanilla CSS & Responsive Design", description: "Flexbox, Grid, Custom Properties, Media Queries.", resources: "- [CSS Tricks](https://css-tricks.com/)" },
      { title: "Modern ES6 JavaScript", description: "Promises, async/await, fetching, destructuring.", resources: "- [JavaScript Info](https://javascript.info/)" },
      { title: "React & Hooks", description: "Components, JSX, useState, useEffect, custom hooks.", resources: "- [React Docs](https://react.dev/)" },
      { title: "TypeScript Integration", description: "Interfaces, generics, types, config compilation.", resources: "- [TS handbook](https://www.typescriptlang.org/docs/)" },
      { title: "State Management & React Query", description: "Redux Toolkit, Zustand, or TanStack React Query.", resources: "- [React Query Docs](https://tanstack.com/query/latest)" }
    ]
  },
  {
    id: "tpl-fitness",
    title: "Marathon Runner Foundation",
    description: "Structured cardiovascular training program for physical endurance.",
    isStatic: true,
    nodes: [
      { title: "Base Building (Weeks 1-4)", description: "Aerobic running, 3-5km easy runs 3 times a week.", resources: "- [Hal Higdon Marathon Plan](https://www.halhigdon.com/)" },
      { title: "Interval Speedwork (Weeks 5-8)", description: "Add interval repeats on track and tempo runs.", resources: "- [Runner World Speedwork](https://www.runnersworld.com/)" },
      { title: "Long Run Scaling (Weeks 9-12)", description: "Gradually scale weekend runs up to 18km.", resources: "- [Endurance Scaling Info](https://www.runnersworld.com/)" },
      { title: "Peak Week & Taper (Weeks 13-16)", description: "Peak run of 32km followed by 3 weeks of volume tapering.", resources: "- [Taper Guide](https://www.runnersworld.com/)" }
    ]
  }
];

export function RoadmapsTab({
  roadmaps,
  roadmapNodes,
  goals,
  tasks,
  notes,
  habits,
  saveRoadmap,
  deleteRoadmap,
  saveTask,
  saveNote,
  saveHabit,
  saveGoal,
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<"personal" | "marketplace">("personal");
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // Import states
  const [importingTemplate, setImportingTemplate] = useState<any | null>(null);
  const [importGoalId, setImportGoalId] = useState("");
  const [newGoalName, setNewGoalName] = useState("");

  const handleTogglePublish = (roadmap: Roadmap) => {
    const updated: Roadmap = {
      ...roadmap,
      isPublic: !roadmap.isPublic,
      updatedAt: new Date().toISOString(),
    };
    const nodes = roadmapNodes.filter((n) => n.roadmapId === roadmap.id);
    saveRoadmap(updated, nodes);
  };

  const handleStartImport = (template: any) => {
    setImportingTemplate(template);
    setImportGoalId("");
    setNewGoalName(template.title);
  };

  const handleConfirmImport = () => {
    if (!importingTemplate) return;

    let targetGoalId = importGoalId;
    if (!targetGoalId) {
      // Create a new goal first
      const newGoalId = crypto.randomUUID();
      const newGoal: Goal = {
        id: newGoalId,
        title: newGoalName.trim() || importingTemplate.title,
        description: `[Structure: ROADMAP] ${importingTemplate.description || ""}`,
        priority: "MEDIUM",
        status: "NOT_STARTED",
        progressPercentage: 0,
        lifeArea: "General",
        motivation: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveGoal(newGoal);
      targetGoalId = newGoalId;
    }

    const newRoadmapId = crypto.randomUUID();
    const roadmapData: Roadmap = {
      id: newRoadmapId,
      title: importingTemplate.title,
      description: importingTemplate.description || "",
      goalId: targetGoalId,
      isTemplate: false,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let nodeDataList: RoadmapNode[] = [];
    if (importingTemplate.isStatic) {
      nodeDataList = importingTemplate.nodes.map((n: any, idx: number) => ({
        id: crypto.randomUUID(),
        roadmapId: newRoadmapId,
        title: n.title,
        description: n.description || "",
        resources: n.resources || "",
        status: "NOT_STARTED",
        orderIndex: idx,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    } else {
      const templateNodes = roadmapNodes
        .filter((n) => n.roadmapId === importingTemplate.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      const idMap = new Map<string, string>();
      templateNodes.forEach((n) => {
        idMap.set(n.id, crypto.randomUUID());
      });

      nodeDataList = templateNodes.map((n, idx) => ({
        id: idMap.get(n.id)!,
        roadmapId: newRoadmapId,
        parentNodeId: n.parentNodeId ? idMap.get(n.parentNodeId) : undefined,
        title: n.title,
        description: n.description || "",
        resources: n.resources || "",
        status: "NOT_STARTED",
        orderIndex: idx,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    saveRoadmap(roadmapData, nodeDataList);
    setImportingTemplate(null);
    setExpandedGoalId(targetGoalId); // Launch Goal Workspace directly
  };

  const communityItems = [
    ...MARKETPLACE_TEMPLATES.map((t) => ({ ...t, isStatic: true })),
    ...roadmaps
      .filter((r) => r.isPublic)
      .map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        isStatic: false,
        stepCount: roadmapNodes.filter((n) => n.roadmapId === r.id).length,
      })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div className="header-row">
        <div className="title-section">
          <h1>Roadmap System</h1>
          <p>Structured execution sequences to build skills and achieve transformation goals.</p>
        </div>
        <div className="action-row" style={{ display: "flex", gap: "12px" }}>
          <button
            className={`btn ${activeSubTab === "personal" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveSubTab("personal")}
          >
            My Roadmaps
          </button>
          <button
            className={`btn ${activeSubTab === "marketplace" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveSubTab("marketplace")}
          >
            Marketplace
          </button>
        </div>
      </div>

      {activeSubTab === "personal" ? (
        /* PERSONAL ROADMAPS VIEW */
        goals.length === 0 ? (
          <div className="card" style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>
            <h3>No goals created yet</h3>
            <p style={{ margin: "8px 0 20px" }}>Create a goal first in the Goals tab to build or import a structured roadmap.</p>
          </div>
        ) : (
          <div className="grid-cols-2">
            {goals.map((goal) => {
              const goalRoadmap = roadmaps.find((r) => r.goalId === goal.id);
              const goalNodes = goalRoadmap ? roadmapNodes.filter((n) => n.roadmapId === goalRoadmap.id) : [];
              const totalSteps = goalNodes.length;
              const completedSteps = goalNodes.filter((n) => n.status === "COMPLETED").length;
              const progressPct = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

              return (
                <div key={goal.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <span className="tag" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                      {goal.lifeArea || "General"}
                    </span>
                    <h3 style={{ fontSize: "18px", marginTop: "8px", marginBottom: "6px" }}>{goal.title}</h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                      {goal.description
                        ? goal.description.replace(/\[Structure: (SIMPLE|CHECKLIST|HIERARCHICAL|ROADMAP)\]\s*/, "")
                        : "No description provided."}
                    </p>
                  </div>

                  {goalRoadmap ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600" }}>
                          <span>Roadmap Progress ({completedSteps}/{totalSteps} steps)</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="progress-bar-container" style={{ height: "6px" }}>
                          <div className="progress-bar" style={{ width: `${progressPct}%` }}></div>
                        </div>
                      </div>

                      <button
                        className="btn"
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          alignSelf: "flex-start",
                          border: "1px solid var(--surface-border)",
                          backgroundColor: goalRoadmap.isPublic ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                          color: goalRoadmap.isPublic ? "var(--danger)" : "var(--success)",
                          cursor: "pointer",
                          borderRadius: "var(--border-radius-sm)",
                          fontWeight: "600",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(goalRoadmap);
                        }}
                      >
                        {goalRoadmap.isPublic ? "Unpublish from Community" : "Publish to Community"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: "12px", backgroundColor: "var(--primary-light)", borderRadius: "6px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
                      No roadmap created yet for this goal.
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "10px", marginTop: "auto", fontSize: "13px" }}
                    onClick={() => setExpandedGoalId(goal.id)}
                  >
                    {goalRoadmap ? "Open Roadmap View" : "Initialize Roadmap"}
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* COMMUNITY ROADMAP MARKETPLACE VIEW */
        <div className="grid-cols-3">
          {communityItems.map((item) => (
            <div key={item.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "18px", margin: 0 }}>{item.title}</h3>
                  <span className="tag" style={{ backgroundColor: item.isStatic ? "var(--primary-light)" : "var(--accent-light)", color: item.isStatic ? "var(--primary)" : "var(--accent)" }}>
                    {item.isStatic ? "Official" : "Community"}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "140%" }}>
                  {item.description}
                </p>
              </div>

              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                <span>Structured Steps: <strong>{item.isStatic ? (item as any).nodes.length : (item as any).stepCount} Key Steps</strong></span>
              </div>

              <div style={{ marginTop: "auto" }}>
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handleStartImport(item)}>
                  Import Path
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Workspace Overlay */}
      {expandedGoalId && (() => {
        const activeGoal = goals.find((g) => g.id === expandedGoalId);
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
            deleteEntity={deleteRoadmap as any}
          />
        );
      })()}

      {/* Import selection modal */}
      {importingTemplate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Import Roadmap</h2>
              <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setImportingTemplate(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                You are importing <strong>{importingTemplate.title}</strong>. Select which transformation goal this roadmap supports:
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Associated Goal</label>
                <select className="select" value={importGoalId} onChange={(e) => setImportGoalId(e.target.value)}>
                  <option value="">-- Create New Goal --</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              {!importGoalId && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>New Goal Name</label>
                  <input
                    type="text"
                    className="input"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    placeholder="Enter goal name..."
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setImportingTemplate(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleConfirmImport}>
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
