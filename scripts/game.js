// === Constants ===
import {
    showSaveUI,
    hideSaveUI,
    showPlayAgainBtn,
    hidePlayAgainBtn,
    showRestartBtn,
    hideRestartBtn
} from "./ui.js";
// -- Canvas & Drawing Context --
export const canvas = document.getElementById("gameCanvas");
export const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// -- Game Physics & Dimensions --
export const PIPE_DISTANCE = 400;
export const fishOriginalWidth = 158;
export const fishOriginalHeight = 56;
export const FISH_SCALE = 0.6;
export const meanderOriginalWidth = 193;
export const meanderOriginalHeight = 108;
export const pipeWidth = 120;
export const pipeGap = 200;
export const PIPE_HITBOX_PADDING = 25;
export const GRAVITY = 0.5;
export const LIFT = -7;
const hitboxMargin = 11;

let DEBUG = false; // Show debug hitboxes if true

// === State variables ===
export let fishX = 100;
export let fishY = 0;
export let velocity = 0;
export let isFlapping = false;
export let highscoresDrawn = false;

export function setIsFlapping(value) {
    isFlapping = value;
}

let idleOffset = 0;
let idleDirection = 1;
let meanderHeight = 0;
let meanderX = 0;
let pipes = [];
let pipeSpeed = 4;
let pipesSpawned = 0;
let gameStartTime = null;
export let score = 0;
export let highscoresVisible = true;
export let gameStarted = false;
export let gameOver = false;
let animId = null;
let restartCooldown = false;
let bgOffsetY = 0;

// === Highscore & Game State ===
export let highScore = 0;
export let highScoreDate = null;
const savedHighScore = localStorage.getItem("highScore");
const savedHighScoreDate = localStorage.getItem("highScoreDate");
if (savedHighScore) {
    highScore = parseInt(savedHighScore, 10);
    highScoreDate = savedHighScoreDate;
}

// === DOM references ===
export const saveScoreContainer = document.getElementById("saveScoreContainer");
export const saveScoreBtn = document.getElementById("saveScoreBtn");
export const nameInputContainer = document.getElementById("nameInputContainer");
export const confirmSaveBtn = document.getElementById("confirmSaveBtn");
export const playerNameInput = document.getElementById("playerName");
export const playAgainBtn = document.getElementById("playAgainBtn");
export const scoreDisplayEl = document.getElementById("scoreDisplay");

// === Current player highlight ===
let currentPlayerName = localStorage.getItem('lastPlayerName') || '';
const normalizeName = (s) => (s || '').trim().toLowerCase();

export function setCurrentPlayerName(name) {
    currentPlayerName = name || '';
    localStorage.setItem('lastPlayerName', currentPlayerName);
    drawHighscores();
}

if (confirmSaveBtn) {
    confirmSaveBtn.addEventListener('click', () => {
        const val = playerNameInput && playerNameInput.value ? playerNameInput.value.trim() : '';
        if (val) setCurrentPlayerName(val);
    });
}

// === Images ===
export const fishImg = new Image();
fishImg.src = "images/el-vis.png";
const pipeImg = new Image();
pipeImg.src = "images/pipe.png";
const bgImg = new Image();
bgImg.src = "images/background.png";
const meanderImg = new Image();
meanderImg.src = "images/meander.png";

// === Utility & Helper functions ===
export function resizeCanvas() {
    canvas.width = 480;
    canvas.height = 800;
    fishY = canvas.height / 2 - 24;
    meanderHeight =
        meanderOriginalHeight * 0.2 * (canvas.width / meanderOriginalWidth);
}

export function isUITarget(el) {
    if (!el || !el.closest) return false;
    return (
        el.closest("#saveScoreContainer") ||
        el.closest("#playAgainBtn") ||
        el.closest("#restartBtn")
    );
}

function drawDebugHitboxes() {
    const fishWidth = fishOriginalWidth * FISH_SCALE;
    const fishHeight = fishOriginalHeight * FISH_SCALE;
    const fishCenterX = fishX + fishWidth / 2;
    const fishCenterY = fishY + fishHeight / 2;
    const fishRadius = Math.min(fishWidth, fishHeight) / 2.5;

    ctx.beginPath();
    ctx.arc(fishCenterX, fishCenterY, fishRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();

    pipes.forEach((pipe, index) => {
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;

        if (index % 2 === 0) {
            // top pipe
            ctx.strokeRect(
                pipe.x + PIPE_HITBOX_PADDING,
                0,
                pipeWidth - PIPE_HITBOX_PADDING * 2,
                pipe.topPipeHeight
            );

            // bottom pipe
            const bottomY = pipe.topPipeHeight + pipeGap;
            const bottomHeight = canvas.height - bottomY;
            ctx.strokeRect(
                pipe.x + PIPE_HITBOX_PADDING,
                bottomY,
                pipeWidth - PIPE_HITBOX_PADDING * 2,
                bottomHeight
            );
        }
    });
}


// === Drawing functions ===
export function drawBackground() {
    // Parallax background offset based on fish velocity
    bgOffsetY += velocity * 0.2;
    bgOffsetY = Math.max(Math.min(bgOffsetY, 50), -50);
    ctx.drawImage(bgImg, 0, bgOffsetY, canvas.width, canvas.height);
}

export function drawFish(customY = fishY) {
    ctx.save();
    const fishWidth = fishOriginalWidth * FISH_SCALE;
    const fishHeight = fishOriginalHeight * FISH_SCALE;
    ctx.translate(fishX + fishWidth * 0.4, customY + fishHeight * 0.4);
    let angle = 0;
    if (isFlapping) {
        angle = (-20 * Math.PI) / 180;
    } else if (velocity > 0) {
        const maxAngle = (90 * Math.PI) / 180;
        const factor = Math.min(velocity / 10, 1);
        angle = factor * maxAngle;
    }
    ctx.rotate(angle);
    ctx.drawImage(
        fishImg,
        -fishWidth / 2,
        -fishHeight / 2,
        fishWidth,
        fishHeight
    );
    ctx.restore();
}

export function drawPipes() {
    pipes.forEach((pipe, index) => {
        if (index % 2 === 0) {
            // top pipe
            const topPipeHeight = pipe.topPipeHeight;
            ctx.drawImage(pipeImg, pipe.x, 0, pipeWidth, topPipeHeight);
            // bottom pipe (the next pipe in array)
            const bottomPipe = pipes[index + 1];
            if (bottomPipe) {
                const bottomPipeY = topPipeHeight + pipeGap;
                const bottomPipeHeight = canvas.height - bottomPipeY;
                ctx.drawImage(
                    pipeImg,
                    bottomPipe.x,
                    bottomPipeY,
                    pipeWidth,
                    bottomPipeHeight
                );
            }
        }
    });
}

export function drawMeander() {
    const meanderWidth =
        meanderOriginalWidth * (meanderHeight / meanderOriginalHeight);
    for (let x = meanderX; x < canvas.width + meanderWidth; x += meanderWidth) {
        ctx.drawImage(
            meanderImg,
            x,
            canvas.height - meanderHeight,
            meanderWidth,
            meanderHeight
        );
    }
}

export function updateScoreDisplay() {
    if (!scoreDisplayEl) return;
    scoreDisplayEl.textContent = String(score);
    scoreDisplayEl.hidden = false;

    const highScoreElement = document.getElementById("gameOverHighScore");
    if (highScoreElement && gameStarted) {
        highScoreElement.style.display = "none";
    }
}

export function drawHighscores() {
    const container = document.getElementById("highscoresList");
    if (!container) return;
    container.innerHTML = "";

    const targetName = normalizeName(currentPlayerName) || normalizeName(playerNameInput && playerNameInput.value);

    highscores.slice(0, 10).forEach((row) => {
        const item = document.createElement("li");
        item.textContent = `${row.player}: ${row.score}`;

        if (targetName && normalizeName(row.player) === targetName) {
            item.classList.add("current-player");
        }

        container.appendChild(item);
    });
}


export function drawGameOver() {
    drawBackground();
    drawPipes();
    drawMeander();
    drawFish();

    const scoreElement = document.getElementById("gameOverScore");
    const highScoreElement = document.getElementById("gameOverHighScore");

    if (scoreElement) {
        scoreElement.textContent = "Score: " + score;
        if (scoreDisplayEl) {
            scoreDisplayEl.hidden = true;
        }
    }
    if (highScoreElement) {
        highScoreElement.style.display = "block";
        highScoreElement.textContent = "Best score: " + highScore;
    }

    const highscoresList = document.getElementById("highscoresList");
    if (highscoresList) highscoresList.classList.remove("score--hidden");

    // ook de wrapper weer tonen
    const highscoresWrapper = document.querySelector(".highscores");
    if (highscoresWrapper) highscoresWrapper.classList.remove("score--hidden");

    showRestartBtn();

    if (score > 0) {
        showSaveUI();
    } else {
        if (saveScoreBtn) saveScoreBtn.style.display = "none";
        if (nameInputContainer) nameInputContainer.style.display = "none";
        if (saveScoreContainer) saveScoreContainer.style.display = "block";
    }
    showPlayAgainBtn();
}

// === Update & Collision ===
export function updatePipes() {
    const meanderWidth =
        meanderOriginalWidth * (meanderHeight / meanderOriginalHeight);
    meanderX -= pipeSpeed;
    if (meanderX <= -meanderWidth) {
        meanderX += meanderWidth;
    }

    if (pipesSpawned === 0 && Date.now() - gameStartTime < 2000) {
        return;
    }
    if (
        pipes.length === 0 ||
        pipes[pipes.length - 1].x < canvas.width - PIPE_DISTANCE
    ) {
        let topPipeHeight = Math.random() * (canvas.height - pipeGap - 50) + 20;
        pipes.push({
            x: canvas.width,
            y: 0,
            height: topPipeHeight,
            topPipeHeight: topPipeHeight,
            scored: false,
        });
        pipes.push({
            x: canvas.width,
            y: topPipeHeight + pipeGap,
            height: canvas.height - (topPipeHeight + pipeGap),
            topPipeHeight: topPipeHeight,
            scored: false,
        });

        pipesSpawned++;
        if (pipesSpawned % 5 === 0) {
            pipeSpeed += 0.5;
        }
    }

    pipes.forEach((pipe) => (pipe.x -= pipeSpeed));

    const fishWidth = fishOriginalWidth * FISH_SCALE;
    for (let i = 0; i < pipes.length; i += 2) {
        let pipePair = pipes[i];
        if (!pipePair.scored && fishX + fishWidth > pipePair.x + pipeWidth / 2) {
            score++;
            updateScoreDisplay();
            pipePair.scored = true;
            pipes[i + 1].scored = true;
        }
    }

    if (pipes[0].x + pipeWidth < 0) {
        pipes.shift();
        pipes.shift();
    }
}

export function checkCollision() {
    const fishWidth = fishOriginalWidth * FISH_SCALE;
    const fishHeight = fishOriginalHeight * FISH_SCALE;

    // Onderaan canvas
    if (fishY + fishHeight > canvas.height) {
        stopGame();
        return;
    }

    // Meander
    if (fishY + fishHeight > canvas.height - meanderHeight) {
        stopGame();
        return;
    }

    // Pijpen
    for (let i = 0; i < pipes.length; i += 2) {
        const topPipe = pipes[i];
        const topPipeHeight = topPipe.topPipeHeight;
        const bottomY = topPipeHeight + pipeGap;

        const pipeHitboxLeft = topPipe.x + PIPE_HITBOX_PADDING;
        const pipeHitboxRight = topPipe.x + pipeWidth - PIPE_HITBOX_PADDING;
        const fishRight = fishX + fishWidth;
        const fishLeft = fishX;

        const overlapsX = fishRight > pipeHitboxLeft && fishLeft < pipeHitboxRight;

        if (overlapsX) {
            const hitsTop = fishY <= topPipeHeight;
            const hitsBottom = fishY + fishHeight >= bottomY;

            if (hitsTop || hitsBottom) {
                stopGame();
                return;
            }
        }
    }
}

// === Game state & loops ===
export function initGameState() {
    fishY = canvas.height / 2 - 24;
    velocity = 0;
    pipes = [];
    score = 0;
    updateScoreDisplay();
    pipesSpawned = 0;
    pipeSpeed = 4;
    gameStartTime = Date.now();
    gameOver = false;
    highscoresVisible = true;
}

export function updateHighscoreIfNeeded() {
    if (score > highScore) {
        highScore = score;
        highScoreDate = new Date().toLocaleString();
        localStorage.setItem("highScore", highScore);
        localStorage.setItem("highScoreDate", highScoreDate);
    }
}

export function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    highscoresDrawn = false;
    if (playAgainBtn) playAgainBtn.style.display = "none";
    gameStartTime = Date.now();
    animId = requestAnimationFrame(gameLoop);

    const highscoresList = document.getElementById("highscoresList");
    if (highscoresList) highscoresList.classList.add("score--hidden");

    // ook de wrapper hiden
    const highscoresWrapper = document.querySelector(".highscores");
    if (highscoresWrapper) highscoresWrapper.classList.add("score--hidden");

    updateScoreDisplay();
    if (scoreDisplayEl) scoreDisplayEl.hidden = false;
}

export function stopGame() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    gameStarted = false;
    isFlapping = false;
    gameOver = true;
    document.body.classList.add("game-over");

    updateHighscoreIfNeeded();
    drawGameOver();
    restartCooldown = true;
    setTimeout(() => {
        restartCooldown = false;
    }, 1000);
}

export function resetGame() {
    initGameState();
    highscoresDrawn = false;

    hideRestartBtn();
    hideSaveUI();
    hidePlayAgainBtn();

    updateScoreDisplay();

    drawBackground();
    drawMeander();
    drawFish();

    fetchHighscores();
    document.body.classList.remove("game-over");
}

export function gameLoop() {
    drawBackground();

    if (gameOver) {
        drawGameOver();
        return;
    }

    if (isFlapping) {
        velocity = LIFT;
    } else {
        velocity += GRAVITY;
    }
    fishY += velocity;
    drawFish();

    updatePipes();
    drawPipes();
    drawMeander();

    updateScoreDisplay();
    if (DEBUG) {
        drawDebugHitboxes();
    }
    checkCollision();

    if (gameStarted) {
        animId = requestAnimationFrame(gameLoop);
    }
}

export function idleLoop() {
    drawBackground();
    drawMeander();

    const meanderWidth =
        meanderOriginalWidth * (meanderHeight / meanderOriginalHeight);
    meanderX -= pipeSpeed;
    if (meanderX <= -meanderWidth) {
        meanderX += meanderWidth;
    }

    idleOffset += idleDirection * 0.5;
    if (idleOffset > 5 || idleOffset < -5) {
        idleDirection *= -1;
    }

    drawFish(fishY + idleOffset);
    updateScoreDisplay();
    if (highscoresVisible && !highscoresDrawn) {
        drawHighscores();
        highscoresDrawn = true;
    }

    if (!gameStarted) {
        requestAnimationFrame(idleLoop);
    }
}

// === Server integration ===
export async function submitScoreToServer(playerName, scoreValue) {
    try {
        const response = await fetch("submit_score.php", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({player: playerName, score: scoreValue}),
        });
        return await response.json();
    } catch (err) {
        console.error("Network error", err);
    }
}

export let highscores = [];

export async function fetchHighscores(limit = 10) {
    try {
        const response = await fetch(`get_highscores.php?limit=${limit}`);
        highscores = await response.json();
        drawHighscores();
    } catch (e) {
        console.error("Cannot fetch highscores", e);
    }
}
