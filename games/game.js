var canvas = document.getElementById("gameCanvas");
var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext("2d");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//definitions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var brickSize = 40;
var brickInset = 5;

var brickRows = Math.floor(height / brickSize);
var brickColumns = Math.floor(width / brickSize);

var bricks = [];
var moving = [];

var colors = ["#FF0000","#00FF00","#0000FF","#FF00FF","#00FFFF","#FFFF00"];

var NEXT_SET = 0;
var BRICK_SETS = [];

var colorCounts = [];
for(var i = 0; i < colors.length; i++) {
  colorCounts[i] = 0;
}

var lastColorIndex = -1;
function randomColor() {
  lastColorIndex = Math.floor(Math.random()*colors.length);
  return colors[lastColorIndex];
}

for(var c = 0; c < brickColumns; c++) {
  bricks[c] = [];
  for(var r = 0; r < brickRows; r++) {
    var color = randomColor();
    while((c > 0 && bricks[c - 1][r].color == color) || (r > 0 && bricks[c][r - 1].color == color)) color = randomColor();
    colorCounts[lastColorIndex]++;
    bricks[c][r] = {color: color};
  }
}

var selected = null; //{x: -1, y: -1};

var pendingUpdates = [];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function checkBounds(x, y) {
  return x >= 0 && x < brickColumns && y >= 0 && y < brickRows;
}

function adjacent(x, y, nx, ny) {
  return ((x == nx && Math.abs(ny - y) == 1) || (y == ny && Math.abs(nx - x) == 1))
}

//

function getNextSet() {
  NEXT_SET++;
  BRICK_SETS[NEXT_SET] = [];
  return NEXT_SET;
}

function addCurrentSet(x, y) {
  BRICK_SETS[NEXT_SET].push({x: x, y: y});
}

//

function find(history, x, y) {
  for(var i = 0; i < history.length; i++) {
    if(history[i].x == x && history[i].y == y) return true;
  }
  return false;
}

//

function removeBrick(x, y) {
  bricks[x][y] = null;
  update(x, y);
}

function removeBricks(coords) {
  for(var i = 0; i < coords.length; i++) {
    var coord = coords[i];
    //increase pointsss
    bricks[coord.x][coord.y] = null;
  }
  for(var i = 0; i < coords.length; i++) {
    var coord = coords[i];
    update(coord.x, coord.y);
  }
}

//

function checkRow(y, clearSets) {
  for(var x = 0; x < brickColumns; x++) {
    if(!bricks[x][y] || !bricks[x][y].set) {
      return false;
    } else {
      clearSets.push(bricks[x][y].set);
    }
  }
  return true;
}

//

function preSwap(x, y, nx, ny) {
  var brick = bricks[nx][ny];
  bricks[nx][ny] = bricks[x][y];
  bricks[x][y] = brick;
}

function swap(x, y, nx, ny) {
  var brick = bricks[nx][ny];
  if(!brick || !brick.set) {
    var tmp = brick;
    bricks[nx][ny] = bricks[x][y];
    bricks[x][y] = tmp;

    for(var dx = -1; dx <= 1; dx++) {
      for(var dy = -1; dy <= 1; dy++) {
        check(x + dx, y + dy);
        check(newX + dx, newY + dy);
        update(x + dx, y + dy);
        update(newX + dx, newY + dy);
      }
    }
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//logic
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function update(x, y) {
  pendingUpdates.push({x: x, y: y});
}

function clearUpdates() {
  for(var i = 0; i < pendingUpdates.length; i++) {
    var currentUpdate = pendingUpdates[i];
    var x = currentUpdate.x;
    var y = currentUpdate.y;
    if(checkBounds(x, y) && y > 0 && !bricks[x][y] && bricks[x][y - 1] && !bricks[x][y - 1].set) {
      y -= 1;
      var brick = bricks[x][y];
      bricks[x][y] = null;
      moving.push({x: x, y: y, dy: 0, brick: brick});

      //update surrounding
      for(var dx = -1; dx <= 1; dx++) {
        for(var dy = -1; dy <= 1; dy++) {
          update(x + dx, y + dy);
        }
      }
      pendingUpdates.splice(i--, 1);
    } else {
      pendingUpdates.splice(i, 1);
    }
  }
}

function checkRows() {
  var allClearSets = [];
  var clearRow = [];
  for(var y = 0; y < brickRows; y++) {
    var clearSets = [];
    if(checkRow(y, clearSets)) {
      clearRow[y] = true;
      allClearSets = allClearSets.concat(clearSets);
    }
  }
  coords = [];
  for(var r = 0; r < brickRows; r++) {
    if(clearRow[r]) {
      for(var c = 0; c < brickColumns; c++) {
        bricks[c][r] = null;
        coords.push({x: c, y: r});
      }
    } else {
      for(var c = 0; c < brickColumns; c++) {
        if(bricks[c][r] && allClearSets.includes(bricks[c][r].set)) bricks[c][r].set = null;
        coords.push({x: c, y: r});
      }
    }
  }
  for(var i = 0; i < coords.length; i++) {
    update(coords[i].x, coords[i].y);
  }
  for(var i = 0; i < allClearSets.length; i++) {
    BRICK_SETS[allClearSets[i]] = null;
  }
}

function check(x, y) {
  if(!checkBounds(x, y)) return;

  var brick = bricks[x][y];
  if(brick && !brick.set) {
    var history = [];
    var count = countBricks(x, y, brick.color, history);

    //prevent the player from making a move with more than four things
    //TODO: maybe give them specials if they match more than 5?

    if(count == 4) {
      currentSet = getNextSet();
      for(var i = 0; i < history.length; i++) {
        var hist = history[i];
        bricks[hist.x][hist.y].set = currentSet;
        addCurrentSet(hist.x, hist.y);
      }

      //remove line
      checkRows();

    } else if(count > 4) {
      removeBricks(history);
    }
  }
}

function countBricks(x, y, color, history) {
  if(!checkBounds(x, y)) return 0;

  var brick = bricks[x][y];
  if(brick && !brick.set && brick.color == color && !find(history, x, y)) {
    history.push({x: x, y: y});
    var count = 1;
    count += countBricks(x - 1, y, color, history);
    count += countBricks(x + 1, y, color, history);
    count += countBricks(x, y - 1, color, history);
    count += countBricks(x, y + 1, color, history);
    return count;
  } else {
    return 0;
  }
}

function updateMoving() {
  for(var i = 0; i < moving.length; i++) {
    var move = moving[i];
    var fx = Math.floor(move.x);
    var fy = Math.floor(move.y);
    if(fy >= brickRows) fy = brickRows - 1;
    if(bricks[fx][fy + 1] || fy == brickRows - 1) {
      bricks[fx][fy] = move.brick;
      if(move.brick.set) {
        BRICK_SETS[move.brick.set].push({x: fx, y: fy});
      }
      bricks[fx][fy].dy = move.dy;
      bricks[fx][fy].cdy = move.dy;
      moving.splice(i, 1);
      i--;
      check(fx, fy);
    } else {
      move.y += move.dy;
      move.dy += 0.005;
    }
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//events
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//single drag mode
/*
var dragging = false;
var startX = -1;
var startY = -1;
var prevX = -1;
var prevY = -1;
var newX = -1;
var newY = -1;

canvas.onmousedown = function(e) {
  startX = Math.floor(e.offsetX / brickSize);
  startY = Math.floor(e.offsetY / brickSize);
  newX = prevX = startX;
  newY = prevY = startY;
  if(bricks[newX][newY] && !bricks[newX][newY].set) {
    dragging = true;
    selected = {x: newX, y: newY};
  }
}

canvas.onmouseup = function(e) {
  selected = null;
  if(dragging) {
    if(adjacent(startX, startY, newX, newY)) {
      preSwap(startX, startY, newX, newY);
      swap(startX, startY, newX, newY);
    }
  }
  dragging = false;
}

canvas.onmousemove = function(e) {
  if(e.buttons == 0) {
    canvas.onmouseup(e);
    return;
  }

  var x = Math.floor(e.offsetX / brickSize);
  var y = Math.floor(e.offsetY / brickSize);

  if(!bricks[x][y] || !bricks[x][y].set) {
    newX = x;
    newY = y;
    var moved = newX != prevX || newY != prevY;
    if(dragging) {
      if(moved) {
        if(adjacent(startX, startY, prevX, prevY)) preSwap(prevX, prevY, startX, startY);
        if(adjacent(startX, startY, newX, newY)) preSwap(startX, startY, newX, newY);
        selected = null;
      }
      selected = bricks[newX][newY] && !bricks[newX][newY].set ? {x: newX, y: newY} : null;
    } else if(!moved) {
      selected = null;
    }
    prevX = newX;
    prevY = newY;
  }
}
*/

var dragging = false;
var prevX = -1;
var prevY = -1;
var newX = -1;
var newY = -1;

canvas.onmousedown = function(e) {
  prevX = Math.floor(e.offsetX / brickSize);
  prevY = Math.floor(e.offsetY / brickSize);
  newX = prevX;
  newY = prevY;
  if(bricks[newX][newY] && !bricks[newX][newY].set) {
    dragging = true;
    selected = {x: newX, y: newY};
  }
}

canvas.onmouseup = function(e) {
  selected = null;
  dragging = false;
}

canvas.onmousemove = function(e) {
  if(e.buttons == 0) {
    canvas.onmouseup(e);
    return;
  }

  newX = Math.floor(e.offsetX / brickSize);
  newY = Math.floor(e.offsetY / brickSize);

  var moved = newX != prevX || newY != prevY;
  if(dragging && moved && (!bricks[newX][newY] || !bricks[newX][newY].set) && (!bricks[prevX][prevY] || !bricks[prevX][prevY].set) && adjacent(prevX, prevY, newX, newY)) {
    swap(prevX, prevY, newX, newY);
    selected = !bricks[newX][newY] || bricks[newX][newY].set ? null : {x: newX, y: newY};
    prevX = newX;
    prevY = newY;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//drawing
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function drawBrickSize(x, y, color, set, w, h) {
  ctx.beginPath();
  var inset = set ? 0 : brickInset;
  var dx = set ? 0 : (brickSize - w) / 2;
  var dy = set ? 0 : (brickSize - h) / 2;
  ctx.rect(x * brickSize + inset + dx, y * brickSize + inset + dy, brickSize - (inset + dx) * 2, brickSize - (inset + dy) * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

function drawBrick(x, y, color, set) {
  drawBrickSize(x, y, color, set, brickSize, brickSize);
}

function drawBricks() {
  for(var c = 0; c < brickColumns; c++) {
    for(var r = 0; r < brickRows; r++) {
      if(bricks[c][r]) {
        var brick = bricks[c][r];
        if(brick.cdy) {
          var w = brickSize * (1 + brick.cdy - brick.dy);
          var h = brickSize * (1 - brick.cdy);
          drawBrickSize(c, r, brick.color, brick.set, w, h);
          brick.cdy *= 0.8;
          brick.dy *= 0.2;
          if(brick.cdy < 0.001) brick.cdy = null;
        } else {
          drawBrick(c, r, brick.color, brick.set);
        }
      }
    }
  }
}

function drawOutlines() {
  for(var i = 1; i < BRICK_SETS.length; i++) {
    var brickSet = BRICK_SETS[i];
    if(!brickSet) continue;
    for(var j = 0; j < brickSet.length; j++) {
      var brick = brickSet[j];
      drawOutlineTop(brick.x, brick.y, i);
      drawOutlineBottom(brick.x, brick.y, i);
      drawOutlineLeft(brick.x, brick.y, i);
      drawOutlineRight(brick.x, brick.y, i);
    }
  }
}

function drawOutlineTop(x, y, set) {
  var ny = y - 1;
  if(!checkBounds(x, ny) || !bricks[x][ny] || bricks[x][ny].set != set) {
    drawOutline(x, y, 1, 0);
  }
}

function drawOutlineBottom(x, y, set) {
  var ny = y + 1;
  if(!checkBounds(x, ny) || !bricks[x][ny] || bricks[x][ny].set != set) {
    drawOutline(x, y + 1, 1, 0);
  }
}

function drawOutlineLeft(x, y, set) {
  var nx = x - 1;
  if(!checkBounds(nx, y) || !bricks[nx][y] || bricks[nx][y].set != set) {
    drawOutline(x, y, 0, 1);
  }
}

function drawOutlineRight(x, y, set) {
  var nx = x + 1;
  if(!checkBounds(nx, y) || !bricks[nx][y] || bricks[nx][y].set != set) {
    drawOutline(x + 1, y, 0, 1);
  }
}

function drawOutline(x, y, dx, dy) {
  ctx.beginPath();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  x *= brickSize;
  y *= brickSize;
  dx *= brickSize;
  dy *= brickSize;
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  ctx.closePath();
}

function drawSelected() {
  if(selected) {
    ctx.beginPath();
    var inset = 3;
    if(selected) ctx.rect(selected.x * brickSize + inset / 2, selected.y * brickSize + inset / 2, brickSize - inset, brickSize - inset);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.closePath();
  }
}

function drawMoving() {
  for(var i = 0; i < moving.length; i++) {
    var move = moving[i];
    var x = move.x;
    var y = move.y;
    var w = brickSize * (1 - move.dy);
    var h = brickSize * (1 + move.dy);
    drawBrickSize(x, y, move.brick.color, move.brick.set, w, h);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawOutlines();
  drawSelected();
  drawMoving();

  requestAnimationFrame(draw);
}

function updateTick() {
  clearUpdates();
  updateMoving();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//start game
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

setInterval(updateTick, 10);

draw();