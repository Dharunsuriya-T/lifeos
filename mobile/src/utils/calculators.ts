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
  LearningItem,
  DashboardData,
  AnalyticsData,
} from '../types/lifeOs';

export const decrementDateStr = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

export const isDateInRange = (dateStr: string, startStr: string, endStr: string): boolean => {
  return dateStr >= startStr && dateStr <= endStr;
};

export function calculateGoalProgress(
  goal: Goal,
  roadmaps: Roadmap[],
  roadmapNodes: RoadmapNode[],
  tasks: Task[],
  projects: Project[],
  projectMilestones: ProjectMilestone[]
): { progress: number; status: Goal['status'] } {
  const linkedRoadmaps = roadmaps.filter(r => r.goalId === goal.id);
  let totalRoadmapProgress = 0;
  let roadmapCount = 0;

  linkedRoadmaps.forEach(roadmap => {
    const nodes = roadmapNodes.filter(n => n.roadmapId === roadmap.id);
    if (nodes.length > 0) {
      let nodeProgressSum = 0;
      nodes.forEach(node => {
        const nodeTasks = tasks.filter(t => t.roadmapNodeId === node.id);
        let nodeProgress = node.progress || 0;
        if (nodeTasks.length > 0) {
          const completed = nodeTasks.filter(t => t.status === 'DONE').length;
          nodeProgress = Math.round((completed / nodeTasks.length) * 100);
        }
        nodeProgressSum += nodeProgress;
      });
      totalRoadmapProgress += nodeProgressSum / nodes.length;
      roadmapCount++;
    }
  });

  const directTasks = tasks.filter(t => t.goalId === goal.id && !t.roadmapNodeId);
  let tasksProgress = 0;
  const hasDirectTasks = directTasks.length > 0;
  if (hasDirectTasks) {
    const completed = directTasks.filter(t => t.status === 'DONE').length;
    tasksProgress = (completed / directTasks.length) * 100;
  }

  const linkedProjects = projects.filter(p => p.goalId === goal.id);
  let projectsProgress = 0;
  let projectCount = 0;
  linkedProjects.forEach(proj => {
    const milestones = projectMilestones.filter(m => m.projectId === proj.id);
    if (milestones.length > 0) {
      const completed = milestones.filter(m => m.isCompleted).length;
      projectsProgress += (completed / milestones.length) * 100;
      projectCount++;
    }
  });
  if (projectCount > 0) {
    projectsProgress = projectsProgress / projectCount;
  }

  let compositeProgress = 0;
  let denominators = 0;

  if (roadmapCount > 0) {
    compositeProgress += totalRoadmapProgress / roadmapCount;
    denominators++;
  }
  if (hasDirectTasks) {
    compositeProgress += tasksProgress;
    denominators++;
  }
  if (projectCount > 0) {
    compositeProgress += projectsProgress;
    denominators++;
  }

  if (denominators > 0) {
    const finalProgress = Math.round(compositeProgress / denominators);
    const status: Goal['status'] = finalProgress === 100 ? 'COMPLETED' : finalProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    return { progress: finalProgress, status };
  }

  return { progress: goal.progressPercentage || 0, status: goal.status || 'NOT_STARTED' };
}

export function calculateHabitStreak(habitId: string, habitLogs: HabitLog[]): number {
  const completedLogs = Array.from(
    new Set(
      habitLogs
        .filter(log => log.habitId === habitId && log.isCompleted)
        .map(log => log.completedDate)
    )
  ).sort((a, b) => b.localeCompare(a));

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

  const todayTasksCount = tasks.filter(t => {
    if (!t.dueDate) return false;
    const taskDate = t.dueDate.split('T')[0];
    return taskDate <= todayStr && t.status !== 'DONE';
  }).length;

  const completedTasksToday = tasks.filter(t => {
    if (t.status !== 'DONE' || !t.updatedAt) return false;
    return t.updatedAt.startsWith(todayStr);
  }).length;

  const computedGoals = goals.map(g => {
    const { progress, status } = calculateGoalProgress(g, roadmaps, roadmapNodes, tasks, projects, projectMilestones);
    return { ...g, progressPercentage: progress, status };
  });
  const activeGoalsCount = computedGoals.filter(g => g.status !== 'COMPLETED').length;

  const averageGoalProgress = computedGoals.length === 0
    ? 0
    : Math.round(computedGoals.reduce((sum, g) => sum + g.progressPercentage, 0) / computedGoals.length);

  const totalHabits = habits.length;
  let habitCompletionRate = 0;
  if (totalHabits > 0) {
    const completedToday = habits.filter(h =>
      habitLogs.some(log => log.habitId === h.id && log.completedDate === todayStr && log.isCompleted)
    ).length;
    habitCompletionRate = Math.round((completedToday / totalHabits) * 100);
  }

  const journalDates = Array.from(new Set(journals.map(j => j.entryDate))).sort((a, b) => b.localeCompare(a));
  let journalStreak = 0;
  if (journalDates.length > 0) {
    const yesterdayStr = decrementDateStr(todayStr, 1);
    let expected = todayStr;
    if (journalDates[0] !== todayStr) {
      if (journalDates[0] === yesterdayStr) {
        expected = yesterdayStr;
      } else {
        expected = '';
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

  const activeProjectsCount = projects.filter(p => p.status !== 'COMPLETED').length;

  const nextWeekStr = decrementDateStr(todayStr, -7);
  const upcomingDeadlines: DashboardData['upcomingDeadlines'] = [];

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
  learningItems: LearningItem[]
): AnalyticsData {
  const todayStr = new Date().toISOString().split('T')[0];

  const getGrowthScoreForPeriod = (endDay: string): number => {
    const startDay = decrementDateStr(endDay, 6);

    let habitScore = 100;
    if (habits.length > 0) {
      const totalPossible = habits.length * 7;
      const actualCompletions = habits.reduce((sum, h) => {
        return sum + habitLogs.filter(l => l.habitId === h.id && l.isCompleted && isDateInRange(l.completedDate, startDay, endDay)).length;
      }, 0);
      habitScore = (actualCompletions / totalPossible) * 100;
    }

    let taskScore = 100;
    const activeTasks = tasks.filter(t => !t.createdAt || t.createdAt.split('T')[0] <= endDay);
    if (activeTasks.length > 0) {
      const completed = activeTasks.filter(t => t.status === 'DONE' && t.updatedAt && t.updatedAt.split('T')[0] <= endDay).length;
      taskScore = (completed / activeTasks.length) * 100;
    }

    const journalsCount = journals.filter(j => isDateInRange(j.entryDate, startDay, endDay)).length;
    const journalScore = Math.min(100, (journalsCount / 7) * 100);

    let learningScore = 100;
    if (learningItems.length > 0) {
      learningScore = learningItems.reduce((sum, item) => sum + (item.progressPercentage || 0), 0) / learningItems.length;
    }

    return Math.max(0, Math.min(100, Math.round(
      (habitScore * 0.4) + (taskScore * 0.25) + (journalScore * 0.15) + (learningScore * 0.20)
    )));
  };

  const growthScore = getGrowthScoreForPeriod(todayStr);

  const goalEstimatedCompletionDays: Record<string, number> = {};
  goals.forEach(goal => {
    const { status } = calculateGoalProgress(goal, roadmaps, roadmapNodes, tasks, projects, projectMilestones);
    if (status === 'COMPLETED') {
      goalEstimatedCompletionDays[goal.title] = 0;
      return;
    }

    const goalTasks = tasks.filter(t => t.goalId === goal.id);
    if (goalTasks.length === 0) {
      goalEstimatedCompletionDays[goal.title] = 30;
      return;
    }

    const completed = goalTasks.filter(t => t.status === 'DONE').length;
    const remaining = goalTasks.length - completed;
    if (remaining === 0) {
      goalEstimatedCompletionDays[goal.title] = 0;
      return;
    }

    const last14DaysLimit = decrementDateStr(todayStr, 14);
    const completedInLast14 = goalTasks.filter(t =>
      t.status === 'DONE' && t.updatedAt && t.updatedAt.split('T')[0] >= last14DaysLimit
    ).length;

    let tasksPerDay = completedInLast14 / 14;
    if (tasksPerDay <= 0) {
      tasksPerDay = 0.1;
    }

    goalEstimatedCompletionDays[goal.title] = Math.ceil(remaining / tasksPerDay);
  });

  const growthTrends = [];
  for (let i = 5; i >= 0; i--) {
    const label = i === 0 ? 'This Wk' : `Wk -${i}`;
    const dateAtWk = decrementDateStr(todayStr, i * 7);
    growthTrends.push({
      weekLabel: label,
      score: getGrowthScoreForPeriod(dateAtWk),
    });
  }

  const reflectionInsights: string[] = [];
  reflectionInsights.push(`Your composite Growth Score is ${growthScore}% this week. You are making steady progress.`);

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

  const journalCountLast7Days = journals.filter(j => isDateInRange(j.entryDate, decrementDateStr(todayStr, 6), todayStr)).length;
  if (journalCountLast7Days >= 5) {
    reflectionInsights.push(`High reflection rate: You journaled ${journalCountLast7Days} times in the last 7 days. This contributes to high emotional self-awareness.`);
  } else {
    reflectionInsights.push(`Try journaling at least 3 times a week (currently ${journalCountLast7Days} times) to build reflection insights.`);
  }

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
