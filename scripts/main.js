import {
  resizeCanvas,
  drawBackground,
  drawMeander,
  fetchHighscores,
  idleLoop,
  fishImg,
} from "./game.js";
import "./ui.js";
import "./input.js";

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () =>
  setTimeout(resizeCanvas, 200)
);

function init() {
  resizeCanvas();
  drawBackground();
  drawMeander();
  fetchHighscores();
  idleLoop();
}

if (fishImg.complete) {
  init();
} else {
  fishImg.onload = init;
}
