const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");

let cw, ch, paddle, ball, bricks = [], state = { playing: false, score: 0, level: 1 };

// 🧭 Canvasリサイズ（高DPI調整削除版）
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cw = canvas.width;
  ch = canvas.height;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 🎯 バーとボールの初期化
function resetBallAndPaddle() {
  paddle = { 
    x: (cw - 180) / 2, 
    y: ch - 60, 
    width: 180, 
    height: 12, 
    speed: 7 + state.level, 
    dx: 0 
  };

  // 画面高さに応じて速度スケール（縦長Android調整）
  const speedScale = ch / 800;
  const baseSpeed = 2 / speedScale;

  ball = { 
    x: cw / 2, 
    y: ch - 80, 
    radius: 8, 
    dx: (baseSpeed + state.level * 0.4), 
    dy: -(baseSpeed + state.level * 0.4)
  };
}

// 🧱 ブロック生成
function createBricks() {
  const rows = 4 + state.level;
  const cols = 7;
  const brickWidth = cw / cols - 6;
  const brickHeight = 16;
  bricks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = `hsl(${Math.random() * 360}, 80%, 60%)`;
      bricks.push({ 
        x: c * (brickWidth + 6) + 3, 
        y: r * (brickHeight + 6) + 50, 
        width: brickWidth, 
        height: brickHeight, 
        visible: true, 
        color 
      });
    }
  }
}

// ✏️ 描画関数
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

// 🕹 ゲーム更新
function update() {
  if (!state.playing) return;

  paddle.x += paddle.dx;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > cw) paddle.x = cw - paddle.width;

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x < ball.radius || ball.x > cw - ball.radius) ball.dx *= -1;
  if (ball.y < ball.radius) ball.dy *= -1;

  // 下に落ちたらゲームオーバー
  if (ball.y > ch - ball.radius) {
    state.playing = false;
    startScreen.innerHTML = `<h1>ゲームオーバー</h1><p>スコア: ${state.score}</p><button id='restartBtn'>リスタート</button>`;
    startScreen.style.display = "flex";
    document.getElementById("restartBtn").onclick = startGame;
  }

  // パドル反射
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

  // 全ブロック破壊 → レベルアップ
  if (remaining === 0) {
    state.level++;
    levelEl.textContent = `レベル: ${state.level}`;
    createBricks();
    resetBallAndPaddle();
  }
}

// 🎬 描画ループ
function draw() {
  ctx.clearRect(0, 0, cw, ch);
  drawBricks();
  drawPaddle();
  drawBall();
  update();
  requestAnimationFrame(draw);
}

// 🖐️ 入力対応
window.addEventListener("mousemove", e => {
  if (!state.playing) return;
  paddle.x = e.clientX - paddle.width / 2;
});
window.addEventListener("touchmove", e => {
  if (!state.playing) return;
  const touch = e.touches[0];
  paddle.x = touch.clientX - paddle.width / 2;
});

// 🚀 ゲーム開始
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

