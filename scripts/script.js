const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const meanderOriginalWidth = 193;
const meanderOriginalHeight = 108;
let meanderHeight = 0; // hoogte van de meander onderaan

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

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => {
  setTimeout(resizeCanvas, 200);
});
resizeCanvas();

// Afbeeldingen
const fishImg = new Image();
fishImg.src = "images/el-vis.png";

const pipeImg = new Image();
pipeImg.src = "images/pipe.png";

const bgImg = new Image();
bgImg.src = "images/background.png";

const meanderImg = new Image();
meanderImg.src = "images/meander.png";

let meanderX = 0;

// Fish settings
let fishX = 100;
// let fishY = canvas.height / 2 - 24; // 24 is de helft van de hoogte van de vis
let gravity = 0.4;
let lift = -4;
let velocity = 0;
let isFlapping = false;
// Idle animation variables
let idleOffset = 0;
let idleDirection = 1;

let gameStarted = false;
let animId = null;

let restartCooldown = false;

// Pipes
let pipes = [];
let pipeWidth = 100;
let pipeGap = 200;
let pipeSpeed = 2;

let score = 0;
let gameOver = false;

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  animId = requestAnimationFrame(gameLoop);
}

function stopGame() {
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  gameStarted = false;
  isFlapping = false;
  gameOver = true;
  drawGameOver();
  restartCooldown = true;
  setTimeout(() => {
    restartCooldown = false;
  }, 1000);
}

// Controls - Keyboard fallback for desktop only
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

// Controls - Touch for mobile
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

// Removed R key restart listener, replaced with Space logic above.

const hitboxMargin = 11; // marge om dichter bij de pipes te kunnen

function drawBackground() {
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
}

function drawFish(customY = fishY) {
  ctx.save();
  // Zet rotatiepunt in het midden van de vis
  ctx.translate(fishX + 34, customY + 24);
  let angle = 0;
  if (isFlapping) {
    angle = (-20 * Math.PI) / 180; // omhoog
  } else if (velocity > 0) {
    // hoe sneller naar beneden, hoe dichter bij 90 graden
    const maxAngle = (90 * Math.PI) / 180;
    const factor = Math.min(velocity / 10, 1); // schaal velocity tot max 1
    angle = factor * maxAngle;
  }
  ctx.rotate(angle);
  ctx.drawImage(fishImg, -34, -24, 68, 48);
  ctx.restore();
}
function idleLoop() {
  drawBackground();
  idleOffset += idleDirection * 0.5;
  if (idleOffset > 5 || idleOffset < -5) {
    idleDirection *= -1;
  }
  drawFish(fishY + idleOffset);
  if (!gameStarted) {
    requestAnimationFrame(idleLoop);
  }
}

function drawPipes() {
  pipes.forEach((pipe) => {
    ctx.drawImage(pipeImg, pipe.x, pipe.y, pipeWidth, canvas.height);
  });
}

function drawMeander() {
  ctx.drawImage(
    meanderImg,
    meanderX,
    canvas.height - meanderHeight,
    canvas.width,
    meanderHeight
  );
  ctx.drawImage(
    meanderImg,
    meanderX + canvas.width,
    canvas.height - meanderHeight,
    canvas.width,
    meanderHeight
  );
}

function updatePipes() {
  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 300) {
    let topPipeHeight = Math.random() * (canvas.height - pipeGap - 50) + 20;
    pipes.push({
      x: canvas.width,
      y: topPipeHeight - canvas.height,
      scored: false,
    }); // bovenste pijp
    pipes.push({ x: canvas.width, y: topPipeHeight + pipeGap, scored: false }); // onderste pijp
  }

  pipes.forEach((pipe) => (pipe.x -= pipeSpeed));

  meanderX -= pipeSpeed;
  if (meanderX <= -canvas.width) {
    meanderX = 0;
  }

  // Score verhogen wanneer de vis voorbij de pijp gaat
  for (let i = 0; i < pipes.length; i += 2) {
    let pipePair = pipes[i];
    if (!pipePair.scored && fishX + 68 > pipePair.x + pipeWidth / 2) {
      score++;
      pipePair.scored = true;
      pipes[i + 1].scored = true; // markeer ook onderste pijp
    }
  }

  if (pipes[0].x + pipeWidth < 0) {
    pipes.shift();
    pipes.shift();
  }
}

function checkCollision() {
  if (fishY + 48 > canvas.height) {
    stopGame();
  }

  // Collide with meander
  if (fishY + 48 > canvas.height - meanderHeight) {
    stopGame();
  }

  for (let i = 0; i < pipes.length; i++) {
    let pipe = pipes[i];
    if (
      fishX + hitboxMargin < pipe.x + pipeWidth &&
      fishX + 68 - hitboxMargin > pipe.x &&
      fishY + hitboxMargin < pipe.y + canvas.height &&
      fishY + 48 - hitboxMargin > pipe.y
    ) {
      stopGame();
    }
  }
}

function resetGame() {
  fishY = 150;
  velocity = 0;
  pipes = [];
  score = 0;
  gameOver = false;
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.style.display = "none";
  }
  drawBackground();
  drawFish();
}
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = `${canvas.width / 10}px "Papyrus", "Times New Roman", serif`; // Grieks-achtig font
  ctx.textAlign = "center";
  ctx.fillText(score, canvas.width / 2, canvas.height * 0.2);
}

function drawGameOver() {
  drawBackground();
  drawPipes();
  drawFish();

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = `${canvas.width / 8}px "Papyrus", "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 - 40);
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.style.display = "block";
  }
}

function gameLoop() {
  drawBackground();

  if (gameOver) {
    drawGameOver();
    return;
  }

  // Fish
  if (isFlapping) {
    velocity = lift;
  } else {
    velocity += gravity;
  }
  fishY += velocity;
  drawFish();

  // Pipes
  updatePipes();
  drawPipes();
  drawMeander();

  drawScore();

  // Collision
  checkCollision();

  if (gameStarted) {
    animId = requestAnimationFrame(gameLoop);
  }
}

// Teken de vis direct na het laden van de afbeelding
fishImg.onload = () => {
  resizeCanvas();
  drawBackground();
  idleLoop();
};
