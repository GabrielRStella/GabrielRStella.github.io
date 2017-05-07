var canvas = document.getElementById("gameCanvas");
canvas.width = window.innerWidth - 10;
canvas.height = window.innerHeight - 100;

//padding is annoying and not worth
var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext("2d");

var brickSize = 40;

//adjust brick size to be nice for the screen
var minBricks = 5;
var maxBricks = 15;

var brickRows = Math.floor(height / brickSize);
var brickColumns = Math.floor(width / brickSize);

while(brickRows > maxBricks || brickColumns > maxBricks) {
  brickSize++;
  brickRows = Math.floor(height / brickSize);
  brickColumns = Math.floor(width / brickSize);
}

while(brickRows < minBricks || brickColumns < minBricks) {
  brickSize--;
  brickRows = Math.floor(height / brickSize);
  brickColumns = Math.floor(width / brickSize);
}

canvas.width = brickColumns * brickSize;
canvas.height = brickRows * brickSize;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//definitions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var brickInset = 5;

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
        check(nx + dx, ny + dy);
        update(x + dx, y + dy);
        update(nx + dx, ny + dy);
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
    var color = brick.color;
    var count = countBricks(x, y, color, history);

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

    } else if(count > 6) {
      for(var c = 0; c < brickColumns; c++) {
        for(var r = 0; r < brickRows; r++) {
          if(bricks[c][r] && !bricks[c][r].set && bricks[c][r].color == color) {
            bricks[c][r] = null;
            update(c, r);
          }
        }
      }
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

function switchEventType(type) {
  canvas.onmousedown = null;
  canvas.onmouseup = null;
  canvas.onmousemove = null;
  canvas.onclick = null;
  if(type == 0) {
    canvas.onclick = mode1_onclick;
  }
  if(type == 1) {
    canvas.onmousedown = mode2_mouseDown;
    canvas.onmouseup = mode2_mouseUp;
    canvas.onmousemove = mode2_mouseMove;
  }
  if(type == 2) {
    canvas.onmousedown = mode3_mouseDown;
    canvas.onmouseup = mode3_mouseUp;
    canvas.onmousemove = mode3_mouseMove;
  }
}

//click and move mode

function mode1_onclick(e) {
  var x = Math.floor((e.offsetX) / brickSize);
  var y = Math.floor((e.offsetY) / brickSize);

  if(!checkBounds(x, y)) return;

  if(selected) {
    var sx = selected.x;
    var sy = selected.y;
    if(adjacent(x, y, sx, sy)) {
      if((!bricks[x][y] || !bricks[x][y].set)) {
        swap(x, y, sx, sy);
      }
      selected = null;
    } else {
      selected = (x == sx && y == sy) ? null : {x: x, y: y};
    }
  } else if(bricks[x][y] && !bricks[x][y].set) {
    selected = {x: x, y: y};
  } else {
    selected = null;
  }
}

//multi-drag mode

var mode2_dragging = false;
var mode2_prevX = -1;
var mode2_prevY = -1;
var mode2_newX = -1;
var mode2_newY = -1;

function mode2_mouseDown(e) {
  mode2_prevX = Math.floor((e.offsetX) / brickSize);
  mode2_prevY = Math.floor((e.offsetY) / brickSize);

  if(!checkBounds(mode2_prevX, mode2_prevY)) return;

  mode2_newX = mode2_prevX;
  mode2_newY = mode2_prevY;
  if(bricks[mode2_newX][mode2_newY] && !bricks[mode2_newX][mode2_newY].set) {
    mode2_dragging = true;
    selected = {x: mode2_newX, y: mode2_newY};
  }
}

function mode2_mouseUp(e) {
  selected = null;
  mode2_dragging = false;
}

function mode2_mouseMove(e) {
  if(e.buttons == 0) {
    canvas.onmouseup(e);
    return;
  }

  mode2_newX = Math.floor((e.offsetX) / brickSize);
  mode2_newY = Math.floor((e.offsetY) / brickSize);

  if(!checkBounds(mode2_newX, mode2_newY)) return;

  var moved = mode2_newX != mode2_prevX || mode2_newY != mode2_prevY;
  if(mode2_dragging && moved && (!bricks[mode2_newX][mode2_newY] || !bricks[mode2_newX][mode2_newY].set) && (!bricks[mode2_prevX][mode2_prevY] || !bricks[mode2_prevX][mode2_prevY].set) && adjacent(mode2_prevX, mode2_prevY, mode2_newX, mode2_newY)) {
    swap(mode2_prevX, mode2_prevY, mode2_newX, mode2_newY);
    selected = !bricks[mode2_newX][mode2_newY] || bricks[mode2_newX][mode2_newY].set ? null : {x: mode2_newX, y: mode2_newY};
    mode2_prevX = mode2_newX;
    mode2_prevY = mode2_newY;
  }
}

//single drag mode

var mode3_dragging = false;
var mode3_startX = -1;
var mode3_startY = -1;
var mode3_prevX = -1;
var mode3_prevY = -1;
var mode3_newX = -1;
var mode3_newY = -1;

function mode3_mouseDown(e) {
  mode3_startX = Math.floor((e.offsetX) / brickSize);
  mode3_startY = Math.floor((e.offsetY) / brickSize);

  if(!checkBounds(mode3_prevX, mode3_prevY)) return;

  mode3_newX = mode3_prevX = mode3_startX;
  mode3_newY = mode3_prevY = mode3_startY;
  if(bricks[mode3_newX][mode3_newY] && !bricks[mode3_newX][mode3_newY].set) {
    mode3_dragging = true;
    selected = {x: mode3_newX, y: mode3_newY};
  }
}

function mode3_mouseUp(e) {
  selected = null;
  if(mode3_dragging) {
    if(adjacent(mode3_startX, mode3_startY, mode3_newX, mode3_newY)) {
      preSwap(mode3_startX, mode3_startY, mode3_newX, mode3_newY);
      swap(mode3_startX, mode3_startY, mode3_newX, mode3_newY);
    }
  }
  mode3_dragging = false;
}

function mode3_mouseMove(e) {
  if(e.buttons == 0) {
    canvas.onmouseup(e);
    return;
  }

  var x = Math.floor((e.offsetX) / brickSize);
  var y = Math.floor((e.offsetY) / brickSize);

  if(!checkBounds(x, y)) return;

  if(!bricks[x][y] || !bricks[x][y].set) {
    mode3_newX = x;
    mode3_newY = y;
    var moved = mode3_newX != mode3_prevX || mode3_newY != mode3_prevY;
    if(mode3_dragging) {
      if(moved) {
        if(adjacent(mode3_startX, mode3_startY, mode3_prevX, mode3_prevY)) preSwap(mode3_prevX, mode3_prevY, mode3_startX, mode3_startY);
        if(adjacent(mode3_startX, mode3_startY, mode3_newX, mode3_newY)) preSwap(mode3_startX, mode3_startY, mode3_newX, mode3_newY);
        selected = null;
      }
      selected = bricks[mode3_newX][mode3_newY] && !bricks[mode3_newX][mode3_newY].set ? {x: mode3_newX, y: mode3_newY} : null;
    } else if(!moved) {
      selected = null;
    }
    mode3_prevX = mode3_newX;
    mode3_prevY = mode3_newY;
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
//button cb
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var currentMode = -1;
var typeNames = ["Click", "Drag", "Select"];

function clickCallback() {
  currentMode = (currentMode + 1) % 3;
  switchEventType(currentMode);
  document.getElementById("game_mode_btn").value = "Click Me! (" + typeNames[currentMode] + ")";
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//start game
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

setInterval(updateTick, 10);

draw();

window.onload = clickCallback;