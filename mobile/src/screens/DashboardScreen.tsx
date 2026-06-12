import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Share, Modal } from 'react-native';
import type { Task, Journal } from '../types/lifeOs';
import { calculateDashboardData } from '../utils/calculators';

interface Props {
  sync: any;
  onNavigate: (screen: string) => void;
}

export default function DashboardScreen({ sync, onNavigate }: Props) {
  const [quickWin, setQuickWin] = useState('');
  const [quickWinSaved, setQuickWinSaved] = useState(false);
  const [wrappedVisible, setWrappedVisible] = useState(false);

  const [newTargetTitle, setNewTargetTitle] = useState('');
  const [newTargetPeriod, setNewTargetPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('WEEKLY');
  const [newTargetGoalId, setNewTargetGoalId] = useState('');

  const {
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
    saveHorizonGoal,
    syncStatus,
    triggerSync,
    saveTask,
    saveJournal,
  } = sync;

  const handleAddTarget = () => {
    if (!newTargetTitle.trim()) return;
    saveHorizonGoal({
      id: 'horizon_' + Math.random().toString(36).substr(2, 9),
      title: newTargetTitle.trim(),
      period: newTargetPeriod,
      status: 'TODO',
      goalId: newTargetGoalId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewTargetTitle('');
    setNewTargetGoalId('');
  };

  const dbData = calculateDashboardData(
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

  const handleToggleTask = (task: Task) => {
    saveTask({
      ...task,
      status: task.status === 'DONE' ? 'TODO' : 'DONE',
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveQuickWin = () => {
    if (!quickWin.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    const existingJournal = journals.find((j: Journal) => j.entryDate === today);
    
    const journalData: Journal = {
      id: existingJournal?.id || 'journal_' + Math.random().toString(36).substr(2, 9),
      entryDate: today,
      wins: existingJournal?.wins 
        ? `${existingJournal.wins}\n- ${quickWin}` 
        : `- ${quickWin}`,
      challenges: existingJournal?.challenges || '',
      lessonsLearned: existingJournal?.lessonsLearned || '',
      gratitude: existingJournal?.gratitude || '',
      mood: existingJournal?.mood || '4',
      energyLevel: existingJournal?.energyLevel || '4',
    };

    saveJournal(journalData);
    setQuickWin('');
    setQuickWinSaved(true);
    setTimeout(() => setQuickWinSaved(false), 3000);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasksListRaw = tasks.filter(
    (t: Task) => (!t.dueDate || t.dueDate.startsWith(todayStr)) && t.status !== 'DONE'
  );
  const priorityOrder: Record<string, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
  const todayTasksList = [...todayTasksListRaw].sort((a, b) => {
    const pA = priorityOrder[a.priority] || 2;
    const pB = priorityOrder[b.priority] || 2;
    return pA - pB;
  });


  const getSyncLabel = () => {
    if (syncStatus === 'syncing') return 'Synchronizing...';
    if (syncStatus === 'synced') return 'Synced with server';
    if (syncStatus === 'error') return 'Offline mode';
    return 'Local Changes';
  };

  const getWeekRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getWrappedStats = () => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // 1. Journal Wins & Lessons
    const weeklyJournals = journals.filter((j: any) => {
      const entryDate = new Date(j.entryDate);
      return entryDate >= sevenDaysAgo && entryDate <= now;
    });

    const winsList = weeklyJournals.map((j: any) => j.wins).filter(Boolean);
    const lessonsList = weeklyJournals.map((j: any) => j.lessonsLearned).filter(Boolean);
    const gratitudeList = weeklyJournals.map((j: any) => j.gratitude).filter(Boolean);

    // 2. Tasks completed
    const completedTasksCount = tasks.filter((t: any) => {
      if (t.status !== "DONE") return false;
      if (!t.updatedAt) return true;
      const completedDate = new Date(t.updatedAt);
      return completedDate >= sevenDaysAgo && completedDate <= now;
    }).length;

    // 3. Habits stats
    const weeklyLogs = habitLogs.filter((l: any) => {
      const logDate = new Date(l.completedDate);
      return logDate >= sevenDaysAgo && logDate <= now;
    });
    const completedHabitsCount = weeklyLogs.filter((l: any) => l.isCompleted).length;
    const totalLogsCount = weeklyLogs.length;
    const habitCompletionRate = totalLogsCount > 0 ? Math.round((completedHabitsCount / totalLogsCount) * 100) : 0;

    return {
      wins: winsList.length > 0 ? winsList : ["Self-reflection and continuous tracking"],
      lessons: lessonsList.length > 0 ? lessonsList : ["Patience and consistent effort are key to progress"],
      gratitude: gratitudeList.length > 0 ? gratitudeList : ["My health, career journey, and personal growth"],
      completedTasksCount,
      habitCompletionRate,
      weekRange: getWeekRange()
    };
  };

  const handleShareReport = (stats: any) => {
    const text = `WEEKLY GROWTH WRAPPED
Date Range: ${stats.weekRange}

Key Metrics:
- Tasks Completed: ${stats.completedTasksCount}
- Habit Completion Rate: ${stats.habitCompletionRate}%

Biggest Wins:
${stats.wins.map((w: string) => `- ${w}`).join("\n")}

Lessons Learned:
${stats.lessons.map((l: string) => `- ${l}`).join("\n")}

Gratitude:
${stats.gratitude.map((g: string) => `- ${g}`).join("\n")}

Powered by LifeOS`;

    Share.share({ message: text });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtext}>Here is your growth overview today.</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.syncButton,
              syncStatus === 'syncing' && styles.syncing,
              syncStatus === 'synced' && styles.synced,
              syncStatus === 'error' && styles.syncError
            ]}
            onPress={triggerSync}
          >
            <Text style={styles.syncButtonText}>{getSyncLabel()}</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Wrapped Callout Banner */}
        <View style={styles.wrappedBanner}>
          <Text style={styles.wrappedBannerText}>Ready to see this week's growth index?</Text>
          <TouchableOpacity style={styles.wrappedBannerBtn} onPress={() => setWrappedVisible(true)}>
            <Text style={styles.wrappedBannerBtnText}>Weekly Wrapped</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Goals Active</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{dbData.activeGoalsCount}</Text>
              <Text style={styles.statSubValue}>avg {dbData.averageGoalProgress}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${dbData.averageGoalProgress}%` }]} />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today's Tasks</Text>
            <Text style={styles.statValue}>{dbData.todayTasksCount}</Text>
            <Text style={styles.statSubText}>{dbData.completedTasksToday} completed today</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Habits</Text>
            <Text style={styles.statValue}>{dbData.habitCompletionRate}%</Text>
            <Text style={styles.statSubText}>completed today</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Reflection</Text>
            <Text style={[styles.statValue, { color: '#ec4899' }]}>{dbData.journalStreak}d</Text>
            <Text style={styles.statSubText}>journal streak</Text>
          </View>
        </View>

        {/* Focus Tasks Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Focus Tasks</Text>
            <TouchableOpacity onPress={() => onNavigate('Tasks')}>
              <Text style={styles.manageLink}>Manage</Text>
            </TouchableOpacity>
          </View>

          {todayTasksList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>All caught up! No tasks left for today.</Text>
            </View>
          ) : (
            todayTasksList.map((task: Task) => (
              <View key={task.id} style={styles.taskItem}>
                <TouchableOpacity style={styles.checkbox} onPress={() => handleToggleTask(task)}>
                  <View style={task.status === 'DONE' ? styles.checkboxChecked : styles.checkboxUnchecked} />
                </TouchableOpacity>
                <View style={styles.taskTextContainer}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.description ? <Text style={styles.taskDesc}>{task.description}</Text> : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Horizon Targets Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Horizon Targets</Text>
          
          {/* Add Inline Target Form */}
          <View style={{ gap: 8, marginVertical: 8 }}>
            <TextInput
              style={styles.input}
              placeholder="Add a new target..."
              placeholderTextColor="#94a3b8"
              value={newTargetTitle}
              onChangeText={setNewTargetTitle}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Period Selector Buttons */}
              {(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: newTargetPeriod === period ? '#a855f7' : '#1e293b',
                    backgroundColor: newTargetPeriod === period ? 'rgba(168, 85, 247, 0.1)' : '#090d16',
                    alignItems: 'center',
                  }}
                  onPress={() => setNewTargetPeriod(period)}
                >
                  <Text style={{ color: newTargetPeriod === period ? '#a855f7' : '#94a3b8', fontSize: 11, fontWeight: 'bold' }}>
                    {period === 'WEEKLY' ? 'Weekly' : period === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Link to Goal Selector */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: !newTargetGoalId ? '#a855f7' : '#1e293b',
                      backgroundColor: !newTargetGoalId ? 'rgba(168, 85, 247, 0.1)' : '#090d16',
                    }}
                    onPress={() => setNewTargetGoalId('')}
                  >
                    <Text style={{ color: !newTargetGoalId ? '#a855f7' : '#94a3b8', fontSize: 10 }}>No Link</Text>
                  </TouchableOpacity>
                  {goals.map((g: any) => (
                    <TouchableOpacity
                      key={g.id}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: newTargetGoalId === g.id ? '#a855f7' : '#1e293b',
                        backgroundColor: newTargetGoalId === g.id ? 'rgba(168, 85, 247, 0.1)' : '#090d16',
                      }}
                      onPress={() => setNewTargetGoalId(g.id)}
                    >
                      <Text style={{ color: newTargetGoalId === g.id ? '#a855f7' : '#94a3b8', fontSize: 10 }}>{g.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: '#a855f7',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={handleAddTarget}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* List Periods & Targets */}
          {(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((period) => {
            const periodItems = (horizonGoals || []).filter((g: any) => g.period === period);
            const completedCount = periodItems.filter((g: any) => g.status === 'DONE').length;
            const progressPercent = periodItems.length > 0 ? (completedCount / periodItems.length) * 100 : 0;
            const label = period === 'WEEKLY' ? 'Weekly' : period === 'MONTHLY' ? 'Monthly' : 'Yearly';

            return (
              <View key={period} style={{ marginTop: 12, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#f8fafc', fontSize: 13, fontWeight: 'bold' }}>
                    {label} Targets ({completedCount}/{periodItems.length})
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11 }}>{Math.round(progressPercent)}%</Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progressPercent}%`, backgroundColor: period === 'WEEKLY' ? '#a855f7' : period === 'MONTHLY' ? '#06b6d4' : '#8b5cf6' }]} />
                </View>

                {periodItems.map((item: any) => {
                  const linkedGoal = goals.find((g: any) => g.id === item.goalId);
                  return (
                    <View key={item.id} style={[styles.taskItem, { paddingVertical: 8, paddingHorizontal: 10, marginTop: 4, justifyContent: 'space-between' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <TouchableOpacity
                          style={styles.checkbox}
                          onPress={() => {
                            saveHorizonGoal({
                              ...item,
                              status: item.status === 'DONE' ? 'TODO' : 'DONE',
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                        >
                          <View style={item.status === 'DONE' ? styles.checkboxChecked : styles.checkboxUnchecked} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#f8fafc', fontSize: 12.5, textDecorationLine: item.status === 'DONE' ? 'line-through' : 'none' }}>
                            {item.title}
                          </Text>
                          {linkedGoal ? (
                            <Text style={{ color: '#64748b', fontSize: 9.5, marginTop: 2 }}>
                              Linked Goal: {linkedGoal.title}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => {
                          sync.deleteEntity('horizonGoals', item.id);
                        }}
                      >
                        <Text style={{ color: '#ef4444', fontSize: 12, paddingHorizontal: 6 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Record Win */}
        <View style={styles.winDeadlinesRow}>
          <View style={[styles.sectionCard, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Record Win</Text>
            <View style={styles.winInputRow}>
              <TextInput
                style={styles.input}
                placeholder="Record a win today..."
                placeholderTextColor="#94a3b8"
                value={quickWin}
                onChangeText={setQuickWin}
              />
              <TouchableOpacity style={styles.saveWinButton} onPress={handleSaveQuickWin}>
                <Text style={styles.saveWinButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
            {quickWinSaved && (
              <Text style={styles.successMessage}>Win saved to journal!</Text>
            )}
          </View>
        </View>

        {/* Upcoming Deadlines */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
          {dbData.upcomingDeadlines.length === 0 ? (
            <Text style={styles.emptyText}>No deadlines in the next 7 days.</Text>
          ) : (
            dbData.upcomingDeadlines.map((deadline: any, idx: number) => (
              <View key={idx} style={styles.deadlineItem}>
                <View>
                  <Text style={styles.deadlineTitle}>{deadline.title}</Text>
                  <Text style={styles.deadlineType}>{deadline.type}</Text>
                </View>
                <Text style={styles.deadlineDate}>
                  {new Date(deadline.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Weekly Growth Wrapped Modal */}
      <Modal visible={wrappedVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.wrappedContent}>
            <View style={styles.wrappedHeader}>
              <Text style={styles.wrappedTitle}>Weekly Growth Wrapped</Text>
              <TouchableOpacity onPress={() => setWrappedVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {(() => {
              const stats = getWrappedStats();
              return (
                <ScrollView contentContainerStyle={styles.wrappedBody}>
                  <Text style={styles.wrappedRange}>{stats.weekRange}</Text>

                  <View style={styles.wrappedStatsRow}>
                    <View style={styles.wrappedStatBox}>
                      <Text style={styles.wrappedStatNumber}>{stats.completedTasksCount}</Text>
                      <Text style={styles.wrappedStatLabel}>Tasks Done</Text>
                    </View>
                    <View style={styles.wrappedStatBox}>
                      <Text style={styles.wrappedStatNumber}>{stats.habitCompletionRate}%</Text>
                      <Text style={styles.wrappedStatLabel}>Habits Kept</Text>
                    </View>
                  </View>

                  <View style={styles.wrappedSection}>
                    <Text style={styles.wrappedSectionTitle}>Highlight Wins</Text>
                    {stats.wins.map((win: string, i: number) => (
                      <Text key={i} style={styles.wrappedListItem}>• {win}</Text>
                    ))}
                  </View>

                  <View style={styles.wrappedSection}>
                    <Text style={styles.wrappedSectionTitle}>Lessons Learned</Text>
                    {stats.lessons.map((lesson: string, i: number) => (
                      <Text key={i} style={styles.wrappedListItem}>• {lesson}</Text>
                    ))}
                  </View>

                  <View style={styles.wrappedSection}>
                    <Text style={styles.wrappedSectionTitle}>Gratitude</Text>
                    {stats.gratitude.map((grat: string, i: number) => (
                      <Text key={i} style={styles.wrappedListItem}>• {grat}</Text>
                    ))}
                  </View>

                  <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareReport(stats)}>
                    <Text style={styles.shareBtnText}>Share Report</Text>
                  </TouchableOpacity>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  content: {
    padding: 20,
    paddingTop: 40,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    fontFamily: 'System',
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 13,
  },
  syncButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  syncing: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  synced: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  syncError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  syncButtonText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#131b2d',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  statSubValue: {
    fontSize: 10,
    color: '#10b981',
  },
  statSubText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 3,
  },
  sectionCard: {
    backgroundColor: '#131b2d',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  manageLink: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    backgroundColor: '#090d16',
    gap: 12,
  },
  checkbox: {
    padding: 4,
  },
  checkboxUnchecked: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94a3b8',
  },
  checkboxChecked: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#a855f7',
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  taskDesc: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  winDeadlinesRow: {
    flexDirection: 'row',
  },
  winInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#f8fafc',
    fontSize: 13,
  },
  saveWinButton: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveWinButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  successMessage: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  deadlineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  deadlineTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  deadlineType: {
    color: '#94a3b8',
    fontSize: 9,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  deadlineDate: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  wrappedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#131b2d',
    borderWidth: 1,
    borderColor: '#3b0764',
    borderRadius: 12,
    padding: 12,
    marginTop: -4,
  },
  wrappedBannerText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  wrappedBannerBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#a855f7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  wrappedBannerBtnText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
  },
  wrappedContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  wrappedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 16,
    marginBottom: 12,
  },
  wrappedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  wrappedBody: {
    gap: 16,
  },
  wrappedRange: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '600',
  },
  wrappedStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  wrappedStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  wrappedStatNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  wrappedStatLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  wrappedSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  wrappedSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fbbf24',
    textTransform: 'uppercase',
  },
  wrappedListItem: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
  },
  shareBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
