/*
TODO:
-power ups
*/

var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_SPACE = 32;
var KEY_P = 112;
var KEY_R = 114;
var KEY_C = 99;

var KEY_PAUSE = KEY_P;
var KEY_LAUNCH = KEY_SPACE;
var KEY_RESET = KEY_R;
var KEY_COOKIE = KEY_C;

var MS_PER_TICK = 10;

var prevTickMs = new Date().getTime();

var GAME_PAUSED = true;
var GAME_OVER = false;
var GAME_CLEAR_BONUS = 1.2;

var BALL_DX_MIN = 0.00;
var BALL_DX_MAX = 0.99;
var BALL_BOUNCE_MAX_AGE = 25;
var BALLS_PER_GAME = 3;

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

var currentBallSpeed = 1;
var ballRadiusDefault = 0;
var ballRadiusMultiplier = 1;

var balls = [];
var ballBounces = [];
var ballsLeft = 0;

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //enemies
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

var enemies = [];

var enemyPadding = 0;
var enemyDx = 0;
var enemyDy = 0;
var enemySpeed = 1;
var enemySpeedY = 1;

var ENEMY_MIN_X = 0;
var ENEMY_MAX_X = 0;

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //---
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

var gameWon = false;
var gameScore = 0;
var maxScore = 0;

function resetCanvas() {
  var oldWidth = width;
  var oldHeight = height;

  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;
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

  currentBallSpeed = paddleSpeed; //width * height / 100000;
  ballRadiusDefault = paddleHeight * 2 / 3;

  GAME_PAUSED = true;

  //rescale ball and enemies

  for(var i = 0; i < balls.length; i++) {
    var ball = balls[i];
    ball.x *= wMod;
    ball.y *= hMod;
  }

  for(var i = 0; i < enemies.length; i++) {
    var enemy = enemies[i];
    //scale boundingbox
    var bb = enemy.bb;
    bb.x *= wMod;
    bb.y *= hMod;
    bb.dx *= wMod;
    bb.dy *= hMod;
  }

  enemyPadding = Math.floor(Math.min(width, height) / 15);
  enemySpeed = currentBallSpeed / 10;
  enemySpeedY = enemySpeed * 10;
  ENEMY_MIN_X = 0;
  ENEMY_MAX_X = width;
}

function resetGame() {
  paddleX = width / 2;
  paddleLeft = false;
  paddleRight = false;

  GAME_PAUSED = false;
  GAME_OVER = false;

  balls = [];
  balls.push(newBall());
  ballsLeft = BALLS_PER_GAME - 1;
  ballBounces = [];

  ballRadiusMultiplier = 1;

  enemies = [];
  enemyDx = 1;
  enemyDy = 1;

  addEnemies();
/*
  //bb, type, lives
  enemies.push(getEnemy(boundingBox(10, 10, 20, 20), 1, 1));
  enemies.push(getEnemy(boundingBox(50, 30, 10, 30), 2, 2));
  enemies.push(getEnemy(boundingBox(100, 20, 300, 100), 3, Math.floor(Math.random() * 3) + 1));
*/

  gameScore = 0;
  getMaxScore(); //sets value of maxScore
  gameWon = false;
}

function addEnemies() {
  var enemySize = enemyPadding;
  var div = (enemySize + enemyPadding) * 2;
  var enemyColumns = Math.ceil(width / div); //estimation
  var enemyRows = Math.ceil(height / div); //estimation

  var x = 0;
  var y = 0;
  for(var r = 0; r < enemyRows; r++) {
    var left = null;
    for(var c = 0; c < enemyColumns; c++) {
      var str = Math.floor(Math.random() * Math.random() * 3) + 1;

      var enemy = getEnemy(boundingBox(x, y, enemySize, enemySize), str, str);
      enemy.left = left;
      if(left != null) left.right = enemy;
      left = enemy;

      enemies.push(enemy);

      x += enemySize + enemyPadding;
    }
    y += enemySize + enemyPadding;
    x = 0;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//misc

//game

function loseGame() {
  GAME_OVER = true;
  GAME_PAUSED = true;
  setMaxScore(gameScore);
  gameWon = false;
}

function winGame() {
  gameScore = Math.ceil(gameScore * GAME_CLEAR_BONUS);
  gameScore += (ballsLeft + 1) * (ballsLeft + 1);
  loseGame();
  gameWon = true;
}

//score

//adds a new score, stores if it is max, and returns the actual max
function setMaxScore(score) {
  var max = getMaxScore();
  if(score > max) {
    var date = new Date();
    date.setFullYear(date.getFullYear() + 1); //won't expire for a while :)
    document.cookie = "maxScore=" + score + ";expires=" + date;
    max = score;
  }
  maxScore = max;
  return max;
}

function getMaxScore() {
  var cookie = document.cookie;
  var index = cookie.search("maxScore=");
  if(index >= 0) {
    index += 9; //beginning of the number
    maxScore = parseInt(cookie.substring(index));
    return maxScore;
  } else maxScore = 0;
  return maxScore;
}

function clearMaxScore() {
    var date = new Date();
    date.setFullYear(date.getFullYear() - 1); //already expired! woo
    document.cookie = "maxScore=;expires=" + date.toUTCString();
    maxScore = -1;
}

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
//https://stackoverflow.com/questions/5254838/calculating-distance-between-a-point-and-a-rectangular-box-nearest-point
  var dx = Math.max(bb.x - x, 0, x - (bb.x + bb.dx));
  var dy = Math.max(bb.y - y, 0, y - (bb.y + bb.dy));
  return Math.sqrt(dx*dx + dy*dy);
}

//ball stuff

function getBallRadius() {
  return ballRadiusMultiplier * ballRadiusDefault;
}

function getBallSpeed() {
  return currentBallSpeed;
}

function randomSpeed(ball, mag) {
  if(!mag) mag = 0.1;
  ball.dx += mag * Math.random() - mag * Math.random();
  ball.dy += mag * Math.random() - mag * Math.random();
}

function newBall(x, y, dx, dy) {
  var bx = x ? x : paddleX;
  var by = y ? y : paddleY - paddleHeight / 2 - getBallRadius();
  var launched = x || y;
  return {x: bx, y: by, dx: dx, dy: dy, launched: launched, dead: false};

  //this was going to prevent double-hits (but now the physics seem to work anyway)
  //return {x: bx, y: by, dx: dx, dy: dy, launched: launched, dead: false, contact: false};
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

function bounceBall(ball, nx, ny) {
  var ballAngle = Math.atan2(-ball.dy, -ball.dx);
  var normAngle = Math.atan2(ny, nx);
console.log(nx + " " + ny + " = " + (normAngle));
  ballAngle += (normAngle - ballAngle) * 2;
  ball.dx = Math.cos(ballAngle);
  ball.dy = Math.sin(ballAngle);
  ballBounces.push({x: ball.x, y: ball.y, age: 0});
}

function onBallDead(ball) {
  //ball.y = height / 2;
  ball.dead = true;
}

//enemy stuff

function getEnemyImg(type) {
  return "enemy_" + type;
}

function getEnemy(bb, type, lives, hitPoints, deathPoints) {
  var enemy = {type: type || 1, lives: lives || 1, bb: bb, dead: false, hitPoints: hitPoints || 1, deathPoints: deathPoints || 0};
  enemy.onHit = enemyHitBasic.bind(enemy);
  return enemy;
}

function enemyHitBasic(ball) {
  if(this.lives > 0) gameScore += this.hitPoints;
  if(--this.lives <= 0) {
    if(!this.dead) gameScore += this.deathPoints;
    this.dead = true;
  }
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

  for(var i = 0; i < ballBounces.length; i++) {
    var bounce = ballBounces[i];
    bounce.age += part;
    if(bounce.age >= BALL_BOUNCE_MAX_AGE) {
      ballBounces.splice(i, 1);
      i--;
    }
  }

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
    if(ball.dead) {
      balls.splice(i, 1);
      i--;
      if(balls.length == 0) {
        if(ballsLeft-- > 0) {
          balls.push(newBall());
        } else {
          //end game
          loseGame();
        }
      }
    }
    if(ball.launched) {
      //test wall collision
      if(ball.x >= width - ballRadius) {
        ball.dx = -Math.abs(ball.dx);
        ballBounces.push({x: width, y: ball.y, age: 0});
      } else if(ball.x <= ballRadius) {
        ball.dx = Math.abs(ball.dx);
        ballBounces.push({x: 0, y: ball.y, age: 0});
      }
      if(ball.y <= ballRadius) {
        ball.dy = Math.abs(ball.dy);
        ballBounces.push({x: ball.x, y: 0, age: 0});
      } else if(ball.y >= height + ballRadius) {
        //dead ball (hit floor)
        onBallDead(ball);
      }

      //test paddle collision
      else if(Math.abs(ball.x - paddleX) * 2 < paddleWidth && ball.y >= paddleY - paddleHeight / 2 - ballRadius && ball.y <= paddleY) {
        ball.dy = -Math.abs(ball.dy);
        //rotate trajectory (placement and paddle dx)
        var dist = Math.max(Math.abs(ball.x - paddleX) * 5 / paddleWidth, 0.5); //how far out it was

        var ndx = ball.dx * dist;

        if(dist > 1 && Math.sign(ball.x - paddleX) != Math.sign(ndx)) {
          ndx = ball.dx - ndx;
        };

        var paddleMoveMod = 0.1;
        if(paddleLeft) {
          ndx -= paddleMoveMod;
        }
        if(paddleRight) {
          ndx += paddleMoveMod;
        }

        if(Math.abs(ndx) > BALL_DX_MAX) {
          ndx = Math.sign(ndx) * BALL_DX_MAX;
        } else if(Math.abs(ndx) < BALL_DX_MIN) {
          ndx = Math.sign(ndx) * BALL_DX_MIN;
        }

        ball.dx = ndx;
        ball.dy = Math.sqrt(1 - ball.dx * ball.dx) * Math.sign(ball.dy);
        ballBounces.push({x: ball.x, y: ball.y + ballRadius, age: 0});
      } else if(ball.y <= paddleY + paddleHeight / 2) {
        //check corners and sides of paddle
        if(boundingBox(paddleX - paddleWidth / 2, paddleY - paddleHeight / 2, paddleWidth, paddleHeight).distance(ball.x, ball.y) <= ballRadius) {
          var dx = ball.x - (paddleX + paddleWidth / 2);
          var dy = ball.y - (paddleY + paddleHeight / 2);
          var xSize = paddleWidth / 2;
          var ySize = paddleHeight / 2;

          if(Math.abs(dx) <= xSize) {
            dx = 0;
          }
          if(Math.abs(dy) <= ySize) {
            dy = 0;
          }
          bounceBall(ball, dx, dy);
        }
        //check side
      }

      //test enemy collision
      for(var j = 0; j < enemies.length; j++) {
        var enemy = enemies[j];
        if(!enemy.dead && enemy.bb.distance(ball.x, ball.y) <= ballRadius) {
          //collision
          enemy.onHit(ball);

          var dx = ball.x - (enemy.bb.x + enemy.bb.dx / 2);
          var dy = ball.y - (enemy.bb.y + enemy.bb.dy / 2);
          var xSize = enemy.bb.dx / 2;
          var ySize = enemy.bb.dy / 2;

          if(Math.abs(dx) <= xSize) {
            dx = 0;
          }
            //else dx = Math.sign(dx);
          if(Math.abs(dy) <= ySize) {
            dy = 0;
          }
            //else dy = Math.sign(dy);

          //dx = ball.x - paddleX;
          //dy = ball.y - paddleY;
          bounceBall(ball, dx, dy);
        }
      }

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

  var enemyMove = enemyDx * enemySpeed * part;
  var moved = false;
  for(var i = 0; i < enemies.length; i++) {
    var enemy = enemies[i];
    if(enemy.dead) {
      enemies.splice(i, 1);
      i--;
      //update links
      if(enemy.left != null) enemy.left.right = enemy.right;
      if(enemy.right != null) enemy.right.left = enemy.left;
    } else {
      if(enemyMove > 0) {
        var right = enemy.right;
        if((right == null && enemy.bb.x < ENEMY_MAX_X - enemy.bb.dx) || (right && (enemy.bb.x + enemy.bb.dx + enemyPadding < right.bb.x))) {
          enemy.bb.x += enemyMove;
          moved = true;
        }
      } else if(enemyMove < 0) {
        var left = enemy.left;
        if((left == null && enemy.bb.x > ENEMY_MIN_X) || (left && ((left.bb.x + left.bb.dx) < enemy.bb.x - enemyPadding))) {
          enemy.bb.x += enemyMove;
          moved = true;
        }
      }
      //move and fire and whatever
    }
  }
  if(!moved) {
    enemyDx *= -1;
    var enemyMoveY = enemyDy * enemySpeedY;
    for(var i = 0; i < enemies.length; i++) {
      enemies[i].bb.y += enemyMoveY;
      if(paddleY - enemies[i].bb.y - enemies[i].bb.dy < ballRadius * 3) loseGame();
    }
    enemyDx *= mult;
    enemyDy *= mult;
  }

  if(enemies.length == 0) {
    winGame();
  }
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
  if(e.keyCode == KEY_PAUSE && !GAME_OVER) {
    GAME_PAUSED = !GAME_PAUSED;
  } else if(e.keyCode == KEY_LAUNCH && !GAME_PAUSED) {
    launchBalls();
  } else if(e.keyCode == KEY_RESET) {
    resetGame();
  } else if(e.keyCode == KEY_COOKIE) {
    clearMaxScore();
  }
}, false);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//drawing
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function drawPaused() {
  ctx.font = '64px sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.textBaseline = 'top';
  ctx.textAlign = 'start';

  ctx.lineWidth = 2;
  ctx.fillText('Paused', 10, 10);
  ctx.strokeText('Paused', 10, 10);

  var x = 20;
  var y = 70;
  var rowHeight = 30;

  ctx.font = '32px sans-serif';
  ctx.lineWidth = 1;
  ctx.fillText('Arrow keys to move paddle', x, y);
  ctx.strokeText('Arrow keys to move paddle', x, y);
  y += rowHeight;
  ctx.fillText('Space to launch ball', x, y);
  ctx.strokeText('Space to launch ball', x, y);
  y += rowHeight;
  ctx.fillText('P to unpause', x, y);
  ctx.strokeText('P to unpause', x, y);
  y += rowHeight;
  ctx.fillText('R to restart', x, y);
  ctx.strokeText('R to restart', x, y);
  y += rowHeight;
  ctx.fillText('C to clear high score', x, y);
  ctx.strokeText('C to clear high score', x, y);
}

function drawGameOver() {
  ctx.font = '64px sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';

  var x = width / 2;
  var y = height / 3;

  ctx.lineWidth = 2;
  var text = gameWon ? "YOU WIN!" : "GAME OVER";
  ctx.fillText(text, x, y);
  ctx.strokeText(text, x, y);
  y += 75;

  ctx.font = '32px sans-serif';
  ctx.lineWidth = 1;
  ctx.fillText('Score: ' + gameScore, x, y);
  ctx.strokeText('Score: ' + gameScore, x, y);
  y += 35;
  var highScore = maxScore;
  ctx.fillText('High Score: ' + highScore, x, y);
  ctx.strokeText('High Score: ' + highScore, x, y);
  y += height / 5;
  ctx.fillText('R to restart', x, y);
  ctx.strokeText('R to restart', x, y);
}

function drawHud() {
  ctx.font = '24px sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;

  //draw score

  //draw lives

  var ballCount = balls.length;
  var maxBallCount = BALLS_PER_GAME;

  var radius = ballRadiusDefault / 2;
  var xPadding = radius / 10;
  var maxx = width - xPadding - radius;
  var y = radius + 60;
  var x = width - (radius * 2 + xPadding) * (maxBallCount - 1) - radius;

  ctx.textBaseline = 'top';
  ctx.textAlign = 'end';
  ctx.fillText('High Score: ' + Math.max(maxScore, gameScore), width - radius, 0);
  ctx.fillText('Score: ' + gameScore, width - radius, 30);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'end';
  ctx.fillText('Lives:', x - radius - xPadding, y);
  for(var i = 0; i < ballsLeft + 1; i++) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    x += radius * 2 + xPadding;
  }
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

//

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

function drawBounces() {
  var alpha = ctx.globalAlpha;
  for(var i = 0; i < ballBounces.length; i++) {
    var bounce = ballBounces[i];
    ctx.beginPath();
    ctx.globalAlpha = 1 - (bounce.age / BALL_BOUNCE_MAX_AGE);
    ctx.arc(bounce.x, bounce.y, bounce.age / BALL_BOUNCE_MAX_AGE * getBallRadius() * 3, 0, Math.PI*2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
  }
  ctx.globalAlpha = alpha;
}

//

function drawEnemies() {
  for(var i = 0; i < enemies.length; i++) {
    var enemy = enemies[i];
    if(!enemy.dead) {
      drawEnemy(enemy);
    }
  }
}

function drawEnemy(enemy) {
  var bb = enemy.bb;
  ctx.drawImage(document.getElementById(getEnemyImg(enemy.type)), bb.x, bb.y, bb.dx, bb.dy);
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

  drawBounces();
  drawPaddle();
  drawBalls();
  drawEnemies();

  if(!GAME_OVER) drawHud();

  if(GAME_PAUSED) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var alpha = ctx.globalAlpha;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.rect(0, 0, width + padding * 2, height + padding * 2);
    ctx.fill();
    ctx.closePath();
    ctx.globalAlpha = alpha;
    ctx.translate(padding, padding);

    if(GAME_OVER) drawGameOver();
    else drawPaused();
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
GAME_PAUSED = true;
draw();