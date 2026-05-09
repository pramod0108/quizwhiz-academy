import { useState, useEffect } from "react";
import { useQuiz } from "../context/QuizContext";

// ─── Lazy glob maps — Vite analyses these statically at build-time but each
//     JSON is loaded as its own async chunk at runtime.
//     This means edits to any JSON file are picked up immediately in dev
//     (Vite HMR invalidates the chunk) and after a rebuild in production,
//     without ever needing to touch this file.
// ─────────────────────────────────────────────────────────────────────────────
const GLOB_MAP = {
  "general-knowledge": import.meta.glob("../data/general-knowledge/*.json"),
  "current-affairs": import.meta.glob("../data/current-affairs/*.json"),
  science: import.meta.glob("../data/science/*.json"),
  mathematics: import.meta.glob("../data/mathematics/*.json"),
  history: import.meta.glob("../data/history/*.json"),
};

/**
 * Dynamically import every paper JSON for a subject.
 * Returns a Promise<Array> of paper objects sorted by filename.
 */
async function fetchPapersForSubject(subjectId) {
  const modules = GLOB_MAP[subjectId];
  if (!modules) return [];

  // Sort paths so papers always render in filename order (paper-1, paper-2 …)
  const sortedEntries = Object.entries(modules).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  // Await all lazy imports in parallel
  const results = await Promise.all(
    sortedEntries.map(([, importFn]) => importFn()),
  );

  // Each resolved module exposes the JSON as `.default`
  return results.map((mod) => mod.default ?? mod);
}

export default function PaperSelectScreen() {
  const { currentSubject, startQuiz, navigateTo } = useQuiz();

  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Re-fetch whenever the active subject changes
  useEffect(() => {
    if (!currentSubject?.id) return;

    let cancelled = false; // guard against stale async updates

    setLoading(true);
    setError(null);

    fetchPapersForSubject(currentSubject.id)
      .then((data) => {
        if (!cancelled) {
          setPapers(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load papers:", err);
          setError("Could not load papers. Please try again.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentSubject]);

  const handleBack = () => navigateTo("home");
  const handleStart = (paper) => {
    startQuiz(paper);
    navigateTo("quiz");
  };

  return (
    <>
      <style>{`
        .ps-screen {
          max-width: 960px;
          margin: 0 auto;
          padding: 24px 16px 48px;
        }

        .ps-nav { margin-bottom: 32px; }

        /* ── Hero ────────────────────────────────────────────── */
        .ps-hero {
          text-align: center;
          margin-bottom: 40px;
        }
        .ps-hero-icon {
          font-size: 5rem;
          line-height: 1;
          display: block;
          margin-bottom: 12px;
          animation: float 3s ease-in-out infinite;
        }
        .ps-hero-title {
          font-family: 'Fredoka One', sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          color: var(--text-dark);
          margin-bottom: 8px;
        }
        .ps-hero-subtitle {
          font-size: 1.05rem;
          color: var(--text-mid);
          font-weight: 600;
        }

        /* ── Loading skeleton ────────────────────────────────── */
        .ps-loading {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 24px;
        }
        .ps-skeleton {
          background: var(--white);
          border-radius: var(--radius);
          padding: 28px 24px;
          height: 180px;
          box-shadow: var(--shadow);
          overflow: hidden;
          position: relative;
        }
        .ps-skeleton::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(124,58,237,0.06) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        /* ── Grid ────────────────────────────────────────────── */
        .ps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 24px;
        }

        /* ── Paper card ──────────────────────────────────────── */
        .ps-card {
          background: var(--white);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 28px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: var(--transition);
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
        }
        .ps-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 5px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--orange));
          border-radius: var(--radius) var(--radius) 0 0;
        }
        .ps-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-hover);
          border-color: var(--purple-light);
        }

        .ps-card-title {
          font-family: 'Fredoka One', sans-serif;
          font-size: 1.3rem;
          color: var(--text-dark);
          line-height: 1.3;
        }

        .ps-card-meta { display: flex; gap: 10px; flex-wrap: wrap; }
        .ps-meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg);
          border-radius: 50px;
          padding: 6px 14px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-dark);
          border: 1.5px solid #E9E5FF;
        }

        .ps-card-cta { margin-top: auto; }

        .ps-start-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--purple);
          color: var(--white);
          padding: 13px 20px;
          border: none;
          border-radius: 50px;
          font-family: 'Nunito', sans-serif;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: var(--transition);
          box-shadow: 0 4px 14px rgba(124,58,237,0.30);
        }
        .ps-start-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124,58,237,0.40);
          filter: brightness(1.08);
        }
        .ps-start-btn:active { transform: translateY(0); }

        .ps-card:hover .ps-arrow { transform: translateX(4px); }
        .ps-arrow { display: inline-block; transition: transform 0.2s ease; }

        /* ── Empty / error states ────────────────────────────── */
        .ps-empty, .ps-error {
          text-align: center;
          padding: 60px 24px;
          color: var(--text-mid);
        }
        .ps-empty-icon { font-size: 3.5rem; margin-bottom: 12px; display: block; }
        .ps-error { color: var(--red); }

        /* ── Responsive ──────────────────────────────────────── */
        @media (max-width: 480px) {
          .ps-grid, .ps-loading { grid-template-columns: 1fr; }
          .ps-hero-icon { font-size: 3.8rem; }
        }
      `}</style>

      <div className="screen ps-screen">
        {/* Back */}
        <div className="ps-nav">
          <button className="btn-secondary" onClick={handleBack}>
            ← Back
          </button>
        </div>

        {/* Hero */}
        <div className="ps-hero">
          <span
            className="ps-hero-icon"
            role="img"
            aria-label={currentSubject?.name}
          >
            {currentSubject?.icon ?? "📚"}
          </span>
          <h1 className="ps-hero-title">
            {currentSubject?.name ?? "Select a Paper"}
          </h1>
          <p className="ps-hero-subtitle">
            Choose a paper and start your challenge! 💪
          </p>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div
            className="ps-loading"
            aria-busy="true"
            aria-label="Loading papers"
          >
            {[1, 2, 3].map((n) => (
              <div key={n} className="ps-skeleton" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="ps-error">
            <span className="ps-empty-icon">⚠️</span>
            <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>{error}</p>
            <button
              className="btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => navigateTo("home")}
            >
              ← Go Back
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && papers.length === 0 && (
          <div className="ps-empty">
            <span className="ps-empty-icon" role="img" aria-label="Coming soon">
              🚧
            </span>
            <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              No papers available yet.
            </p>
            <p style={{ marginTop: 6, fontSize: "0.9rem" }}>
              Check back soon — more content is on the way!
            </p>
          </div>
        )}

        {/* Paper grid */}
        {!loading && !error && papers.length > 0 && (
          <div className="ps-grid">
            {papers.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                onStart={() => handleStart(paper)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── PaperCard ────────────────────────────────────────────────────────────────
function PaperCard({ paper, onStart }) {
  const questionCount = paper.totalQuestions ?? paper.questions?.length ?? "?";
  const minutes =
    paper.timeLimit ?? Math.round((paper.questions?.length ?? 0) * 1.5);

  return (
    <div className="ps-card">
      <h2 className="ps-card-title">{paper.title}</h2>

      <div className="ps-card-meta">
        <span className="ps-meta-chip">📋 {questionCount} Questions</span>
        <span className="ps-meta-chip">⏱️ {minutes} Minutes</span>
      </div>

      <div className="ps-card-cta">
        <button className="ps-start-btn" onClick={onStart}>
          Start Test <span className="ps-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
