import { useState, useMemo } from "react";
import { useQuiz } from "../context/QuizContext";

// ─── Filter definitions ───────────────────────────────────────────────────────
const FILTERS = [
  { key: "all", label: "All", emoji: "📋" },
  { key: "correct", label: "Correct", emoji: "✅" },
  { key: "wrong", label: "Wrong", emoji: "❌" },
  { key: "skipped", label: "Skipped", emoji: "⏭️" },
];

const OPTION_LABELS = ["A", "B", "C", "D"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getQuestionResult(question, answers) {
  const selected = answers?.[question.id]?.selectedOption;
  if (selected === null || selected === undefined) return "skipped";
  if (selected === question.correctAnswer) return "correct";
  return "wrong";
}

// Returns style tokens for a single option in review mode
function getOptionTokens(optionIndex, question, answers) {
  const selected = answers?.[question.id]?.selectedOption;
  const isCorrect = optionIndex === question.correctAnswer;
  const isSelected = optionIndex === selected;

  if (isCorrect) {
    return {
      bg: "var(--green-light)",
      border: "var(--green)",
      color: "var(--green)",
      fw: 800,
      icon: "✅",
      letterBg: "var(--green)",
      letterColor: "#fff",
    };
  }
  if (isSelected && !isCorrect) {
    return {
      bg: "var(--red-light)",
      border: "var(--red)",
      color: "var(--red)",
      fw: 800,
      icon: "❌",
      letterBg: "var(--red)",
      letterColor: "#fff",
    };
  }
  return {
    bg: "#F8F7FF",
    border: "#DDD6FE",
    color: "var(--text-dark)",
    fw: 600,
    icon: null,
    letterBg: "#EDE9FE",
    letterColor: "var(--purple)",
  };
}

const BADGE_MAP = {
  correct: {
    label: "Correct ✅",
    bg: "var(--green-light)",
    color: "var(--green)",
  },
  wrong: { label: "Wrong ❌", bg: "var(--red-light)", color: "var(--red)" },
  skipped: { label: "Skipped ⏭️", bg: "var(--yellow-light)", color: "#B45309" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReviewScreen() {
  const { currentPaper, answers, navigateTo, resetQuiz } = useQuiz();

  const [activeFilter, setActiveFilter] = useState("all");
  const [viewIndex, setViewIndex] = useState(0); // index within filtered list

  const allQuestions = currentPaper?.questions ?? [];

  // Compute per-filter counts once
  const counts = useMemo(() => {
    return allQuestions.reduce(
      (acc, q) => {
        const r = getQuestionResult(q, answers);
        acc[r]++;
        acc.all++;
        return acc;
      },
      { all: 0, correct: 0, wrong: 0, skipped: 0 },
    );
  }, [allQuestions, answers]);

  // Filtered list of questions based on active tab
  const filteredQuestions = useMemo(() => {
    if (activeFilter === "all") return allQuestions;
    return allQuestions.filter(
      (q) => getQuestionResult(q, answers) === activeFilter,
    );
  }, [activeFilter, allQuestions, answers]);

  // Clamp viewIndex whenever filtered list changes
  const safeIndex = Math.min(
    viewIndex,
    Math.max(0, filteredQuestions.length - 1),
  );
  const question = filteredQuestions[safeIndex] ?? null;
  const totalInView = filteredQuestions.length;
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === totalInView - 1;

  // Original position of this question in the full list (for "Question X of Y" label)
  const originalIndex = question
    ? allQuestions.findIndex((q) => q.id === question.id)
    : -1;

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setViewIndex(0);
  };

  const goPrev = () => setViewIndex((i) => Math.max(0, i - 1));
  const goNext = () => setViewIndex((i) => Math.min(totalInView - 1, i + 1));

  const handleHome = () => {
    resetQuiz();
    navigateTo("home");
  };

  const result = question ? getQuestionResult(question, answers) : null;
  const badge = result ? BADGE_MAP[result] : null;

  return (
    <>
      <style>{`
        /* ── Review shell ──────────────────────────────────── */
        .rv-shell {
          min-height: 100vh;
          background: linear-gradient(160deg, #F5F3FF 0%, #EDE9FE 40%, #F0FFFE 100%);
          font-family: 'Nunito', sans-serif;
          padding-bottom: 40px;
        }

        /* ── Sticky header ─────────────────────────────────── */
        .rv-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,0.93);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1.5px solid rgba(124,58,237,0.10);
          box-shadow: 0 2px 16px rgba(124,58,237,0.08);
        }

        .rv-header-top {
          max-width: 700px;
          margin: 0 auto;
          padding: 12px 20px 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rv-back-btn {
          background: #EDE9FE;
          border: none;
          border-radius: 50%;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1rem;
          color: var(--purple);
          flex-shrink: 0;
          transition: var(--transition);
          font-family: 'Nunito', sans-serif;
          font-weight: 900;
        }
        .rv-back-btn:hover { background: #DDD6FE; transform: scale(1.08); }

        .rv-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--text-dark);
          flex: 1;
          font-family: 'Fredoka One', sans-serif;
        }

        .rv-paper-pill {
          background: rgba(124,58,237,0.1);
          color: var(--purple);
          border-radius: 50px;
          padding: 3px 12px;
          font-size: 0.76rem;
          font-weight: 700;
          white-space: nowrap;
        }

        /* ── Filter tabs ───────────────────────────────────── */
        .rv-tabs {
          max-width: 700px;
          margin: 0 auto;
          padding: 0 20px 12px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .rv-tabs::-webkit-scrollbar { display: none; }

        .rv-tab {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 16px;
          border-radius: 50px;
          font-family: 'Nunito', sans-serif;
          font-weight: 800;
          font-size: 0.88rem;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: var(--transition);
        }
        .rv-tab.active {
          background: var(--purple);
          color: #fff;
          border: 2px solid var(--purple);
          box-shadow: 0 4px 14px rgba(124,58,237,0.30);
        }
        .rv-tab.inactive {
          background: var(--white);
          color: var(--purple);
          border: 2px solid var(--purple);
        }
        .rv-tab.inactive:hover { background: #F5F3FF; }

        .rv-tab-count {
          background: rgba(255,255,255,0.25);
          border-radius: 50px;
          padding: 1px 7px;
          font-size: 0.76rem;
          font-weight: 900;
        }
        .rv-tab.inactive .rv-tab-count {
          background: rgba(124,58,237,0.12);
        }

        /* ── Content area ──────────────────────────────────── */
        .rv-content {
          max-width: 700px;
          margin: 0 auto;
          padding: 24px 20px 0;
        }

        /* ── Progress info ─────────────────────────────────── */
        .rv-progress {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .rv-counter {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--purple);
          background: #EDE9FE;
          padding: 4px 14px;
          border-radius: 50px;
          letter-spacing: 0.02em;
        }

        /* ── Question card ─────────────────────────────────── */
        .rv-card {
          background: var(--white);
          border-radius: var(--radius);
          box-shadow: 0 4px 24px rgba(124,58,237,0.12);
          overflow: hidden;
          animation: fadeIn 0.28s ease both;
          border: 1.5px solid rgba(124,58,237,0.08);
          margin-bottom: 20px;
        }

        .rv-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 20px 14px;
          border-bottom: 1.5px solid rgba(124,58,237,0.07);
          background: linear-gradient(135deg, #F5F3FF 0%, #FAFAFE 100%);
        }

        .rv-q-chip {
          background: var(--purple);
          color: var(--white);
          border-radius: 50px;
          padding: 3px 12px;
          font-size: 0.76rem;
          font-weight: 800;
          white-space: nowrap;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .rv-q-text {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-dark);
          line-height: 1.55;
          flex: 1;
        }

        .rv-status-badge {
          border-radius: 50px;
          padding: 4px 12px;
          font-size: 0.76rem;
          font-weight: 800;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Options list ──────────────────────────────────── */
        .rv-options {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .rv-option {
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: var(--radius-sm);
          padding: 11px 16px;
          user-select: none;
          border: 2.5px solid transparent;
          transition: all 0.15s ease;
        }

        .rv-opt-letter {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 900;
          flex-shrink: 0;
          font-family: 'Fredoka One', sans-serif;
        }

        .rv-opt-text {
          flex: 1;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .rv-opt-icon { font-size: 1.05rem; flex-shrink: 0; }

        /* ── Nav bar ───────────────────────────────────────── */
        .rv-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .rv-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 50px;
          padding: 10px 22px;
          font-family: 'Nunito', sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          transition: var(--transition);
          border: 2px solid var(--purple);
          background: var(--white);
          color: var(--purple);
          white-space: nowrap;
        }
        .rv-nav-btn:hover:not(:disabled) {
          background: var(--bg);
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
        }
        .rv-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── Home button ───────────────────────────────────── */
        .rv-home-btn {
          background: var(--purple);
          color: var(--white);
          border: none;
          border-radius: 50px;
          padding: 12px 28px;
          font-size: 1rem;
          font-weight: 800;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          box-shadow: var(--shadow);
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 28px auto 0;
        }
        .rv-home-btn:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-hover);
          filter: brightness(1.08);
        }

        /* ── Empty state ───────────────────────────────────── */
        .rv-empty {
          text-align: center;
          padding: 56px 24px;
          background: var(--white);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }

        /* ── Responsive ────────────────────────────────────── */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .rv-header-top { padding: 10px 14px 8px; }
          .rv-tabs { padding: 0 14px 10px; }
          .rv-content { padding: 18px 14px 0; }
          .rv-title { font-size: 1.1rem; }
          .rv-card-header { padding: 14px 14px 12px; }
          .rv-options { padding: 12px 14px; }
          .rv-q-text { font-size: 0.98rem; }
          .rv-nav-btn { padding: 8px 16px; font-size: 0.88rem; }
        }

        @media (max-width: 480px) {
          .rv-paper-pill { display: none; }
          .rv-progress { flex-direction: column; align-items: flex-start; }
          .rv-nav { justify-content: center; }
        }
      `}</style>

      <div className="rv-shell screen">
        {/* ── Sticky header ─────────────────────────────────────────── */}
        <div className="rv-header">
          <div className="rv-header-top">
            <button
              className="rv-back-btn"
              onClick={handleHome}
              aria-label="Go home"
            >
              ←
            </button>
            <h1 className="rv-title">Answer Review 🔍</h1>
            {currentPaper?.title && (
              <span className="rv-paper-pill">
                {currentPaper.subjectIcon && `${currentPaper.subjectIcon} `}
                {currentPaper.title}
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="rv-tabs" role="tablist" aria-label="Filter questions">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={activeFilter === f.key}
                className={`rv-tab ${activeFilter === f.key ? "active" : "inactive"}`}
                onClick={() => handleFilterChange(f.key)}
              >
                <span>{f.emoji}</span>
                <span>{f.label}</span>
                <span className="rv-tab-count">{counts[f.key]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────── */}
        <div className="rv-content">
          {totalInView === 0 ? (
            /* Empty state */
            <div className="rv-empty">
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎯</div>
              <p
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--text-dark)",
                  margin: "0 0 6px",
                }}
              >
                No questions here!
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--purple)",
                  fontWeight: 600,
                  margin: 0,
                  opacity: 0.7,
                }}
              >
                {activeFilter === "correct" &&
                  "You didn't get any correct answers."}
                {activeFilter === "wrong" &&
                  "You didn't have any wrong answers — great job! 🎉"}
                {activeFilter === "skipped" && "You didn't skip any questions!"}
                {activeFilter === "all" && "No questions found."}
              </p>
            </div>
          ) : (
            <>
              {/* Progress row */}
              <div className="rv-progress">
                <span className="rv-counter">
                  Question {safeIndex + 1} of {totalInView}
                  {activeFilter !== "all" &&
                    ` (${FILTERS.find((f) => f.key === activeFilter)?.label})`}
                </span>
                {originalIndex >= 0 && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#94A3B8",
                    }}
                  >
                    Original: Q{originalIndex + 1} of {allQuestions.length}
                  </span>
                )}
              </div>

              {/* Question card — re-mount on index change for animation */}
              {question && (
                <div className="rv-card" key={`${activeFilter}-${safeIndex}`}>
                  {/* Card header */}
                  <div className="rv-card-header">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        flex: 1,
                      }}
                    >
                      <span className="rv-q-chip">Q{originalIndex + 1}</span>
                      <p className="rv-q-text">{question.question}</p>
                    </div>
                    {badge && (
                      <span
                        className="rv-status-badge"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div className="rv-options">
                    {question.options.map((opt, idx) => {
                      const t = getOptionTokens(idx, question, answers);
                      return (
                        <div
                          key={idx}
                          className="rv-option"
                          style={{
                            background: t.bg,
                            borderColor: t.border,
                          }}
                        >
                          <span
                            className="rv-opt-letter"
                            style={{
                              background: t.letterBg,
                              color: t.letterColor,
                            }}
                          >
                            {OPTION_LABELS[idx]}
                          </span>
                          <span
                            className="rv-opt-text"
                            style={{ fontWeight: t.fw, color: t.color }}
                          >
                            {opt}
                          </span>
                          {t.icon && (
                            <span className="rv-opt-icon">{t.icon}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Prev / Next navigation */}
              <div className="rv-nav">
                <button
                  className="rv-nav-btn"
                  onClick={goPrev}
                  disabled={isFirst}
                  aria-label="Previous question"
                >
                  ← Prev
                </button>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--purple)",
                    opacity: 0.7,
                  }}
                >
                  {safeIndex + 1} / {totalInView}
                </span>
                <button
                  className="rv-nav-btn"
                  onClick={goNext}
                  disabled={isLast}
                  aria-label="Next question"
                >
                  Next →
                </button>
              </div>
            </>
          )}

          {/* Back to Home */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button className="rv-home-btn" onClick={handleHome}>
              Back to Home 🏠
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
