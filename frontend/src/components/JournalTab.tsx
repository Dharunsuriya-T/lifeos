import { useState, useEffect } from "react";
import type { Journal } from "../types/lifeOs";
import { useFeedback } from "../hooks/useFeedback";
import { getLocalDateStr, isValidDateStr } from "../utils/calculators";

interface Props {
  journals: Journal[];
  saveJournal: (journal: Journal) => void;
  deleteJournal: (type: "journals", id: string) => void;
}

export function JournalTab({ journals, saveJournal, deleteJournal }: Props) {
  const { showToast } = useFeedback();
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [entryDate, setEntryDate] = useState(getLocalDateStr());
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [mood, setMood] = useState("4");
  const [energyLevel, setEnergyLevel] = useState("4");

  const sortedJournals = [...journals].sort(
    (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
  );

  useEffect(() => {
    if (sortedJournals.length > 0 && !selectedJournalId && !isAdding) {
      setSelectedJournalId(sortedJournals[0].id);
    }
  }, [sortedJournals, selectedJournalId, isAdding]);

  const handleStartAdd = () => {
    setEntryDate(getLocalDateStr());
    setWins("");
    setChallenges("");
    setLessonsLearned("");
    setGratitude("");
    setMood("4");
    setEnergyLevel("4");
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!entryDate) return;

    if (!isValidDateStr(entryDate)) {
      showToast("Please enter a valid date with a 4-digit year.", "error");
      return;
    }

    const todayStr = getLocalDateStr();
    if (entryDate > todayStr) {
      showToast("Cannot write a journal entry for a future date.", "error");
      return;
    }

    // Check if entry date already has a journal
    const existing = journals.find((j) => j.entryDate === entryDate);
    const journalId = existing?.id || crypto.randomUUID();

    const journalData: Journal = {
      id: journalId,
      entryDate,
      wins,
      challenges,
      lessonsLearned,
      gratitude,
      mood,
      energyLevel,
      createdAt: existing?.createdAt,
    };

    saveJournal(journalData);
    setSelectedJournalId(journalId);
    setIsAdding(false);
  };

  const activeJournal = journals.find((j) => j.id === selectedJournalId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div className="header-row">
        <div className="title-section">
          <h1>Journal</h1>
          <p>Document wins, challenges, lessons learned, and gratitude daily.</p>
        </div>
        {!isAdding && (
          <button className="btn btn-primary" onClick={handleStartAdd}>
            + Log Entry
          </button>
        )}
      </div>

      {/* Main split dashboard */}
      <div className="grid-cols-3" style={{ alignItems: "start" }}>
        {/* Left column: past logs */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
          <h3 style={{ fontSize: "16px", margin: "0 0 12px 8px" }}>Journal Entries</h3>
          {sortedJournals.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No entries logged.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "500px", overflowY: "auto" }}>
              {sortedJournals.map((j) => (
                <button
                  key={j.id}
                  className={`nav-item ${selectedJournalId === j.id && !isAdding ? "active" : ""}`}
                  onClick={() => {
                    setSelectedJournalId(j.id);
                    setIsAdding(false);
                  }}
                  style={{
                    border: "1px solid var(--surface-border)",
                    backgroundColor: selectedJournalId === j.id && !isAdding ? "var(--primary-light)" : "var(--surface)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>
                      {new Date(j.entryDate).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: form / log viewer */}
        <div className="card" style={{ gridColumn: "span 2", minHeight: "500px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {isAdding ? (
            /* REFLECTION INPUT FORM */
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>New Journal Entry</h2>
                <input
                  type="date"
                  className="input"
                  style={{ width: "160px" }}
                  value={entryDate}
                  max={getLocalDateStr()}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Today's Wins / Victories</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Record your achievements..."
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Challenges Faced</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="What was difficult today?"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Lessons Learned</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Write down any new realizations..."
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Gratitude List</label>
                <input
                  type="text"
                  className="input"
                  placeholder="I am grateful for..."
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button className="btn btn-secondary" onClick={() => setIsAdding(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  Save Entry
                </button>
              </div>
            </div>
          ) : (
            /* REFLECTION DETAIL VIEWER */
            activeJournal ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ marginBottom: "6px" }}>
                      {new Date(activeJournal.entryDate).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h2>
                  </div>
                  <button
                    className="btn btn-danger"
                    style={{ background: "transparent", color: "var(--danger)" }}
                    onClick={() => {
                      deleteJournal("journals", activeJournal.id);
                      setSelectedJournalId(null);
                    }}
                  >
                    Delete Entry
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {activeJournal.wins && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Wins & Victories</h4>
                      <p style={{ margin: 0, fontSize: "15px", whiteSpace: "pre-wrap" }}>{activeJournal.wins}</p>
                    </div>
                  )}

                  {activeJournal.challenges && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Challenges</h4>
                      <p style={{ margin: 0, fontSize: "15px", whiteSpace: "pre-wrap" }}>{activeJournal.challenges}</p>
                    </div>
                  )}

                  {activeJournal.lessonsLearned && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Lessons Learned</h4>
                      <p style={{ margin: 0, fontSize: "15px", whiteSpace: "pre-wrap" }}>{activeJournal.lessonsLearned}</p>
                    </div>
                  )}

                  {activeJournal.gratitude && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Gratitude</h4>
                      <p style={{ margin: 0, fontSize: "15px", fontStyle: "italic" }}>"{activeJournal.gratitude}"</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
                Select a journal entry or log a new one.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
