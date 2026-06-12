export type GoalPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: GoalPriority;
  status: GoalStatus;
  progressPercentage: number;
  targetDate?: string;
  lifeArea: string;
  motivation: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Roadmap {
  id: string;
  goalId?: string;
  title: string;
  description: string;
  isTemplate: boolean;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type RoadmapNodeStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  parentNodeId?: string;
  title: string;
  description: string;
  resources: string;
  status: RoadmapNodeStatus;
  orderIndex: number;
  deadline?: string;
  progress: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

export interface Project {
  id: string;
  goalId?: string;
  title: string;
  description: string;
  status: ProjectStatus;
  deadline?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  isCompleted: boolean;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type LearningType = 'COURSE' | 'BOOK' | 'CERTIFICATION' | 'TOPIC' | 'RESOURCE';
export type LearningStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface LearningItem {
  id: string;
  goalId?: string;
  roadmapNodeId?: string;
  title: string;
  description: string;
  type: LearningType;
  status: LearningStatus;
  progressPercentage: number;
  totalLessonsPages?: number;
  completedLessonsPages?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BACKLOG';

export interface Task {
  id: string;
  goalId?: string;
  projectId?: string;
  roadmapNodeId?: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  isRecurring: boolean;
  recurrencePattern?: string;
  parentTaskId?: string;
  estimatedTime: number;
  actualTime: number;
  lifeArea: string;
  dependencyIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type HorizonPeriod = "WEEKLY" | "MONTHLY" | "YEARLY";

export interface HorizonGoal {
  id: string;
  goalId?: string; // Optional link to main Goal
  title: string;
  period: HorizonPeriod;
  status: "TODO" | "DONE";
  targetDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Note {
  id: string;
  goalId?: string;
  taskId?: string;
  projectId?: string;
  roadmapNodeId?: string;
  learningItemId?: string;
  title: string;
  content: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Journal {
  id: string;
  entryDate: string; // YYYY-MM-DD
  wins: string;
  challenges: string;
  lessonsLearned: string;
  gratitude: string;
  mood: string;
  energyLevel: string;
  createdAt?: string;
  updatedAt?: string;
}

export type HabitFrequency = 'DAILY' | 'WEEKLY';

export interface Habit {
  id: string;
  title: string;
  description: string;
  frequency: HabitFrequency;
  streak: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  completedDate: string; // YYYY-MM-DD
  isCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncRequest {
  lastSyncTime?: string;
  goals: Goal[];
  roadmaps: Roadmap[];
  roadmapNodes: RoadmapNode[];
  tasks: Task[];
  projects: Project[];
  projectMilestones: ProjectMilestone[];
  learningItems: LearningItem[];
  notes: Note[];
  journals: Journal[];
  habits: Habit[];
  habitLogs: HabitLog[];
}

export interface SyncResponse {
  syncTime: string;
  goals: Goal[];
  roadmaps: Roadmap[];
  roadmapNodes: RoadmapNode[];
  tasks: Task[];
  projects: Project[];
  projectMilestones: ProjectMilestone[];
  learningItems: LearningItem[];
  notes: Note[];
  journals: Journal[];
  habits: Habit[];
  habitLogs: HabitLog[];
}

export interface DashboardData {
  todayTasksCount: number;
  completedTasksToday: number;
  activeGoalsCount: number;
  averageGoalProgress: number;
  habitCompletionRate: number;
  journalStreak: number;
  activeProjectsCount: number;
  upcomingDeadlines: Array<{
    title: string;
    type: 'TASK' | 'PROJECT' | 'ROADMAP_NODE';
    deadline: string;
  }>;
}

export interface AnalyticsData {
  growthScore: number;
  goalEstimatedCompletionDays: Record<string, number>;
  growthTrends: Array<{
    weekLabel: string;
    score: number;
  }>;
  reflectionInsights: string[];
}
