(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const startBtn = document.getElementById("startBtn");
  const overlayText = document.getElementById("overlayText");
  const scoreBoard = document.getElementById("scoreBoard");

  let paddle, ball, bricks;
  const state = { running: false, paused: true, won: false, gameOver: false, score:0, level:1 };

  function adjustCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    canvas.width = cw * ratio;
    canvas.height = ch * ratio;
    ctx.setTransform(ratio,0,0,ratio,0,0);
  }

  function resetBallAndPaddle() {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    paddle = { x: (cw-100)/2, y: ch-50, width: 100, height: 12, speed:7+state.level, dx:0 };
    ball = { x: cw/2, y: ch-70, radius:8, dx:4+state.level, dy:-4-state.level };
  }

  function createBricks() {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const rows = 4 + state.level; // レベルで行数増加
    const cols = 7;
    const margin = 30;
    const width = (cw - margin*2 - (cols-1)*5)/cols;
    const height = 20;
    bricks = [];
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        bricks.push({
          x: margin + c*(width+5),
          y: margin + r*(height+5),
          width,
          height,
          broken:false,
          color: `hsl(${Math.random()*360},70%,50%)` // ランダムカラー
        });
      }
    }
  }

  function draw() {
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    // 背景グラデーション
    const grad = ctx.createLinearGradient(0,0,0,ch);
    grad.addColorStop(0,"#001a33");
    grad.addColorStop(1,"#003366");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,cw,ch);

    // パドル
    ctx.fillStyle="lime";
    ctx.fillRect(paddle.x,paddle.y,paddle.width,paddle.height);

    // ボール
    ctx.beginPath();
    ctx.arc(ball.x,ball.y,ball.radius,0,Math.PI*2);
    ctx.fillStyle="yellow";
    ctx.fill();
    ctx.closePath();

    // ブロック
    for(let b of bricks){
      if(!b.broken){
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x,b.y,b.width,b.height);
      }
    }
  }

  function handleInput(x){
    const cw = canvas.width / (window.devicePixelRatio || 1);
    paddle.x = x - paddle.width/2;
    if(paddle.x<0) paddle.x=0;
    if(paddle.x+paddle.width>cw) paddle.x=cw-paddle.width;
  }

  canvas.addEventListener("mousemove", e => handleInput(e.offsetX));
  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    handleInput(e.touches[0].clientX - rect.left);
  });
  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    handleInput(e.touches[0].clientX - rect.left);
  });

  function updateScore() {
    scoreBoard.textContent = `スコア: ${state.score} | レベル: ${state.level}`;
  }

  function showOverlay(text, btnText="スタート") {
    overlayText.textContent = text;
    startBtn.textContent = btnText;
    overlay.classList.remove("hidden");
    state.paused = true;
  }

  function update() {
    if(!state.running || state.paused) return;
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);

    paddle.x += paddle.dx*paddle.speed;
    if(paddle.x<0) paddle.x=0;
    if(paddle.x+paddle.width>cw) paddle.x=cw-paddle.width;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if(ball.x-ball.radius<0 || ball.x+ball.radius>cw) ball.dx*=-1;
    if(ball.y-ball.radius<0) ball.dy*=-1;

    if(ball.y+ball.radius>=paddle.y && ball.y+ball.radius<=paddle.y+paddle.height &&
       ball.x>=paddle.x && ball.x<=paddle.x+paddle.width){
      ball.dy*=-1;
      ball.y=paddle.y-ball.radius;
    }

    for(let b of bricks){
      if(!b.broken){
        if(ball.x>b.x && ball.x<b.x+b.width &&
           ball.y-ball.radius<b.y+b.height && ball.y+ball.radius>b.y){
             b.broken=true;
             ball.dy*=-1;
             state.score += 10;
             updateScore();
        }
      }
    }

    if(ball.y>ch){
      state.running=false;
      state.gameOver=true;
      showOverlay("GAME OVER");
      return;
    }

    if(bricks.every(b=>b.broken)){
      state.running=false;
      state.won=true;
      state.level +=1;
      showOverlay(`LEVEL UP!`, "次のレベル");
      return;
    }

    draw();
    requestAnimationFrame(loop);
  }

  function loop(){ update(); }

  function startGame(){
    adjustCanvas();
    overlay.classList.add("hidden");
    resetBallAndPaddle();
    createBricks();
    state.running=true;
    state.paused=false;
    updateScore();
    requestAnimationFrame(loop);
  }

  startBtn.addEventListener("click", startGame);
  startBtn.addEventListener("touchstart", startGame);

  window.addEventListener("resize", adjustCanvas);

  // 初期化
  adjustCanvas();
  resetBallAndPaddle();
  createBricks();
  draw();
  updateScore();
  showOverlay("タップしてゲームを始める", "スタート");
})();
