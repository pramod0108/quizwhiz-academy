import { useState, useEffect, useRef, useCallback } from "react";
import { useQuiz } from "../context/QuizContext";
import { formatTime, getQuestionStatus } from "../utils/quizHelpers";

const OPTION_LABELS = ["A", "B", "C", "D"];

const STATUS_COLOUR = {
  "not-visited": "#94A3B8",
  attempted: "var(--green)",
  marked: "var(--yellow)",
  "attempted-marked": "var(--purple)",
};
const STATUS_TEXT = {
  "not-visited": "#fff",
  attempted: "#fff",
  marked: "#1E1B4B",
  "attempted-marked": "#fff",
};

function getOptionFeedback(optionIndex, question, selectedOption) {
  const answered = selectedOption !== null && selectedOption !== undefined;
  if (!answered) return "idle";
  if (optionIndex === question.correctAnswer) return "correct";
  if (optionIndex === selectedOption) return "wrong";
  return "dim";
}

export default function QuizScreen() {
  const {
    currentPaper,
    currentSubject,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    selectAnswer,
    markForReview,
    submitQuiz,
    navigateTo,
  } = useQuiz();

  const totalSeconds = (currentPaper?.timeLimit ?? 30) * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [timesUp, setTimesUp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef(null);
  const submittedRef = useRef(false);

  const questions = currentPaper?.questions ?? [];
  const question = questions[currentQuestionIndex] ?? null;
  const totalQ = questions.length;
  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === totalQ - 1;
  const currentAnswer = question ? answers?.[question.id] : null;
  const selectedOption = currentAnswer?.selectedOption ?? null;
  const isAnswered = selectedOption !== null && selectedOption !== undefined;
  const isMarked = Boolean(currentAnswer?.markedForReview);

  const getElapsed = useCallback(
    () => Math.round((Date.now() - startTimeRef.current) / 1000),
    [],
  );

  const handleSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    clearInterval(intervalRef.current);
    submitQuiz(getElapsed());
    navigateTo("result");
  }, [submitQuiz, navigateTo, getElapsed]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (!submittedRef.current) {
            submittedRef.current = true;
            setTimesUp(true);
            setTimeout(() => {
              submitQuiz(getElapsed());
              navigateTo("result");
            }, 2200);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue =
        "Your quiz is in progress. Are you sure you want to leave?";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const goTo = (i) => {
    setCurrentQuestionIndex(i);
    setSidebarOpen(false);
  };
  const goPrev = () => !isFirst && goTo(currentQuestionIndex - 1);
  const goNext = () => !isLast && goTo(currentQuestionIndex + 1);

  const confirmSubmit = () => {
    if (window.confirm("Are you sure you want to submit? You can't go back!")) {
      handleSubmit();
    }
  };

  if (!currentPaper || !question) {
    return (
      <div
        className="screen"
        style={{ textAlign: "center", padding: "80px 24px" }}
      >
        <p style={{ fontSize: "2rem" }}>⚠️</p>
        <p style={{ fontWeight: 700, marginTop: 8 }}>
          No quiz loaded. Please go back and select a paper.
        </p>
        <button
          className="btn-secondary"
          style={{ marginTop: 20 }}
          onClick={() => navigateTo("home")}
        >
          Go Home
        </button>
      </div>
    );
  }

  const timerWarning = timeLeft < 300;
  const timerDisplay = formatTime(timeLeft);

  return (
    <>
      <style>{`
        /* ─────────────────────────────────────────────────────
           SHELL — true full-viewport column, nothing overflows
        ───────────────────────────────────────────────────── */
        .qs-shell {
          display: flex;
          flex-direction: column;
          height: 100dvh;          /* exact viewport, no address-bar gap */
          overflow: hidden;        /* children handle their own scroll */
          background: var(--bg);
        }

        /* ── Header (fixed height) ───────────────────────────── */
        .qs-header {
          flex-shrink: 0;
          background: var(--white);
          border-bottom: 2px solid #E9E5FF;
          box-shadow: 0 2px 12px rgba(124,58,237,0.10);
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          z-index: 100;
        }
        .qs-header-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }
        .qs-paper-title {
          font-family: 'Fredoka One', sans-serif;
          font-size: 1.05rem;
          color: var(--text-dark);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .qs-subject-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #EDE9FE;
          color: var(--purple);
          border-radius: 50px;
          padding: 2px 10px;
          font-size: 0.74rem;
          font-weight: 700;
          width: fit-content;
        }

        /* ── Timer ───────────────────────────────────────────── */
        .qs-timer {
          display: flex;
          align-items: center;
          gap: 5px;
          background: var(--bg);
          border: 2px solid #E9E5FF;
          border-radius: 50px;
          padding: 6px 14px;
          font-family: 'Fredoka One', sans-serif;
          font-size: 1.15rem;
          color: var(--text-dark);
          white-space: nowrap;
          flex-shrink: 0;
          transition: border-color 0.3s;
        }
        .qs-timer.warning {
          border-color: var(--red);
          color: var(--red);
          animation: timerPulse 1s ease-in-out infinite;
        }

        /* Palette toggle — shown only on mobile */
        .qs-palette-toggle {
          display: none;
          background: var(--purple);
          color: #fff;
          border: none;
          border-radius: 50px;
          padding: 6px 13px;
          font-family: 'Nunito', sans-serif;
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          flex-shrink: 0;
          align-items: center;
          gap: 5px;
        }

        /* ─────────────────────────────────────────────────────
           BODY — fills remaining height between header & nav
        ───────────────────────────────────────────────────── */
        .qs-body {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 272px;
          min-height: 0;           /* lets children scroll independently */
          overflow: hidden;
        }

        /* ── Main scrollable question area ───────────────────── */
        .qs-main {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 20px 24px 24px;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .qs-q-counter {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--purple);
          background: #EDE9FE;
          display: inline-block;
          padding: 3px 13px;
          border-radius: 50px;
          margin-bottom: 14px;
          letter-spacing: 0.02em;
          align-self: flex-start;
        }

        .qs-question-text {
          font-family: 'Nunito', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-dark);
          line-height: 1.6;
          margin-bottom: 18px;
        }

        /* ── Options ─────────────────────────────────────────── */
        .qs-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .qs-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          text-align: left;
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          cursor: pointer;
          transition: var(--transition);
          font-family: 'Nunito', sans-serif;
          font-size: 0.97rem;
          font-weight: 600;
          position: relative;
          border: 2.5px solid transparent;
        }
        .qs-option.idle {
          background: var(--white);
          border-color: #C4B5FD;
          color: var(--text-dark);
          box-shadow: 0 2px 8px rgba(124,58,237,0.07);
        }
        .qs-option.idle:hover {
          border-color: var(--purple);
          background: #F5F3FF;
          transform: translateX(4px);
          box-shadow: 0 4px 16px rgba(124,58,237,0.13);
        }
        .qs-option.correct {
          background: var(--green-light);
          border-color: var(--green);
          color: var(--green);
          font-weight: 800;
          cursor: default;
        }
        .qs-option.wrong {
          background: var(--red-light);
          border-color: var(--red);
          color: var(--red);
          font-weight: 800;
          cursor: default;
        }
        .qs-option.dim {
          background: #F8F7FF;
          border-color: #DDD6FE;
          color: #94A3B8;
          cursor: default;
          opacity: 0.7;
        }

        .qs-opt-letter {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fredoka One', sans-serif;
          font-size: 0.9rem;
          flex-shrink: 0;
          transition: var(--transition);
        }
        .qs-option.idle    .qs-opt-letter { background: #EDE9FE; color: var(--purple); }
        .qs-option.correct .qs-opt-letter { background: var(--green); color: #fff; }
        .qs-option.wrong   .qs-opt-letter { background: var(--red);   color: #fff; }
        .qs-option.dim     .qs-opt-letter { background: #E2E8F0; color: #94A3B8; }

        .qs-opt-text { line-height: 1.4; flex: 1; }
        .qs-opt-icon { margin-left: auto; font-size: 1.1rem; flex-shrink: 0; }

        /* Feedback strip */
        .qs-feedback {
          margin-top: 14px;
          padding: 11px 18px;
          border-radius: var(--radius-sm);
          font-weight: 800;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: fadeIn 0.3s ease both;
        }
        .qs-feedback.correct { background: var(--green-light); color: var(--green); border: 2px solid var(--green); }
        .qs-feedback.wrong   { background: var(--red-light);   color: var(--red);   border: 2px solid var(--red);   }

        /* ─────────────────────────────────────────────────────
           SIDEBAR / PALETTE
           Desktop: sticky column beside main
           Mobile:  full-screen slide-in drawer
        ───────────────────────────────────────────────────── */
        .qs-sidebar {
          background: var(--white);
          border-left: 2px solid #E9E5FF;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          /* Scrolls independently inside the body grid */
        }
        .qs-palette-close-row {
          display: none;  /* shown via media query on mobile */
        }
        .qs-palette-inner {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          flex: 1;
          padding: 16px 14px 16px;
        }
        .qs-palette-title {
          font-family: 'Fredoka One', sans-serif;
          font-size: 1rem;
          color: var(--text-dark);
          margin-bottom: 10px;
          text-align: center;
        }
        .qs-legend {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
          background: var(--bg);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
        }
        .qs-legend-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--text-dark);
        }
        .qs-legend-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .qs-palette-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        .qs-palette-btn {
          aspect-ratio: 1;
          border-radius: 50%;
          border: none;
          font-family: 'Nunito', sans-serif;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qs-palette-btn:hover { transform: scale(1.15); }
        .qs-palette-btn.active-q {
          outline: 3px solid var(--text-dark);
          outline-offset: 2px;
        }

        /* ─────────────────────────────────────────────────────
           NAV BAR — inline in flex flow, never fixed
           Sits naturally at the bottom of the shell column
        ───────────────────────────────────────────────────── */
        .qs-nav-bar {
          flex-shrink: 0;
          background: var(--white);
          border-top: 2px solid #E9E5FF;
          box-shadow: 0 -3px 16px rgba(124,58,237,0.09);
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 90;
        }
        .qs-nav-group { display: flex; gap: 8px; align-items: center; }
        .qs-nav-group.right { margin-left: auto; }

        .qs-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 50px;
          padding: 8px 16px;
          font-family: 'Nunito', sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
          cursor: pointer;
          transition: var(--transition);
          border: 2px solid transparent;
          white-space: nowrap;
        }
        .qs-nav-btn.outline {
          background: var(--white);
          color: var(--purple);
          border-color: var(--purple);
        }
        .qs-nav-btn.outline:hover:not(:disabled) {
          background: var(--bg);
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
        }
        .qs-nav-btn.outline:disabled { opacity: 0.35; cursor: not-allowed; }
        .qs-nav-btn.mark {
          background: var(--yellow-light);
          color: #92400E;
          border-color: var(--yellow);
        }
        .qs-nav-btn.mark.active { background: var(--yellow); color: #1E1B4B; }
        .qs-nav-btn.mark:hover  { transform: translateY(-2px); }

        /* Submit button */
        .qs-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--red);
          color: #fff;
          border: none;
          border-radius: 50px;
          padding: 8px 18px;
          font-family: 'Nunito', sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
          cursor: pointer;
          transition: var(--transition);
          white-space: nowrap;
        }
        .qs-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(239,68,68,0.35);
        }

        /* ── Times Up overlay ────────────────────────────────── */
        .qs-timesup {
          position: fixed;
          inset: 0;
          background: rgba(30,27,75,0.72);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease both;
        }
        .qs-timesup-card {
          background: var(--white);
          border-radius: var(--radius);
          padding: 44px 36px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(124,58,237,0.35);
          animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
          max-width: 340px;
          width: 90%;
        }
        .qs-timesup-emoji   { font-size: 3.6rem; display: block; margin-bottom: 12px; animation: bounce 0.8s ease infinite; }
        .qs-timesup-heading { font-family: 'Fredoka One', sans-serif; font-size: 1.9rem; color: var(--red); margin-bottom: 8px; }
        .qs-timesup-sub     { font-size: 0.97rem; font-weight: 600; color: var(--text-mid); }

        /* ═══════════════════════════════════════════════════════
           RESPONSIVE
        ═══════════════════════════════════════════════════════ */

        /* ── Tablet & Mobile: collapse to single column ───────── */
        @media (max-width: 900px) {
          .qs-body {
            grid-template-columns: 1fr;
          }
          .qs-palette-toggle {
            display: inline-flex;
          }
          /* Palette becomes a full-screen drawer */
          .qs-sidebar {
            position: fixed;
            inset: 0;
            height: 100dvh;
            border-left: none;
            z-index: 200;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          }
          .qs-sidebar.open { transform: translateX(0); }
          .qs-palette-close-row {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px 6px;
            flex-shrink: 0;
          }
        }

        /* ── Mobile ───────────────────────────────────────────── */
        @media (max-width: 768px) {
          .qs-header      { padding: 8px 14px; }
          .qs-paper-title { font-size: 0.92rem; }
          .qs-timer       { font-size: 1rem; padding: 5px 11px; }
          .qs-main        { padding: 14px 14px 16px; }
          .qs-question-text { font-size: 1.05rem; }
          .qs-option      { padding: 11px 14px; font-size: 0.93rem; }
          .qs-opt-letter  { width: 29px; height: 29px; font-size: 0.85rem; }
          .qs-nav-bar     { padding: 8px 12px; gap: 6px; }
          .qs-nav-btn     { padding: 7px 12px; font-size: 0.82rem; }
          .qs-submit-btn  { padding: 7px 14px; font-size: 0.82rem; }
          .qs-feedback    { font-size: 0.88rem; padding: 9px 14px; }
        }

        /* ── Small phones ─────────────────────────────────────── */
        @media (max-width: 480px) {
          .qs-header { gap: 6px; }
          .qs-nav-bar { gap: 5px; }
          .qs-nav-group.right { margin-left: auto; }
          /* Shrink mark button label on very small screens */
          .qs-mark-label-full { display: none; }
          .qs-mark-label-short { display: inline; }
        }
        @media (min-width: 481px) {
          .qs-mark-label-short { display: none; }
        }
      `}</style>

      {/* Times Up overlay */}
      {timesUp && (
        <div className="qs-timesup" role="alert" aria-live="assertive">
          <div className="qs-timesup-card">
            <span className="qs-timesup-emoji">⏰</span>
            <h2 className="qs-timesup-heading">Time's up!</h2>
            <p className="qs-timesup-sub">Let's see how you did! 🎉</p>
          </div>
        </div>
      )}

      {/* ── Root shell — exact viewport height, flex column ─── */}
      <div className="qs-shell">
        {/* ── HEADER ─────────────────────────────────────────── */}
        <header className="qs-header">
          <div className="qs-header-left">
            <span className="qs-paper-title">{currentPaper.title}</span>
            <span className="qs-subject-badge">
              {currentSubject?.icon} {currentSubject?.name}
            </span>
          </div>

          <div
            className={`qs-timer${timerWarning ? " warning" : ""}`}
            role="timer"
            aria-label="Time remaining"
          >
            ⏱️ {timerDisplay}
          </div>

          <button
            className="qs-palette-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open question palette"
          >
            🗂️ Palette
          </button>
        </header>

        {/* ── BODY — scrollable content + sidebar ────────────── */}
        <div className="qs-body">
          {/* Main question area — scrolls on its own */}
          <main className="qs-main">
            <span className="qs-q-counter">
              Question {currentQuestionIndex + 1} of {totalQ}
            </span>

            <p className="qs-question-text">{question.question}</p>

            <div
              className="qs-options"
              role="radiogroup"
              aria-label="Answer choices"
            >
              {question.options.map((optText, i) => {
                const feedback = getOptionFeedback(i, question, selectedOption);
                const handleClick = isAnswered
                  ? undefined
                  : () => selectAnswer(question.id, i);
                return (
                  <button
                    key={i}
                    className={`qs-option ${feedback}`}
                    onClick={handleClick}
                    style={{ cursor: isAnswered ? "default" : "pointer" }}
                    role="radio"
                    aria-checked={i === selectedOption}
                    aria-label={`Option ${OPTION_LABELS[i]}: ${optText}`}
                  >
                    <span className="qs-opt-letter" aria-hidden="true">
                      {OPTION_LABELS[i]}
                    </span>
                    <span className="qs-opt-text">{optText}</span>
                    {feedback === "correct" && (
                      <span className="qs-opt-icon">✅</span>
                    )}
                    {feedback === "wrong" && (
                      <span className="qs-opt-icon">❌</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback strip */}
            {isAnswered && (
              <div
                className={`qs-feedback ${selectedOption === question.correctAnswer ? "correct" : "wrong"}`}
                role="status"
                aria-live="polite"
              >
                {selectedOption === question.correctAnswer ? (
                  <>
                    <span>✅</span> Correct! Well done! 🎉
                  </>
                ) : (
                  <>
                    <span>❌</span> Wrong! The correct answer is highlighted in
                    green.
                  </>
                )}
              </div>
            )}
          </main>

          {/* Palette sidebar */}
          <aside
            className={`qs-sidebar${sidebarOpen ? " open" : ""}`}
            aria-label="Question palette"
          >
            {/* Close row (mobile only) */}
            <div className="qs-palette-close-row">
              <span
                style={{
                  fontFamily: "'Fredoka One', sans-serif",
                  fontSize: "1rem",
                  color: "var(--text-dark)",
                }}
              >
                Question Palette
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close palette"
                style={{
                  background: "#EDE9FE",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: "var(--purple)",
                  fontWeight: 900,
                }}
              >
                ←
              </button>
            </div>

            <div className="qs-palette-inner">
              <h2
                className="qs-palette-title"
                style={{ display: sidebarOpen ? "none" : "block" }}
              >
                Question Palette
              </h2>

              <div className="qs-legend" role="list">
                {[
                  { status: "not-visited", label: "Not Visited" },
                  { status: "attempted", label: "Attempted" },
                  { status: "marked", label: "Marked for Review" },
                  { status: "attempted-marked", label: "Attempted + Marked" },
                ].map(({ status, label }) => (
                  <div className="qs-legend-item" key={status} role="listitem">
                    <span
                      className="qs-legend-dot"
                      style={{ background: STATUS_COLOUR[status] }}
                      aria-hidden="true"
                    />
                    {label}
                  </div>
                ))}
              </div>

              <div
                className="qs-palette-grid"
                role="list"
                aria-label="Question navigator"
              >
                {questions.map((q, i) => {
                  const status = getQuestionStatus(q.id, answers);
                  const isCurrent = i === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      className={`qs-palette-btn${isCurrent ? " active-q" : ""}`}
                      style={{
                        background: STATUS_COLOUR[status],
                        color: STATUS_TEXT[status],
                      }}
                      onClick={() => goTo(i)}
                      role="listitem"
                      aria-label={`Question ${i + 1}, ${status.replace(/-/g, " ")}`}
                      aria-current={isCurrent ? "true" : undefined}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>

        {/* ── NAV BAR — inline, never fixed ──────────────────── */}
        <nav className="qs-nav-bar" aria-label="Quiz navigation">
          <div className="qs-nav-group">
            <button
              className="qs-nav-btn outline"
              onClick={goPrev}
              disabled={isFirst}
              aria-label="Previous question"
            >
              ← Prev
            </button>
            <button
              className="qs-nav-btn outline"
              onClick={goNext}
              disabled={isLast}
              aria-label="Next question"
            >
              Next →
            </button>
          </div>

          <div className="qs-nav-group">
            <button
              className={`qs-nav-btn mark${isMarked ? " active" : ""}`}
              onClick={() => markForReview(question.id)}
              aria-pressed={isMarked}
              aria-label={isMarked ? "Unmark for review" : "Mark for review"}
            >
              🔖
              <span className="qs-mark-label-full">
                {isMarked ? " Marked" : " Mark"}
              </span>
              <span className="qs-mark-label-short">
                {isMarked ? " ✓" : ""}
              </span>
            </button>
          </div>

          <div className="qs-nav-group right">
            <button
              className="qs-submit-btn"
              onClick={confirmSubmit}
              aria-label="Submit quiz"
            >
              🏁 Submit
            </button>
          </div>
        </nav>
      </div>
      {/* /.qs-shell */}
    </>
  );
}
