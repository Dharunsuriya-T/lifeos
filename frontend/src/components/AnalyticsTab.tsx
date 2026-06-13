import { useState, useMemo } from "react";
import type { Goal, Roadmap, RoadmapNode, Task, Project, ProjectMilestone, Habit, HabitLog, Journal, HorizonGoal } from "../types/lifeOs";
import { calculateAnalyticsData } from "../utils/calculators";

interface Props {
  goals: Goal[];
  roadmaps: Roadmap[];
  roadmapNodes: RoadmapNode[];
  tasks: Task[];
  projects: Project[];
  projectMilestones: ProjectMilestone[];
  habits: Habit[];
  habitLogs: HabitLog[];
  journals: Journal[];
  horizonGoals: HorizonGoal[];
}

export function AnalyticsTab({
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
}: Props) {
  const [showWrapped, setShowWrapped] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);

  const data = useMemo(() => {
    return calculateAnalyticsData(
      goals,
      roadmaps,
      roadmapNodes,
      tasks,
      projects,
      projectMilestones,
      habits,
      habitLogs,
      journals,
      horizonGoals
    );
  }, [goals, roadmaps, roadmapNodes, tasks, projects, projectMilestones, habits, habitLogs, journals, horizonGoals]);

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
    const weeklyJournals = journals.filter(j => {
      const entryDate = new Date(j.entryDate);
      return entryDate >= sevenDaysAgo && entryDate <= now;
    });

    const winsList = weeklyJournals.map(j => j.wins).filter(Boolean);
    const lessonsList = weeklyJournals.map(j => j.lessonsLearned).filter(Boolean);
    const gratitudeList = weeklyJournals.map(j => j.gratitude).filter(Boolean);

    // 2. Tasks completed
    const completedTasksCount = tasks.filter(t => {
      if (t.status !== "DONE") return false;
      if (!t.updatedAt) return true; // Fallback if no updatedAt
      const completedDate = new Date(t.updatedAt);
      return completedDate >= sevenDaysAgo && completedDate <= now;
    }).length;

    // 3. Habits stats
    const weeklyLogs = habitLogs.filter(l => {
      const logDate = new Date(l.completedDate);
      return logDate >= sevenDaysAgo && logDate <= now;
    });
    const completedHabitsCount = weeklyLogs.filter(l => l.isCompleted).length;
    const totalLogsCount = weeklyLogs.length;
    const habitCompletionRate = totalLogsCount > 0 ? Math.round((completedHabitsCount / totalLogsCount) * 100) : 0;

    // 4. Horizon Goals completed recently
    const activeHorizon = horizonGoals.filter(g => {
      if (g.status !== "DONE") return false;
      const compDate = new Date(g.updatedAt || g.createdAt || new Date());
      return compDate >= sevenDaysAgo && compDate <= now;
    });

    return {
      wins: winsList.length > 0 ? winsList : ["Self-reflection and continuous tracking"],
      lessons: lessonsList.length > 0 ? lessonsList : ["Patience and consistent effort are key to progress"],
      gratitude: gratitudeList.length > 0 ? gratitudeList : ["My health, career journey, and personal growth"],
      completedTasksCount,
      habitCompletionRate,
      activeHorizon: activeHorizon.map(g => g.title),
      weekRange: getWeekRange()
    };
  };

  const handleCopyReport = (stats: ReturnType<typeof getWrappedStats>) => {
    const text = `WEEKLY GROWTH WRAPPED
Date Range: ${stats.weekRange}

Key Metrics:
- Tasks Completed: ${stats.completedTasksCount}
- Habit Completion Rate: ${stats.habitCompletionRate}%
- Horizon Targets Completed: ${stats.activeHorizon.length > 0 ? stats.activeHorizon.join(", ") : "None"}

Biggest Wins:
${stats.wins.map(w => `- ${w}`).join("\n")}

Lessons Learned:
${stats.lessons.map(l => `- ${l}`).join("\n")}

Gratitude:
${stats.gratitude.map(g => `- ${g}`).join("\n")}

Powered by LifeOS`;

    navigator.clipboard.writeText(text);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 3000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div className="header-row">
        <div className="title-section">
          <h1>Personal Analytics Engine</h1>
          <p>Continuous growth indexing, weekly trend charting, and correlations mapping.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowWrapped(true)}>
          Weekly Growth Wrapped
        </button>
      </div>

      {data && (
        <div className="grid-cols-3" style={{ alignItems: "stretch" }}>
          {/* Growth Score Gauge */}
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "32px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text-muted)", textTransform: "uppercase" }}>Growth Index</h3>
            
            {/* Circular Gauge Representation */}
            <div
              style={{
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                background: `conic-gradient(var(--primary) ${data.growthScore * 3.6}deg, var(--surface-border) 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px",
                position: "relative"
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span style={{ fontSize: "36px", fontWeight: "800", fontFamily: "var(--font-display)" }}>
                  {data.growthScore}%
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>GROWTH</span>
              </div>
            </div>
            
            <span style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
              Composite score calculated across tasks, habits, learning, and journals.
            </span>
          </div>

          {/* Growth Trends Chart */}
          <div className="card" style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Weekly Growth Trend</h3>
            
            {/* Simple CSS Bar Chart */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "160px", padding: "10px 20px 0", borderBottom: "2px solid var(--surface-border)" }}>
                {data.growthTrends.map((t, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexGrow: 1 }}>
                    <span style={{ fontSize: "11px", fontWeight: "700" }}>{t.score}%</span>
                    <div
                      style={{
                        width: "36px",
                        height: `${Math.max(4, t.score * 1.2)}px`,
                        background: "linear-gradient(180deg, var(--primary), var(--accent))",
                        borderRadius: "6px 6px 0 0",
                        transition: "height 0.4s ease-out"
                      }}
                    />
                  </div>
                ))}
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px" }}>
                {data.growthTrends.map((t, idx) => (
                  <span key={idx} style={{ flexGrow: 1, textAlign: "center", fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>
                    {t.weekLabel}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-cols-2" style={{ alignItems: "start" }}>
        {/* Goal completion estimates */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "18px" }}>Estimated Days to Goal</h3>
          {data && Object.keys(data.goalEstimatedCompletionDays).length === 0 ? (
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>No goals currently active.</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {data && Object.entries(data.goalEstimatedCompletionDays).map(([goalTitle, days]) => (
                <div key={goalTitle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid var(--surface-border)", borderRadius: "var(--border-radius-sm)", backgroundColor: "var(--bg)" }}>
                  <span style={{ fontWeight: "600", fontSize: "14px" }}>{goalTitle}</span>
                  <span className="tag" style={{
                    backgroundColor: days === 0 ? "rgba(16, 185, 129, 0.1)" : days < 45 ? "rgba(245, 158, 11, 0.1)" : "var(--primary-light)",
                    color: days === 0 ? "var(--success)" : days < 45 ? "var(--warning)" : "var(--primary)",
                    textTransform: "none"
                  }}>
                    {days === 0 ? "Achieved!" : `${days} Days left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reflection Insights correlations */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "18px" }}>Reflection Insights</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data && data.reflectionInsights.map((insight, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "13px", lineHeight: "150%" }}>
                <span style={{ color: "var(--primary)", fontWeight: "bold" }}>✦</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Growth Wrapped Modal */}
      {showWrapped && (() => {
        const stats = getWrappedStats();
        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
              color: "#f8fafc",
              border: "1px solid rgba(255,255,255,0.1)",
              width: "550px",
              position: "relative",
              overflow: "hidden",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
            }}>
              {/* Decorative glows */}
              <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0) 70%)", pointerEvents: "none" }}></div>
              <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(236,72,153,0) 70%)", pointerEvents: "none" }}></div>

              <div className="modal-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "20px 24px" }}>
                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#f1f5f9", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  Weekly Growth Wrapped
                </h2>
                <button className="btn" style={{ padding: "4px 8px", background: "transparent", border: "none", color: "#94a3b8", fontSize: "20px" }} onClick={() => setShowWrapped(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "14px", color: "#cbd5e1", letterSpacing: "0.05em", fontWeight: "600" }}>{stats.weekRange}</span>
                </div>

                {/* Metrics Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <span style={{ fontSize: "28px", fontWeight: "800", color: "#38bdf8", display: "block" }}>{stats.completedTasksCount}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Tasks Done</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <span style={{ fontSize: "28px", fontWeight: "800", color: "#34d399", display: "block" }}>{stats.habitCompletionRate}%</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Habits Kept</span>
                  </div>
                </div>

                {/* Wins section */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px" }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "#fbbf24", fontWeight: "700", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                    Highlight Wins
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {stats.wins.map((win, idx) => (
                      <li key={idx}>{win}</li>
                    ))}
                  </ul>
                </div>

                {/* Lessons Learned */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px" }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "#a78bfa", fontWeight: "700", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                    Lessons Learned
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {stats.lessons.map((lesson, idx) => (
                      <li key={idx}>{lesson}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button className="btn btn-secondary" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#f1f5f9" }} onClick={() => setShowWrapped(false)}>
                  Close
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {reportCopied && <span style={{ fontSize: "12px", color: "#34d399" }}>Copied!</span>}
                  <button className="btn btn-primary" style={{ background: "#6366f1", border: "none" }} onClick={() => handleCopyReport(stats)}>
                    Share Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
