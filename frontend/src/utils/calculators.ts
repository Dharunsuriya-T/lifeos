import type {
  Goal,
  Roadmap,
  RoadmapNode,
  Task,
  Project,
  ProjectMilestone,
  Habit,
  HabitLog,
  Journal,
  DashboardData,
  AnalyticsData,
  HorizonGoal,
} from '../types/lifeOs';

// Helper to decrement dates
export const decrementDateStr = (dateStr: string, days: number): string => {
  const parts = dateStr.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Helper to check if a date is within a date range inclusive
export const isDateInRange = (dateStr: string, startStr: string, endStr: string): boolean => {
  return dateStr >= startStr && dateStr <= endStr;
};

export function calculateNodeProgress(
  nodeId: string,
  roadmapNodes: RoadmapNode[],
  tasks: Task[]
): number {
  const childNodes = roadmapNodes.filter(n => n.parentNodeId === nodeId);
  if (childNodes.length > 0) {
    const sumProgress = childNodes.reduce((sum, child) => {
      return sum + calculateNodeProgress(child.id, roadmapNodes, tasks);
    }, 0);
    return Math.round(sumProgress / childNodes.length);
  }

  // Leaf node: check tasks (subgoals + milestones)
  const nodeTasks = tasks.filter(t => t.roadmapNodeId === nodeId);
  if (nodeTasks.length > 0) {
    const completed = nodeTasks.filter(t => t.status === 'DONE').length;
    return Math.round((completed / nodeTasks.length) * 100);
  }

  // No children and no tasks: return based on status
  const node = roadmapNodes.find(n => n.id === nodeId);
  if (node) {
    if (node.status === 'COMPLETED') return 100;
    if (node.status === 'IN_PROGRESS') return 50;
  }
  return 0;
}

// 1. Goal Progress Calculation
export function calculateGoalProgress(
  goal: Goal,
  roadmaps: Roadmap[],
  roadmapNodes: RoadmapNode[],
  tasks: Task[],
  _projects: Project[],
  _projectMilestones: ProjectMilestone[]
): { progress: number; status: Goal['status'] } {
  const linkedRoadmaps = roadmaps.filter(r => r.goalId === goal.id);
  
  if (linkedRoadmaps.length > 0) {
    let totalRoadmapProgress = 0;
    let roadmapCount = 0;

    linkedRoadmaps.forEach(roadmap => {
      const nodes = roadmapNodes.filter(n => n.roadmapId === roadmap.id);
      const rootNodes = nodes.filter(n => !n.parentNodeId);

      if (rootNodes.length > 0) {
        const sumRootProgress = rootNodes.reduce((sum, rootNode) => {
          return sum + calculateNodeProgress(rootNode.id, nodes, tasks);
        }, 0);
        totalRoadmapProgress += sumRootProgress / rootNodes.length;
        roadmapCount++;
      }
    });

    if (roadmapCount > 0) {
      const finalProgress = Math.round(totalRoadmapProgress / roadmapCount);
      const status: Goal['status'] = finalProgress === 100 ? 'COMPLETED' : finalProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
      return { progress: finalProgress, status };
    }
  }

  // Fallback to direct tasks if no roadmaps exist
  const directTasks = tasks.filter(t => t.goalId === goal.id);
  if (directTasks.length > 0) {
    const completed = directTasks.filter(t => t.status === 'DONE').length;
    const finalProgress = Math.round((completed / directTasks.length) * 100);
    const status: Goal['status'] = finalProgress === 100 ? 'COMPLETED' : finalProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    return { progress: finalProgress, status };
  }

  return { progress: goal.progressPercentage || 0, status: goal.status || 'NOT_STARTED' };
}

// 2. Habit Streak Calculation
export function calculateHabitStreak(habitId: string, habitLogs: HabitLog[]): number {
  const completedLogs = Array.from(
    new Set(
      habitLogs
        .filter(log => log.habitId === habitId && log.isCompleted)
        .map(log => log.completedDate)
    )
  ).sort((a, b) => b.localeCompare(a)); // Sort descending

  if (completedLogs.length === 0) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = decrementDateStr(todayStr, 1);

  let expected = todayStr;
  if (completedLogs[0] !== todayStr) {
    if (completedLogs[0] === yesterdayStr) {
      expected = yesterdayStr;
    } else {
      return 0;
    }
  }

  let streak = 0;
  for (const logDate of completedLogs) {
    if (logDate === expected) {
      streak++;
      expected = decrementDateStr(expected, 1);
    } else if (logDate < expected) {
      break;
    }
  }
  return streak;
}

// 3. DashboardData Calculation
export function calculateDashboardData(
  goals: Goal[],
  roadmaps: Roadmap[],
  roadmapNodes: RoadmapNode[],
  tasks: Task[],
  projects: Project[],
  projectMilestones: ProjectMilestone[],
  habits: Habit[],
  habitLogs: HabitLog[],
  journals: Journal[]
): DashboardData {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. todayTasksCount: t.dueDate <= today and t.status !== 'DONE'
  const todayTasksCount = tasks.filter(t => {
    if (!t.dueDate) return false;
    const taskDate = t.dueDate.split('T')[0];
    return taskDate <= todayStr && t.status !== 'DONE';
  }).length;

  // 2. completedTasksToday: t.status === 'DONE' and t.updatedAt is today
  const completedTasksToday = tasks.filter(t => {
    if (t.status !== 'DONE' || !t.updatedAt) return false;
    return t.updatedAt.startsWith(todayStr);
  }).length;

  // 3. activeGoalsCount: status !== 'COMPLETED'
  const computedGoals = goals.map(g => {
    const { progress, status } = calculateGoalProgress(g, roadmaps, roadmapNodes, tasks, projects, projectMilestones);
    return { ...g, progressPercentage: progress, status };
  });
  const activeGoalsCount = computedGoals.filter(g => g.status !== 'COMPLETED').length;

  // 4. averageGoalProgress: average of all goals
  const averageGoalProgress = computedGoals.length === 0
    ? 0
    : Math.round(computedGoals.reduce((sum, g) => sum + g.progressPercentage, 0) / computedGoals.length);

  // 5. habitCompletionRate: (completed habits today / total habits) * 100
  const totalHabits = habits.length;
  let habitCompletionRate = 0;
  if (totalHabits > 0) {
    const completedToday = habits.filter(h =>
      habitLogs.some(log => log.habitId === h.id && log.completedDate === todayStr && log.isCompleted)
    ).length;
    habitCompletionRate = Math.round((completedToday / totalHabits) * 100);
  }

  // 6. journalStreak
  const journalDates = Array.from(new Set(journals.map(j => j.entryDate))).sort((a, b) => b.localeCompare(a));
  let journalStreak = 0;
  if (journalDates.length > 0) {
    const yesterdayStr = decrementDateStr(todayStr, 1);
    let expected = todayStr;
    if (journalDates[0] !== todayStr) {
      if (journalDates[0] === yesterdayStr) {
        expected = yesterdayStr;
      } else {
        expected = ''; // streak is 0
      }
    }

    if (expected) {
      for (const jDate of journalDates) {
        if (jDate === expected) {
          journalStreak++;
          expected = decrementDateStr(expected, 1);
        } else if (jDate < expected) {
          break;
        }
      }
    }
  }

  // 7. activeProjectsCount
  const activeProjectsCount = projects.filter(p => p.status !== 'COMPLETED').length;

  // 8. upcomingDeadlines
  const nextWeekStr = decrementDateStr(todayStr, -7);
  const upcomingDeadlines: DashboardData['upcomingDeadlines'] = [];

  // Tasks
  tasks.forEach(t => {
    if (t.dueDate && t.status !== 'DONE') {
      const dDate = t.dueDate.split('T')[0];
      if (dDate >= todayStr && dDate <= nextWeekStr) {
        upcomingDeadlines.push({
          title: t.title,
          type: 'TASK',
          deadline: t.dueDate,
        });
      }
    }
  });

  // Projects
  projects.forEach(p => {
    if (p.deadline && p.status !== 'COMPLETED') {
      const dDate = p.deadline.split('T')[0];
      if (dDate >= todayStr && dDate <= nextWeekStr) {
        upcomingDeadlines.push({
          title: p.title,
          type: 'PROJECT',
          deadline: p.deadline,
        });
      }
    }
  });

  // Roadmap Nodes
  roadmapNodes.forEach(rn => {
    if (rn.deadline && rn.status !== 'COMPLETED') {
      const dDate = rn.deadline.split('T')[0];
      if (dDate >= todayStr && dDate <= nextWeekStr) {
        upcomingDeadlines.push({
          title: rn.title,
          type: 'ROADMAP_NODE',
          deadline: rn.deadline,
        });
      }
    }
  });

  upcomingDeadlines.sort((a, b) => a.deadline.localeCompare(b.deadline));

  return {
    todayTasksCount,
    completedTasksToday,
    activeGoalsCount,
    averageGoalProgress,
    habitCompletionRate,
    journalStreak,
    activeProjectsCount,
    upcomingDeadlines: upcomingDeadlines.slice(0, 5)
  };
}

// 4. AnalyticsData Calculation
export function calculateAnalyticsData(
  goals: Goal[],
  roadmaps: Roadmap[],
  roadmapNodes: RoadmapNode[],
  tasks: Task[],
  projects: Project[],
  projectMilestones: ProjectMilestone[],
  habits: Habit[],
  habitLogs: HabitLog[],
  journals: Journal[],
  horizonGoals: HorizonGoal[]
): AnalyticsData {
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to calculate Growth Score for a given time window
  const getGrowthScoreForPeriod = (endDay: string): number => {
    const startDay = decrementDateStr(endDay, 6); // 7-day window

    // 1. Habit score
    let habitScore = 0;
    let habitActive = false;
    const activeHabits = habits.filter(h => !h.createdAt || h.createdAt.split('T')[0] <= endDay);
    if (activeHabits.length > 0) {
      habitActive = true;
      const totalPossible = activeHabits.length * 7;
      const actualCompletions = activeHabits.reduce((sum, h) => {
        return sum + habitLogs.filter(l => l.habitId === h.id && l.isCompleted && isDateInRange(l.completedDate, startDay, endDay)).length;
      }, 0);
      habitScore = (actualCompletions / totalPossible) * 100;
    }

    // 2. Task score
    let taskScore = 0;
    let taskActive = false;
    const activeTasks = tasks.filter(t => !t.createdAt || t.createdAt.split('T')[0] <= endDay);
    if (activeTasks.length > 0) {
      taskActive = true;
      const completed = activeTasks.filter(t => t.status === 'DONE' && (!t.updatedAt || t.updatedAt.split('T')[0] <= endDay)).length;
      taskScore = (completed / activeTasks.length) * 100;
    }

    // 3. Journal score
    let journalScore = 0;
    let journalActive = false;
    const activeJournals = journals.filter(j => !j.createdAt || j.createdAt.split('T')[0] <= endDay);
    if (activeJournals.length > 0) {
      journalActive = true;
      const journalsCount = activeJournals.filter(j => isDateInRange(j.entryDate, startDay, endDay)).length;
      journalScore = Math.min(100, (journalsCount / 7) * 100);
    }

    // 4. Horizon goals score
    let horizonScore = 0;
    let horizonActive = false;
    const activeHorizon = horizonGoals.filter(g => !g.createdAt || g.createdAt.split('T')[0] <= endDay);
    if (activeHorizon.length > 0) {
      horizonActive = true;
      const completed = activeHorizon.filter(g => g.status === 'DONE' && (!g.updatedAt || g.updatedAt.split('T')[0] <= endDay)).length;
      horizonScore = (completed / activeHorizon.length) * 100;
    }

    let sumWeights = 0;
    let weightedScoreSum = 0;

    if (habitActive) {
      sumWeights += 0.40;
      weightedScoreSum += habitScore * 0.40;
    }
    if (taskActive) {
      sumWeights += 0.25;
      weightedScoreSum += taskScore * 0.25;
    }
    if (journalActive) {
      sumWeights += 0.15;
      weightedScoreSum += journalScore * 0.15;
    }
    if (horizonActive) {
      sumWeights += 0.20;
      weightedScoreSum += horizonScore * 0.20;
    }

    if (sumWeights === 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(weightedScoreSum / sumWeights)));
  };

  const growthScore = getGrowthScoreForPeriod(todayStr);

  // Goal Completion Estimates
  const goalEstimatedCompletionDays: Record<string, number> = {};
  goals.forEach(goal => {
    const { status } = calculateGoalProgress(goal, roadmaps, roadmapNodes, tasks, projects, projectMilestones);
    if (status === 'COMPLETED') {
      goalEstimatedCompletionDays[goal.title] = 0;
      return;
    }

    const goalTasks = tasks.filter(t => t.goalId === goal.id);
    if (goalTasks.length === 0) {
      goalEstimatedCompletionDays[goal.title] = 30; // Default placeholder for no tasks
      return;
    }

    const completed = goalTasks.filter(t => t.status === 'DONE').length;
    const remaining = goalTasks.length - completed;
    if (remaining === 0) {
      goalEstimatedCompletionDays[goal.title] = 0;
      return;
    }

    // Task completions in the last 14 days
    const last14DaysLimit = decrementDateStr(todayStr, 14);
    const completedInLast14 = goalTasks.filter(t =>
      t.status === 'DONE' && (t.updatedAt || t.createdAt) && (t.updatedAt || t.createdAt)!.split('T')[0] >= last14DaysLimit
    ).length;

    let tasksPerDay = completedInLast14 / 14;
    if (tasksPerDay <= 0) {
      tasksPerDay = 0.1; // Default to 1 task per 10 days
    }

    goalEstimatedCompletionDays[goal.title] = Math.ceil(remaining / tasksPerDay);
  });

  // Growth Trends
  const growthTrends = [];
  for (let i = 5; i >= 0; i--) {
    const label = i === 0 ? 'This Wk' : `Wk -${i}`;
    const dateAtWk = decrementDateStr(todayStr, i * 7);
    growthTrends.push({
      weekLabel: label,
      score: getGrowthScoreForPeriod(dateAtWk),
    });
  }

  // Reflection Insights
  const reflectionInsights: string[] = [];
  reflectionInsights.push(`Your composite Growth Score is ${growthScore}% this week. You are making steady progress.`);

  // Habit insights
  if (habits.length > 0) {
    const startDay = decrementDateStr(todayStr, 6);
    const actualCompletions = habits.reduce((sum, h) => {
      return sum + habitLogs.filter(l => l.habitId === h.id && l.isCompleted && isDateInRange(l.completedDate, startDay, todayStr)).length;
    }, 0);
    const habitRate = Math.round((actualCompletions / (habits.length * 7)) * 100);

    if (habitRate > 80) {
      reflectionInsights.push(`Excellent habit consistency! You completed ${habitRate}% of your habits this week.`);
    } else {
      reflectionInsights.push(`Increasing your daily habit completions (${habitRate}% currently) can significantly accelerate your growth score.`);
    }
  } else {
    reflectionInsights.push(`Try defining some daily habits to establish consistency and structure in your routine.`);
  }

  // Journal insights
  const journalCountLast7Days = journals.filter(j => isDateInRange(j.entryDate, decrementDateStr(todayStr, 6), todayStr)).length;
  if (journalCountLast7Days >= 5) {
    reflectionInsights.push(`High reflection rate: You journaled ${journalCountLast7Days} times in the last 7 days. This contributes to high emotional self-awareness.`);
  } else {
    reflectionInsights.push(`Try journaling at least 3 times a week (currently ${journalCountLast7Days} times) to build reflection insights.`);
  }

  // Mood insight
  if (journals.length > 0) {
    const moodSum = journals.reduce((sum, j) => sum + parseFloat(j.mood || '3'), 0);
    const avgMood = moodSum / journals.length;
    reflectionInsights.push(`Your average mood score is ${avgMood.toFixed(1)}/5. Streaks are stable.`);
  }

  return {
    growthScore,
    goalEstimatedCompletionDays,
    growthTrends,
    reflectionInsights,
  };
}
