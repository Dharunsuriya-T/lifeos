import { useState } from "react";
import type { Habit, HabitLog, HabitFrequency } from "../types/lifeOs";

interface Props {
  habits: Habit[];
  habitLogs: HabitLog[];
  saveHabit: (habit: Habit, logs?: HabitLog[]) => void;
  deleteHabit: (type: "habits", id: string) => void;
}

export function HabitsTab({ habits, habitLogs, saveHabit, deleteHabit }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<HabitFrequency>("DAILY");

  // Generate last 7 days labels
  const getLast7Days = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d);
    }
    return list;
  };

  const last7Days = getLast7Days();

  const handleOpenAdd = () => {
    setEditingHabit(null);
    setTitle("");
    setDescription("");
    setFrequency("DAILY");
    setShowModal(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setDescription(habit.description || "");
    setFrequency(habit.frequency);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const habitData: Habit = {
      id: editingHabit?.id || crypto.randomUUID(),
      title,
      description,
      frequency,
      streak: editingHabit?.streak || 0,
      createdAt: editingHabit?.createdAt,
    };

    saveHabit(habitData);
    setShowModal(false);
  };

  const isHabitCompletedOnDate = (habitId: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return habitLogs.some((l) => l.habitId === habitId && l.completedDate === dateStr && l.isCompleted);
  };

  const toggleHabitOnDate = (habit: Habit, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const existingLog = habitLogs.find((l) => l.habitId === habit.id && l.completedDate === dateStr);
    
    const isCompleted = existingLog ? !existingLog.isCompleted : true;
    const logData: HabitLog = {
      id: existingLog?.id || crypto.randomUUID(),
      habitId: habit.id,
      completedDate: dateStr,
      isCompleted,
      createdAt: existingLog?.createdAt,
    };

    saveHabit(habit, [logData]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div className="header-row">
        <div className="title-section">
          <h1>Habits System</h1>
          <p>Configure daily behaviors, check off completions, and build momentum streaks.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + New Habit
        </button>
      </div>

      {/* Habits Checklist Grid */}
      {habits.length === 0 ? (
        <div className="card" style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <span style={{ fontSize: "40px" }}>⚡</span>
          <h3 style={{ marginTop: "16px" }}>No habits tracked yet</h3>
          <p style={{ margin: "8px 0 20px" }}>Add simple recurring habits to automate your personal transformation routines.</p>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            Create Habit
          </button>
        </div>
      ) : (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="habit-grid-container">
            {/* Header dates label */}
            <div className="habit-row" style={{ borderBottom: "2px solid var(--surface-border)", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px" }}>
              <span style={{ flexGrow: 1 }}>Habit Routines</span>
              <div className="habit-week-completion">
                {last7Days.map((d, i) => (
                  <div key={i} style={{ width: "34px", textAlign: "center", textTransform: "uppercase" }}>
                    {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                  </div>
                ))}
              </div>
            </div>

            {/* Habit Rows */}
            {habits.map((habit) => (
              <div key={habit.id} className="habit-row">
                <div className="habit-info" style={{ flexGrow: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "700", fontSize: "16px" }}>{habit.title}</span>
                    <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "600" }}>
                      🔥 {habit.streak} day streak
                    </span>
                  </div>
                  {habit.description && (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{habit.description}</span>
                  )}
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button style={{ border: "none", background: "none", color: "var(--primary)", fontSize: "11px", fontWeight: "600", cursor: "pointer", padding: 0 }} onClick={() => handleOpenEdit(habit)}>
                      Edit
                    </button>
                    <button style={{ border: "none", background: "none", color: "var(--danger)", fontSize: "11px", fontWeight: "600", cursor: "pointer", padding: 0 }} onClick={() => deleteHabit("habits", habit.id)}>
                      Remove
                    </button>
                  </div>
                </div>

                <div className="habit-week-completion">
                  {last7Days.map((date, index) => {
                    const completed = isHabitCompletedOnDate(habit.id, date);
                    return (
                      <button
                        key={index}
                        className={`habit-day-box ${completed ? "completed" : ""}`}
                        onClick={() => toggleHabitOnDate(habit, date)}
                      >
                        {completed ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingHabit ? "Edit Habit" : "Create Habit"}</h2>
              <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Habit Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Read 15 pages"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Description</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Write instructions on how to complete this habit..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Frequency</label>
                <select className="select" value={frequency} onChange={(e) => setFrequency(e.target.value as HabitFrequency)}>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
