////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//definitions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var KEY_LEFT = 37;
var KEY_RIGHT = 39;

var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");
var padding = 10;

//window stuff

var windowWidth = 0;
var windowHeight = 0;
canvas.width = -1;
canvas.height = -1;
var width = 0;
var height = 0;

var MAX_RADIUS = 0;

//background stuff

var minRingSize = 0;
var ringSize = 25;
var ringCount = 0;
var rings = [];

//alignment

var centerX = 0;
var centerY = 0;

var btnSize = -1;
var btnLeft = null;
var btnRight = null;

//circles

var COLOR_ON = "#ffffff";
var COLOR_OFF = "#ff0000";
var COLOR_OUTLINE = "#000000";

var MAX_CIRCLES = 50;

var circles = [];
var circleSizeMod = 1;
var circleSizeModMax = 1.25;

var MIN_ANGLE_DIFFERENCE = 0.05;
var MAX_ANGLE_DIFFERENCE = 0.4;
var currentAngle = 0;
var nextAngle = 0;
var markerAnglePrev = 0;
var markerAngleNext = 0;

//TODO: for resizing and score and restarting and such

function resetCanvas() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  canvas.width = windowWidth - 10;
  canvas.height = windowHeight - 40;
  width = canvas.width - padding * 2;
  height = canvas.height - padding * 2;
  MAX_RADIUS = Math.min(width, height) / 3;

  centerX = width / 2;
  centerY = height / 2;

//bg stuff

  minRingSize = MAX_RADIUS * 1.32;
  ringSize = 25;
  ringCount = Math.ceil((Math.max(width, height) - minRingSize) / ringSize / 2) + 2;
  if(!rings) rings = [];

  rings[0] = 1;
  for(var r = rings.length; r < ringCount; r++) {
    rings[r] = Math.random();
  }

//buttons

  var wide = width > height;

  if(wide) {
    var space = width - minRingSize * 2;
    btnSize = space / 2 / 2;
    var dx = (space / 2 - btnSize) / 2;
    var dy = (height - btnSize) / 2;
    btnLeft = {x: dx, y: dy};
    btnRight = {x: width - btnSize - dx, y: dy};
  } else {
    //realign stuff for mobile
    var c1 = width * 2 / 3;
    var c2 = width / 2;
    var ratio = width / height;
    centerY = c2 * ratio + c1 * (1 - ratio);
    var space = height - width;
    btnSize = space / 2 / 2;
    var dy = width + (space - btnSize) / 2;
    var dx = width / 4 - btnSize / 2;
    btnLeft = {x: dx, y: dy};
    btnRight = {x: width - btnSize - dx, y: dy};
  }
}

function resetGame() {
  circles = [];

  currentAngle = 0;
  nextAngle = newAngle(currentAngle);
  markerAnglePrev = currentAngle;
  markerAngleNext = nextAngle;
}

resetCanvas();
resetGame();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getColor(left) {
  var shouldLeft = (nextAngle - currentAngle) < 0;
  return shouldLeft == left ? COLOR_ON : COLOR_OFF;
}

function newAngle(current) {
  var angle = Math.random();
  while(Math.abs(current - angle) < MIN_ANGLE_DIFFERENCE || Math.abs(current - angle) > MAX_ANGLE_DIFFERENCE) angle = Math.random();
  return angle;
}

//http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function ringColor(part, dark) {
  var dark2 = 1 - dark;
  var p1 = Math.round(255 * dark2);
  var p2 = Math.round(part * 255 * dark2);
  var p3 = p2;
  return toHex(p1, p2, p3);
}

function toHex(r, g, b) {
  return pad(r.toString(16), 2) + pad(g.toString(16), 2) + pad(b.toString(16), 2);
}

function onClick(left) {
  createCircle(getColor(left));
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//logic
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createCircle(color) {
  circles.push({angle: nextAngle, color: color}); //simple object for future compatibility
  currentAngle = nextAngle;
  nextAngle = newAngle(currentAngle);

  if(circles.length > MAX_CIRCLES * 2) {
    circles.splice(0, MAX_CIRCLES);
  }

  circleSizeMod = circleSizeModMax;
}

function updateTick() {
  //resize game
  if(window.innerWidth != windowWidth || window.innerHeight != windowHeight) {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    resetCanvas();
  }

  var amt = 4;
  markerAnglePrev = (currentAngle + markerAnglePrev * (amt - 1)) / amt;
  markerAngleNext = (nextAngle + markerAngleNext * (amt - 1)) / amt;
  amt = 10;
  circleSizeMod = (1 + circleSizeMod * (amt - 1)) / amt;

  var r = 1 + Math.floor(Math.random() * (ringCount - 1));
  var color = rings[r];

  if(Math.random() < 0.8 && r < ringCount - 1) {
    //sort
    var color2 = rings[r + 1];
    if(color2 > color) {
      rings[r] = color2;
      rings[r + 1] = color;
    }
  } else if(Math.random() < 0.3) {
    //average
    var color2 = rings[r - 1];
    var count = 1;
    if(r < ringCount - 1) {
      color2 += rings[r + 1];
      count++;
    }
    if(count > 0) {
      rings[r] = (color + (color2 / count)) / 2;
    }
  } else if(Math.random() < 0.1) {
    //replace
    rings[r] = Math.random();
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//events
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener("keydown", function(e) {
  if(e.keyCode == KEY_RIGHT) {
    onClick(false);
  }
  else if(e.keyCode == KEY_LEFT) {
    onClick(true);
  }
}, false);

canvas.addEventListener('click', function(e) {
  var x = e.offsetX - padding;
  var y = e.offsetY - padding;
  //left btn
  if(x >= btnLeft.x && x - btnLeft.x < btnSize && y >= btnLeft.y && y - btnLeft.y < btnSize) {
    onClick(true);
  }
  //right btn
  if(x >= btnRight.x && x - btnRight.x < btnSize && y >= btnRight.y && y - btnRight.y < btnSize) {
    onClick(false);
  }
}, false);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//drawing
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function drawCircle(x, y, radius, color, outline, lineWidth) {
  radius *= MAX_RADIUS;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI*2);
  ctx.fillStyle = color;
  ctx.fill();
  if(outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = lineWidth ? lineWidth : 2;
    ctx.stroke();
  }
  ctx.closePath();
}

function drawBar(x, y, radius, angle, outline) {
  radius *= MAX_RADIUS;
  angle *= Math.PI * 2;

  var dx = radius * Math.cos(angle);
  var dy = radius * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

function drawOffsetCircle(x, y, angle, fill, outline) {
  ctx.beginPath();
  radius = 1.15 * MAX_RADIUS;
  var angle = angle * Math.PI * 2;
  var dx = radius * Math.cos(angle);
  var dy = radius * Math.sin(angle);
  ctx.arc(x + dx, y + dy, MAX_RADIUS * 0.05, 0, Math.PI*2);
  ctx.fillStyle = fill ? fill : COLOR_ON;
  ctx.fill();
  ctx.strokeStyle = outline ? outline : COLOR_OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

function drawOffsetTriangle(x, y, angle, fill, outline) {
  radius = 1.15 * MAX_RADIUS;
  var angle = angle * Math.PI * 2;
  var dx = x + radius * Math.cos(angle);
  var dy = y + radius * Math.sin(angle);
  ctx.translate(dx, dy);
  ctx.rotate(angle + Math.PI / 2);

  ctx.beginPath();

  var size = Math.min(width, height) * 0.025;
  ctx.moveTo(-size, -size);
  ctx.lineTo(size, -size);
  ctx.lineTo(0, size);
  ctx.lineTo(-size, -size);

  ctx.fillStyle = fill ? fill : COLOR_ON;
  ctx.fill();
  ctx.strokeStyle = outline ? outline : COLOR_OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();

  ctx.rotate(-(angle + Math.PI / 2));
  ctx.translate(-dx, -dy);
}

function drawRings(x, y) {
  for(var r = ringCount - 1; r >= 0; r--) {
    ctx.beginPath();
    ctx.arc(x, y, r * ringSize + minRingSize, 0, Math.PI*2);
    ctx.strokeStyle = "#" + ringColor(rings[r], 0);
    ctx.lineWidth = ringSize * 2;
    ctx.stroke();
    ctx.closePath();
  }

  ctx.beginPath();
  ctx.arc(x, y, minRingSize, 0, Math.PI*2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.arc(x, y, minRingSize - 2, 0, Math.PI*2);
  ctx.strokeStyle = COLOR_OUTLINE;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.closePath();
}

function draw() {

  var x = centerX;
  var y = centerY;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(padding, padding);

  drawRings(centerX, centerY);

  var radius = 1;
  drawCircle(x, y, radius, COLOR_ON, COLOR_OUTLINE);
  for(var i = 0; i < MAX_CIRCLES && i < circles.length; i++) {
    var circle = circles[circles.length - i - 1];
    var r2 = Math.min(radius * circleSizeMod, 1);
    drawCircle(x, y, r2, circle.color, COLOR_OUTLINE);
    drawBar(x, y, r2, circle.angle, COLOR_OUTLINE);
    radius *= 0.8;
  }

  //draw a little dot at the center
  drawCircle(x, y, 0.025, COLOR_ON, COLOR_OUTLINE);

  //draw the next position
  drawOffsetTriangle(x, y, markerAnglePrev);
  drawOffsetCircle(x, y, markerAngleNext);

  //draw btns
  var alpha = ctx.globalAlpha;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.rect(btnLeft.x, btnLeft.y, btnSize, btnSize);
  ctx.rect(btnRight.x, btnRight.y, btnSize, btnSize);
  ctx.fillStyle = COLOR_ON;
  ctx.fill();
  ctx.strokeStyle = COLOR_OUTLINE;
  ctx.lineWidth = 2;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.closePath();
  

  requestAnimationFrame(draw);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//start game
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//every 1 ms
setInterval(updateTick, 1);
//start drawing loop
draw();