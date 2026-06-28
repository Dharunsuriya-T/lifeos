import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import type { Task, Goal } from '../types/lifeOs';

interface Props {
  sync: any;
}

const PRIORITIES: Array<Task['priority']> = ['LOW', 'MEDIUM', 'HIGH'];

export default function TasksScreen({ sync }: Props) {
  const { tasks, goals, saveTask, deleteEntity } = sync;

  const [activeTab, setActiveTab] = useState<Task['status']>('TODO');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('MEDIUM');
  const [goalId, setGoalId] = useState<string>('');

  const handleOpenAdd = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setGoalId('');
    setModalVisible(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority || 'MEDIUM');
    setGoalId(task.goalId || '');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const taskData: Task = {
      id: editingTask?.id || 'task_' + Math.random().toString(36).substr(2, 9),
      title,
      description,
      priority,
      status: editingTask?.status || 'TODO',
      goalId: goalId || undefined,
      isRecurring: false,
      estimatedTime: 0,
      actualTime: 0,
      lifeArea: editingTask?.lifeArea || 'Career',
      createdAt: editingTask?.createdAt,
      updatedAt: new Date().toISOString(),
    };

    saveTask(taskData);
    setModalVisible(false);
  };

  const toggleTaskStatus = (task: Task) => {
    saveTask({
      ...task,
      status: task.status === 'DONE' ? 'TODO' : 'DONE',
      updatedAt: new Date().toISOString(),
    });
  };

  const cycleStatus = (task: Task) => {
    let nextStatus: Task['status'] = 'TODO';
    if (task.status === 'TODO') nextStatus = 'IN_PROGRESS';
    else if (task.status === 'IN_PROGRESS') nextStatus = 'DONE';
    
    saveTask({
      ...task,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const filteredTasks = tasks.filter((t: Task) => t.status === activeTab);

  const getPriorityColor = (p: Task['priority']) => {
    if (p === 'HIGH') return '#ef4444';
    if (p === 'MEDIUM') return '#f59e0b';
    return '#10b981';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks System</Text>
          <Text style={styles.subtext}>Organize your personal action list.</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['TODO', 'IN_PROGRESS', 'DONE'] as Task['status'][]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📋 No tasks in this column.</Text>
          </View>
        ) : (
          filteredTasks.map((task: Task) => {
            const goal = goals.find((g: Goal) => g.id === task.goalId);
            return (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <TouchableOpacity onPress={() => toggleTaskStatus(task)} style={styles.checkbox}>
                    <View style={task.status === 'DONE' ? styles.checkboxChecked : styles.checkboxUnchecked} />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, task.status === 'DONE' && styles.taskTitleDone]}>
                      {task.title}
                    </Text>
                    {task.description ? <Text style={styles.taskDesc}>{task.description}</Text> : null}
                  </View>
                  <TouchableOpacity 
                    style={[styles.cycleBtn, { borderColor: getPriorityColor(task.priority) }]}
                    onPress={() => cycleStatus(task)}
                  >
                    <Text style={[styles.cycleBtnText, { color: getPriorityColor(task.priority) }]}>
                      {task.status === 'TODO' ? 'Start' : task.status === 'IN_PROGRESS' ? 'Complete' : 'Reopen'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {goal || task.priority ? (
                  <View style={styles.cardFooter}>
                    {goal ? <Text style={styles.goalTag}>🎯 {goal.title}</Text> : null}
                    <Text style={[styles.priorityTag, { color: getPriorityColor(task.priority) }]}>
                      {task.priority}
                    </Text>
                    <View style={{ flexGrow: 1 }} />
                    <TouchableOpacity onPress={() => handleOpenEdit(task)} style={styles.footerAction}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteEntity('tasks', task.id)} style={styles.footerAction}>
                      <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Task Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Write project specifications"
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
                placeholder="Details about the task..."
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.pickerRow}>
                {PRIORITIES.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pickerBtn, priority === p && styles.pickerBtnActive]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.pickerBtnText, priority === p && styles.pickerBtnTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Link to Goal (Optional)</Text>
              <ScrollView style={styles.goalsScroll} nestedScrollEnabled>
                <TouchableOpacity
                  style={[styles.goalSelectBtn, goalId === '' && styles.goalSelectBtnActive]}
                  onPress={() => setGoalId('')}
                >
                  <Text style={[styles.goalSelectText, goalId === '' && styles.goalSelectTextActive]}>
                    No linked goal
                  </Text>
                </TouchableOpacity>
                {goals.map((g: Goal) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.goalSelectBtn, goalId === g.id && styles.goalSelectBtnActive]}
                    onPress={() => setGoalId(g.id)}
                  >
                    <Text style={[styles.goalSelectText, goalId === g.id && styles.goalSelectTextActive]} numberOfLines={1}>
                      🎯 {g.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Task</Text>
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
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#131b2d',
    padding: 6,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#6366f1',
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  taskCard: {
    backgroundColor: '#131b2d',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#6366f1',
  },
  taskTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  taskDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  cycleBtn: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cycleBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
    gap: 8,
  },
  goalTag: {
    color: '#ec4899',
    fontSize: 11,
    fontWeight: '600',
  },
  priorityTag: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  footerAction: {
    paddingHorizontal: 6,
  },
  actionText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  pickerBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  pickerBtnTextActive: {
    color: '#ffffff',
  },
  goalsScroll: {
    maxHeight: 100,
    backgroundColor: '#090d16',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  goalSelectBtn: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  goalSelectBtnActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  goalSelectText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  goalSelectTextActive: {
    color: '#6366f1',
    fontWeight: 'bold',
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
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
