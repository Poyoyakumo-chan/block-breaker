const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");

let cw, ch, paddle, ball, bricks = [], particles = [], state = { playing: false, score: 0, level: 1 };

// Canvasサイズ
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cw = canvas.width;
  ch = canvas.height;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 初期化
function resetBallAndPaddle() {
  paddle = {
    width: cw * 0.25,
    height: ch * 0.02,
    x: cw * 0.375,
    y: ch * 0.9,
    dx: 0
  };

  const baseSpeed = 4;
  ball = {
    x: cw / 2,
    y: ch * 0.85,
    radius: cw * 0.015,
    dx: baseSpeed * (Math.random() < 0.5 ? -1 : 1),
    dy: -baseSpeed,
    trail: []
  };
}

function createBricks() {
  const rows = 4 + state.level;
  const cols = 7;
  const brickWidth = cw / cols - 8;
  const brickHeight = ch * 0.03;
  bricks = [];
  const topOffset = ch * 0.1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: c * (brickWidth + 6) + 3,
        y: topOffset + r * (brickHeight + 6),
        width: brickWidth,
        height: brickHeight,
        visible: true,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`
      });
    }
  }
}

// パーティクル生成
function createParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x,
      y,
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 4,
      alpha: 1,
      color
    });
  }
}

// 描画
function drawPaddle() {
  ctx.fillStyle = "#ff4f81";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#ff4f81";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.shadowBlur = 0;
}
function drawBall() {
  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > 10) ball.trail.shift();

  // トレイル描画
  ball.trail.forEach((t, i) => {
    ctx.beginPath();
    ctx.arc(t.x, t.y, ball.radius * (i / 10 + 0.5), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,255,255,${i/10 * 0.5})`;
    ctx.fill();
    ctx.closePath();
  });

  // ボール本体
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
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
  ctx.shadowBlur = 0;
}

// パーティクル描画
function drawParticles() {
  particles.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
    ctx.fill();
    ctx.closePath();

    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= 0.05;
    if (p.alpha <= 0) particles.splice(i, 1);
  });
}

// 更新
function update() {
  if (!state.playing) return;

  paddle.x += paddle.dx;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > cw) paddle.x = cw - paddle.width;

  ball.x += ball.dx;
  ball.y += ball.dy;

  // 壁反射
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
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width &&
    ball.y + ball.radius > paddle.y &&
    ball.y - ball.radius < paddle.y + paddle.height
  ) {
    ball.dy *= -1;
    ball.y = paddle.y - ball.radius;
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

      createParticles(ball.x, ball.y, "0,255,255"); // パーティクル
    }
  });

  if (remaining === 0) {
    state.level++;
    levelEl.textContent = `レベル: ${state.level}`;
    createBricks();
    resetBallAndPaddle();
  }
}

// ループ
function draw() {
  // 背景グラデーション
  const grad = ctx.createLinearGradient(0, 0, 0, ch);
  grad.addColorStop(0, `hsl(${Date.now()/50 % 360},50%,10%)`);
  grad.addColorStop(1, `hsl(${(Date.now()/50+60) % 360},50%,10%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  drawBricks();
  drawPaddle();
  drawBall();
  drawParticles();
  update();
  requestAnimationFrame(draw);
}

// 入力
window.addEventListener("mousemove", e => {
  if (!state.playing) return;
  paddle.x = e.clientX - paddle.width / 2;
});
window.addEventListener("touchmove", e => {
  if (!state.playing) return;
  const touch = e.touches[0];
  paddle.x = touch.clientX - paddle.width / 2;
});

// ゲーム開始
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

// スタートボタン対応
startBtn.addEventListener("click", startGame);
startBtn.addEventListener("touchstart", e => { e.preventDefault(); startGame(); });
