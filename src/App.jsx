import { useQuiz } from "./context/QuizContext";
import WelcomeScreen from "./screens/WelcomeScreen";
import HomeScreen from "./screens/HomeScreen";
import PaperSelectScreen from "./screens/PaperSelectScreen";
import QuizScreen from "./screens/QuizScreen";
import ResultScreen from "./screens/ResultScreen";
import ReviewScreen from "./screens/ReviewScreen";

// Screen map — each key matches a value of currentScreen
const SCREENS = {
  welcome: WelcomeScreen,
  home: HomeScreen,
  paperSelect: PaperSelectScreen,
  quiz: QuizScreen,
  result: ResultScreen,
  review: ReviewScreen,
};

export default function App() {
  const { currentScreen } = useQuiz();

  // Look up the right component; fall back to WelcomeScreen for unknown values
  const Screen = SCREENS[currentScreen] ?? WelcomeScreen;

  return (
    <div className="app-container">
      {/* Re-mount the screen when currentScreen changes so each screen gets
          its own independent state and the fadeIn CSS animation re-triggers. */}
      <Screen key={currentScreen} />
    </div>
  );
}
