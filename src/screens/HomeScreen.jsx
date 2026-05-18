import { useState } from "react";
import { useQuiz } from "../context/QuizContext";
import "../styles/global.css";

/* ─── Subject data ──────────────────────────────────────────────────────── */
const SUBJECTS = [
  {
    id: "general-knowledge",
    name: "General Knowledge",
    icon: "🌍",
    description: "Explore amazing facts about our world!",
    color: "#7C3AED",
  },
  {
    id: "current-affairs",
    name: "Current Affairs",
    icon: "📰",
    description: "Stay updated with what's happening!",
    color: "#F97316",
  },
  {
    id: "science",
    name: "Science",
    icon: "🔬",
    description: "Discover the wonders of science!",
    color: "#0D9488",
  },
  {
    id: "mathematics",
    name: "Mathematics",
    icon: "➕",
    description: "Sharpen your math superpowers!",
    color: "#F59E0B",
  },
  {
    id: "history",
    name: "History",
    icon: "🏛️",
    description: "Journey through time and history!",
    color: "#EC4899",
  },
  {
    id: "english",
    name: "English",
    icon: "📖",
    description: "Build grammar skills & expand your vocabulary!",
    color: "#3B82F6",
  },
];

export default function HomeScreen() {
  const { userName, setCurrentSubject, navigateTo } = useQuiz();

  const [hoveredCard, setHoveredCard] = useState(null);

  /* ── Subject selection handler ──────────────────────────────────────── */
  const handleSubjectSelect = (subject) => {
    setCurrentSubject(subject);
    navigateTo("paperSelect");
  };

  /* ── Inline style builders ──────────────────────────────────────────── */
  const styles = {

    /* outer wrapper — plain bg keeps it calm while header pops */
    screen: {
      minHeight: "100vh",
      background: "#F5F3FF",
      display: "flex",
      flexDirection: "column",
    },

    /* ── Animated header banner ── */
    header: {
      background: "linear-gradient(135deg, #7C3AED 0%, #F97316 60%, #0D9488 100%)",
      backgroundSize: "250% 250%",
      animation: "headerGradient 10s ease infinite",
      padding: "clamp(28px, 6vw, 52px) 24px clamp(32px, 7vw, 60px)",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    },

    headerDecorLeft: {
      position: "absolute",
      top: "12px",
      left: "20px",
      fontSize: "2.2rem",
      opacity: 0.4,
      animation: "float 3.5s ease-in-out infinite",
      pointerEvents: "none",
    },

    headerDecorRight: {
      position: "absolute",
      top: "16px",
      right: "24px",
      fontSize: "2rem",
      opacity: 0.4,
      animation: "float 4s ease-in-out 0.8s infinite",
      pointerEvents: "none",
    },

    greeting: {
      fontFamily: "'Fredoka One', cursive",
      fontSize: "clamp(1.8rem, 5vw, 3rem)",
      color: "#fff",
      lineHeight: 1.2,
      marginBottom: "10px",
      textShadow: "0 2px 12px rgba(0,0,0,0.18)",
      animation: "fadeIn 0.5s ease both",
    },

    subtext: {
      fontFamily: "'Nunito', sans-serif",
      fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
      fontWeight: 700,
      color: "rgba(255,255,255,0.9)",
      letterSpacing: "0.01em",
      animation: "fadeIn 0.5s 0.15s ease both",
    },

    /* ── Grid container ── */
    gridSection: {
      flex: 1,
      padding: "clamp(24px, 5vw, 48px) clamp(16px, 5vw, 40px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "32px",
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: "24px",
      width: "100%",
      maxWidth: "900px",
    },

    /* ── Individual subject card ── */
    card: (subject, isHovered) => ({
      background: "#fff",
      borderRadius: "24px",
      padding: "28px 20px 22px",
      boxShadow: isHovered
        ? "0 16px 40px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08)"
        : "0 4px 20px rgba(124,58,237,0.12)",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s cubic-bezier(0.4,0,0.2,1)",
      transform: isHovered ? "translateY(-6px) scale(1.025)" : "translateY(0) scale(1)",
      border: "2px solid transparent",
      borderBottom: `4px solid ${subject.color}`,
      /* staggered pop-in */
      animation: `popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${SUBJECTS.indexOf(subject) * 0.08}s both`,
      userSelect: "none",
    }),

    /* coloured left accent bar (subtle strip at top) */
    cardAccentTop: (subject) => ({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "5px",
      background: subject.color,
      borderRadius: "24px 24px 0 0",
      opacity: 0.85,
    }),

    cardIcon: {
      fontSize: "4rem",
      lineHeight: 1,
      display: "block",
      marginBottom: "4px",
      transition: "transform 0.22s ease",
    },

    cardIconHovered: {
      fontSize: "4rem",
      lineHeight: 1,
      display: "block",
      marginBottom: "4px",
      transform: "scale(1.15) rotate(-5deg)",
      transition: "transform 0.22s ease",
    },

    cardName: (subject) => ({
      fontFamily: "'Fredoka One', cursive",
      fontSize: "1.2rem",
      color: subject.color,
      textAlign: "center",
      lineHeight: 1.2,
    }),

    cardDesc: {
      fontFamily: "'Nunito', sans-serif",
      fontSize: "0.88rem",
      fontWeight: 600,
      color: "#4C1D95",
      textAlign: "center",
      lineHeight: 1.4,
      opacity: 0.8,
    },

    /* small coloured "go" chip */
    cardChip: (subject, isHovered) => ({
      marginTop: "6px",
      padding: "5px 14px",
      background: isHovered ? subject.color : `${subject.color}18`,
      color: isHovered ? "#fff" : subject.color,
      borderRadius: "50px",
      fontFamily: "'Nunito', sans-serif",
      fontSize: "0.8rem",
      fontWeight: 800,
      transition: "background 0.2s, color 0.2s",
    }),

    /* ── Footer motivational text ── */
    footer: {
      textAlign: "center",
      padding: "0 16px 32px",
    },

    footerText: {
      fontFamily: "'Nunito', sans-serif",
      fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
      fontWeight: 800,
      color: "#7C3AED",
      background: "linear-gradient(90deg, #7C3AED, #F97316, #0D9488)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      letterSpacing: "0.01em",
    },
  };

  return (
    <>
      {/* ── Keyframes (gradient animation not in global.css) ─────────────── */}
      <style>{`
        @keyframes headerGradient {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
      `}</style>

      <div style={styles.screen} className="screen">

        {/* ── Animated header ─────────────────────────────────────────────── */}
        <header style={styles.header}>
          <span style={styles.headerDecorLeft} aria-hidden="true">🌈</span>
          <span style={styles.headerDecorRight} aria-hidden="true">⭐</span>

          <h1 style={styles.greeting}>
            Welcome back, <span style={{ color: "#FED7AA" }}>{userName}</span>! 🎉
          </h1>
          <p style={styles.subtext}>Pick a subject to begin your adventure! 📚</p>
        </header>

        {/* ── Subject grid section ─────────────────────────────────────────── */}
        <main style={styles.gridSection}>
          <div
            style={styles.grid}
            role="list"
            aria-label="Subject selection"
          >
            {SUBJECTS.map((subject) => {
              const isHovered = hoveredCard === subject.id;
              return (
                <div
                  key={subject.id}
                  role="listitem"
                  aria-label={`Select ${subject.name}`}
                  style={styles.card(subject, isHovered)}
                  onClick={() => handleSubjectSelect(subject)}
                  onMouseEnter={() => setHoveredCard(subject.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onFocus={() => setHoveredCard(subject.id)}
                  onBlur={() => setHoveredCard(null)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSubjectSelect(subject);
                    }
                  }}
                >
                  {/* top colour accent strip */}
                  <div style={styles.cardAccentTop(subject)} aria-hidden="true" />

                  {/* big emoji */}
                  <span
                    style={isHovered ? styles.cardIconHovered : styles.cardIcon}
                    role="img"
                    aria-hidden="true"
                  >
                    {subject.icon}
                  </span>

                  {/* name */}
                  <h2 style={styles.cardName(subject)}>{subject.name}</h2>

                  {/* description */}
                  <p style={styles.cardDesc}>{subject.description}</p>

                  {/* action chip */}
                  <span style={styles.cardChip(subject, isHovered)}>
                    {isHovered ? "Let's go! →" : "Tap to explore"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Footer motivational text ──────────────────────────────────── */}
          <footer style={styles.footer}>
            <p style={styles.footerText}>
              You've got this! Every quiz makes you smarter! 💡
            </p>
          </footer>
        </main>

      </div>
    </>
  );
}
