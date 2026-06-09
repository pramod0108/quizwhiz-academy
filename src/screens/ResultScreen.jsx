import Confetti from "../components/Confetti";
import { useQuiz } from "../context/QuizContext";
import { calculateResults, getPerformanceMessage, formatTime } from "../utils/quizHelpers";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTrophyEmoji(percentage) {
  if (percentage >= 90) return "🏆";
  if (percentage >= 70) return "⭐";
  if (percentage >= 50) return "🎯";
  return "📚";
}

function getPercentageColor(percentage) {
  if (percentage >= 70) return "var(--green)";
  if (percentage >= 50) return "var(--orange)";
  return "var(--red)";
}

function getPercentageBg(percentage) {
  if (percentage >= 70) return "var(--green-light)";
  if (percentage >= 50) return "var(--orange-light)";
  return "var(--red-light)";
}

function getCardGradient(percentage) {
  if (percentage >= 70) return "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)";
  if (percentage >= 50) return "linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%)";
  return "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)";
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ emoji, label, value, bgColor, textColor }) {
  return (
    <div style={{
      background: bgColor || "var(--white)",
      borderRadius: "var(--radius-sm)",
      padding: "16px 12px",
      textAlign: "center",
      boxShadow: "0 2px 12px rgba(124,58,237,0.10)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "6px",
      border: `1.5px solid ${bgColor ? "transparent" : "rgba(124,58,237,0.08)"}`,
      transition: "var(--transition)",
    }}>
      <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{emoji}</span>
      <span style={{
        fontSize: "1.5rem",
        fontWeight: 900,
        color: textColor || "var(--text-dark)",
        lineHeight: 1.1,
        fontFamily: "'Nunito', sans-serif",
      }}>
        {value}
      </span>
      <span style={{
        fontSize: "0.75rem",
        fontWeight: 700,
        color: textColor || "var(--text-mid, #4C1D95)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        opacity: textColor ? 0.85 : 0.7,
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ResultScreen() {
  const { userName, currentPaper, answers, timeTaken, navigateTo, resetQuiz, reattemptIncorrect } = useQuiz();

  const results = calculateResults(answers, currentPaper);
  const { total, attempted, correct, wrong, skipped, score, percentage } = results;
  const performanceMsg = getPerformanceMessage(percentage);
  const trophy = getTrophyEmoji(percentage);
  const percentColor = getPercentageColor(percentage);
  const percentBg = getPercentageBg(percentage);

  // Number of questions still to be mastered. When 0, hide Re-Attempt.
  const remaining = wrong + skipped;
  const showReattempt = remaining > 0;
  const attemptNumber = currentPaper?.attemptNumber ?? 1;

  const handleReview = () => navigateTo("review");
  const handleHome = () => { resetQuiz(); navigateTo("home"); };
  const handleReattempt = () => reattemptIncorrect();

  return (
    <>
      {/* ── Keyframe injection ── */}
      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0);   opacity: 0; }
          70%  { transform: scale(1.05);opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes floatBadge {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes shimmerBar {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .result-btn:hover {
          transform: translateY(-3px) !important;
          box-shadow: var(--shadow-hover) !important;
          filter: brightness(1.08);
        }
        .result-btn:active {
          transform: translateY(-1px) !important;
        }
        .stat-card-wrap:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(124,58,237,0.18) !important;
        }
      `}</style>

      {/* ── Confetti ── */}
      <Confetti show={percentage >= 70} />

      {/* ── Page wrapper ── */}
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #F5F3FF 0%, #EDE9FE 50%, #F0FDF4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Nunito', sans-serif",
      }}>

        {/* ── Main card ── */}
        <div style={{
          width: "100%",
          maxWidth: "620px",
          background: "var(--white)",
          borderRadius: "28px",
          boxShadow: "0 20px 60px rgba(124,58,237,0.18), 0 4px 16px rgba(0,0,0,0.06)",
          overflow: "hidden",
          animation: "popIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>

          {/* ── Card hero banner ── */}
          <div style={{
            background: getCardGradient(percentage),
            padding: "36px 32px 28px",
            textAlign: "center",
            position: "relative",
          }}>
            {/* Trophy emoji */}
            <div style={{
              fontSize: "4rem",
              lineHeight: 1,
              marginBottom: "12px",
              animation: "floatBadge 3s ease-in-out infinite",
              display: "inline-block",
            }}>
              {trophy}
            </div>

            {/* User greeting */}
            <h1 style={{
              fontSize: "1.7rem",
              fontWeight: 900,
              color: "var(--text-dark)",
              margin: "0 0 6px",
              lineHeight: 1.2,
            }}>
              Great job,&nbsp;
              <span style={{ color: "var(--purple)" }}>
                {userName || "Champ"}
              </span>
              !&nbsp;🎉
            </h1>

            {/* Performance message */}
            <p style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: percentColor,
              margin: 0,
              letterSpacing: "0.01em",
            }}>
              {performanceMsg}
            </p>

            {/* Paper title pill */}
            {currentPaper?.title && (
              <span style={{
                display: "inline-block",
                marginTop: "14px",
                background: "rgba(124,58,237,0.1)",
                color: "var(--purple)",
                borderRadius: "50px",
                padding: "4px 16px",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}>
                {currentPaper.subjectIcon && `${currentPaper.subjectIcon} `}
                {currentPaper.title}
              </span>
            )}

            {/* Attempt-number pill — only shown from 2nd attempt onwards */}
            {attemptNumber > 1 && (
              <div style={{ marginTop: "8px" }}>
                <span style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, var(--orange) 0%, var(--pink) 100%)",
                  color: "var(--white)",
                  borderRadius: "50px",
                  padding: "4px 14px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  boxShadow: "0 4px 12px rgba(249,115,22,0.30)",
                }}>
                  🔁 Attempt #{attemptNumber}
                </span>
              </div>
            )}
          </div>

          {/* ── Card body ── */}
          <div style={{ padding: "28px 28px 32px" }}>

            {/* ── Big percentage badge ── */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "28px",
            }}>
              <div style={{
                background: percentBg,
                border: `4px solid ${percentColor}`,
                borderRadius: "50%",
                width: "130px",
                height: "130px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 8px 32px ${percentColor}40`,
                animation: "floatBadge 3.5s ease-in-out 0.3s infinite",
              }}>
                <span style={{
                  fontSize: "2.6rem",
                  fontWeight: 900,
                  color: percentColor,
                  lineHeight: 1,
                  fontFamily: "'Nunito', sans-serif",
                }}>
                  {percentage}%
                </span>
                <span style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: percentColor,
                  opacity: 0.75,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>
                  Score
                </span>
              </div>
            </div>

            {/* ── Stats grid 3×2 ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              marginBottom: "28px",
            }}>
              <div className="stat-card-wrap" style={{ transition: "var(--transition)" }}>
                <StatCard emoji="📋" label="Total" value={total} />
              </div>
              <div className="stat-card-wrap" style={{ transition: "var(--transition)" }}>
                <StatCard emoji="✏️" label="Attempted" value={attempted} />
              </div>
              <div className="stat-card-wrap" style={{ transition: "var(--transition)" }}>
                <StatCard
                  emoji="✅"
                  label="Correct"
                  value={correct}
                  bgColor="var(--green-light)"
                  textColor="var(--green)"
                />
              </div>
              <div className="stat-card-wrap" style={{ transition: "var(--transition)" }}>
                <StatCard
                  emoji="❌"
                  label="Wrong"
                  value={wrong}
                  bgColor="var(--red-light)"
                  textColor="var(--red)"
                />
              </div>
              <div className="stat-card-wrap" style={{ transition: "var(--transition)" }}>
                <StatCard
                  emoji="⏭️"
                  label="Skipped"
                  value={skipped}
                  bgColor="var(--yellow-light)"
                  textColor="var(--yellow)"
                />
              </div>
              <div className="stat-card-wrap" style={{ transition: "var(--transition)" }}>
                <StatCard
                  emoji="🏆"
                  label="Score"
                  value={`${score} / ${total}`}
                  bgColor="linear-gradient(135deg,#EDE9FE,#DDD6FE)"
                  textColor="var(--purple)"
                />
              </div>
            </div>

            {/* ── Time taken strip ── */}
            {timeTaken > 0 && (
              <div style={{
                background: "var(--bg)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 18px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: "var(--purple)",
                fontWeight: 700,
                fontSize: "0.9rem",
              }}>
                <span>⏱️</span>
                <span>Time taken:&nbsp;<strong>{formatTime(timeTaken)}</strong></span>
              </div>
            )}

            {/* ── Action buttons ── */}
            <div style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
              {showReattempt && (
                <button
                  className="result-btn"
                  onClick={handleReattempt}
                  aria-label={`Re-attempt the ${remaining} remaining ${remaining === 1 ? "question" : "questions"}`}
                  style={{
                    flex: "1 1 100%",
                    background: "linear-gradient(135deg, var(--orange) 0%, var(--pink) 100%)",
                    color: "var(--white)",
                    border: "none",
                    borderRadius: "50px",
                    padding: "14px 24px",
                    fontSize: "1.02rem",
                    fontWeight: 900,
                    fontFamily: "'Nunito', sans-serif",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(249,115,22,0.35)",
                    transition: "var(--transition)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    letterSpacing: "0.01em",
                  }}
                >
                  🔁 Re-Attempt {remaining} {remaining === 1 ? "Question" : "Questions"}
                </button>
              )}

              <button
                className="result-btn"
                onClick={handleReview}
                style={{
                  flex: "1 1 180px",
                  background: "var(--purple)",
                  color: "var(--white)",
                  border: "none",
                  borderRadius: "50px",
                  padding: "13px 24px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: "pointer",
                  boxShadow: "var(--shadow)",
                  transition: "var(--transition)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                Review Answers 🔍
              </button>

              <button
                className="result-btn"
                onClick={handleHome}
                style={{
                  flex: "1 1 180px",
                  background: "var(--white)",
                  color: "var(--purple)",
                  border: "2px solid var(--purple)",
                  borderRadius: "50px",
                  padding: "13px 24px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: "pointer",
                  boxShadow: "var(--shadow)",
                  transition: "var(--transition)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                Go to Home 🏠
              </button>
            </div>

            {/* ── Perfect score celebration banner ── */}
            {!showReattempt && attemptNumber > 1 && (
              <div style={{
                marginTop: "18px",
                background: "linear-gradient(135deg, var(--green-light) 0%, #BBF7D0 100%)",
                border: "2px solid var(--green)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 18px",
                textAlign: "center",
                fontSize: "0.92rem",
                fontWeight: 800,
                color: "var(--green)",
                animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
              }}>
                🌟 You mastered every question! Amazing persistence! 🌟
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
