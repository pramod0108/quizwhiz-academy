import { useMemo } from "react";

// ─── Palette ───────────────────────────────────────────────────────────────────
const COLORS = [
  "#7C3AED", // purple
  "#A78BFA", // purple-light
  "#F97316", // orange
  "#FED7AA", // orange-light
  "#0D9488", // teal
  "#99F6E4", // teal-light
  "#F59E0B", // yellow
  "#EC4899", // pink
  "#10B981", // green
  "#EF4444", // red
  "#FFFFFF", // white
];

const PIECE_COUNT = 50;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

// ─── Component ─────────────────────────────────────────────────────────────────
/**
 * Confetti
 * Renders 50 colourful animated particles that fall from the top of the screen.
 *
 * @param {{ show: boolean }} props
 */
export default function Confetti({ show }) {
  // Build the static piece data once; regenerate only if PIECE_COUNT changes.
  const pieces = useMemo(() => {
    return Array.from({ length: PIECE_COUNT }, (_, i) => {
      const size = rand(8, 16);
      const isCircle = Math.random() > 0.5;
      return {
        id: i,
        left: rand(0, 100),            // vw percent
        delay: rand(0, 3),             // seconds
        duration: rand(2, 5),          // seconds
        color: COLORS[randInt(0, COLORS.length - 1)],
        size,
        borderRadius: isCircle ? "50%" : `${randInt(2, 6)}px`,
        // Add a slight horizontal wobble via rotation start
        initialRotation: rand(0, 360),
      };
    });
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1000,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: "absolute",
            top: 0,
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: piece.borderRadius,
            opacity: 1,
            transform: `rotate(${piece.initialRotation}deg)`,
            animation: `confettiFall ${piece.duration}s ${piece.delay}s ease-in infinite`,
            // A subtle box-shadow gives the pieces a little sparkle
            boxShadow: `0 0 ${piece.size / 2}px ${piece.color}88`,
          }}
        />
      ))}
    </div>
  );
}
