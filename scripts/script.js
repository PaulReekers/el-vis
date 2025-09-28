const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// Asset dimensions and scaling
const fishOriginalWidth = 158;
const fishOriginalHeight = 56;
const FISH_SCALE = 0.6;

const meanderOriginalWidth = 193;
const meanderOriginalHeight = 108;

const pipeWidth = 100;
const pipeGap = 250;

// Physics constants
const GRAVITY = 0.5;
const LIFT = -7;

// Hitbox margin for collision detection
const hitboxMargin = 11;

// State variables
let fishX = 100;
let fishY = 0;
let velocity = 0;
let isFlapping = false;

let idleOffset = 0;
let idleDirection = 1;

let meanderHeight = 0;
let meanderX = 0;

let pipes = [];
let pipeSpeed = 4;
let pipesSpawned = 0;
let gameStartTime = null;

let score = 0;
let highScore = 0;
let highScoreDate = null;

// Load high score from localStorage
const savedHighScore = localStorage.getItem("highScore");
const savedHighScoreDate = localStorage.getItem("highScoreDate");
if (savedHighScore) {
  highScore = parseInt(savedHighScore, 10);
  highScoreDate = savedHighScoreDate;
}

let gameStarted = false;
let gameOver = false;
let animId = null;
let restartCooldown = false;

// Images
const fishImg = new Image();
fishImg.src = "images/el-vis.png";

const pipeImg = new Image();
pipeImg.src = "images/pipe.png";

const bgImg = new Image();
bgImg.src = "images/background.png";

const meanderImg = new Image();
meanderImg.src = "images/meander.png";

// Utility function to resize canvas and recalculate scaling
function resizeCanvas() {
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

// Drawing functions
function drawBackground() {
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
}

function drawFish(customY = fishY) {
  ctx.save();
  const fishWidth = fishOriginalWidth * FISH_SCALE;
  const fishHeight = fishOriginalHeight * FISH_SCALE;
  ctx.translate(fishX + fishWidth / 2, customY + fishHeight / 2);
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

function drawPipes() {
  pipes.forEach((pipe) => {
    ctx.drawImage(pipeImg, pipe.x, pipe.y, pipeWidth, canvas.height);
  });
}

function drawMeander() {
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

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = `${canvas.width / 10}px "Papyrus", "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.fillText(score, canvas.width / 2, canvas.height * 0.2);
}

function drawGameOver() {
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
  ctx.font = `${canvas.width / 12}px "Papyrus", "Times New Roman", serif`;
  ctx.fillText("Best: " + highScore, canvas.width / 2, canvas.height / 2);
  if (highScoreDate) {
    ctx.font = `${canvas.width / 20}px Arial`;
  }

  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.style.display = "block";
  }
}

// Update functions
function updatePipes() {
  const meanderWidth =
    meanderOriginalWidth * (meanderHeight / meanderOriginalHeight);
  meanderX -= pipeSpeed;
  if (meanderX <= -meanderWidth) {
    meanderX += meanderWidth;
  }

  if (pipesSpawned === 0 && Date.now() - gameStartTime < 2000) {
    return;
  }

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 300) {
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

// Collision detection
function checkCollision() {
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
    if (
      fishX + hitboxMargin + 10 < pipe.x + pipeWidth &&
      fishX + fishWidth - hitboxMargin - 10 > pipe.x &&
      fishY + hitboxMargin < pipe.y + canvas.height &&
      fishY + fishHeight - hitboxMargin > pipe.y
    ) {
      stopGame();
    }
  }
}

// Game state functions
function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  gameStartTime = Date.now();
  animId = requestAnimationFrame(gameLoop);
}

function stopGame() {
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  gameStarted = false;
  isFlapping = false;
  gameOver = true;

  if (score > highScore) {
    highScore = score;
    highScoreDate = new Date().toLocaleString();
    localStorage.setItem("highScore", highScore);
    localStorage.setItem("highScoreDate", highScoreDate);
  }

  drawGameOver();
  restartCooldown = true;
  setTimeout(() => {
    restartCooldown = false;
  }, 1000);
}

function resetGame() {
  fishY = canvas.height / 2 - 24;
  velocity = 0;
  pipes = [];
  score = 0;
  pipesSpawned = 0;
  pipeSpeed = 4;
  gameStartTime = Date.now();
  gameOver = false;

  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.style.display = "none";
  }

  drawBackground();
  drawMeander();
  drawFish();
}

// Main game loop
function gameLoop() {
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

  checkCollision();

  if (gameStarted) {
    animId = requestAnimationFrame(gameLoop);
  }
}

// Idle animation loop before game start
function idleLoop() {
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

  if (!gameStarted) {
    requestAnimationFrame(idleLoop);
  }
}

// Event listeners
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => {
  setTimeout(resizeCanvas, 200);
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
    e.preventDefault();
    if (gameOver && !restartCooldown) {
      resetGame();
      gameOver = false;
      gameStarted = false;
      idleLoop();
      return;
    }
    startGame();
    isFlapping = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
    e.preventDefault();
    isFlapping = false;
  }
});

document.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    if (gameOver && !restartCooldown) {
      resetGame();
      gameOver = false;
      gameStarted = false;
      idleLoop();
      return;
    }
    startGame();
    isFlapping = true;
  },
  { passive: false }
);

document.addEventListener(
  "touchend",
  (e) => {
    e.preventDefault();
    isFlapping = false;
  },
  { passive: false }
);

document.addEventListener("touchmove", (e) => e.preventDefault(), {
  passive: false,
});

// Initialize on fish image load
fishImg.onload = () => {
  resizeCanvas();
  drawBackground();
  drawMeander();
  idleLoop();
};
