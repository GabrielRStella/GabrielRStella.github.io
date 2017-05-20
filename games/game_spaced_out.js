var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_SPACE = 32;
var KEY_P = 112;

var KEY_PAUSE = KEY_P;
var KEY_LAUNCH = KEY_SPACE;

var MS_PER_TICK = 10;

var prevTickMs = new Date().getTime();

var GAME_PAUSED = true;

var BALL_DX_MIN = 0.05;
var BALL_DX_MAX = 0.85;

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //window
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");
var padding = 10;

var width = 0;
var height = 0;

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //paddle
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

var paddleWidth = 0;
var paddleHeight = 0;

var paddleMinX = 0;
var paddleMaxX = 0;
var paddleSpeed = 0;

//center of the paddle
var paddleX = 0;
var paddleY = 0;

var paddleLeft = false;
var paddleRight = false;

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //balls
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

var ballRadiusDefault = 0;
var ballRadiusMultiplier = 1;

var balls = [];

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //enemies
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

var enemies = [];

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //---
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

function resetCanvas() {
  var oldWidth = width;
  var oldHeight = height;

  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 30;
  width = canvas.width - padding * 2;
  height = canvas.height - padding * 2;

  var wMod = width / oldWidth;
  var hMod = height / oldHeight;

  paddleWidth = width / 5;
  paddleMinX = paddleWidth / 2;
  paddleMaxX = width - paddleWidth / 2;
  paddleSpeed = width * 0.005;

  paddleHeight = height / 15;
  paddleY = height - paddleHeight / 2;

  paddleX *= wMod;

  ballRadiusDefault = paddleHeight * 2 / 3;

  GAME_PAUSED = true;

  //rescale ball and enemies

  for(var i = 0; i < balls.length; i++) {
    var ball = balls[i];
    ball.x *= wMod;
    ball.y *= hMod;
    ball.dx *= wMod;
    ball.dy *= hMod;
  }

  for(var i = 0; i < enemies.length; i++) {
    var enemy = enemies[i];
    //scale boundingbox
  }
}

function resetGame() {
  paddleX = width / 2;
  paddleLeft = false;
  paddleRight = false;

  GAME_PAUSED = true;

  balls = [];
  balls.push(newBall());

  enemies = [];

  ballRadiusMultiplier = 1;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//misc

//bounding box stuff

function boundingBox(x, y, dx, dy) {
  var ret = {x: x, y: y, dx: dx, dy: dy};
  ret.contains = contains.bind(ret, ret);
  ret.distance = distance.bind(ret, ret);
  return ret;
}

function contains(bb, x, y) {
  return x >= bb.x && x - bb.x < bb.dx && y >= bb.y && y - bb.y < bb.dy;
}

function distance(bb, x, y) {
  return 0; //TODO
}

//ball stuff

function getBallRadius() {
  return ballRadiusMultiplier * ballRadiusDefault;
}

function getBallSpeed() {
  return width * height / 100000;
}

function randomSpeed(ball, mag) {
  if(!mag) mag = 0.001;
  ball.dx += mag * Math.random() - mag * Math.random();
  ball.dy += mag * Math.random() - mag * Math.random();
}

function newBall(x, y, dx, dy) {
  var bx = x ? x : paddleX;
  var by = y ? y : paddleY - paddleHeight / 2 - getBallRadius();
  var launched = x || y;
  return {x: bx, y: by, dx: dx, dy: dy, launched: launched};
}

function launchBalls() {
  var angle = Math.atan2(height / 2, paddleX - width / 2);
  var dx = Math.cos(angle);
  var dy = -Math.sin(angle);
  for(var i = 0; i < balls.length; i++) {
    var ball = balls[i];
    if(!ball.launched) {
      ball.dx = dx;
      ball.dy = dy;
      randomSpeed(ball);
      ball.launched = true;
    }
  }
}

//enemy stuff

function getEnemyImg(type) {
  return "enemy_" + type;
}

function getEnemy(bb, type, lives) {
  var enemy = {type: type || 1, lives: lives || 1, bb: bb, dead: false};
  enemy.onHit = enemyHitBasic.bind(enemy);
  return enemy;
}

function enemyHitBasic() {
  if(--this.lives <= 0) this.dead = true;
}

//

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//logic
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//this is called from draw() to be continuous
function updateTick(part) {
  //resize

  //other stuff

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //move the paddle
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  var paddleDx = 0;
  if(paddleLeft) paddleDx--;
  if(paddleRight) paddleDx++;
  paddleX += paddleDx * part * paddleSpeed;
  if(paddleX < paddleMinX) paddleX = paddleMinX;
  else if(paddleX > paddleMaxX) paddleX = paddleMaxX;

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //update balls
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  var ballRadius = getBallRadius();
  var ballSpeed = getBallSpeed() * part;
  for(var i = 0; i < balls.length; i++) {
    var ball = balls[i];
    if(ball.launched) {
      //test wall collision
      if(ball.x >= width - ballRadius) {
        ball.dx = -Math.abs(ball.dx);
      } else if(ball.x <= ballRadius) {
        ball.dx = Math.abs(ball.dx);
      }
      if(ball.y <= ballRadius) {
        ball.dy = Math.abs(ball.dy);
      } else if(ball.y >= height + ballRadius) {
        //dead ball
        ball.y = height / 2; //TMP
      }
      //test paddle collision
      else if(Math.abs(ball.x - paddleX) * 2 < paddleWidth && ball.y >= paddleY - paddleHeight / 2 - ballRadius && ball.y <= paddleY) {
        ball.dy = -Math.abs(ball.dy);
        //rotate trajectory (placement and paddle dx)
        var dist = Math.max(Math.abs(ball.x - paddleX) * 6 / paddleWidth, 0.5); //how far out it was

        var ndx = ball.dx * dist;

        if(dist > 1 && Math.sign(ball.x - paddleX) != Math.sign(ndx)) {
          ndx = ball.dx - ndx;
        };

        if(Math.abs(ndx) > BALL_DX_MAX) {
          ndx = Math.sign(ndx) * BALL_DX_MAX;
        } else if(Math.abs(ndx) < BALL_DX_MIN) {
          ndx = Math.sign(ndx) * BALL_DX_MIN;
        }

        ball.dx = ndx;
        ball.dy = Math.sqrt(1 - ball.dx * ball.dx) * Math.sign(ball.dy);
      }
      //test enemy collision

      ball.x += ball.dx * ballSpeed;
      ball.y += ball.dy * ballSpeed;
    } else {
      ball.x = paddleX;
      ball.y = paddleY - paddleHeight / 2 - getBallRadius();
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //update enemies
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//events
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener("keydown", function(e) {
  if(e.keyCode == KEY_RIGHT) {
    paddleRight = true;
  }
  else if(e.keyCode == KEY_LEFT) {
    paddleLeft = true;
  }
}, false);

document.addEventListener("keyup", function(e) {
  if(e.keyCode == KEY_RIGHT) {
    paddleRight = false;
  }
  else if(e.keyCode == KEY_LEFT) {
    paddleLeft = false;
  }
}, false);

document.addEventListener("keypress", function(e) {
  if(e.keyCode == KEY_PAUSE) {
    GAME_PAUSED = !GAME_PAUSED;
  } else if(e.keyCode == KEY_LAUNCH && !GAME_PAUSED) {
    launchBalls();
  }
}, false);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//drawing
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function drawPaused() {
  ctx.font = '48px sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = 'top';
  ctx.fillText('Paused', 10, 10);
/*
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 2;
  ctx.strokeText('Pause', 10, 10);
*/
  ctx.font = '24px sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = 'top';
  ctx.fillText('Arrow keys to move paddle', 15, 60);
  ctx.fillText('Space to launch ball', 15, 90);
  ctx.fillText('P to unpause', 15, 120);
}

function drawPaddle() {
  var dx = paddleWidth / 2;
  var dy = paddleHeight / 2;
  ctx.beginPath();
  ctx.rect(paddleX - dx, paddleY - dy, paddleWidth, paddleHeight);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.closePath();
}

function drawBalls() {
  var radius = getBallRadius();
  for(var i = 0; i < balls.length; i++) {
    drawBall(balls[i], radius);
  }
}

function drawBall(ball, radius) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, radius, 0, Math.PI*2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.closePath();
}

//

var prevWindowWidth = window.innerWidth;
var prevWindowHeight = window.innerHeight;

function draw() {

  var ms = new Date().getTime();
  var part = (ms - prevTickMs) / MS_PER_TICK;

  //resize
  if(prevWindowWidth != window.innerWidth || prevWindowHeight != window.innerHeight) {
    prevWindowWidth = window.innerWidth;
    prevWindowHeight = window.innerHeight;
    resetCanvas();
  }

  if(!GAME_PAUSED) {
    updateTick(part);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //---
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(padding, padding);
  //ctx.drawImage(document.getElementById('box'), 0, 0, width, height);

/*
  ctx.drawImage(document.getElementById('source'), 33, 71, 104, 124, 21, 20, 87, 104);
  ctx.transform(1,0.5,-0.5,1, 200, 0); //also has rotate() and translate()
  ctx.drawImage(document.getElementById('test'), 0, 0);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(400, 100);
  ctx.drawImage(document.getElementById('box'), 0, 0, 20, 20);
  ctx.translate(0, 100);
  ctx.drawImage(document.getElementById('box'), 0, 0, 40, 40);
  ctx.translate(0, 100);
  ctx.drawImage(document.getElementById('box'), 0, 0, 80, 80);
  ctx.translate(0, 200);
  ctx.drawImage(document.getElementById('box'), 0, 0, 160, 160);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(600, 100);
  ctx.drawImage(document.getElementById('box'), 0, 0, 256, 256);
  ctx.translate(0, 300);
  ctx.drawImage(document.getElementById('box'), 0, 0, 128, 128);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(1000, 100);
  ctx.drawImage(document.getElementById('box'), 0, 0, 512, 512);
*/

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(padding, padding);

  drawPaddle();
  drawBalls();

  if(GAME_PAUSED) {
    drawPaused();
  }

  prevTickMs = ms;

  requestAnimationFrame(draw);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//start game
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

resetCanvas();
resetGame();
draw();