const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");

let paddle, ball, bricks = [], state = { playing: false, score: 0, level: 1 };

// 📱 Canvasサイズ設定（スマホ対応）
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 🎯 ボール・バー・ブロックの初期化
function resetBallAndPaddle() {
  const cw = canvas.width / (window.devicePixelRatio || 1);
  const ch = canvas.height / (window.devicePixelRatio || 1);

  // バーを長めに
  paddle = { 
    x: (cw - 160) / 2, 
    y: ch - 60, 
    width: 160, 
    height: 12, 
    speed: 7 + state.level, 
    dx: 0 
  };

  // 画面の高さに応じて速度スケール
  const speedScale = ch / 800;
  const baseSpeed = 2 / speedScale; // 高いほど遅く見えるので調整

  ball = { 
    x: cw / 2, 
    y: ch - 80, 
    radius: 8, 
    dx: (baseSpeed + state.level * 0.5), 
    dy: -(baseSpeed + state.level * 0.5)
  };
}

// ブロック配置
function createBricks() {
  const cw = canvas.width / (window.devicePixelRatio || 1);
  const rows = 4 + state.level;
  const cols = 6;
  const brickWidth = cw / cols - 10;
  const brickHeight = 18;
  bricks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = `hsl(${Math.random() * 360}, 80%, 60%)`;
      bricks.push({ x: c * (brickWidth + 10) + 5, y: r * (brickHeight + 10) + 40, width: brickWidth, height: brickHeight, visible: true, color });
    }
  }
}

// 🧠 描画関数
function drawPaddle() {
  ctx.fillStyle = "#ff4f81";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#00ffff";
  ctx.fill();
  ctx.closePath();
}
function drawBricks() {
  bricks.forEach(b => {
    if (!b.visible) return;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
}

// 🎮 ゲーム更新
function update() {
  if (!state.playing) return;

  paddle.x += paddle.dx;
  const cw = canvas.width / (window.devicePixelRatio || 1);
  const ch = canvas.height / (window.devicePixelRatio || 1);

  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > cw) paddle.x = cw - paddle.width;

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x < ball.radius || ball.x > cw - ball.radius) ball.dx *= -1;
  if (ball.y < ball.radius) ball.dy *= -1;

  if (ball.y > ch - ball.radius) {
    state.playing = false;
    startScreen.style.display = "flex";
    startScreen.innerHTML = `<h1>ゲームオーバー</h1><p>スコア: ${state.score}</p><button id='restartBtn'>リスタート</button>`;
    document.getElementById("restartBtn").onclick = startGame;
  }

  // パドル衝突
  if (
    ball.x > paddle.x && ball.x < paddle.x + paddle.width &&
    ball.y + ball.radius > paddle.y && ball.y - ball.radius < paddle.y + paddle.height
  ) {
    ball.dy *= -1;
  }

  // ブロック衝突
  let remaining = 0;
  bricks.forEach(b => {
    if (!b.visible) return;
    remaining++;
    if (
      ball.x > b.x && ball.x < b.x + b.width &&
      ball.y > b.y && ball.y < b.y + b.height
    ) {
      ball.dy *= -1;
      b.visible = false;
      state.score += 10;
      scoreEl.textContent = `スコア: ${state.score}`;
    }
  });

  // 全ブロック破壊 → 次レベル
  if (remaining === 0) {
    state.level++;
    levelEl.textContent = `レベル: ${state.level}`;
    createBricks();
    resetBallAndPaddle();
  }
}

// 🎬 描画ループ
function draw() {
  const cw = canvas.width / (window.devicePixelRatio || 1);
  const ch = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, cw, ch);
  drawBricks();
  drawPaddle();
  drawBall();
  update();
  requestAnimationFrame(draw);
}

// 入力（タッチ／マウス対応）
window.addEventListener("mousemove", e => {
  if (!state.playing) return;
  const rect = canvas.getBoundingClientRect();
  paddle.x = e.clientX - rect.left - paddle.width / 2;
});

window.addEventListener("touchmove", e => {
  if (!state.playing) return;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  paddle.x = touch.clientX - rect.left - paddle.width / 2;
});

// スタート
function startGame() {
  state.playing = true;
  state.score = 0;
  state.level = 1;
  scoreEl.textContent = "スコア: 0";
  levelEl.textContent = "レベル: 1";
  createBricks();
  resetBallAndPaddle();
  startScreen.style.display = "none";
  draw();
}

startBtn.addEventListener("click", startGame);
