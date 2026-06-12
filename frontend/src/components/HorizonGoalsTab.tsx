import { useState } from "react";
import type { HorizonGoal, Goal, HorizonPeriod } from "../types/lifeOs";

interface Props {
  horizonGoals: HorizonGoal[];
  goals: Goal[];
  saveHorizonGoal: (item: HorizonGoal) => void;
  deleteHorizonGoal: (type: "horizonGoals", id: string) => void;
}

export function HorizonGoalsTab({
  horizonGoals,
  goals,
  saveHorizonGoal,
  deleteHorizonGoal,
}: Props) {
  // Input states for each column
  const [inputs, setInputs] = useState<Record<HorizonPeriod, { title: string; goalId: string }>>({
    WEEKLY: { title: "", goalId: "" },
    MONTHLY: { title: "", goalId: "" },
    YEARLY: { title: "", goalId: "" },
  });

  const handleInputChange = (period: HorizonPeriod, field: "title" | "goalId", value: string) => {
    setInputs((prev) => ({
      ...prev,
      [period]: {
        ...prev[period],
        [field]: value,
      },
    }));
  };

  const handleAddGoal = (period: HorizonPeriod) => {
    const { title, goalId } = inputs[period];
    if (!title.trim()) return;

    const newItem: HorizonGoal = {
      id: crypto.randomUUID(),
      title: title.trim(),
      period,
      status: "TODO",
      goalId: goalId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveHorizonGoal(newItem);
    setInputs((prev) => ({
      ...prev,
      [period]: { title: "", goalId: "" },
    }));
  };

  const toggleGoalStatus = (item: HorizonGoal) => {
    const updated: HorizonGoal = {
      ...item,
      status: item.status === "TODO" ? "DONE" : "TODO",
      updatedAt: new Date().toISOString(),
    };
    saveHorizonGoal(updated);
  };

  const renderColumn = (period: HorizonPeriod, titleLabel: string) => {
    const items = horizonGoals.filter((g) => g.period === period);
    const completedCount = items.filter((g) => g.status === "DONE").length;
    const progressPercent = items.length > 0 ? (completedCount / items.length) * 100 : 0;

    return (
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", minHeight: "500px" }}>
        {/* Column Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{titleLabel}</h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>
              {completedCount}/{items.length} done
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="progress-bar-container" style={{ height: "6px", backgroundColor: "var(--surface-border)" }}>
              <div
                className="progress-bar"
                style={{
                  width: `${progressPercent}%`,
                  transition: "width 0.3s ease",
                  backgroundColor: period === "WEEKLY" ? "var(--primary)" : period === "MONTHLY" ? "var(--accent)" : "#8b5cf6",
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Add Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", border: "1px solid var(--surface-border)", borderRadius: "var(--border-radius-sm)", backgroundColor: "var(--bg)" }}>
          <input
            type="text"
            className="input"
            style={{ fontSize: "13px", padding: "8px 12px" }}
            placeholder={`Add a new ${titleLabel.toLowerCase().slice(0, -5)} target...`}
            value={inputs[period].title}
            onChange={(e) => handleInputChange(period, "title", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddGoal(period);
            }}
          />

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              className="select"
              style={{ flex: 1, fontSize: "12px", padding: "6px" }}
              value={inputs[period].goalId}
              onChange={(e) => handleInputChange(period, "goalId", e.target.value)}
            >
              <option value="">Link to Goal...</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              style={{ padding: "6px 14px", fontSize: "12px" }}
              onClick={() => handleAddGoal(period)}
            >
              Add
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", flex: 1, maxHeight: "450px", paddingRight: "4px" }}>
          {items.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No targets defined.
            </div>
          ) : (
            items.map((item) => {
              const linkedGoal = goals.find((g) => g.id === item.goalId);
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "12px",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--border-radius-sm)",
                    backgroundColor: "var(--bg)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <button
                    onClick={() => toggleGoalStatus(item)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      marginTop: "2px",
                      color: item.status === "DONE" ? "var(--primary)" : "var(--text-muted)",
                    }}
                  >
                    {item.status === "DONE" ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                  </button>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span
                      style={{
                        fontSize: "13.5px",
                        lineHeight: "1.4",
                        textDecoration: item.status === "DONE" ? "line-through" : "none",
                        color: item.status === "DONE" ? "var(--text-muted)" : "var(--text)",
                        fontWeight: "500",
                      }}
                    >
                      {item.title}
                    </span>
                    {linkedGoal && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <span
                          className="tag"
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            backgroundColor: "var(--surface-hover)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--surface-border)",
                            borderRadius: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                          </svg>
                          {linkedGoal.title}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteHorizonGoal("horizonGoals", item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      marginTop: "2px",
                      opacity: 0.7,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                    title="Delete target"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div className="header-row">
        <div className="title-section">
          <h1>Horizon Goals</h1>
          <p>Organize your progress across time horizons. Break your main goals down into actionable weekly, monthly, and yearly targets.</p>
        </div>
      </div>

      {/* Grid of columns */}
      <div className="grid-cols-3" style={{ alignItems: "start", gap: "24px" }}>
        {renderColumn("WEEKLY", "Weekly Targets")}
        {renderColumn("MONTHLY", "Monthly Targets")}
        {renderColumn("YEARLY", "Yearly Targets")}
      </div>
    </div>
  );
}
