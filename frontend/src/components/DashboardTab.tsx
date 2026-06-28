import { useState, useEffect, useMemo } from "react";
import { useFeedback } from "../hooks/useFeedback";

import type { Goal, Roadmap, RoadmapNode, Task, Project, ProjectMilestone, Habit, HabitLog, Journal, HorizonGoal } from "../types/lifeOs";
import { calculateDashboardData, getLocalDateStr } from "../utils/calculators";

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
  const { showToast } = useFeedback();
  const dbData = useMemo(() => {
    return calculateDashboardData(
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
  }, [goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, habits, habitLogs, journals]);

  const [quickWin, setQuickWin] = useState("");
  const [quickWinSaved, setQuickWinSaved] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationSetting>(
    () => (localStorage.getItem("lifeos_notifications") as NotificationSetting) || "default"
  );

  type NotificationSetting = "granted" | "denied" | "default";

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      showToast("This browser does not support desktop notifications.", "error");
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
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const currentMinuteStr = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

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

  // Removed useEffect calculation of dbData in favor of useMemo

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    saveTask({
      ...task,
      status: newStatus,
    });
  };

  const handleSaveQuickWin = () => {
    if (!quickWin.trim()) return;
    const today = getLocalDateStr();
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

  const todayStr = getLocalDateStr();
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
    } catch {
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
        <div className="action-row" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className={getSyncBadgeClass()}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "currentColor" }}></span>
            {getSyncLabel()}
          </div>
          <button className="btn btn-secondary" onClick={triggerSync}>
            Sync Now
          </button>
        </div>
      </div>

      {/* Row 1: Urgent / Focus Row - Grid of 3 columns */}
      <div className="grid-cols-3">
        {/* Today's Focus Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", minHeight: "310px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Today's Focus Tasks</h2>
            <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => onNavigate("tasks")}>
              Manage
            </button>
          </div>
          
          {todayTasksList.length === 0 ? (
            <div className="empty-state-card" style={{ padding: "20px 10px", border: "none", background: "transparent", minHeight: "180px", flexGrow: 1 }}>
              <div className="empty-state-icon" style={{ width: "36px", height: "36px" }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <p className="empty-state-title" style={{ fontSize: "14px" }}>All Caught Up!</p>
              <p className="empty-state-desc" style={{ fontSize: "12px", maxWidth: "240px" }}>No focus tasks left for today. You are fully caught up.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "210px", flexGrow: 1, paddingRight: "4px" }}>
              {todayTasksList.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--border-radius-sm)",
                    backgroundColor: "var(--bg)",
                  }}
                >
                  <button
                    className={`premium-checkbox-container ${task.status === "DONE" ? "checked" : ""}`}
                    onClick={() => toggleTaskStatus(task)}
                    aria-label={task.status === "DONE" ? `Mark task "${task.title}" as incomplete` : `Mark task "${task.title}" as complete`}
                  >
                    {task.status === "DONE" && (
                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span style={{ fontWeight: "600", fontSize: "13.5px", textDecoration: task.status === "DONE" ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexGrow: 1, color: task.status === "DONE" ? "var(--text-muted)" : "var(--text)" }}>
                    {task.title}
                  </span>
                  {task.priority && (
                    <span className="tag" style={{
                      padding: "2px 6px",
                      fontSize: "9px",
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

        {/* Today's Reminders & Scheduled Milestones Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", minHeight: "310px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Today's Reminders</h2>
            {notificationPermission !== "granted" ? (
              <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={requestNotificationPermission}>
                Enable Alerts
              </button>
            ) : (
              <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: "600" }}>
                Alerts Active
              </span>
            )}
          </div>

          {todayRemindersList.length === 0 ? (
            <div className="empty-state-card" style={{ padding: "20px 10px", border: "none", background: "transparent", minHeight: "180px", flexGrow: 1 }}>
              <div className="empty-state-icon" style={{ width: "36px", height: "36px" }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <p className="empty-state-title" style={{ fontSize: "14px" }}>No Reminders</p>
              <p className="empty-state-desc" style={{ fontSize: "12px", maxWidth: "240px" }}>Nothing scheduled for today. Have a peaceful day.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "210px", flexGrow: 1, paddingRight: "4px" }}>
              {todayRemindersList.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--border-radius-sm)",
                    backgroundColor: "var(--bg)",
                  }}
                >
                  <button
                    className={`premium-checkbox-container ${task.status === "DONE" ? "checked" : ""}`}
                    onClick={() => toggleTaskStatus(task)}
                    aria-label={task.status === "DONE" ? `Mark reminder "${task.title}" as incomplete` : `Mark reminder "${task.title}" as complete`}
                  >
                    {task.status === "DONE" && (
                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <div style={{ flexGrow: 1, overflow: "hidden" }}>
                    <span style={{ fontWeight: "600", fontSize: "13.5px", textDecoration: task.status === "DONE" ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", color: task.status === "DONE" ? "var(--text-muted)" : "var(--text)" }}>
                      {task.title}
                    </span>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: "600", color: "var(--accent)", backgroundColor: "var(--accent-light)", padding: "2px 6px", borderRadius: "4px" }}>
                    {formatTime(task.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Record Today's Win Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", minHeight: "310px" }}>
          <h2 style={{ margin: 0, fontSize: "18px" }}>Record Today's Win</h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: "1.5" }}>
            Capture a win or victory today. It will be recorded in your journal reflection entries automatically.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "auto" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                className="input"
                placeholder="I successfully completed..."
                value={quickWin}
                onChange={(e) => setQuickWin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveQuickWin()}
                style={{ flex: 1 }}
                aria-label="Today's win reflection text input"
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
        </div>
      </div>

      {/* Row 2: Analytics Summary Row */}
      {dbData && (
        <div className="grid-cols-4">
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Goals Active</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-display)" }}>{dbData.activeGoalsCount}</span>
              <span style={{ fontSize: "13px", color: "var(--success)" }}>avg {dbData.averageGoalProgress}%</span>
            </div>
            <div className="progress-bar-container" style={{ height: "6px" }}>
              <div className="progress-bar" style={{ width: `${dbData.averageGoalProgress}%` }}></div>
            </div>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Today's Tasks</span>
            <span style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-display)" }}>
              {dbData.todayTasksCount}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {dbData.completedTasksToday} completed today
            </span>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Habit Compliance</span>
            <span style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-display)" }}>
              {dbData.habitCompletionRate}%
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>completed today</span>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Journal Streak</span>
            <span style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--font-display)", color: "var(--accent)" }}>
              {dbData.journalStreak} Days
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>consistency count</span>
          </div>
        </div>
      )}

      {/* Row 3: Secondary columns (Horizon Targets & Upcoming Deadlines) */}
      <div className="grid-cols-2">
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px", maxHeight: "100px", overflowY: "auto", paddingLeft: "4px" }}>
                    {periodItems.map((item) => (
                      <label key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
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
              <div style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px", padding: "40px 0" }}>
                No upcoming deadlines this week.
              </div>
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
  );
}
