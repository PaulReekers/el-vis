import {
  startGame,
  resetGame,
  idleLoop,
  gameOver,
  gameStarted,
  setIsFlapping,
} from "./game.js";
import { isUITarget } from "./ui.js";

export function handleKeyDown(e) {
  if (e.code === "Space") {
    e.preventDefault();
    if (gameOver) {
      resetGame();
      idleLoop();
      return;
    }
    if (!gameStarted) {
      startGame();
    }
    setIsFlapping(true);
  }
}
export function handleKeyUp(e) {
  if (e.code === "Space") {
    setIsFlapping(false);
  }
}

export function handleTouchStart(e) {
  if (isUITarget(e.target) || gameOver) return;
  e.preventDefault();
  if (!gameStarted) {
    startGame();
  }
  setIsFlapping(true);
}
export function handleTouchEnd(e) {
  if (isUITarget(e.target)) return;
  e.preventDefault();
  setIsFlapping(false);
}
export function handleTouchMove(e) {
  if (isUITarget(e.target)) return;
  e.preventDefault();
}

// Event listeners
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
document.addEventListener("touchstart", handleTouchStart, { passive: false });
document.addEventListener("touchend", handleTouchEnd, { passive: false });
document.addEventListener("touchmove", handleTouchMove, { passive: false });
