const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");

let cw, ch, paddle, ball, bricks = [], state = { playing: false, score: 0, level: 1 };

// 📱 高DPI対応
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  cw = window.innerWidth;
  ch = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 🧱 初期化
function resetBallAndPaddle() {
  const base = cw;
  paddle = {
    width: base * 0.25,
    height: base * 0.02,
    x: (cw - base * 0.25) / 2,
    y: ch - base * 0.08,
    dx: 0
  };
  const speed = Math.max(2, base / 600);
  ball = {
    x: cw / 2,
    y: ch - base * 0.1,
    radius: base * 0.015,
    dx: speed,
    dy: -speed
  };
}

function createBricks() {
  const rows = 4 + state.level;
  const cols = 7;
  const brickWidth = cw / cols - 8;
  const brickHeight = cw * 0.03;
  bricks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: c * (brickWidth + 6) + 3,
        y: r * (brickHeight + 6) + 60,
        width: brickWidth,
        height: brickHeight,
        visible: true,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`
      });
    }
  }
}

// 🎨 描画関数
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

// 🕹 更新
function update() {
  if (!state.playing) return;

  paddle.x += paddle.dx;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > cw) paddle.x = cw - paddle.width;

  ball.x += ball.dx;
  ball.y += ball.dy;

  // 壁
  if (ball.x < ball.radius || ball.x > cw - ball.radius) ball.dx *= -1;
  if (ball.y < ball.radius) ball.dy *= -1;

  // 下に落ちた
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
      b.visible = false;
      ball.dy *= -1;
      state.score += 10;
      scoreEl.textContent = `スコア: ${state.score}`;
    }
  });

  if (remaining === 0) {
    state.level++;
    levelEl.textContent = `レベル: ${state.level}`;
    createBricks();
    resetBallAndPaddle();
  }
}

// 🔁 ループ
function draw() {
  ctx.clearRect(0, 0, cw, ch);
  drawBricks();
  drawPaddle();
  drawBall();
  update();
  requestAnimationFrame(draw);
}

// 🖐 入力
window.addEventListener("mousemove", e => {
  if (!state.playing) return;
  paddle.x = e.clientX - paddle.width / 2;
});
window.addEventListener("touchmove", e => {
  if (!state.playing) return;
  const touch = e.touches[0];
  paddle.x = touch.clientX - paddle.width / 2;
});

// 🚀 開始
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


