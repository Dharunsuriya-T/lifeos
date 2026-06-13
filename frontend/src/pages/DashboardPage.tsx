import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearTokens, getRefreshToken } from "../utils/auth";
import { logout } from "../api/authApi";
import { useLifeOsSync } from "../hooks/useLifeOsSync";
import { useGoogleLogin } from "@react-oauth/google";
import { useFeedback } from "../hooks/useFeedback";


import { DashboardTab } from "../components/DashboardTab";
import { GoalsTab } from "../components/GoalsTab";
import { RoadmapsTab } from "../components/RoadmapsTab";
import { TasksTab } from "../components/TasksTab";
import { NotesTab } from "../components/NotesTab";
import { JournalTab } from "../components/JournalTab";
import { HabitsTab } from "../components/HabitsTab";
import { HorizonGoalsTab } from "../components/HorizonGoalsTab";
import { AnalyticsTab } from "../components/AnalyticsTab";
import api from "../api/axios";

type Tab = "dashboard" | "goals" | "roadmaps" | "tasks" | "notes" | "journal" | "habits" | "learning" | "analytics";

const ICONS: Record<Tab, React.ReactNode> = {
  dashboard: (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  goals: (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  roadmaps: (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M11.5 3a17 17 0 0 0 0 18" />
      <path d="M12.5 3a17 17 0 0 1 0 18" />
    </svg>
  ),
  tasks: (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  ),
  notes: (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  journal: (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  habits: (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  learning: (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  ),
  analytics: (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
};

function DashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useFeedback();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("lifeos_theme") as "light" | "dark") || "dark"
  );
  const [accentColor, setAccentColor] = useState<string>(
    () => localStorage.getItem("lifeos_accent") || "slate"
  );

  const sync = useLifeOsSync();

  const loginToGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      if (tokenResponse.access_token) {
        sync.connectGoogleDrive(tokenResponse.access_token);
      }
    },
    scope: "https://www.googleapis.com/auth/drive.file",
  });

  const [tourStep, setTourStep] = useState<number | null>(null);

  const TOUR_STEPS = [
    {
      title: "Welcome to LifeOS",
      content: "Let's take a quick 1-minute tour of your digital growth space. LifeOS runs offline-first and syncs securely to your personal Google Drive or local JSON backups.",
    },
    {
      title: "1. Priority-Driven Dashboard",
      content: "The Dashboard displays today's tasks sorted by priority (High, Medium, Low) to keep you focused on what matters most. It also features your Time Horizon progress meters.",
    },
    {
      title: "2. Simplified Goals & Workspaces",
      content: "Create goals from scratch by defining a Goal Name, description, and target completion date. Click 'Open Goal Workspace' to access linear roadmap timelines and folder resource links.",
    },
    {
      title: "3. Time Horizon Goals",
      content: "Break down long-term goals into actionable Weekly, Monthly, and Yearly targets in the Horizon Goals tab to maintain continuous progress tracking.",
    },
    {
      title: "4. Categorized Notes Notebook",
      content: "Organize note reflections into custom categories. Search instantly through both note titles and content. Notes without a category default to 'Unclassified'.",
    },
    {
      title: "5. Daily Reflections (Journal)",
      content: "Write down today's wins, lessons, challenges, gratitude, mood, and energy levels to capture daily reflection snapshots.",
    },
    {
      title: "6. Analytics Engine",
      content: "Monitor your composite Growth Score and weekly performance trends computed dynamically from task completions and habit tracking.",
    }
  ];

  // Auto-switch tabs during help tour
  useEffect(() => {
    if (tourStep === null) return;
    const stepToTab: Record<number, Tab> = {
      0: "dashboard",
      1: "dashboard",
      2: "goals",
      3: "learning",
      4: "notes",
      5: "journal",
      6: "analytics",
    };
    const targetTab = stepToTab[tourStep];
    if (targetTab) {
      setActiveTab(targetTab);
    }
  }, [tourStep]);

  const handleExportLocalData = () => {
    const data = {
      goals: sync.goals,
      roadmaps: sync.roadmaps,
      roadmapNodes: sync.roadmapNodes,
      tasks: sync.tasks,
      projects: sync.projects,
      projectMilestones: sync.projectMilestones,
      learningItems: sync.learningItems,
      notes: sync.notes,
      journals: sync.journals,
      habits: sync.habits,
      habitLogs: sync.habitLogs,
      horizonGoals: sync.horizonGoals,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "lifeos_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportLocalData = () => {
    const fileInput = document.getElementById("manual-import-file") as HTMLInputElement;
    if (fileInput) fileInput.click();
  };

  const handleFileImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        const mergeLists = (localList: any[], remoteList: any[]) => {
          const mergedMap = new Map(localList.map((item) => [item.id, item]));
          remoteList.forEach((remoteItem) => {
            const localItem = mergedMap.get(remoteItem.id);
            if (!localItem) {
              mergedMap.set(remoteItem.id, remoteItem);
            } else {
              const localTime = localItem.updatedAt || localItem.createdAt || "";
              const remoteTime = remoteItem.updatedAt || remoteItem.createdAt || "";
              if (remoteTime > localTime) {
                mergedMap.set(remoteItem.id, remoteItem);
              }
            }
          });
          return Array.from(mergedMap.values());
        };

        const mergedGoals = mergeLists(sync.goals, parsed.goals || []);
        const mergedRoadmaps = mergeLists(sync.roadmaps, parsed.roadmaps || []);
        const mergedNodes = mergeLists(sync.roadmapNodes, parsed.roadmapNodes || []);
        const mergedTasks = mergeLists(sync.tasks, parsed.tasks || []);
        const mergedProjects = mergeLists(sync.projects, parsed.projects || []);
        const mergedMilestones = mergeLists(sync.projectMilestones, parsed.projectMilestones || []);
        const mergedLearning = mergeLists(sync.learningItems, parsed.learningItems || []);
        const mergedNotes = mergeLists(sync.notes, parsed.notes || []);
        const mergedJournals = mergeLists(sync.journals, parsed.journals || []);
        const mergedHabits = mergeLists(sync.habits, parsed.habits || []);
        const mergedLogs = mergeLists(sync.habitLogs, parsed.habitLogs || []);
        const mergedHorizonGoals = mergeLists(sync.horizonGoals, parsed.horizonGoals || []);

        localStorage.setItem("lifeos_goals", JSON.stringify(mergedGoals));
        localStorage.setItem("lifeos_roadmaps", JSON.stringify(mergedRoadmaps));
        localStorage.setItem("lifeos_roadmap_nodes", JSON.stringify(mergedNodes));
        localStorage.setItem("lifeos_tasks", JSON.stringify(mergedTasks));
        localStorage.setItem("lifeos_projects", JSON.stringify(mergedProjects));
        localStorage.setItem("lifeos_project_milestones", JSON.stringify(mergedMilestones));
        localStorage.setItem("lifeos_learning_items", JSON.stringify(mergedLearning));
        localStorage.setItem("lifeos_notes", JSON.stringify(mergedNotes));
        localStorage.setItem("lifeos_journals", JSON.stringify(mergedJournals));
        localStorage.setItem("lifeos_habits", JSON.stringify(mergedHabits));
        localStorage.setItem("lifeos_habit_logs", JSON.stringify(mergedLogs));
        localStorage.setItem("lifeos_horizon_goals", JSON.stringify(mergedHorizonGoals));

        showToast("Backup JSON successfully imported and merged!", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        showToast("Failed to parse the backup file. Ensure it is a valid LifeOS JSON export.", "error");
      }
    };
    fileReader.readAsText(files[0]);
  };



  // Accent color effect
  useEffect(() => {
    document.body.classList.forEach((cls) => {
      if (cls.startsWith("accent-")) {
        document.body.classList.remove(cls);
      }
    });
    document.body.classList.add(`accent-${accentColor}`);
    localStorage.setItem("lifeos_accent", accentColor);
  }, [accentColor]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me");
        setUserEmail(res.data.email);
        const parts = res.data.email.split("@")[0];
        setUserName(parts.charAt(0).toUpperCase() + parts.slice(1));
      } catch (e) {
        console.error("Failed to load user profile details", e);
      }
    };
    fetchUser();
    
    // Automatically trigger initial server sync on login load
    sync.triggerSync();
  }, []);

  // Theme effect
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
    localStorage.setItem("lifeos_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const logoutHandler = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout request failed: ", error);
    } finally {
      clearTokens();
      navigate("/login");
    }
  };

  const getInitials = () => {
    return userName.slice(0, 2).toUpperCase();
  };

  const getSyncLabel = () => {
    if (sync.googleDriveSyncing) return "Syncing with Google Drive...";
    if (sync.googleDriveSyncError) return `Sync Error: ${sync.googleDriveSyncError}`;
    if (sync.googleDriveConnected) return "Connected and synced with Google Drive";
    return "Not connected to Google Drive";
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardTab
            goals={sync.goals}
            roadmaps={sync.roadmaps}
            roadmapNodes={sync.roadmapNodes}
            tasks={sync.tasks}
            projects={sync.projects}
            projectMilestones={sync.projectMilestones}
            habits={sync.habits}
            habitLogs={sync.habitLogs}
            journals={sync.journals}
            horizonGoals={sync.horizonGoals}
            syncStatus={sync.syncStatus}
            retryCount={sync.retryCount}
            triggerSync={sync.triggerSync}
            saveTask={sync.saveTask}
            saveJournal={sync.saveJournal}
            saveHorizonGoal={sync.saveHorizonGoal}
            onNavigate={(tab) => setActiveTab(tab as Tab)}
          />
        );
      case "goals":
        return (
          <GoalsTab
            goals={sync.goals}
            roadmaps={sync.roadmaps}
            roadmapNodes={sync.roadmapNodes}
            tasks={sync.tasks}
            projects={sync.projects}
            projectMilestones={sync.projectMilestones}
            notes={sync.notes}
            habits={sync.habits}
            saveGoal={sync.saveGoal}
            deleteGoal={sync.deleteEntity}
            saveTask={sync.saveTask}
            saveRoadmap={sync.saveRoadmap}
            saveHabit={sync.saveHabit}
            saveNote={sync.saveNote}
          />
        );
      case "roadmaps":
        return (
          <RoadmapsTab
            roadmaps={sync.roadmaps}
            roadmapNodes={sync.roadmapNodes}
            goals={sync.goals}
            tasks={sync.tasks}
            notes={sync.notes}
            habits={sync.habits}
            saveRoadmap={sync.saveRoadmap}
            deleteRoadmap={sync.deleteEntity}
            saveTask={sync.saveTask}
            saveNote={sync.saveNote}
            saveHabit={sync.saveHabit}
            saveGoal={sync.saveGoal}
          />
        );
      case "tasks":
        return (
          <TasksTab
            tasks={sync.tasks}
            goals={sync.goals}
            projects={sync.projects}
            roadmapNodes={sync.roadmapNodes}
            saveTask={sync.saveTask}
            deleteTask={sync.deleteEntity}
          />
        );
      case "notes":
        return (
          <NotesTab
            notes={sync.notes}
            goals={sync.goals}
            tasks={sync.tasks}
            projects={sync.projects}
            roadmapNodes={sync.roadmapNodes}
            saveNote={sync.saveNote}
            deleteNote={sync.deleteEntity}
          />
        );
      case "journal":
        return <JournalTab journals={sync.journals} saveJournal={sync.saveJournal} deleteJournal={sync.deleteEntity} />;
      case "habits":
        return (
          <HabitsTab
            habits={sync.habits}
            habitLogs={sync.habitLogs}
            saveHabit={sync.saveHabit}
            deleteHabit={sync.deleteEntity}
          />
        );
      case "learning":
        return (
          <HorizonGoalsTab
            horizonGoals={sync.horizonGoals}
            goals={sync.goals}
            saveHorizonGoal={sync.saveHorizonGoal}
            deleteHorizonGoal={sync.deleteEntity}
          />
        );
      case "analytics":
        return (
          <AnalyticsTab
            goals={sync.goals}
            roadmaps={sync.roadmaps}
            roadmapNodes={sync.roadmapNodes}
            tasks={sync.tasks}
            projects={sync.projects}
            projectMilestones={sync.projectMilestones}
            habits={sync.habits}
            habitLogs={sync.habitLogs}
            journals={sync.journals}
            horizonGoals={sync.horizonGoals}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  const navMenuItems: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "goals", label: "Goals" },
    { id: "roadmaps", label: "Roadmaps" },
    { id: "tasks", label: "Tasks" },
    { id: "notes", label: "Notes" },
    { id: "journal", label: "Daily Reflections" },
    { id: "habits", label: "Habit Tracker" },
    { id: "learning", label: "Horizon Goals" },
    { id: "analytics", label: "Analytics Engine" },
  ];

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">L</div>
          <span className="brand-name">LifeOS</span>
        </div>

        <nav className="nav-menu">
          {navMenuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <span className="nav-icon-container" style={{ display: "flex", alignItems: "center" }}>
                {ICONS[item.id]}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer profile panel */}
        <div className="sidebar-footer">
          <button 
            className="theme-switch-btn" 
            onClick={toggleTheme}
            style={{ width: "100%", padding: "8px 12px", display: "flex", gap: "10px", alignItems: "center", justifyContent: "center" }}
          >
            {theme === "dark" ? (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span>Dark Mode</span>
              </>
            )}
          </button>
          
          {/* Accent Color picker */}
          <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Accent Color</span>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {["slate", "indigo", "emerald", "amber", "ruby", "violet"].map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: accentColor === color ? "2px solid var(--text)" : "1px solid var(--surface-border)",
                    backgroundColor:
                      color === "slate" ? "#475569" :
                      color === "indigo" ? "#4f46e5" :
                      color === "emerald" ? "#10b981" :
                      color === "amber" ? "#f59e0b" :
                      color === "ruby" ? "#e11d48" : "#8b5cf6",
                    cursor: "pointer",
                    padding: 0
                  }}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                />
              ))}
            </div>
          </div>

          {/* Google Drive Sync Section */}
          <div style={{ padding: "8px 0", borderTop: "1px solid var(--surface-border)", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Backup & Sync</span>
            {sync.googleDriveConnected ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => sync.triggerSync()}
                  disabled={sync.googleDriveSyncing}
                  style={{ width: "100%", padding: "8px 12px", display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", fontSize: "12px" }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={sync.googleDriveSyncing ? "spin" : ""}>
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  <span>{sync.googleDriveSyncing ? "Syncing..." : "Sync Now"}</span>
                </button>
                <div style={{ fontSize: "10px", color: "var(--text-success)", textAlign: "center", fontWeight: "500" }}>
                  Connected to Drive
                </div>
                {sync.lastSyncTime && (
                  <div style={{ fontSize: "9px", color: "var(--text-muted)", textAlign: "center" }}>
                    Last: {new Date(sync.lastSyncTime).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => loginToGoogle()}
                style={{ width: "100%", padding: "8px 12px", display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", fontSize: "12px" }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Backup to Google Drive</span>
              </button>
            )}
            {sync.googleDriveSyncError && (
              <div style={{ fontSize: "10px", color: "var(--text-error)", textAlign: "center", marginTop: "2px" }}>
                {sync.googleDriveSyncError}
              </div>
            )}
          </div>

          {/* Manual JSON Backup Section */}
          <div style={{ padding: "8px 0", borderTop: "1px solid var(--surface-border)", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Manual Backup</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className="btn btn-secondary"
                onClick={handleExportLocalData}
                style={{ flex: 1, padding: "6px 8px", fontSize: "11px", display: "flex", gap: "4px", alignItems: "center", justifyContent: "center" }}
              >
                Export JSON
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleImportLocalData}
                style={{ flex: 1, padding: "6px 8px", fontSize: "11px", display: "flex", gap: "4px", alignItems: "center", justifyContent: "center" }}
              >
                Import JSON
              </button>
            </div>
            <input
              type="file"
              id="manual-import-file"
              style={{ display: "none" }}
              accept=".json"
              onChange={handleFileImportChange}
            />
          </div>


          <div className="user-profile">
            <div className="avatar">{getInitials()}</div>
            <div className="user-details">
              <span className="user-name">{userName}</span>
              <span className="user-email">{userEmail || "loading email..."}</span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: "100%", padding: "8px 12px" }} onClick={logoutHandler}>
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main viewport */}
      <main className="main-content">
        <header className="main-header">
          <button className="mobile-toggle-btn" onClick={() => setSidebarOpen(true)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          
          <div className="header-breadcrumbs">
            <span className="breadcrumb-parent">LifeOS</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">
              {navMenuItems.find((item) => item.id === activeTab)?.label}
            </span>
          </div>

          <div className="header-actions">
            {/* Sync Badge */}
            <div
              className={`sync-status-compact ${sync.googleDriveConnected ? "connected" : ""}`}
              onClick={() => sync.triggerSync()}
              title={getSyncLabel()}
            >
              <span className={`sync-dot ${sync.googleDriveSyncing ? "syncing" : ""}`}></span>
              <span style={{ fontSize: "11px", fontWeight: "600" }}>
                {sync.googleDriveSyncing ? "Syncing..." : "Synced"}
              </span>
            </div>

            {/* Theme Toggle */}
            <button className="theme-icon-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Logout Button */}
            <button className="btn btn-secondary btn-lux-logout" onClick={logoutHandler}>
              Logout
            </button>
          </div>
        </header>

        <div className="main-content-body">
          {renderActiveTab()}
        </div>
      </main>

      {/* Help Tour Floating Button */}
      <button
        onClick={() => setTourStep(0)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "var(--primary)",
          color: "var(--text-inverse)",
          border: "none",
          boxShadow: "var(--shadow-lg)",
          cursor: "pointer",
          fontSize: "20px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        title="Interactive Help Guide"
      >
        ?
      </button>

      {/* Help Tour Overlay */}
      {tourStep !== null && (
        <div className="modal-overlay" style={{ zIndex: 1001, backdropFilter: "none", backgroundColor: "rgba(9, 13, 22, 0.3)" }}>
          <div className="modal-content" style={{ width: "420px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>{TOUR_STEPS[tourStep].title}</h2>
              <button className="btn" style={{ padding: "4px 8px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "18px" }} onClick={() => setTourStep(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "14px", lineHeight: "150%", color: "var(--text-muted)", margin: 0 }}>
                {TOUR_STEPS[tourStep].content}
              </p>
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              <button className="btn btn-secondary" onClick={() => setTourStep(prev => prev !== null && prev > 0 ? prev - 1 : null)} disabled={tourStep === 0}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => setTourStep(prev => prev !== null && prev < TOUR_STEPS.length - 1 ? prev + 1 : null)}>
                {tourStep === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}

export default DashboardPage;
