(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const startBtn = document.getElementById("startBtn");
  const overlayText = document.getElementById("overlayText");

  // --- 状態 ---
  let paddle, ball, bricks;
  const state = { running: false, paused: true, won: false, gameOver: false };

  // --- Canvas 高DPI & 画面サイズ調整 ---
  function adjustCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    canvas.width = cw * ratio;
    canvas.height = ch * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // --- パドルとボール初期化 ---
  function resetBallAndPaddle() {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    paddle = { x: (cw - 80)/2, y: ch - 50, width: 80, height: 10, speed: 7, dx:0 };
    ball = { x: cw/2, y: ch - 70, radius: 8, dx: 4, dy: -4 };
  }

  // --- ブロック作成 ---
  function createBricks() {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const rows = 5, cols = 7;
    const margin = 40;
    const width = (cw - margin*2 - (cols-1)*5)/cols;
    const height = 20;
    bricks = [];
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        bricks.push({ x: margin+c*(width+5), y: margin+r*(height+5), width, height, broken:false });
      }
    }
  }

  // --- スタートゲーム ---
  function startNewGame() {
    adjustCanvas();
    resetBallAndPaddle();
    createBricks();
    state.running = true;
    state.paused = false;
    state.won = false;
    state.gameOver = false;
    overlay.classList.add("hidden");
    requestAnimationFrame(loop);
  }

  // --- 描画 ---
  function draw() {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0,0,cw,ch);

    // パドル
    ctx.fillStyle="dodgerblue";
    ctx.fillRect(paddle.x,paddle.y,paddle.width,paddle.height);

    // ボール
    ctx.beginPath();
    ctx.arc(ball.x,ball.y,ball.radius,0,Math.PI*2);
    ctx.fillStyle="red";
    ctx.fill();
    ctx.closePath();

    // ブロック
    for(let b of bricks){
      if(!b.broken){
        ctx.fillStyle="orange";
        ctx.fillRect(b.x,b.y,b.width,b.height);
      }
    }
  }

  // --- 更新 ---
  function update() {
    if(!state.running || state.paused) return;
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);

    // パドル移動
    paddle.x += paddle.dx*paddle.speed;
    if(paddle.x<0) paddle.x=0;
    if(paddle.x+paddle.width>cw) paddle.x=cw-paddle.width;

    // ボール移動
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 壁反射
    if(ball.x-ball.radius<0 || ball.x+ball.radius>cw) ball.dx*=-1;
    if(ball.y-ball.radius<0) ball.dy*=-1;

    // パドル衝突
    if(ball.y+ball.radius>=paddle.y && ball.y+ball.radius<=paddle.y+paddle.height &&
       ball.x>=paddle.x && ball.x<=paddle.x+paddle.width){
      ball.dy*=-1;
      ball.y=paddle.y-ball.radius;
    }

    // ブロック衝突
    for(let b of bricks){
      if(!b.broken){
        if(ball.x>b.x && ball.x<b.x+b.width &&
           ball.y-ball.radius<b.y+b.height && ball.y+ball.radius>b.y){
             b.broken=true;
             ball.dy*=-1;
        }
      }
    }

    // ゲームオーバー
    if(ball.y>ch){
      state.running=false;
      state.gameOver=true;
      showOverlay("GAME OVER");
      return;
    }

    // ステージクリア
    if(bricks.every(b=>b.broken)){
      state.running=false;
      state.won=true;
      showOverlay("CLEAR!");
      return;
    }

    draw();
    requestAnimationFrame(loop);
  }

  // --- ループ ---
  function loop(){
    update();
  }

  // --- メッセージ表示 ---
  function showOverlay(text){
    overlayText.textContent=text;
    overlay.classList.remove("hidden");
  }

  // --- 入力 ---
  function handleInput(x){
    const cw = canvas.width / (window.devicePixelRatio || 1);
    paddle.x=x-paddle.width/2;
    if(paddle.x<0) paddle.x=0;
    if(paddle.x+paddle.width>cw) paddle.x=cw-paddle.width;
  }

  canvas.addEventListener("mousemove", e=>handleInput(e.offsetX));
  canvas.addEventListener("touchmove", e=>{
    e.preventDefault();
    const rect=canvas.getBoundingClientRect();
    handleInput(e.touches[0].clientX-rect.left);
  });

  startBtn.addEventListener("click", ()=>{
    adjustCanvas();
    if(!state.running || state.gameOver || state.won) startNewGame();
    else { state.paused=false; overlay.classList.add("hidden"); requestAnimationFrame(loop); }
  });

  window.addEventListener("resize", adjustCanvas);

  // 初期化
  adjustCanvas();
  resetBallAndPaddle();
  createBricks();
  draw();
})();


