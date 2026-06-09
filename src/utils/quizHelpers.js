// ─── formatTime ───────────────────────────────────────────────────────────────
/**
 * Converts a raw seconds value into a "MM:SS" string.
 * @param {number} seconds - Total elapsed seconds (non-negative integer).
 * @returns {string} e.g. "02:07"
 */
export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// ─── calculateResults ─────────────────────────────────────────────────────────
/**
 * Calculates quiz score results from the answers map and the paper object.
 *
 * @param {Object} answers - { [questionId]: { selectedOption: number|null, visited: boolean } }
 * @param {Object} paper   - The full paper object from JSON, expected to have:
 *                           paper.questions: Array<{ id, correctOption: number, marks?: number, negativeMarks?: number }>
 *                           paper.marksPerQuestion: number  (fallback if per-question marks not set)
 *                           paper.negativeMarks:    number  (fallback, default 0)
 * @returns {{ total: number, attempted: number, correct: number, wrong: number, skipped: number, score: number, percentage: number }}
 */
export function calculateResults(answers, paper) {
  if (!paper?.questions) {
    return {
      total: 0,
      attempted: 0,
      correct: 0,
      wrong: 0,
      skipped: 0,
      score: 0,
      percentage: 0,
    };
  }

  const questions = paper.questions;
  const defaultMarks = paper.marksPerQuestion ?? 1;
  const defaultNegative = paper.negativeMarks ?? 0;

  let attempted = 0;
  let correct = 0;
  let wrong = 0;
  let score = 0;
  let maxScore = 0;

  questions.forEach((question) => {
    const marksForQ = question.marks ?? defaultMarks;
    const negativeForQ = question.negativeMarks ?? defaultNegative;
    maxScore += marksForQ;

    const answer = answers?.[question.id];
    const selected = answer?.selectedOption;

    if (selected === null || selected === undefined) {
      // Skipped — no score change
      return;
    }

    attempted += 1;

    if (selected === question.correctAnswer) {
      correct += 1;
      score += marksForQ;
    } else {
      wrong += 1;
      score -= negativeForQ;
    }
  });

  const skipped = questions.length - attempted;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return {
    total: questions.length,
    attempted,
    correct,
    wrong,
    skipped,
    score: Math.max(0, score), // score floored at 0 for display purposes
    percentage: Math.max(0, percentage),
  };
}

// ─── getPerformanceMessage ────────────────────────────────────────────────────
/**
 * Returns an encouraging message and emoji based on the percentage scored.
 * @param {number} percentage - 0 to 100
 * @returns {string}
 */
export function getPerformanceMessage(percentage) {
  if (percentage >= 90) {
    return "You're a GENIUS! 🧠🏆";
  } else if (percentage >= 70) {
    return "Amazing Work! 🌟";
  } else if (percentage >= 50) {
    return "Good Job! Keep it up! 💪";
  } else {
    return "Keep Practicing, You've Got This! 🚀";
  }
}

// ─── getQuestionStatus ────────────────────────────────────────────────────────
/**
 * Derives the palette status of a single question for the question navigator.
 *
 * Because options lock instantly on click, we can show real result-based
 * colours during the quiz instead of a generic "attempted" colour.
 *
 * Status values:
 *   "not-visited" — the question has never been opened
 *   "skipped"     — visited but no option selected
 *   "correct"     — selected the right option
 *   "wrong"       — selected the wrong option
 *
 * @param {Object} question - the question object (needs correctAnswer)
 * @param {Object} answers  - the full answers map from context
 * @returns {"not-visited"|"skipped"|"correct"|"wrong"}
 */
export function getQuestionStatus(question, answers) {
  const entry = answers?.[question?.id];

  if (!entry || !entry.visited) return "not-visited";

  const selected = entry.selectedOption;
  if (selected === null || selected === undefined) return "skipped";

  return selected === question.correctAnswer ? "correct" : "wrong";
}
