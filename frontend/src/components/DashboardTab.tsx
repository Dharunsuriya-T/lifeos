import { useState, useEffect } from "react";

import type { DashboardData, Goal, Roadmap, RoadmapNode, Task, Project, ProjectMilestone, Habit, HabitLog, Journal, HorizonGoal } from "../types/lifeOs";
import { calculateDashboardData } from "../utils/calculators";

interface Props {
  goals: Goal[];
  roadmaps: Roadmap[];
  roadmapNodes: RoadmapNode[];
  tasks: Task[];
  projects: Project[];
  projectMilestones: ProjectMilestone[];
  habits: Habit[];
  habitLogs: HabitLog[];
  journals: Journal[];
  horizonGoals: HorizonGoal[];
  syncStatus: string;
  retryCount?: number;
  triggerSync: () => void;
  saveTask: (task: Task) => void;
  saveJournal: (journal: Journal) => void;
  saveHorizonGoal: (item: HorizonGoal) => void;
  onNavigate: (tab: string) => void;
}

export function DashboardTab({
  goals,
  roadmaps,
  roadmapNodes,
  tasks,
  projects,
  projectMilestones,
  habits,
  habitLogs,
  journals,
  horizonGoals,
  syncStatus,
  retryCount = 0,
  triggerSync,
  saveTask,
  saveJournal,
  saveHorizonGoal,
  onNavigate,
}: Props) {
  const [dbData, setDbData] = useState<DashboardData | null>(null);
  const [quickWin, setQuickWin] = useState("");
  const [quickWinSaved, setQuickWinSaved] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationSetting>(
    () => (localStorage.getItem("lifeos_notifications") as NotificationSetting) || "default"
  );

  type NotificationSetting = "granted" | "denied" | "default";

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    localStorage.setItem("lifeos_notifications", permission);
  };

  // Background Web Notification Scheduler
  useEffect(() => {
    if (notificationPermission !== "granted") return;
    const lastNotifiedTasks = new Set<string>();

    const checkReminders = () => {
      const now = new Date();
      const currentMinuteStr = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

      tasks.forEach((task) => {
        if (task.dueDate && task.status !== "DONE") {
          const taskMinuteStr = task.dueDate.slice(0, 16);
          if (taskMinuteStr === currentMinuteStr && !lastNotifiedTasks.has(task.id)) {
            lastNotifiedTasks.add(task.id);
            new Notification("LifeOS Reminder", {
              body: `${task.title}\n${task.description || "You have a task scheduled for now."}`,
            });
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks, notificationPermission]);

  useEffect(() => {
    const localData = calculateDashboardData(
      goals,
      roadmaps,
      roadmapNodes,
      tasks,
      projects,
      projectMilestones,
      habits,
      habitLogs,
      journals
    );
    setDbData(localData);
  }, [goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, habits, habitLogs, journals]);

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    saveTask({
      ...task,
      status: newStatus,
    });
  };

  const handleSaveQuickWin = () => {
    if (!quickWin.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    const existingJournal = journals.find((j) => j.entryDate === today);
    
    const journalData: Journal = {
      id: existingJournal?.id || crypto.randomUUID(),
      entryDate: today,
      wins: existingJournal?.wins 
        ? `${existingJournal.wins}\n- ${quickWin}` 
        : `- ${quickWin}`,
      challenges: existingJournal?.challenges || "",
      lessonsLearned: existingJournal?.lessonsLearned || "",
      gratitude: existingJournal?.gratitude || "",
      mood: existingJournal?.mood || "4",
      energyLevel: existingJournal?.energyLevel || "4",
    };

    saveJournal(journalData);
    setQuickWin("");
    setQuickWinSaved(true);
    setTimeout(() => setQuickWinSaved(false), 3000);
  };

  const getSyncBadgeClass = () => {
    if (syncStatus === "syncing") return "sync-indicator sync-syncing";
    if (syncStatus === "synced") return "sync-indicator sync-synced";
    if (syncStatus === "error") {
      return retryCount > 0 && retryCount < 6
        ? "sync-indicator sync-syncing"
        : "sync-indicator sync-error";
    }
    return "sync-indicator sync-idle";
  };

  const getSyncLabel = () => {
    if (syncStatus === "syncing") return "Synchronizing...";
    if (syncStatus === "synced") return "Synced with server";
    if (syncStatus === "error") {
      return retryCount > 0 && retryCount < 6
        ? `Cloud waking up... (Retrying connection ${retryCount}/5)`
        : "Offline mode (local cache active)";
    }
    return "Local-Only Changes";
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasksListRaw = tasks.filter(
    (t) => (!t.dueDate || t.dueDate.startsWith(todayStr)) && t.status !== "DONE"
  );
  const priorityOrder: Record<string, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
  const todayTasksList = [...todayTasksListRaw].sort((a, b) => {
    const pA = priorityOrder[a.priority] || 2;
    const pB = priorityOrder[b.priority] || 2;
    return pA - pB;
  });


  const todayRemindersList = tasks
    .filter((t) => {
      if (!t.dueDate) return false;
      const taskDate = t.dueDate.split("T")[0];
      return taskDate === todayStr && t.status !== "DONE";
    })
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const parts = isoString.split("T");
      if (parts.length < 2) return "";
      const timeParts = parts[1].split(":");
      const hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch (e) {
      return "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Title Section */}
      <div className="header-row">
        <div className="title-section">
          <h1>Welcome Back</h1>
          <p>Here is your growth overview for today.</p>
        </div>
        <div className="action-row">
          <div className={getSyncBadgeClass()}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "currentColor" }}></span>
            {getSyncLabel()}
          </div>
          <button className="btn btn-secondary" onClick={triggerSync}>
            Sync Now
          </button>
        </div>
      </div>

      {/* Analytics Summary Row */}
      {dbData && (
        <div className="grid-cols-4">
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Goals Active</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "32px", fontWeight: "700", fontFamily: "var(--font-display)" }}>{dbData.activeGoalsCount}</span>
              <span style={{ fontSize: "14px", color: "var(--success)" }}>avg {dbData.averageGoalProgress}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${dbData.averageGoalProgress}%` }}></div>
            </div>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Today's Tasks</span>
            <span style={{ fontSize: "32px", fontWeight: "700", fontFamily: "var(--font-display)" }}>
              {dbData.todayTasksCount}
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {dbData.completedTasksToday} completed today
            </span>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Habit Compliance</span>
            <span style={{ fontSize: "32px", fontWeight: "700", fontFamily: "var(--font-display)" }}>
              {dbData.habitCompletionRate}%
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>completed today</span>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Journal Streak</span>
            <span style={{ fontSize: "32px", fontWeight: "700", fontFamily: "var(--font-display)", color: "var(--accent)" }}>
              {dbData.journalStreak} Days
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>consistency count</span>
          </div>
        </div>
      )}

      {/* Main split sections */}
      <div className="grid-cols-3">
        {/* Left Column stack */}
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Today's Focus */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Today's Focus Tasks</h2>
              <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => onNavigate("tasks")}>
                Manage
              </button>
            </div>
            
            {todayTasksList.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
                All caught up! No tasks left for today.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {todayTasksList.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 18px",
                      border: "1px solid var(--surface-border)",
                      borderRadius: "var(--border-radius-sm)",
                      backgroundColor: "var(--bg)",
                      transition: "var(--transition)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.status === "DONE"}
                      onChange={() => toggleTaskStatus(task)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)", cursor: "pointer" }}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <span style={{ fontWeight: "600", textDecoration: task.status === "DONE" ? "line-through" : "none" }}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                          {task.description}
                        </p>
                      )}
                    </div>
                    {task.priority && (
                      <span className="tag" style={{
                        backgroundColor: task.priority === "HIGH" ? "rgba(239, 68, 68, 0.1)" : task.priority === "MEDIUM" ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                        color: task.priority === "HIGH" ? "var(--danger)" : task.priority === "MEDIUM" ? "var(--warning)" : "var(--success)"
                      }}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Reminders & Scheduled Milestones */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0 }}>Today's Reminders & Milestones</h2>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {notificationPermission !== "granted" ? (
                  <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={requestNotificationPermission}>
                    Enable Desktop Alerts
                  </button>
                ) : (
                  <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    Notifications Active
                  </span>
                )}
              </div>
            </div>

            {todayRemindersList.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                No scheduled reminders or timed milestones due today.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {todayRemindersList.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 16px",
                      border: "1px solid var(--surface-border)",
                      borderRadius: "var(--border-radius-sm)",
                      backgroundColor: "var(--bg)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.status === "DONE"}
                      onChange={() => toggleTaskStatus(task)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)", cursor: "pointer" }}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <span style={{ fontWeight: "600", textDecoration: task.status === "DONE" ? "line-through" : "none" }}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--accent)", backgroundColor: "var(--accent-light)", padding: "4px 8px", borderRadius: "6px" }}>
                        Time: {formatTime(task.dueDate)}
                      </span>
                      {task.goalId && goals.find(g => g.id === task.goalId) && (
                        <span className="tag" style={{ fontSize: "11px" }}>
                          Goal: {goals.find(g => g.id === task.goalId)?.title.slice(0, 15)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Win & Deadlines */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Quick Win Recorder */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Record Today's Win</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                className="input"
                placeholder="I successfully deployed..."
                value={quickWin}
                onChange={(e) => setQuickWin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveQuickWin()}
              />
              <button className="btn btn-primary" style={{ padding: "8px 16px" }} onClick={handleSaveQuickWin}>
                Save
              </button>
            </div>
            {quickWinSaved && (
              <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: "600" }}>
                Win added to daily journal!
              </span>
            )}
          </div>

          {/* Horizon Targets Widget */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Horizon Targets</h3>
              <button
                className="btn btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => onNavigate("learning")}
              >
                Manage
              </button>
            </div>

            {(["WEEKLY", "MONTHLY", "YEARLY"] as const).map((period) => {
              const periodItems = horizonGoals.filter((g) => g.period === period);
              const completedCount = periodItems.filter((g) => g.status === "DONE").length;
              const progressPercent = periodItems.length > 0 ? (completedCount / periodItems.length) * 100 : 0;
              const label = period === "WEEKLY" ? "Weekly" : period === "MONTHLY" ? "Monthly" : "Yearly";

              return (
                <div key={period} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600" }}>
                    <span style={{ color: "var(--text)" }}>{label} ({completedCount}/{periodItems.length})</span>
                    <span style={{ color: "var(--text-muted)" }}>{Math.round(progressPercent)}%</span>
                  </div>

                  <div className="progress-bar-container" style={{ height: "6px", backgroundColor: "var(--surface-border)" }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: period === "WEEKLY" ? "var(--primary)" : period === "MONTHLY" ? "var(--accent)" : "#8b5cf6",
                      }}
                    ></div>
                  </div>

                  {periodItems.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px", maxHeight: "120px", overflowY: "auto", paddingLeft: "4px" }}>
                      {periodItems.map((item) => (
                        <label key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={item.status === "DONE"}
                            onChange={() => {
                              saveHorizonGoal({
                                ...item,
                                status: item.status === "TODO" ? "DONE" : "TODO",
                                updatedAt: new Date().toISOString(),
                              });
                            }}
                            style={{ width: "14px", height: "14px", accentColor: "var(--primary)" }}
                          />
                          <span style={{ textDecoration: item.status === "DONE" ? "line-through" : "none", color: item.status === "DONE" ? "var(--text-muted)" : "var(--text)" }}>
                            {item.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upcoming Deadlines */}
          {dbData && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Upcoming Deadlines</h3>
              {dbData.upcomingDeadlines.length === 0 ? (
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>No upcoming deadlines this week.</span>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {dbData.upcomingDeadlines.map((deadline, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600" }}>{deadline.title}</span>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{deadline.type}</span>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--danger)", fontWeight: "600" }}>
                        {new Date(deadline.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
