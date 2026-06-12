import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import type { Goal } from '../types/lifeOs';
import { calculateGoalProgress } from '../utils/calculators';

interface Props {
  sync: any;
}

const LIFE_AREAS = ["Career", "Health & Fitness", "Finance", "Learning", "Relationships", "Personal Development"];

const getGoalStructure = (goal: Goal): "SIMPLE" | "CHECKLIST" | "HIERARCHICAL" | "ROADMAP" => {
  if (goal.description?.includes("[Structure: SIMPLE]")) return "SIMPLE";
  if (goal.description?.includes("[Structure: CHECKLIST]")) return "CHECKLIST";
  if (goal.description?.includes("[Structure: HIERARCHICAL]")) return "HIERARCHICAL";
  if (goal.description?.includes("[Structure: ROADMAP]")) return "ROADMAP";
  return "SIMPLE";
};

const getCleanDescription = (goal: Goal): string => {
  if (!goal.description) return "";
  return goal.description.replace(/\[Structure: (SIMPLE|CHECKLIST|HIERARCHICAL|ROADMAP)\]\s*/, "");
};

const getRemainingDays = (targetDate?: string) => {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const today = new Date();
  target.setHours(23, 59, 59, 999);
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getAllocatedDays = (createdAt?: string, targetDate?: string) => {
  if (!targetDate) return null;
  const start = createdAt ? new Date(createdAt) : new Date();
  const target = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  target.setHours(23, 59, 59, 999);
  const diffTime = target.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};


export default function GoalsScreen({ sync }: Props) {
  const { goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, saveGoal, deleteEntity } = sync;

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lifeArea, setLifeArea] = useState(LIFE_AREAS[0]);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [motivation, setMotivation] = useState('');
  const [structureType, setStructureType] = useState<'SIMPLE' | 'CHECKLIST' | 'HIERARCHICAL' | 'ROADMAP'>('SIMPLE');

  // Expanded Workspace States
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState<{[key: string]: string}>({});

  // Subgoal Tree Modals
  const [subgoalModalVisible, setSubgoalModalVisible] = useState(false);
  const [subgoalTitle, setSubgoalTitle] = useState("");
  const [subgoalParentId, setSubgoalParentId] = useState<string | undefined>(undefined);
  const [subgoalGoalId, setSubgoalGoalId] = useState("");

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setLifeArea(LIFE_AREAS[0]);
    setPriority('MEDIUM');
    setMotivation('');
    setStructureType('SIMPLE');
    setModalVisible(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(getCleanDescription(goal));
    setLifeArea(goal.lifeArea || LIFE_AREAS[0]);
    setPriority(goal.priority || 'MEDIUM');
    setMotivation(goal.motivation || '');
    setStructureType(getGoalStructure(goal));
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const goalData: Goal = {
      id: editingGoal?.id || 'goal_' + Math.random().toString(36).substr(2, 9),
      title,
      description: `[Structure: ${structureType}] ${description}`,
      lifeArea,
      priority,
      status: editingGoal?.status || 'NOT_STARTED',
      progressPercentage: editingGoal?.progressPercentage || 0,
      motivation,
      createdAt: editingGoal?.createdAt,
      updatedAt: new Date().toISOString(),
    };

    saveGoal(goalData);
    setModalVisible(false);
  };

  const handleAutoRescheduleMilestones = (goalId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const goalMilestones = tasks
      .filter((t: any) => t.goalId === goalId && t.title.startsWith("[Milestone]") && t.dueDate && t.status !== "DONE")
      .sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || ""));

    if (goalMilestones.length === 0) return;

    let shiftDays = 0;
    const updatedTasks: any[] = [];

    goalMilestones.forEach((milestone: any) => {
      const milestoneDate = new Date(milestone.dueDate!);
      milestoneDate.setHours(0, 0, 0, 0);

      if (shiftDays > 0) {
        const newDate = new Date(milestoneDate);
        newDate.setDate(newDate.getDate() + shiftDays);
        updatedTasks.push({
          ...milestone,
          dueDate: newDate.toISOString().replace(".000Z", "").split(".")[0],
          updatedAt: new Date().toISOString(),
        });
      } else if (milestoneDate < today) {
        const diffTime = today.getTime() - milestoneDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          shiftDays = diffDays;
          const newDate = new Date(milestoneDate);
          newDate.setDate(newDate.getDate() + shiftDays);
          updatedTasks.push({
            ...milestone,
            dueDate: newDate.toISOString().replace(".000Z", "").split(".")[0],
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });

    if (updatedTasks.length > 0) {
      updatedTasks.forEach((task) => sync.saveTask(task));
      alert(`GPS Reschedule: Milestone delay detected! Shifting remaining milestones forward by ${shiftDays} days.`);
    }
  };

  const toggleExpandGoal = (goalId: string) => {
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null);
    } else {
      setExpandedGoalId(goalId);
      handleAutoRescheduleMilestones(goalId);
    }
  };

  const handleAddChecklistTask = (goalId: string) => {
    const text = newChecklistText[goalId];
    if (!text || !text.trim()) return;

    sync.saveTask({
      id: 'task_' + Math.random().toString(36).substr(2, 9),
      goalId,
      title: text.trim(),
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      isRecurring: false,
      estimatedTime: 0,
      actualTime: 0,
      lifeArea: "Personal Development",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setNewChecklistText({ ...newChecklistText, [goalId]: "" });
  };

  const handleSaveSubgoal = () => {
    if (!subgoalTitle.trim() || !subgoalGoalId) return;
    
    sync.saveTask({
      id: 'task_' + Math.random().toString(36).substr(2, 9),
      goalId: subgoalGoalId,
      parentTaskId: subgoalParentId,
      title: subgoalTitle.trim(),
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      isRecurring: false,
      estimatedTime: 0,
      actualTime: 0,
      lifeArea: "Personal Development",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    setSubgoalTitle("");
    setSubgoalModalVisible(false);
  };

  const renderTreeNodes = (goalId: string, parentTaskId: string | undefined, depth: number = 0) => {
    const childTasks = tasks.filter(
      (t: any) => t.goalId === goalId && !t.title.startsWith("[Milestone]") && t.parentTaskId === parentTaskId
    );
    if (childTasks.length === 0) return null;

    return (
      <View style={{ marginLeft: depth > 0 ? 12 : 0, borderLeftWidth: depth > 0 ? 1 : 0, borderLeftColor: '#334155', paddingLeft: depth > 0 ? 8 : 0 }}>
        {childTasks.map((task: any) => (
          <View key={task.id} style={{ marginVertical: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                onPress={() => sync.saveTask({
                  ...task,
                  status: task.status === 'DONE' ? 'TODO' : 'DONE',
                  updatedAt: new Date().toISOString()
                })}
              >
                <View style={[styles.checkboxTiny, task.status === 'DONE' && styles.checkboxTinyChecked]} />
                <Text style={[styles.subgoalText, task.status === 'DONE' && styles.lineThrough]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.treeAddBtn}
                onPress={() => {
                  setSubgoalParentId(task.id);
                  setSubgoalGoalId(goalId);
                  setSubgoalModalVisible(true);
                }}
              >
                <Text style={styles.treeAddBtnText}>+ Sub</Text>
              </TouchableOpacity>
            </View>
            {renderTreeNodes(goalId, task.id, depth + 1)}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Goals System</Text>
          <Text style={styles.subtext}>Define target transformations.</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No goals defined yet.</Text>
            <TouchableOpacity style={styles.createBtn} onPress={handleOpenAdd}>
              <Text style={styles.createBtnText}>Create first goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal: Goal) => {
            const { progress, status } = calculateGoalProgress(
              goal,
              roadmaps,
              roadmapNodes,
              tasks,
              projects,
              projectMilestones
            );

            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.tagRow}>
                    <Text style={styles.tag}>{goal.lifeArea}</Text>
                    <Text style={[
                      styles.statusTag,
                      status === 'COMPLETED' && styles.statusCompleted,
                      status === 'IN_PROGRESS' && styles.statusInProgress
                    ]}>
                      {status.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleOpenEdit(goal)} style={styles.actionBtn}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteEntity('goals', goal.id)} style={styles.actionBtn}>
                      <Text style={[styles.actionText, { color: '#ef4444' }]}>Del</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.goalTitle}>{goal.title}</Text>
                {goal.description ? <Text style={styles.goalDesc}>{getCleanDescription(goal)}</Text> : null}
                {goal.motivation ? (
                  <View style={styles.motivationBox}>
                    <Text style={styles.motivationText}>" {goal.motivation} "</Text>
                  </View>
                ) : null}

                {goal.targetDate ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                    {(() => {
                      const remaining = getRemainingDays(goal.targetDate);
                      const allocated = getAllocatedDays(goal.createdAt, goal.targetDate);
                      return (
                        <>
                          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                            {remaining !== null ? `${remaining} days remaining` : ''}
                            {allocated !== null ? ` (of ${allocated} total)` : ''}
                          </Text>
                          <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' }}>
                            Target: {new Date(goal.targetDate).toLocaleDateString()}
                          </Text>
                        </>
                      );
                    })()}
                  </View>
                ) : null}

                <View style={styles.progressSection}>

                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressValue}>{progress}%</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                  </View>
                </View>

                {/* Open Goal Space Button */}
                <TouchableOpacity
                  style={styles.workspaceBtn}
                  onPress={() => toggleExpandGoal(goal.id)}
                >
                  <Text style={styles.workspaceBtnText}>
                    {expandedGoalId === goal.id ? "Close Goal Space ▲" : "Open Goal Space ▼"}
                  </Text>
                </TouchableOpacity>

                {/* Expanded Goal Space Panel */}
                {expandedGoalId === goal.id && (
                  <View style={styles.expandedWorkspace}>
                    {(() => {
                      const structure = getGoalStructure(goal);
                      if (structure === "CHECKLIST") {
                        const goalTasks = tasks.filter((t: any) => t.goalId === goal.id && !t.title.startsWith("[Milestone]"));
                        return (
                          <View style={styles.workspaceSection}>
                            <Text style={styles.workspaceSectionTitle}>Checklist Items</Text>
                            {goalTasks.length === 0 ? (
                              <Text style={styles.emptyTextTiny}>No items. Add one below!</Text>
                            ) : (
                              goalTasks.map((t: any) => (
                                <View key={t.id} style={styles.checkItemRow}>
                                  <TouchableOpacity
                                    style={styles.checkboxTiny}
                                    onPress={() => sync.saveTask({
                                      ...t,
                                      status: t.status === 'DONE' ? 'TODO' : 'DONE',
                                      updatedAt: new Date().toISOString()
                                    })}
                                  >
                                    <View style={t.status === 'DONE' ? styles.checkboxTinyChecked : styles.checkboxTinyUnchecked} />
                                  </TouchableOpacity>
                                  <Text style={[styles.checkItemText, t.status === 'DONE' && styles.lineThrough]}>{t.title}</Text>
                                </View>
                              ))
                            )}
                            <View style={styles.addInputRow}>
                              <TextInput
                                style={styles.tinyInput}
                                placeholder="Add checklist item..."
                                placeholderTextColor="#64748b"
                                value={newChecklistText[goal.id] || ""}
                                onChangeText={(text) => setNewChecklistText({ ...newChecklistText, [goal.id]: text })}
                              />
                              <TouchableOpacity
                                style={styles.tinyAddBtn}
                                onPress={() => handleAddChecklistTask(goal.id)}
                              >
                                <Text style={styles.tinyAddBtnText}>Add</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      } else if (structure === "HIERARCHICAL") {
                        return (
                          <View style={styles.workspaceSection}>
                            <Text style={styles.workspaceSectionTitle}>Sub-goals Tree</Text>
                            {renderTreeNodes(goal.id, undefined)}
                            <TouchableOpacity
                              style={styles.addRootBtn}
                              onPress={() => {
                                setSubgoalParentId(undefined);
                                setSubgoalGoalId(goal.id);
                                setSubgoalModalVisible(true);
                              }}
                            >
                              <Text style={styles.addRootBtnText}>+ Add Root Sub-goal</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      } else if (structure === "ROADMAP") {
                        const goalRoadmaps = roadmaps.filter((r: any) => r.goalId === goal.id);
                        return (
                          <View style={styles.workspaceSection}>
                            <Text style={styles.workspaceSectionTitle}>Linked Roadmaps</Text>
                            {goalRoadmaps.length === 0 ? (
                              <Text style={styles.emptyTextTiny}>No linked roadmaps.</Text>
                            ) : (
                              goalRoadmaps.map((r: any) => (
                                <View key={r.id} style={styles.roadmapItemRow}>
                                  <Text style={styles.roadmapItemTitle}>{r.title}</Text>
                                  <Text style={styles.roadmapItemActive}>Active Path</Text>
                                </View>
                              ))
                            )}
                          </View>
                        );
                      } else {
                        // SIMPLE (Default)
                        const goalTasks = tasks.filter((t: any) => t.goalId === goal.id && !t.title.startsWith("[Milestone]"));
                        const milestones = tasks.filter((t: any) => t.goalId === goal.id && t.title.startsWith("[Milestone]"));
                        return (
                          <View style={styles.workspaceSection}>
                            {/* Milestones */}
                            <Text style={styles.workspaceSectionTitle}>Milestones</Text>
                            {milestones.length === 0 ? (
                              <Text style={styles.emptyTextTiny}>No milestones defined.</Text>
                            ) : (
                              milestones.map((m: any) => (
                                <View key={m.id} style={styles.checkItemRow}>
                                  <TouchableOpacity
                                    style={styles.checkboxTiny}
                                    onPress={() => sync.saveTask({
                                      ...m,
                                      status: m.status === 'DONE' ? 'TODO' : 'DONE',
                                      updatedAt: new Date().toISOString()
                                    })}
                                  >
                                    <View style={m.status === 'DONE' ? styles.checkboxTinyChecked : styles.checkboxTinyUnchecked} />
                                  </TouchableOpacity>
                                  <Text style={[styles.checkItemText, m.status === 'DONE' && styles.lineThrough]}>
                                    {m.title.replace("[Milestone] ", "")} {m.dueDate ? `(${m.dueDate.split("T")[0]})` : ""}
                                  </Text>
                                </View>
                              ))
                            )}

                            {/* Checklist */}
                            <Text style={[styles.workspaceSectionTitle, { marginTop: 12 }]}>Sub-goals</Text>
                            {goalTasks.length === 0 ? (
                              <Text style={styles.emptyTextTiny}>No sub-goals. Add one below!</Text>
                            ) : (
                              goalTasks.map((t: any) => (
                                <View key={t.id} style={styles.checkItemRow}>
                                  <TouchableOpacity
                                    style={styles.checkboxTiny}
                                    onPress={() => sync.saveTask({
                                      ...t,
                                      status: t.status === 'DONE' ? 'TODO' : 'DONE',
                                      updatedAt: new Date().toISOString()
                                    })}
                                  >
                                    <View style={t.status === 'DONE' ? styles.checkboxTinyChecked : styles.checkboxTinyUnchecked} />
                                  </TouchableOpacity>
                                  <Text style={[styles.checkItemText, t.status === 'DONE' && styles.lineThrough]}>{t.title}</Text>
                                </View>
                              ))
                            )}
                            <View style={styles.addInputRow}>
                              <TextInput
                                style={styles.tinyInput}
                                placeholder="Add subgoal..."
                                placeholderTextColor="#64748b"
                                value={newChecklistText[goal.id] || ""}
                                onChangeText={(text) => setNewChecklistText({ ...newChecklistText, [goal.id]: text })}
                              />
                              <TouchableOpacity
                                style={styles.tinyAddBtn}
                                onPress={() => handleAddChecklistTask(goal.id)}
                              >
                                <Text style={styles.tinyAddBtnText}>Add</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      }
                    })()}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Goal Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingGoal ? 'Edit Goal' : 'New Goal'}</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Run a Marathon"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
                placeholder="Explain what success looks like..."
                placeholderTextColor="#64748b"
              />
            </View>

            {!editingGoal && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Goal Structure</Text>
                <View style={styles.pickerRow}>
                  {['SIMPLE', 'CHECKLIST', 'HIERARCHICAL', 'ROADMAP'].map(struct => (
                    <TouchableOpacity
                      key={struct}
                      style={[styles.pickerBtn, structureType === struct && styles.pickerBtnActive]}
                      onPress={() => setStructureType(struct as any)}
                    >
                      <Text style={[styles.pickerBtnText, structureType === struct && styles.pickerBtnTextActive]}>{struct}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Life Area</Text>
              <View style={styles.pickerRow}>
                {LIFE_AREAS.slice(0, 3).map(area => (
                  <TouchableOpacity
                    key={area}
                    style={[styles.pickerBtn, lifeArea === area && styles.pickerBtnActive]}
                    onPress={() => setLifeArea(area)}
                  >
                    <Text style={[styles.pickerBtnText, lifeArea === area && styles.pickerBtnTextActive]}>{area}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.pickerRow, { marginTop: 8 }]}>
                {LIFE_AREAS.slice(3).map(area => (
                  <TouchableOpacity
                    key={area}
                    style={[styles.pickerBtn, lifeArea === area && styles.pickerBtnActive]}
                    onPress={() => setLifeArea(area)}
                  >
                    <Text style={[styles.pickerBtnText, lifeArea === area && styles.pickerBtnTextActive]}>{area}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Motivation / Core Why</Text>
              <TextInput
                style={styles.input}
                value={motivation}
                onChangeText={setMotivation}
                placeholder="Why do you want to achieve this?"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subgoal Tree Modal */}
      <Modal visible={subgoalModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '80%', padding: 20 }]}>
            <Text style={styles.modalTitle}>Add Sub-goal</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={subgoalTitle}
                onChangeText={setSubgoalTitle}
                placeholder="Enter subgoal title..."
                placeholderTextColor="#64748b"
              />
            </View>
            <View style={[styles.modalActions, { marginTop: 16 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setSubgoalTitle(""); setSubgoalModalVisible(false); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSubgoal}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  createBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: '#a855f7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#a855f7',
    fontWeight: 'bold',
  },
  goalCard: {
    backgroundColor: '#131b2d',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    color: '#ec4899',
    fontSize: 10,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
    textTransform: 'uppercase',
  },
  statusTag: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
    textTransform: 'uppercase',
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
  },
  statusInProgress: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    color: '#a855f7',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  goalDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  motivationBox: {
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
    padding: 10,
    borderRadius: 4,
  },
  motivationText: {
    color: '#a855f7',
    fontStyle: 'italic',
    fontSize: 12,
  },
  progressSection: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#131b2d',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  input: {
    height: 40,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#f8fafc',
    fontSize: 14,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerBtn: {
    flex: 1,
    height: 32,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBtnActive: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  pickerBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  pickerBtnTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#a855f7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  workspaceBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  workspaceBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  expandedWorkspace: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
    marginTop: 8,
    gap: 12,
  },
  workspaceSection: {
    gap: 8,
  },
  workspaceSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginBottom: 4,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  checkboxTiny: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxTinyUnchecked: {
    width: 10,
    height: 10,
  },
  checkboxTinyChecked: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#a855f7',
  },
  checkItemText: {
    color: '#f8fafc',
    fontSize: 13,
    flex: 1,
  },
  lineThrough: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tinyInput: {
    flex: 1,
    height: 32,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 8,
    color: '#f8fafc',
    fontSize: 12,
  },
  tinyAddBtn: {
    backgroundColor: '#a855f7',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tinyAddBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subgoalText: {
    color: '#f8fafc',
    fontSize: 13,
    marginLeft: 6,
  },
  treeAddBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#1e293b',
  },
  treeAddBtnText: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: '600',
  },
  addRootBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  addRootBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  roadmapItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
  },
  roadmapItemTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  roadmapItemActive: {
    color: '#a855f7',
    fontSize: 10,
  },
  emptyTextTiny: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
