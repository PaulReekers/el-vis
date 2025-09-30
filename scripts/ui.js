import {resetGame, idleLoop, submitScoreToServer, score} from "./game.js";

// === DOM references ===
export const saveScoreContainer = document.getElementById("saveScoreContainer");
export const saveScoreBtn = document.getElementById("saveScoreBtn");
export const nameInputContainer = document.getElementById("nameInputContainer");
export const confirmSaveBtn = document.getElementById("confirmSaveBtn");
export const playerNameInput = document.getElementById("playerName");
export const playAgainBtn = document.getElementById("playAgainBtn");
export const restartBtn = document.getElementById("restartBtn");

// === UI Helpers ===
export function showSaveUI() {
    if (saveScoreContainer) saveScoreContainer.style.display = "block";
    if (saveScoreBtn) saveScoreBtn.style.display = "inline-block";
    if (nameInputContainer) nameInputContainer.style.display = "none";
    if (playerNameInput) playerNameInput.value = "";
}

export function hideSaveUI() {
    if (saveScoreContainer) saveScoreContainer.style.display = "none";
    if (playerNameInput) playerNameInput.value = "";
}

export function showPlayAgainBtn() {
    if (playAgainBtn) playAgainBtn.style.display = "block";
    if (playAgainBtn) playAgainBtn.classList.remove("score__button--hidden");
}

export function hidePlayAgainBtn() {
    if (playAgainBtn) playAgainBtn.style.display = "none";
}

export function showRestartBtn() {
    if (restartBtn) restartBtn.style.display = "block";
}

export function hideRestartBtn() {
    if (restartBtn) restartBtn.style.display = "none";
}

// === Button handlers ===
export function handleSaveScoreClick(e) {
    e.stopPropagation();
    if (nameInputContainer) nameInputContainer.style.display = "block";
    if (saveScoreBtn) saveScoreBtn.style.display = "none";
    if (confirmSaveBtn) confirmSaveBtn.style.display = "inline-block";
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
        showNotification("Please enter your name!");
        return;
    }
    if (playerName.length > 10) {
        showNotification("Name can be max 10 characters!", "error");
        return;
    }

    submitScoreToServer(playerName, score)
        .then(() => {
            hideSaveUI();
            playerNameInput.value = "";
            resetGame();
            idleLoop();
        })
        .catch(() => {
            showNotification("Failed to save score. Please try again.", "error");
        });
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

// === Notifications ===
let notificationTimeout;

export function showNotification(message, type = "info") {
    const notification = document.getElementById("notification");
    const messageSpan = document.getElementById("notification-message");
    const closeBtn = document.getElementById("notification-close");

    if (!notification || !messageSpan || !closeBtn) return;

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }

    notification.classList.remove("notification--error", "notification--info", "notification--success", "show", "hide", "hidden");
    notification.classList.add(`notification--${type}`);
    messageSpan.textContent = message;

    void notification.offsetWidth; // force reflow
    notification.classList.add("show");

    function closeNotification() {
        notification.classList.remove("show");
        notification.classList.add("hide");

        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
            notificationTimeout = null;
        }

        notification.addEventListener("animationend", () => {
            if (notification.classList.contains("hide")) {
                notification.classList.remove("hide");
                notification.classList.add("hidden");
            }
        }, {once: true});
    }

    closeBtn.onclick = closeNotification;

    notificationTimeout = setTimeout(() => {
        closeNotification();
    }, 4000);
}