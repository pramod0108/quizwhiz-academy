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
  visited: false,
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
    // Reset attemptNumber to 1 for a fresh start (re-attempt path sets its own)
    const fresh = { ...paper, attemptNumber: 1 };
    const shuffled = shufflePaper(fresh);
    setCurrentPaper(shuffled);
    setAnswers(buildEmptyAnswers(shuffled));
    setQuizStatus("in-progress");
    setCurrentQuestionIndex(0);
    setTimeTaken(0);
  };

  // ── reattemptIncorrect ────────────────────────────────────────────────────
  // Builds a new paper made up of only the questions the user got wrong,
  // skipped, or never visited, then re-shuffles question + option order via
  // shufflePaper. Time limit is scaled proportionally to the smaller question
  // pool so the user still gets a fair amount of time per question.
  const reattemptIncorrect = () => {
    if (!currentPaper?.questions) return;

    const incorrectQuestions = currentPaper.questions.filter((q) => {
      const selected = answers?.[q.id]?.selectedOption;
      // null / undefined → skipped or not visited
      if (selected === null || selected === undefined) return true;
      // selected something but not the correct option → wrong
      return selected !== q.correctAnswer;
    });

    // Nothing left to re-attempt — bail (button shouldn't be visible anyway)
    if (incorrectQuestions.length === 0) return;

    // Preserve original time-per-question ratio; floor at 1 minute total
    const originalTotal =
      currentPaper.totalQuestions ?? currentPaper.questions.length;
    const originalLimit = currentPaper.timeLimit ?? 30;
    const timePerQ = originalTotal > 0 ? originalLimit / originalTotal : 1.5;
    const scaledTimeLimit = Math.max(
      1,
      Math.ceil(incorrectQuestions.length * timePerQ),
    );

    const nextAttempt = (currentPaper.attemptNumber ?? 1) + 1;

    const reattemptPaper = {
      ...currentPaper,
      questions: incorrectQuestions,
      totalQuestions: incorrectQuestions.length,
      timeLimit: scaledTimeLimit,
      attemptNumber: nextAttempt,
    };

    // shufflePaper guarantees a fresh question order and fresh option order
    const shuffled = shufflePaper(reattemptPaper);
    setCurrentPaper(shuffled);
    setAnswers(buildEmptyAnswers(shuffled));
    setQuizStatus("in-progress");
    setCurrentQuestionIndex(0);
    setTimeTaken(0);
    setCurrentScreen("quiz");
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
          visited: true,
        },
      };
    });
  };

  // ── visitQuestion ─────────────────────────────────────────────────────────
  // Marks a question as "visited" so the palette can distinguish Skipped
  // (visited but no answer) from Not Visited.
  const visitQuestion = (questionId) => {
    setAnswers((prev) => {
      const entry = prev[questionId] ?? defaultAnswerEntry();
      if (entry.visited) return prev;
      return {
        ...prev,
        [questionId]: { ...entry, visited: true },
      };
    });
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
    visitQuestion,
    navigateTo,
    resetQuiz,
    reattemptIncorrect,
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
