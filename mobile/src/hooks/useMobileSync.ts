import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncWithServer } from '../api/lifeOsApi';
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
  SyncRequest,
  HorizonGoal,
} from '../types/lifeOs';

export function useMobileSync() {
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

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadLocalData = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedGoals = await AsyncStorage.getItem('lifeos_goals');
      const storedRoadmaps = await AsyncStorage.getItem('lifeos_roadmaps');
      const storedNodes = await AsyncStorage.getItem('lifeos_roadmap_nodes');
      const storedTasks = await AsyncStorage.getItem('lifeos_tasks');
      const storedProjects = await AsyncStorage.getItem('lifeos_projects');
      const storedMilestones = await AsyncStorage.getItem('lifeos_project_milestones');
      const storedLearning = await AsyncStorage.getItem('lifeos_learning_items');
      const storedNotes = await AsyncStorage.getItem('lifeos_notes');
      const storedJournals = await AsyncStorage.getItem('lifeos_journals');
      const storedHabits = await AsyncStorage.getItem('lifeos_habits');
      const storedLogs = await AsyncStorage.getItem('lifeos_habit_logs');
      const storedHorizonGoals = await AsyncStorage.getItem('lifeos_horizon_goals');
      const storedLastSync = await AsyncStorage.getItem('lifeos_last_sync_time');

      if (storedGoals) setGoals(JSON.parse(storedGoals));
      if (storedRoadmaps) setRoadmaps(JSON.parse(storedRoadmaps));
      if (storedNodes) setRoadmapNodes(JSON.parse(storedNodes));
      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedProjects) setProjects(JSON.parse(storedProjects));
      if (storedMilestones) setProjectMilestones(JSON.parse(storedMilestones));
      if (storedLearning) setLearningItems(JSON.parse(storedLearning));
      if (storedNotes) setNotes(JSON.parse(storedNotes));
      if (storedJournals) setJournals(JSON.parse(storedJournals));
      if (storedHabits) setHabits(JSON.parse(storedHabits));
      if (storedLogs) setHabitLogs(JSON.parse(storedLogs));
      if (storedHorizonGoals) setHorizonGoals(JSON.parse(storedHorizonGoals));
      if (storedLastSync) setLastSyncTime(storedLastSync);
    } catch (e) {
      console.error('Failed to load local data', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

  const saveAllLocal = async (
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
    try {
      const horizonToSave = newHorizonGoals !== undefined ? newHorizonGoals : horizonGoals;
      await AsyncStorage.multiSet([
        ['lifeos_goals', JSON.stringify(newGoals)],
        ['lifeos_roadmaps', JSON.stringify(newRoadmaps)],
        ['lifeos_roadmap_nodes', JSON.stringify(newNodes)],
        ['lifeos_tasks', JSON.stringify(newTasks)],
        ['lifeos_projects', JSON.stringify(newProjects)],
        ['lifeos_project_milestones', JSON.stringify(newMilestones)],
        ['lifeos_learning_items', JSON.stringify(newLearning)],
        ['lifeos_notes', JSON.stringify(newNotes)],
        ['lifeos_journals', JSON.stringify(newJournals)],
        ['lifeos_habits', JSON.stringify(newHabits)],
        ['lifeos_habit_logs', JSON.stringify(newLogs)],
        ['lifeos_horizon_goals', JSON.stringify(horizonToSave)],
      ]);
      if (syncTime) {
        await AsyncStorage.setItem('lifeos_last_sync_time', syncTime);
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
    } catch (e) {
      console.error('Failed to save data locally', e);
    }
  };

  const triggerSync = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const localLastSync = await AsyncStorage.getItem('lifeos_last_sync_time');

      const filterUpdated = <T extends { updatedAt?: string; createdAt?: string }>(list: T[]): T[] => {
        if (!localLastSync) return list;
        return list.filter((item) => {
          const itemTime = item.updatedAt || item.createdAt;
          return !itemTime || new Date(itemTime) > new Date(localLastSync);
        });
      };

      const requestPayload: SyncRequest = {
        lastSyncTime: localLastSync || undefined,
        goals: filterUpdated(goals),
        roadmaps: filterUpdated(roadmaps),
        roadmapNodes: filterUpdated(roadmapNodes),
        tasks: filterUpdated(tasks),
        projects: filterUpdated(projects),
        projectMilestones: filterUpdated(projectMilestones),
        learningItems: filterUpdated(learningItems),
        notes: filterUpdated(notes),
        journals: filterUpdated(journals),
        habits: filterUpdated(habits),
        habitLogs: filterUpdated(habitLogs),
      };

      const response = await syncWithServer(requestPayload);

      const mergeLists = <T extends { id: string }>(localList: T[], serverList: T[]): T[] => {
        const mergedMap = new Map(localList.map((item) => [item.id, item]));
        serverList.forEach((item) => mergedMap.set(item.id, item));
        return Array.from(mergedMap.values());
      };

      const updatedGoals = mergeLists(goals, response.goals);
      const updatedRoadmaps = mergeLists(roadmaps, response.roadmaps);
      const updatedNodes = mergeLists(roadmapNodes, response.roadmapNodes);
      const updatedTasks = mergeLists(tasks, response.tasks);
      const updatedProjects = mergeLists(projects, response.projects);
      const updatedMilestones = mergeLists(projectMilestones, response.projectMilestones);
      const updatedLearning = mergeLists(learningItems, response.learningItems);
      const updatedNotes = mergeLists(notes, response.notes);
      const updatedJournals = mergeLists(journals, response.journals);
      const updatedHabits = mergeLists(habits, response.habits);
      const updatedLogs = mergeLists(habitLogs, response.habitLogs);

      await saveAllLocal(
        updatedGoals,
        updatedRoadmaps,
        updatedNodes,
        updatedTasks,
        updatedProjects,
        updatedMilestones,
        updatedLearning,
        updatedNotes,
        updatedJournals,
        updatedHabits,
        updatedLogs,
        response.syncTime
      );

      setSyncStatus('synced');
    } catch (e) {
      console.error('Sync failed, operating in offline-first mode', e);
      setSyncStatus('error');
    }
  }, [goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes, journals, habits, habitLogs]);

  const saveGoal = async (goal: Goal) => {
    const updated = {
      ...goal,
      id: goal.id || 'goal_' + Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
      createdAt: goal.createdAt || new Date().toISOString(),
    };
    const newGoals = goals.some((g) => g.id === updated.id)
      ? goals.map((g) => (g.id === updated.id ? updated : g))
      : [...goals, updated];

    await saveAllLocal(
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

  const saveTask = async (task: Task) => {
    const updated = {
      ...task,
      id: task.id || 'task_' + Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
      createdAt: task.createdAt || new Date().toISOString(),
    };
    const newTasks = tasks.some((t) => t.id === updated.id)
      ? tasks.map((t) => (t.id === updated.id ? updated : t))
      : [...tasks, updated];

    await saveAllLocal(
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

  const saveHorizonGoal = async (item: HorizonGoal) => {
    const updated = {
      ...item,
      id: item.id || 'horizon_' + Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
      createdAt: item.createdAt || new Date().toISOString(),
    };
    const newHorizonGoals = horizonGoals.some((h) => h.id === updated.id)
      ? horizonGoals.map((h) => (h.id === updated.id ? updated : h))
      : [...horizonGoals, updated];

    await saveAllLocal(
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

  const saveJournal = async (journal: Journal) => {
    const updated = {
      ...journal,
      id: journal.id || 'journal_' + Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
      createdAt: journal.createdAt || new Date().toISOString(),
    };
    const newJournals = journals.some((j) => j.id === updated.id)
      ? journals.map((j) => (j.id === updated.id ? updated : j))
      : [...journals, updated];

    await saveAllLocal(
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

  const saveHabit = async (habit: Habit, logs?: HabitLog[]) => {
    const updatedHabit = {
      ...habit,
      id: habit.id || 'habit_' + Math.random().toString(36).substr(2, 9),
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
        id: l.id || 'log_' + Math.random().toString(36).substr(2, 9),
        habitId: updatedHabit.id,
        updatedAt: new Date().toISOString(),
        createdAt: l.createdAt || new Date().toISOString(),
      }));

      const filteredLogs = habitLogs.filter((l) => l.habitId !== updatedHabit.id);
      newLogs = [...filteredLogs, ...updatedLogs];
    }

    await saveAllLocal(
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

  const deleteEntity = async (
    type: 'goals' | 'roadmaps' | 'tasks' | 'projects' | 'learningItems' | 'notes' | 'journals' | 'habits' | 'horizonGoals',
    id: string
  ) => {
    if (type === 'goals') await saveAllLocal(goals.filter(g => g.id !== id), roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes, journals, habits, habitLogs);
    if (type === 'roadmaps') await saveAllLocal(goals, roadmaps.filter(r => r.id !== id), roadmapNodes.filter(n => n.roadmapId !== id), tasks, projects, projectMilestones, learningItems, notes, journals, habits, habitLogs);
    if (type === 'tasks') await saveAllLocal(goals, roadmaps, roadmapNodes, tasks.filter(t => t.id !== id), projects, projectMilestones, learningItems, notes, journals, habits, habitLogs);
    if (type === 'projects') await saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects.filter(p => p.id !== id), projectMilestones.filter(m => m.projectId !== id), learningItems, notes, journals, habits, habitLogs);
    if (type === 'learningItems') await saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems.filter(l => l.id !== id), notes, journals, habits, habitLogs);
    if (type === 'notes') await saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes.filter(n => n.id !== id), journals, habits, habitLogs);
    if (type === 'journals') await saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes, journals.filter(j => j.id !== id), habits, habitLogs);
    if (type === 'habits') await saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes, journals, habits.filter(h => h.id !== id), habitLogs.filter(l => l.habitId !== id));
    if (type === 'horizonGoals') await saveAllLocal(goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, learningItems, notes, journals, habits, habitLogs, undefined, horizonGoals.filter(h => h.id !== id));
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
    isLoading,
    triggerSync,
    saveGoal,
    saveTask,
    saveJournal,
    saveHabit,
    saveHorizonGoal,
    deleteEntity,
  };
}
