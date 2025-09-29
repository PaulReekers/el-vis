// === Constants ===
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
export const PIPE_HITBOX_PADDING = 15;
export const GRAVITY = 0.5;
export const LIFT = -7;
const hitboxMargin = 11;

let DEBUG = false; // Show debug hitboxes if true

// === State variables ===
export let fishX = 100;
export let fishY = 0;
export let velocity = 0;
export let isFlapping = false;
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

// === Highscore & Game State ===
export let highScore = 0;
export let highScoreDate = null;
const savedHighScore = localStorage.getItem("highScore");
const savedHighScoreDate = localStorage.getItem("highScoreDate");
if (savedHighScore) {
  highScore = parseInt(savedHighScore, 10);
  highScoreDate = savedHighScoreDate;
}
export let gameStarted = false;
export let gameOver = false;
let animId = null;
let restartCooldown = false;

// === DOM references ===
export const saveScoreContainer = document.getElementById("saveScoreContainer");
export const saveScoreBtn = document.getElementById("saveScoreBtn");
export const nameInputContainer = document.getElementById("nameInputContainer");
export const confirmSaveBtn = document.getElementById("confirmSaveBtn");
export const playerNameInput = document.getElementById("playerName");
export const playAgainBtn = document.getElementById("playAgainBtn");

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
  const maxWidth = window.visualViewport
    ? window.visualViewport.width
    : window.innerWidth;
  const maxHeight = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;
  const aspectRatio = 768 / 1024;

  let newWidth = maxWidth;
  let newHeight = newWidth / aspectRatio;

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  canvas.width = newWidth;
  canvas.height = newHeight;
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

  pipes.forEach((pipe) => {
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      pipe.x + PIPE_HITBOX_PADDING,
      pipe.y,
      pipeWidth - PIPE_HITBOX_PADDING * 2,
      canvas.height
    );
  });
}

// === UI Handling functions ===
export function showSaveUI() {
  if (saveScoreContainer) {
    saveScoreContainer.style.display = "block";
    saveScoreContainer.style.bottom = "10%";
    saveScoreContainer.style.left = "50%";
  }
  if (saveScoreBtn) saveScoreBtn.style.display = "inline-block";
  if (nameInputContainer) nameInputContainer.style.display = "none";
  if (playerNameInput) playerNameInput.value = "";
}

export function hideSaveUI() {
  if (saveScoreContainer) saveScoreContainer.style.display = "none";
  if (nameInputContainer) nameInputContainer.style.display = "none";
}

export function showPlayAgainBtn() {
  if (playAgainBtn) playAgainBtn.style.display = "block";
}

export function hidePlayAgainBtn() {
  if (playAgainBtn) playAgainBtn.style.display = "none";
}

export function showRestartBtn() {
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.style.display = "block";
  }
}

export function hideRestartBtn() {
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.style.display = "none";
  }
}

// === Drawing functions ===
export function drawBackground() {
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
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
  pipes.forEach((pipe) => {
    ctx.drawImage(pipeImg, pipe.x, pipe.y, pipeWidth, canvas.height);
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

export function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = `${canvas.width / 10}px "Papyrus", "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.fillText(score, canvas.width / 2, canvas.height * 0.2);
}

export function drawHighscores() {
  if (!highscores || highscores.length === 0) return;
  ctx.font = `${canvas.width / 20}px Arial`;
  ctx.fillStyle = "yellow";
  ctx.textAlign = "center";
  ctx.fillText("Top Scores", canvas.width / 2, canvas.height / 2 + 100);
  ctx.font = `${canvas.width / 30}px Arial`;
  highscores.slice(0, 10).forEach((row, index) => {
    ctx.fillText(
      `${index + 1}. ${row.player}: ${row.score}`,
      canvas.width / 2,
      canvas.height / 2 + 140 + index * 30
    );
  });
}

export function drawGameOver() {
  drawBackground();
  drawPipes();
  drawMeander();
  drawFish();

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = `${canvas.width / 8}px "Papyrus", "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 - 80);

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
      y: topPipeHeight - canvas.height,
      scored: false,
    });
    pipes.push({ x: canvas.width, y: topPipeHeight + pipeGap, scored: false });

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

  if (fishY + fishHeight > canvas.height) {
    stopGame();
  }

  if (fishY + fishHeight > canvas.height - meanderHeight) {
    stopGame();
  }

  for (let i = 0; i < pipes.length; i++) {
    let pipe = pipes[i];
    const fishCenterX = fishX + fishWidth / 2;
    const fishCenterY = fishY + fishHeight / 2;
    const fishRadius = Math.min(fishWidth, fishHeight) / 2.5;

    const closestX = Math.max(
      pipe.x + PIPE_HITBOX_PADDING,
      Math.min(fishCenterX, pipe.x + pipeWidth - PIPE_HITBOX_PADDING)
    );
    const closestY = Math.max(
      pipe.y,
      Math.min(fishCenterY, pipe.y + canvas.height)
    );

    const dx = fishCenterX - closestX;
    const dy = fishCenterY - closestY;

    if (dx * dx + dy * dy < fishRadius * fishRadius) {
      stopGame();
    }
  }
}

// === Game state & loops ===
export function initGameState() {
  fishY = canvas.height / 2 - 24;
  velocity = 0;
  pipes = [];
  score = 0;
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
  if (playAgainBtn) playAgainBtn.style.display = "none";
  gameStartTime = Date.now();
  animId = requestAnimationFrame(gameLoop);
  highscoresVisible = false;
}

export function stopGame() {
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  gameStarted = false;
  isFlapping = false;
  gameOver = true;

  updateHighscoreIfNeeded();
  drawGameOver();
  restartCooldown = true;
  setTimeout(() => {
    restartCooldown = false;
  }, 1000);
}

export function resetGame() {
  fetchHighscores();
  initGameState();

  hideRestartBtn();
  hideSaveUI();
  hidePlayAgainBtn();

  drawBackground();
  drawMeander();
  drawFish();

  fetchHighscores();
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

  drawScore();
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
  drawScore();
  if (highscoresVisible) {
    drawHighscores();
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player: playerName, score: scoreValue }),
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
  } catch (e) {
    console.error("Cannot fetch highscores", e);
  }
}
