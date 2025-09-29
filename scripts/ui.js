import { resetGame, idleLoop, submitScoreToServer, score } from "./game.js";

// === DOM references ===
export const saveScoreContainer = document.getElementById("saveScoreContainer");
export const saveScoreBtn = document.getElementById("saveScoreBtn");
export const nameInputContainer = document.getElementById("nameInputContainer");
export const confirmSaveBtn = document.getElementById("confirmSaveBtn");
export const playerNameInput = document.getElementById("playerName");
export const playAgainBtn = document.getElementById("playAgainBtn");

// === UI Helpers ===
export function showSaveUI() {
  if (saveScoreContainer) saveScoreContainer.style.display = "block";
  if (saveScoreBtn) saveScoreBtn.style.display = "inline-block";
  if (nameInputContainer) nameInputContainer.style.display = "none";
  if (playerNameInput) playerNameInput.value = "";
}
export function hideSaveUI() {
  if (saveScoreContainer) saveScoreContainer.style.display = "none";
  if (nameInputContainer) nameInputContainer.style.display = "none";
  // Optionally hide saveScoreBtn, or leave visible depending on design:
  if (saveScoreBtn) saveScoreBtn.style.display = "none";
}
export function showPlayAgainBtn() {
  if (playAgainBtn) playAgainBtn.style.display = "block";
}
export function hidePlayAgainBtn() {
  if (playAgainBtn) playAgainBtn.style.display = "none";
}
export function showRestartBtn() {
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) restartBtn.style.display = "block";
}
export function hideRestartBtn() {
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) restartBtn.style.display = "none";
}

// === Button handlers ===
export function handleSaveScoreClick(e) {
  e.stopPropagation();
  if (nameInputContainer) nameInputContainer.style.display = "block";
  if (saveScoreBtn) saveScoreBtn.style.display = "none";
  if (playerNameInput) playerNameInput.focus();
}
export function handleConfirmSaveClick(e) {
  e.stopPropagation();
  savePlayerScore();
}
export function handlePlayerNameKeydown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    savePlayerScore();
  }
}
export function handlePlayAgainClick(e) {
  e.stopPropagation();
  resetGame();
  idleLoop();
}

// === Save logic ===
export function savePlayerScore() {
  const playerName = playerNameInput.value.trim();
  if (!playerName) {
    alert("Please enter your name!");
    return;
  }
  if (playerName.length > 10) {
    alert("Name must be max 10 characters!");
    return;
  }

  submitScoreToServer(playerName, score);
  hideSaveUI();
  playerNameInput.value = "";
  resetGame();
  idleLoop();
}

// === Event listeners ===
if (saveScoreBtn) saveScoreBtn.addEventListener("click", handleSaveScoreClick);
if (confirmSaveBtn)
  confirmSaveBtn.addEventListener("click", handleConfirmSaveClick);
if (playerNameInput)
  playerNameInput.addEventListener("keydown", handlePlayerNameKeydown);
if (playAgainBtn) playAgainBtn.addEventListener("click", handlePlayAgainClick);

// Helper for input.js
export function isUITarget(el) {
  if (!el || !el.closest) return false;
  return (
    el.closest("#saveScoreContainer") ||
    el.closest("#playAgainBtn") ||
    el.closest("#restartBtn")
  );
}
