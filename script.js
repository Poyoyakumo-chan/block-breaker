const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

let paddle, ball, bricks;
const state = { running: false, paused: false, gameOver: false, won: false };

// 🎯 スマホでも確実にキャンバスサイズを調整
function adjustCanvasForHiDPI() {
  const ratio = window.devicePixelRatio || 1;
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  canvas.style.width = cw + "px";
  canvas.style.height = ch + "px";
  canvas.width = cw * ratio;
  canvas.height = ch * ratio;
  ctx.scale(ratio, ratio);
}

// 🎯 パドルとボールをリセット
function resetBallAndPaddle() {
  const cw = canvas.width / (window.devicePixelRatio || 1);
  const ch = canvas.height / (window.devicePixelRatio || 1);
  paddle = { x: (cw - 80) / 2, y: ch - 50, width: 80, height: 10, speed: 7 };
  ball = { x: cw / 2, y: ch - 70, radius: 8, dx: 4, dy: -4 };
}

// 🎯 ブロック配置
function createBricks() {
  const rows = 5;
  const cols = 7;
  const margin = 40;
  const width = (canvas.width / (window.devicePixelRatio || 1) - margin * 2) / cols - 5;
  const height = 20;
  bricks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: margin + c * (width + 5),
        y: margin + r * (height + 5),
        width,
        height,
        broken: false,
      });
    }
  }
}

// 🎯 すべてリセットして新ゲーム開始
function startNewGame() {
  adjustCanvasForHiDPI();
  resetBallAndPaddle();
  createBricks();
  state.running = true;
  state.gameOver = false;
  state.won = false;
  overlay.classList.add("hidden");
  requestAnimationFrame(loop);
}

// 🎯 メインループ
function loop() {
  if (!state.running || state.paused)
