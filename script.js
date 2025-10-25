// 簡単なブロック崩しゲーム（スマホ対応版）
// キーボード / マウス / タッチ操作対応
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const overlay = document.getElementById('overlay');
  const overlayText = document.getElementById('overlayText');
  const startBtn = document.getElementById('startBtn');

  // --- Canvas 高DPI対応 ---
  function adjustCanvasForHiDPI() {
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight || 600;
    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // --- ゲーム状態 ---
  const state = { score: 0, lives: 3, running: false, paused: true, won: false, gameOver: false };

  // パドル
  const paddle = {
    width: 110,
    height: 12,
    x: 0,
    y: 0,
    speed: 8,
    dx: 0,
  };

  // ボール
  const ball = { radius: 9, x: 0, y: 0, speed: 4, vx: 4, vy: -4 };

  // ブロック配置
  const brickConfig = { rows: 5, cols: 9, width: 70, height: 20, padding: 10, offsetTop: 60, offsetLeft: 35 };
  let bricks = [];

  // --- 初期化 ---
  function initBricks() {
    bricks = [];
    for (let r = 0; r < brickConfig.rows; r++) {
      const row = [];
      for (let c = 0; c < brickConfig.cols; c++) {
        row.push({ x: brickConfig.offsetLeft + c * (brickConfig.width + brickConfig.padding), y: brickConfig.offsetTop + r * (brickConfig.height + brickConfig.padding), status: 1 });
      }
      bricks.push(row);
    }
  }

  function resetBallAndPaddle() {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    paddle.x = (cw - paddle.width) / 2;
    paddle.y = ch - 50;
    ball.x = cw / 2;
    ball.y = ch - 80;
    ball.speed = 4;
    const angle = (Math.random() * Math.PI / 3) + (Math.PI / 6);
    ball.vx = ball.speed * Math.cos(angle) * (Math.random() < 0.5 ? -1 : 1);
    ball.vy = -Math.abs(ball.speed * Math.sin(angle));
  }

  function startNewGame() {
    state.score = 0;
    state.lives = 3;
    state.running = true;
    state.paused = false;
    state.won = false;
    state.gameOver = false;
    initBricks();
    resetBallAndPaddle();
    updateHUD();
    overlay.classList.add('hidden');
    requestAnimationFrame(loop);
  }

  // --- 描画 ---
  function clear() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

  function drawPaddle() { roundRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 6, true, false, '#118ab2'); }
  function drawBall() { ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.closePath(); }

  function drawBricks() {
    const colors = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#8338ec'];
    for (let r = 0; r < brickConfig.rows; r++) {
      for (let c = 0; c < brickConfig.cols; c++) {
        const b = bricks[r][c];
        if (b.status === 1) roundRect(ctx, b.x, b.y, brickConfig.width, brickConfig.height, 4, true, false, colors[r % colors.length]);
      }
    }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke, fillStyle = '#fff') {
    if (r < 0) r = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fillStyle; ctx.fill(); }
    if (stroke) ctx.stroke();
  }

  // --- 更新 ---
  function update() {
    if (!state.running || state.paused) return;
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);

    paddle.x += paddle.dx * paddle.speed;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > cw) paddle.x = cw - paddle.width;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // 壁反射
    if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx *= -1; }
    if (ball.x + ball.radius > cw) { ball.x = cw - ball.radius; ball.vx *= -1; }
    if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy *= -1; }

    // パドル衝突
    if (ball.y + ball.radius >= paddle.y && ball.y + ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
      const collidePoint = (ball.x - (paddle.x + paddle.width / 2));
      const normalized = collidePoint / (paddle.width / 2);
      const maxBounce = Math.PI / 3;
      const bounceAngle = normalized * maxBounce;
      const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
      ball.vx = speed * Math.sin(bounceAngle);
      ball.vy = -Math.abs(speed * Math.cos(bounceAngle));
      ball.vx *= 1.02; ball.vy *= 1.02;
    }

    // ブロック衝突
    for (let r = 0; r < brickConfig.rows; r++) {
      for (let c = 0; c < brickConfig.cols; c++) {
        const b = bricks[r][c];
        if (b.status === 1 && circleRectCollision(ball, b.x, b.y, brickConfig.width, brickConfig.height)) {
          b.status = 0; state.score += 10; ball.vy *= -1;
          const speed = Math.min(10, Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy) * 1.03);
          const angle = Math.atan2(ball.vy, ball.vx);
          ball.vx = speed * Math.cos(angle); ball.vy = speed * Math.sin(angle);
        }
      }
    }

    // 下端チェック
    if (ball.y - ball.radius > ch) {
      state.lives--;
      updateHUD();
      if (state.lives <= 0) { state.running = false; state.gameOver = true; showOverlay('ゲームオーバー', 'もう一度遊ぶ'); }
      else { state.paused = true; showOverlay('ミス！残りライフ: ' + state.lives, '再開', false); resetBallAndPaddle(); }
    }

    if (isAllBricksCleared()) { state.running = false; state.won = true; showOverlay('ステージクリア！ Score: ' + state.score, '再挑戦'); }

    updateHUD();
  }

  function circleRectCollision(circle, rx, ry, rw, rh) {
    const closestX = clamp(circle.x, rx, rx + rw);
    const closestY = clamp(circle.y, ry, ry + rh);
    const dx = circle.x - closestX, dy = circle.y - closestY;
    return (dx*dx + dy*dy) < (circle.radius*circle.radius);
  }

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function isAllBricksCleared(){return bricks.every(row=>row.every(b=>b.status===0));}

  // --- HUD / Overlay ---
  function updateHUD(){scoreEl.textContent='Score: '+state.score; livesEl.textContent='Lives: '+state.lives;}
  function showOverlay(text, btnText='スタート', showCorner=true){overlayText.textContent=text; startBtn.textContent=btnText; overlay.classList.remove('hidden'); state.paused=true;}

  // --- ループ ---
  function loop(){
    adjustCanvasForHiDPI();
    clear();
    drawBricks();
    drawPaddle();
    drawBall();
    update();
    if(state.running && !state.paused) requestAnimationFrame(loop);
  }

  // --- 入力 ---
  const keys={};
  function handleKeyDown(e){keys[e.key]=true; if(keys['ArrowLeft']||keys['a']||keys['A']) paddle.dx=-1; if(keys['ArrowRight']||keys['d']||keys['D']) paddle.dx=1; if(e.key===' '||e.key==='Spacebar'){togglePause(); e.preventDefault();}}
  function handleKeyUp(e){keys[e.key]=false; paddle.dx=keys['ArrowLeft']||keys['a']||keys['A']?-1:keys['ArrowRight']||keys['d']||keys['D']?1:0;}
  function handleMouseMove(e){const rect=canvas.getBoundingClientRect(); paddle.x=e.clientX-rect.left-paddle.width/2; const cw = canvas.width / (window.devicePixelRatio || 1); if(paddle.x<0)paddle.x=0; if(paddle.x+paddle.width>cw)paddle.x=cw-paddle.width;}

  // --- タッチ操作 ---
  function handleTouchMove(e){
    e.preventDefault();
    const rect=canvas.getBoundingClientRect();
    const touch=e.touches[0];
    paddle.x=touch.clientX-rect.left-paddle.width/2;
    const cw=canvas.width/(window.devicePixelRatio||1);
    if(paddle.x<0)paddle.x=0;
    if(paddle.x+paddle.width>cw)paddle.x=cw-paddle.width;
  }

  function togglePause(){
    if(!state.running) return;
    state.paused=!state.paused;
    if(!state.paused){overlay.classList.add('hidden'); requestAnimationFrame(loop);}
    else showOverlay('一時停止','再開',false);
  }

  startBtn.addEventListener('click',()=>{
    if(!state.running||state.gameOver||state.won) startNewGame();
    else {state.paused=false; overlay.classList.add('hidden'); requestAnimationFrame(loop);}
  });

  // --- 初期化 ---
  function init(){
    initBricks();
    resetBallAndPaddle();
    updateHUD();
    showOverlay('クリックしてゲームを始める','スタート');
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchstart', handleTouchMove);
    canvas.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('resize',()=>{
      adjustCanvasForHiDPI();
      const cw = canvas.width/(window.devicePixelRatio||1);
      const ch = canvas.height/(window.devicePixelRatio||1);
      if(paddle.x+paddle.width>cw) paddle.x=cw-paddle.width;
      if(ball.x>cw) ball.x=cw/2;
      if(ball.y>ch) ball.y=ch-80;
    });
  }

  init();
})();
