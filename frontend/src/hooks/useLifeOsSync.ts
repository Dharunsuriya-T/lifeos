import { useState, useEffect, useCallback } from "react";
import type {
  Goal,
  Roadmap,
  RoadmapNode,
  Task,
  Project,
  ProjectMilestone,
  LearningItem,
  Note,
  Journal,
  Habit,
  HabitLog,
  HorizonGoal,
} from "../types/lifeOs";

export function useLifeOsSync() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [roadmapNodes, setRoadmapNodes] = useState<RoadmapNode[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<ProjectMilestone[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [horizonGoals, setHorizonGoals] = useState<HorizonGoal[]>([]);

  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [googleDriveConnected, setGoogleDriveConnected] = useState<boolean>(() => {
    const token = localStorage.getItem("lifeos_google_access_token");
    const expiryStr = localStorage.getItem("lifeos_google_token_expiry");
    if (token && expiryStr) {
      return new Date(expiryStr) > new Date();
    }
    return false;
  });
  const [googleDriveSyncing, setGoogleDriveSyncing] = useState(false);
  const [googleDriveSyncError, setGoogleDriveSyncError] = useState<string | null>(null);

  // Load from localStorage
  const loadLocalData = useCallback(() => {
    try {
      setGoals(JSON.parse(localStorage.getItem("lifeos_goals") || "[]"));
      setRoadmaps(JSON.parse(localStorage.getItem("lifeos_roadmaps") || "[]"));
      setRoadmapNodes(JSON.parse(localStorage.getItem("lifeos_roadmap_nodes") || "[]"));
      setTasks(JSON.parse(localStorage.getItem("lifeos_tasks") || "[]"));
      setProjects(JSON.parse(localStorage.getItem("lifeos_projects") || "[]"));
      setProjectMilestones(JSON.parse(localStorage.getItem("lifeos_project_milestones") || "[]"));
      setLearningItems(JSON.parse(localStorage.getItem("lifeos_learning_items") || "[]"));
      setNotes(JSON.parse(localStorage.getItem("lifeos_notes") || "[]"));
      setJournals(JSON.parse(localStorage.getItem("lifeos_journals") || "[]"));
      setHabits(JSON.parse(localStorage.getItem("lifeos_habits") || "[]"));
      setHabitLogs(JSON.parse(localStorage.getItem("lifeos_habit_logs") || "[]"));
      setHorizonGoals(JSON.parse(localStorage.getItem("lifeos_horizon_goals") || "[]"));
      setLastSyncTime(localStorage.getItem("lifeos_last_sync_time"));
    } catch (e) {
      console.error("Failed to load local data", e);
    }
  }, []);

  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);


  // Helper to save all data locally
  const saveAllLocal = (
    newGoals: Goal[],
    newRoadmaps: Roadmap[],
    newNodes: RoadmapNode[],
    newTasks: Task[],
    newProjects: Project[],
    newMilestones: ProjectMilestone[],
    newLearning: LearningItem[],
    newNotes: Note[],
    newJournals: Journal[],
    newHabits: Habit[],
    newLogs: HabitLog[],
    syncTime?: string,
    newHorizonGoals?: HorizonGoal[]
  ) => {
    localStorage.setItem("lifeos_goals", JSON.stringify(newGoals));
    localStorage.setItem("lifeos_roadmaps", JSON.stringify(newRoadmaps));
    localStorage.setItem("lifeos_roadmap_nodes", JSON.stringify(newNodes));
    localStorage.setItem("lifeos_tasks", JSON.stringify(newTasks));
    localStorage.setItem("lifeos_projects", JSON.stringify(newProjects));
    localStorage.setItem("lifeos_project_milestones", JSON.stringify(newMilestones));
    localStorage.setItem("lifeos_learning_items", JSON.stringify(newLearning));
    localStorage.setItem("lifeos_notes", JSON.stringify(newNotes));
    localStorage.setItem("lifeos_journals", JSON.stringify(newJournals));
    localStorage.setItem("lifeos_habits", JSON.stringify(newHabits));
    localStorage.setItem("lifeos_habit_logs", JSON.stringify(newLogs));
    
    const horizonToSave = newHorizonGoals !== undefined ? newHorizonGoals : horizonGoals;
    localStorage.setItem("lifeos_horizon_goals", JSON.stringify(horizonToSave));

    if (syncTime) {
      localStorage.setItem("lifeos_last_sync_time", syncTime);
      setLastSyncTime(syncTime);
    }

    setGoals(newGoals);
    setRoadmaps(newRoadmaps);
    setRoadmapNodes(newNodes);
    setTasks(newTasks);
    setProjects(newProjects);
    setProjectMilestones(newMilestones);
    setLearningItems(newLearning);
    setNotes(newNotes);
    setJournals(newJournals);
    setHabits(newHabits);
    setHabitLogs(newLogs);
    setHorizonGoals(horizonToSave);
  };

  const syncWithGoogleDrive = useCallback(async (token: string) => {
    setGoogleDriveSyncing(true);
    setGoogleDriveSyncError(null);
    setSyncStatus("syncing");
    try {
      // 1. Search for lifeos_backup.json on Google Drive
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='lifeos_backup.json'+and+trashed=false&spaces=drive`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!searchRes.ok) {
        throw new Error(`Google Drive search failed: ${searchRes.status}`);
      }

      const searchData = await searchRes.json();
      const files = searchData.files || [];
      const backupFile = files[0];

      let mergedPayload = {
        goals,
        roadmaps,
        roadmapNodes,
        tasks,
        projects,
        projectMilestones,
        learningItems,
        notes,
        journals,
        habits,
        habitLogs,
        horizonGoals,
      };

      const mergeLists = <T extends { id: string; updatedAt?: string; createdAt?: string }>(localList: T[], remoteList: T[]): T[] => {
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

      let fileId = backupFile?.id;

      if (fileId) {
        // 2. Download contents
        const contentRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (contentRes.ok) {
          const remoteData = await contentRes.json();
          mergedPayload = {
            goals: mergeLists(goals, remoteData.goals || []),
            roadmaps: mergeLists(roadmaps, remoteData.roadmaps || []),
            roadmapNodes: mergeLists(roadmapNodes, remoteData.roadmapNodes || []),
            tasks: mergeLists(tasks, remoteData.tasks || []),
            projects: mergeLists(projects, remoteData.projects || []),
            projectMilestones: mergeLists(projectMilestones, remoteData.projectMilestones || []),
            learningItems: mergeLists(learningItems, remoteData.learningItems || []),
            notes: mergeLists(notes, remoteData.notes || []),
            journals: mergeLists(journals, remoteData.journals || []),
            habits: mergeLists(habits, remoteData.habits || []),
            habitLogs: mergeLists(habitLogs, remoteData.habitLogs || []),
            horizonGoals: mergeLists(horizonGoals, remoteData.horizonGoals || []),
          };

          // Save locally
          saveAllLocal(
            mergedPayload.goals,
            mergedPayload.roadmaps,
            mergedPayload.roadmapNodes,
            mergedPayload.tasks,
            mergedPayload.projects,
            mergedPayload.projectMilestones,
            mergedPayload.learningItems,
            mergedPayload.notes,
            mergedPayload.journals,
            mergedPayload.habits,
            mergedPayload.habitLogs,
            new Date().toISOString(),
            mergedPayload.horizonGoals
          );
        }
      }

      // 3. Upload/Update file content on Google Drive
      if (!fileId) {
        // Create file metadata first
        const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "lifeos_backup.json",
            mimeType: "application/json",
          }),
        });
        if (!metaRes.ok) {
          throw new Error("Failed to create file on Google Drive");
        }
        const metaData = await metaRes.json();
        fileId = metaData.id;
      }

      // Upload media content (PATCH)
      const uploadRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mergedPayload),
        }
      );

      if (!uploadRes.ok) {
        throw new Error("Failed to write data content to Google Drive");
      }

      setGoogleDriveConnected(true);
      setGoogleDriveSyncing(false);
      setSyncStatus("synced");
      setRetryCount(0);
    } catch (e: any) {
      console.error("Google Drive sync failed:", e);
      setGoogleDriveSyncError(e.message || "Google Drive sync error");
      setGoogleDriveSyncing(false);
      setSyncStatus("error");
    }
  }, [goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes, journals, habits, habitLogs, horizonGoals]);

  const connectGoogleDrive = useCallback((accessToken: string) => {
    localStorage.setItem("lifeos_google_access_token", accessToken);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour token standard
    localStorage.setItem("lifeos_google_token_expiry", expiry.toISOString());
    setGoogleDriveConnected(true);
    syncWithGoogleDrive(accessToken);
  }, [syncWithGoogleDrive]);

  // Sync function
  const triggerSync = useCallback(async () => {
    const token = localStorage.getItem("lifeos_google_access_token");
    const expiryStr = localStorage.getItem("lifeos_google_token_expiry");

    if (token && expiryStr && new Date(expiryStr) > new Date()) {
      await syncWithGoogleDrive(token);
    } else {
      setGoogleDriveConnected(false);
      setSyncStatus("idle");
    }
  }, [syncWithGoogleDrive]);

  // CRUD Actions helper (saves locally and updates timestamps)
  const saveGoal = (goal: Goal) => {
    const updated = {
      ...goal,
      id: goal.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      createdAt: goal.createdAt || new Date().toISOString(),
    };
    const newGoals = goals.some((g) => g.id === updated.id)
      ? goals.map((g) => (g.id === updated.id ? updated : g))
      : [...goals, updated];

    saveAllLocal(
      newGoals,
      roadmaps,
      roadmapNodes,
      tasks,
      projects,
      projectMilestones,
      learningItems,
      notes,
      journals,
      habits,
      habitLogs
    );
  };

  const saveRoadmap = (roadmap: Roadmap, nodes: RoadmapNode[]) => {
    const updatedRoadmap = {
      ...roadmap,
      id: roadmap.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      createdAt: roadmap.createdAt || new Date().toISOString(),
    };

    const newRoadmaps = roadmaps.some((r) => r.id === updatedRoadmap.id)
      ? roadmaps.map((r) => (r.id === updatedRoadmap.id ? updatedRoadmap : r))
      : [...roadmaps, updatedRoadmap];

    const updatedNodes = nodes.map((n) => ({
      ...n,
      id: n.id || crypto.randomUUID(),
      roadmapId: updatedRoadmap.id,
      updatedAt: new Date().toISOString(),
      createdAt: n.createdAt || new Date().toISOString(),
    }));

    // Remove old nodes of this roadmap and add the new ones
    const filteredNodes = roadmapNodes.filter((n) => n.roadmapId !== updatedRoadmap.id);
    const newNodes = [...filteredNodes, ...updatedNodes];

    saveAllLocal(
      goals,
      newRoadmaps,
      newNodes,
      tasks,
      projects,
      projectMilestones,
      learningItems,
      notes,
      journals,
      habits,
      habitLogs
    );
  };

  const saveTask = (task: Task) => {
    const updated = {
      ...task,
      id: task.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      createdAt: task.createdAt || new Date().toISOString(),
    };
    const newTasks = tasks.some((t) => t.id === updated.id)
      ? tasks.map((t) => (t.id === updated.id ? updated : t))
      : [...tasks, updated];

    saveAllLocal(
      goals,
      roadmaps,
      roadmapNodes,
      newTasks,
      projects,
      projectMilestones,
      learningItems,
      notes,
      journals,
      habits,
      habitLogs
    );
  };

  const saveProject = (project: Project, milestones: ProjectMilestone[]) => {
    const updatedProject = {
      ...project,
      id: project.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      createdAt: project.createdAt || new Date().toISOString(),
    };

    const newProjects = projects.some((p) => p.id === updatedProject.id)
      ? projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
      : [...projects, updatedProject];

    const updatedMilestones = milestones.map((m) => ({
      ...m,
      id: m.id || crypto.randomUUID(),
      projectId: updatedProject.id,
      updatedAt: new Date().toISOString(),
      createdAt: m.createdAt || new Date().toISOString(),
    }));

    const filteredMilestones = projectMilestones.filter((m) => m.projectId !== updatedProject.id);
    const newMilestones = [...filteredMilestones, ...updatedMilestones];

    saveAllLocal(
      goals,
      roadmaps,
      roadmapNodes,
      tasks,
      newProjects,
      newMilestones,
      learningItems,
      notes,
      journals,
      habits,
      habitLogs
    );
  };

  const saveLearningItem = (item: LearningItem) => {
    const updated = {
      ...item,
      id: item.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      createdAt: item.createdAt || new Date().toISOString(),
    };
    const newLearning = learningItems.some((l) => l.id === updated.id)
      ? learningItems.map((l) => (l.id === updated.id ? updated : l))
      : [...learningItems, updated];

    saveAllLocal(
      goals,
      roadmaps,
      roadmapNodes,
      tasks,
      projects,
      projectMilestones,
      newLearning,
      notes,
      journals,
      habits,
      habitLogs
    );
  };

  const saveHorizonGoal = (item: HorizonGoal) => {
    const updated = {
      ...item,
      id: item.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      createdAt: item.createdAt || new Date().toISOString(),
    };
    const newHorizonGoals = horizonGoals.some((h) => h.id === updated.id)
      ? horizonGoals.map((h) => (h.id === updated.id ? updated : h))
      : [...horizonGoals, updated];

    saveAllLocal(
      goals,
      roadmaps,
      roadmapNodes,
      tasks,
      projects,
      projectMilestones,
      learningItems,
      notes,
      journals,
      habits,
      habitLogs,
      undefined,
      newHorizonGoals
    );
  };

  const saveNote = (note: Note) => {
    const updated = {
      ...note,
      id: note.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      createdAt: note.createdAt || new Date().toISOString(),
    };
    const newNotes = notes.some((n) => n.id === updated.id)
      ? notes.map((n) => (n.id === updated.id ? updated : n))
      : [...notes, updated];

    saveAllLocal(
      goals,
      roadmaps,
      roadmapNodes,
      tasks,
      projects,
      projectMilestones,
      learningItems,
      newNotes,
      journals,
      habits,
      habitLogs
    );
  };

  const saveJournal = (journal: Journal) => {
    const updated = {
      ...journal,
      id: journal.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      createdAt: journal.createdAt || new Date().toISOString(),
    };
    const newJournals = journals.some((j) => j.id === updated.id)
      ? journals.map((j) => (j.id === updated.id ? updated : j))
      : [...journals, updated];

    saveAllLocal(
      goals,
      roadmaps,
      roadmapNodes,
      tasks,
      projects,
      projectMilestones,
      learningItems,
      notes,
      newJournals,
      habits,
      habitLogs
    );
  };

  const saveHabit = (habit: Habit, logs?: HabitLog[]) => {
    const updatedHabit = {
      ...habit,
      id: habit.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      createdAt: habit.createdAt || new Date().toISOString(),
    };

    const newHabits = habits.some((h) => h.id === updatedHabit.id)
      ? habits.map((h) => (h.id === updatedHabit.id ? updatedHabit : h))
      : [...habits, updatedHabit];

    let newLogs = habitLogs;
    if (logs) {
      const updatedLogs = logs.map((l) => ({
        ...l,
        id: l.id || crypto.randomUUID(),
        habitId: updatedHabit.id,
        updatedAt: new Date().toISOString(),
        createdAt: l.createdAt || new Date().toISOString(),
      }));

      const filteredLogs = habitLogs.filter((l) => l.habitId !== updatedHabit.id);
      newLogs = [...filteredLogs, ...updatedLogs];
    }

    saveAllLocal(
      goals,
      roadmaps,
      roadmapNodes,
      tasks,
      projects,
      projectMilestones,
      learningItems,
      notes,
      journals,
      newHabits,
      newLogs
    );
  };

  const deleteEntity = (
    type: "goals" | "roadmaps" | "tasks" | "projects" | "learningItems" | "notes" | "journals" | "habits" | "horizonGoals",
    id: string
  ) => {
    // For local delete, we remove it from local state.
    // If it was created offline and never synced, we delete it completely.
    // In a more complex sync, we can mark a flag 'is_deleted' so the server deletes it, but for our scope, simple local filter works great.
    if (type === "goals") saveAllLocal(goals.filter(g => g.id !== id), roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes, journals, habits, habitLogs);
    if (type === "roadmaps") saveAllLocal(goals, roadmaps.filter(r => r.id !== id), roadmapNodes.filter(n => n.roadmapId !== id), tasks, projects, projectMilestones, learningItems, notes, journals, habits, habitLogs);
    if (type === "tasks") saveAllLocal(goals, roadmaps, roadmapNodes, tasks.filter(t => t.id !== id), projects, projectMilestones, learningItems, notes, journals, habits, habitLogs);
    if (type === "projects") saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects.filter(p => p.id !== id), projectMilestones.filter(m => m.projectId !== id), learningItems, notes, journals, habits, habitLogs);
    if (type === "learningItems") saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems.filter(l => l.id !== id), notes, journals, habits, habitLogs);
    if (type === "notes") saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes.filter(n => n.id !== id), journals, habits, habitLogs);
    if (type === "journals") saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes, journals.filter(j => j.id !== id), habits, habitLogs);
    if (type === "habits") saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes, journals, habits.filter(h => h.id !== id), habitLogs.filter(l => l.habitId !== id));
    if (type === "horizonGoals") saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes, journals, habits, habitLogs, undefined, horizonGoals.filter(h => h.id !== id));
  };

  return {
    goals,
    roadmaps,
    roadmapNodes,
    tasks,
    projects,
    projectMilestones,
    learningItems,
    notes,
    journals,
    habits,
    habitLogs,
    horizonGoals,
    syncStatus,
    lastSyncTime,
    retryCount,
    triggerSync,
    saveGoal,
    saveRoadmap,
    saveTask,
    saveProject,
    saveLearningItem,
    saveHorizonGoal,
    saveNote,
    saveJournal,
    saveHabit,
    deleteEntity,
    googleDriveConnected,
    googleDriveSyncing,
    googleDriveSyncError,
    connectGoogleDrive,
  };
}
