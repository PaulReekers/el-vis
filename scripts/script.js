const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

function resizeCanvas() {
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;
  const aspectRatio = 4 / 3; // maintain 800x600 ratio

  let newWidth = maxWidth;
  let newHeight = newWidth / aspectRatio;

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  canvas.width = newWidth;
  canvas.height = newHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Afbeeldingen
const fishImg = new Image();
fishImg.src = "../images/el-vis.png";

const pipeImg = new Image();
pipeImg.src = "../images/pipe.png";

// Fish settings
let fishX = 100;
let fishY = canvas.height / 2 - 24; // 24 is de helft van de hoogte van de vis
let gravity = 0.4;
let lift = -4;
let velocity = 0;
let isFlapping = false;

let gameStarted = false;
let animId = null;

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
}

// Pipes
let pipes = [];
let pipeWidth = 100;
let pipeGap = 300;
let pipeSpeed = 2;

let score = 0;

// Controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
    e.preventDefault();
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

document.addEventListener("touchstart", () => {
  startGame();
  isFlapping = true;
});

document.addEventListener("touchend", () => {
  isFlapping = false;
});

const hitboxMargin = 10; // marge om dichter bij de pipes te kunnen

function drawFish() {
  ctx.save();
  // Zet rotatiepunt in het midden van de vis
  ctx.translate(fishX + 34, fishY + 24);
  if (isFlapping) {
    ctx.rotate((-20 * Math.PI) / 180); // draai 20 graden omhoog
  } else if (velocity > 0) {
    ctx.rotate((20 * Math.PI) / 180); // draai 20 graden omlaag
  }
  ctx.drawImage(fishImg, -34, -24, 68, 48);
  ctx.restore();
}

function drawPipes() {
  pipes.forEach((pipe) => {
    ctx.drawImage(pipeImg, pipe.x, pipe.y, pipeWidth, canvas.height);
  });
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

  // Score verhogen wanneer de vis voorbij de pijp gaat
  for (let i = 0; i < pipes.length; i += 2) {
    let pipePair = pipes[i];
    if (!pipePair.scored && fishX > pipePair.x + pipeWidth) {
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
  if (fishY + 48 > canvas.height || fishY < 0) {
    resetGame();
  }

  for (let i = 0; i < pipes.length; i++) {
    let pipe = pipes[i];
    if (
      fishX + hitboxMargin < pipe.x + pipeWidth &&
      fishX + 68 - hitboxMargin > pipe.x &&
      fishY + hitboxMargin < pipe.y + canvas.height &&
      fishY + 48 - hitboxMargin > pipe.y
    ) {
      resetGame();
    }
  }
}

function resetGame() {
  stopGame(); // stop de animatieloop
  fishY = 150;
  velocity = 0;
  pipes = [];
  score = 0;
}
function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, 20, 40);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  drawScore();

  // Collision
  checkCollision();

  if (gameStarted) {
    animId = requestAnimationFrame(gameLoop);
  }
}

// Teken de vis direct na het laden van de afbeelding
fishImg.onload = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFish();
};
