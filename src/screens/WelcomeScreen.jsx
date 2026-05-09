import { useState } from "react";
import { useQuiz } from "../context/QuizContext";
import "../styles/global.css";

/* ─── Decorative floating elements ─────────────────────────────────────── */
const FLOATERS = [
  { emoji: "⭐", top: "8%",  left: "5%",  size: "2.4rem", delay: "0s",    duration: "3.2s" },
  { emoji: "🚀", top: "14%", left: "88%", size: "2.8rem", delay: "0.6s",  duration: "4s"   },
  { emoji: "📚", top: "72%", left: "4%",  size: "2.2rem", delay: "1s",    duration: "3.6s" },
  { emoji: "✨", top: "80%", left: "91%", size: "2rem",   delay: "0.3s",  duration: "2.8s" },
  { emoji: "🌟", top: "42%", left: "93%", size: "1.8rem", delay: "1.4s",  duration: "3.4s" },
  { emoji: "🎯", top: "55%", left: "2%",  size: "2rem",   delay: "0.8s",  duration: "3s"   },
  { emoji: "💡", top: "28%", left: "91%", size: "1.6rem", delay: "1.8s",  duration: "4.2s" },
  { emoji: "🔭", top: "88%", left: "50%", size: "1.8rem", delay: "0.4s",  duration: "3.8s" },
  { emoji: "🎨", top: "5%",  left: "46%", size: "1.6rem", delay: "1.2s",  duration: "3.1s" },
];

export default function WelcomeScreen() {
  const { setUserName, navigateTo } = useQuiz();

  const [name, setName]       = useState("");
  const [shaking, setShaking] = useState(false);
  const [error, setError]     = useState(false);

  /* ── submission handler ──────────────────────────────────────────────── */
  const handleSubmit = () => {
    if (!name.trim()) {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      return;
    }
    setError(false);
    setUserName(name.trim());
    navigateTo("home");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  /* ── inline styles ───────────────────────────────────────────────────── */
  const styles = {
    screen: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      padding: "24px 16px",
      background: "linear-gradient(135deg, #7C3AED 0%, #F97316 50%, #0D9488 100%)",
      backgroundSize: "300% 300%",
      animation: "gradientShift 8s ease infinite",
    },

    /* floating decorative emojis */
    floater: (f) => ({
      position: "absolute",
      top: f.top,
      left: f.left,
      fontSize: f.size,
      opacity: 0.55,
      animation: `float ${f.duration} ease-in-out ${f.delay} infinite`,
      pointerEvents: "none",
      userSelect: "none",
      zIndex: 0,
    }),

    /* glass overlay card that holds all real content */
    glassWrap: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0",
      width: "100%",
      maxWidth: "520px",
    },

    /* ── Logo section ── */
    logoSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: "32px",
    },

    graduationEmoji: {
      fontSize: "6rem",
      lineHeight: 1,
      animation: "float 3s ease-in-out infinite",
      display: "block",
      marginBottom: "16px",
      filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25))",
    },

    appTitle: {
      fontFamily: "'Fredoka One', cursive",
      fontSize: "clamp(2.4rem, 8vw, 3.6rem)",
      lineHeight: 1.1,
      letterSpacing: "-0.5px",
      background: "linear-gradient(90deg, #fff 0%, #FED7AA 55%, #fff 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      textAlign: "center",
      textShadow: "none",
      marginBottom: "10px",
    },

    tagline: {
      fontFamily: "'Nunito', sans-serif",
      fontSize: "clamp(1rem, 3vw, 1.25rem)",
      fontWeight: 700,
      color: "rgba(255,255,255,0.92)",
      textAlign: "center",
      letterSpacing: "0.01em",
    },

    /* ── Input card ── */
    inputCard: {
      background: "rgba(255,255,255,0.97)",
      borderRadius: "28px",
      padding: "clamp(24px, 5vw, 40px)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.2), 0 4px 16px rgba(124,58,237,0.18)",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
      animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
    },

    prompt: {
      fontFamily: "'Nunito', sans-serif",
      fontSize: "clamp(1.05rem, 3vw, 1.25rem)",
      fontWeight: 800,
      color: "#1E1B4B",
      textAlign: "center",
      lineHeight: 1.4,
    },

    inputWrap: {
      width: "100%",
      position: "relative",
    },

    input: (hasError, shaking) => ({
      width: "100%",
      padding: "14px 20px",
      fontSize: "1.15rem",
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 700,
      color: "#1E1B4B",
      background: "#F5F3FF",
      border: `2.5px solid ${hasError ? "#EF4444" : "#A78BFA"}`,
      borderRadius: "50px",
      outline: "none",
      transition: "border-color 0.2s, box-shadow 0.2s, transform 0.1s",
      boxShadow: hasError
        ? "0 0 0 3px rgba(239,68,68,0.15)"
        : "0 0 0 0px transparent",
      animation: shaking ? "shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both" : "none",
    }),

    errorMsg: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontFamily: "'Nunito', sans-serif",
      fontSize: "0.95rem",
      fontWeight: 700,
      color: "#EF4444",
      marginTop: "4px",
      paddingLeft: "8px",
    },

    submitBtn: {
      width: "100%",
      padding: "15px 28px",
      fontSize: "1.2rem",
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 800,
      color: "#fff",
      background: "linear-gradient(135deg, #7C3AED, #F97316)",
      border: "none",
      borderRadius: "50px",
      cursor: "pointer",
      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: "0 6px 24px rgba(124,58,237,0.35)",
      letterSpacing: "0.03em",
    },
  };

  return (
    <>
      {/* ── Keyframes injected via <style> ─────────────────────────────────── */}
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }

        @keyframes shake {
          10%, 90%  { transform: translateX(-4px); }
          20%, 80%  { transform: translateX(6px);  }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60%  { transform: translateX(8px);  }
        }

        .welcome-input:focus {
          border-color: #7C3AED !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.2) !important;
          background: #fff !important;
        }

        .lets-go-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 36px rgba(124,58,237,0.5) !important;
          filter: brightness(1.08);
        }

        .lets-go-btn:active {
          transform: translateY(-1px) scale(0.99);
        }
      `}</style>

      {/* ── Main screen ──────────────────────────────────────────────────── */}
      <div style={styles.screen} className="screen">

        {/* Decorative floaters */}
        {FLOATERS.map((f, i) => (
          <span key={i} style={styles.floater(f)} aria-hidden="true">
            {f.emoji}
          </span>
        ))}

        <div style={styles.glassWrap}>

          {/* ── Logo section ───────────────────────────────────────────── */}
          <div style={styles.logoSection}>
            <span style={styles.graduationEmoji} role="img" aria-label="graduation cap">
              🎓
            </span>
            <h1 style={styles.appTitle}>QuizWhiz Academy</h1>
            <p style={styles.tagline}>Where Learning Meets Fun! ✨</p>
          </div>

          {/* ── Input card ─────────────────────────────────────────────── */}
          <div style={styles.inputCard}>

            <p style={styles.prompt}>
              Hey there! What's your name, superstar? 🌟
            </p>

            <div style={styles.inputWrap}>
              <input
                className="welcome-input"
                type="text"
                placeholder="Type your name here..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error && e.target.value.trim()) setError(false);
                }}
                onKeyDown={handleKeyDown}
                style={styles.input(error, shaking)}
                maxLength={32}
                autoFocus
                aria-label="Enter your name"
                aria-describedby={error ? "name-error" : undefined}
              />

              {error && (
                <p id="name-error" style={styles.errorMsg} role="alert">
                  <span aria-hidden="true">😅</span>
                  Oops! Don't forget your name!
                </p>
              )}
            </div>

            <button
              className="lets-go-btn"
              style={styles.submitBtn}
              onClick={handleSubmit}
              type="button"
              aria-label="Let's go — start the quiz"
            >
              Let's Go! 🚀
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
