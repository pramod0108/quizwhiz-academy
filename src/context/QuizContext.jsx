import { createContext, useContext, useState } from "react";

// ─── Fisher-Yates shuffle — always returns a NEW array in random order ─────────
function shuffleArray(arr) {
  const a = [...arr];
  // Run two full passes to eliminate any slim chance of identity permutation
  // on small arrays (e.g. 3-item arrays where first pass sometimes returns
  // the original order by pure chance)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a;
}

/**
 * Returns true when every element is in the same position as the original.
 * Used to detect (and re-do) an identity permutation.
 */
function isSameOrder(original, shuffled) {
  return original.every((item, i) => item === shuffled[i]);
}

/**
 * Shuffle arr until the result differs from the original.
 * Guarantees a different order for arrays with 2+ distinct elements.
 */
function shuffleUntilDifferent(arr) {
  if (arr.length <= 1) return [...arr];
  let result = shuffleArray(arr);
  // Retry up to 10 times — statistically impossible to fail, but bounded
  let attempts = 0;
  while (isSameOrder(arr, result) && attempts < 10) {
    result = shuffleArray(arr);
    attempts++;
  }
  return result;
}

/**
 * Shuffle both question order AND each question's options on every quiz start.
 * - Questions come out in a random order different from the JSON order
 * - Each question's options are shuffled, and correctAnswer index is
 *   recalculated so it always points at the right option text
 */
function shufflePaper(paper) {
  if (!paper?.questions) return paper;

  // 1. Filter out any malformed entries (e.g. accidentally nested arrays)
  //    then shuffle the question order
  const validQuestions = paper.questions.filter(
    (q) =>
      q &&
      typeof q === "object" &&
      !Array.isArray(q) &&
      Array.isArray(q.options),
  );
  const reorderedQuestions = shuffleUntilDifferent(validQuestions);

  // 2. Shuffle each question's options and fix the correctAnswer index
  const shuffledQuestions = reorderedQuestions.map((q) => {
    // Pair each option text with a flag marking whether it is the correct one
    const paired = q.options.map((opt, idx) => ({
      text: opt,
      isCorrect: idx === q.correctAnswer,
    }));

    // Shuffle the pairs until the order changes
    const shuffledPaired = shuffleUntilDifferent(paired);

    return {
      ...q,
      options: shuffledPaired.map((p) => p.text),
      // findIndex is safe: exactly one element has isCorrect === true
      correctAnswer: shuffledPaired.findIndex((p) => p.isCorrect),
    };
  });

  return { ...paper, questions: shuffledQuestions };
}

// ─── Default State ────────────────────────────────────────────────────────────

const defaultAnswerEntry = () => ({
  selectedOption: null,
  markedForReview: false,
});

const initialState = {
  userName: "",
  currentScreen: "welcome",
  currentSubject: null,
  currentPaper: null,
  answers: {},
  quizStatus: "not-started",
  currentQuestionIndex: 0,
  timeTaken: 0,
};

// ─── Context Creation ─────────────────────────────────────────────────────────

const QuizContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function QuizProvider({ children }) {
  const [userName, setUserName] = useState(initialState.userName);
  const [currentScreen, setCurrentScreen] = useState(
    initialState.currentScreen,
  );
  const [currentSubject, setCurrentSubject] = useState(
    initialState.currentSubject,
  );
  const [currentPaper, setCurrentPaper] = useState(initialState.currentPaper);
  const [answers, setAnswers] = useState(initialState.answers);
  const [quizStatus, setQuizStatus] = useState(initialState.quizStatus);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialState.currentQuestionIndex,
  );
  const [timeTaken, setTimeTaken] = useState(initialState.timeTaken);

  // ── Helper: build a fresh answers map from a paper ────────────────────────
  const buildEmptyAnswers = (paper) => {
    const map = {};
    if (paper?.questions) {
      paper.questions.forEach((q) => {
        map[q.id] = defaultAnswerEntry();
      });
    }
    return map;
  };

  // ── startQuiz ─────────────────────────────────────────────────────────────
  // Shuffles question order + options, then starts the quiz.
  const startQuiz = (paper) => {
    const shuffled = shufflePaper(paper);
    setCurrentPaper(shuffled);
    setAnswers(buildEmptyAnswers(shuffled));
    setQuizStatus("in-progress");
    setCurrentQuestionIndex(0);
    setTimeTaken(0);
  };

  // ── submitQuiz ────────────────────────────────────────────────────────────
  const submitQuiz = (elapsed) => {
    setQuizStatus("submitted");
    setTimeTaken(elapsed);
  };

  // ── selectAnswer ──────────────────────────────────────────────────────────
  const selectAnswer = (questionId, optionIndex) => {
    setAnswers((prev) => {
      // If already answered, do NOT allow changing (lock after first pick)
      const existing = prev[questionId];
      if (
        existing?.selectedOption !== null &&
        existing?.selectedOption !== undefined
      ) {
        return prev;
      }
      return {
        ...prev,
        [questionId]: {
          ...(existing ?? defaultAnswerEntry()),
          selectedOption: optionIndex,
        },
      };
    });
  };

  // ── markForReview ─────────────────────────────────────────────────────────
  const markForReview = (questionId) => {
    setAnswers((prev) => {
      const entry = prev[questionId] ?? defaultAnswerEntry();
      return {
        ...prev,
        [questionId]: { ...entry, markedForReview: !entry.markedForReview },
      };
    });
  };

  // ── clearResponse — kept in context but NOT exposed in UI ─────────────────
  const clearResponse = (questionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] ?? defaultAnswerEntry()),
        selectedOption: null,
      },
    }));
  };

  // ── navigateTo ────────────────────────────────────────────────────────────
  const navigateTo = (screen) => setCurrentScreen(screen);

  // ── resetQuiz ─────────────────────────────────────────────────────────────
  const resetQuiz = () => {
    setCurrentScreen("home");
    setCurrentSubject(initialState.currentSubject);
    setCurrentPaper(initialState.currentPaper);
    setAnswers(initialState.answers);
    setQuizStatus(initialState.quizStatus);
    setCurrentQuestionIndex(initialState.currentQuestionIndex);
    setTimeTaken(initialState.timeTaken);
  };

  // ─── Context Value ────────────────────────────────────────────────────────
  const value = {
    // State
    userName,
    currentScreen,
    currentSubject,
    currentPaper,
    answers,
    quizStatus,
    currentQuestionIndex,
    timeTaken,

    // Setters
    setUserName,
    setCurrentSubject,
    setCurrentQuestionIndex,

    // Helpers
    startQuiz,
    submitQuiz,
    selectAnswer,
    markForReview,
    clearResponse,
    navigateTo,
    resetQuiz,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

// ─── useQuiz Hook ─────────────────────────────────────────────────────────────

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context)
    throw new Error("useQuiz must be used inside a <QuizProvider>.");
  return context;
}
