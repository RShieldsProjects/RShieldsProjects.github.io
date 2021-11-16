// Canvas and context for drawing
var cvs;
var ctx;

var animationHandle = 0;
var waitTime = 1;
var waited = 0;

var screenWidth;
var screenHeight;
const topGap = 100;

var towers;
var discCount;

function initDiscs(newDiscCount) {
  stopAnim();

  discCount = newDiscCount;
  towers = [Array(discCount), [], []];
  for (let i = 0; i < discCount; i++) {
    towers[0][i] = discCount - i;
  }

  draw();
}

function iterate() {
  // wait a certain amount of time, in accordance with the speed
  if (waited < waitTime) {
    waited++;
    animationHandle = window.requestAnimationFrame(iterate);
    return;
  }
  waited -= waitTime;

  const move = getMove();
  if (move === -1) return;

  // can't move from empty tower
  if (towers[move[0]-1].length === 0) return;
  // can't place on smaller
  if (towers[move[1]-1].length > 0
          && towers[move[1]-1][towers[move[1]-1].length - 1]
          < towers[move[0]-1][towers[move[0]-1].length - 1])
      return;

  // must be a legal move, so do it
  towers[move[1]-1].push(towers[move[0]-1].pop());
  draw();

  animationHandle = window.requestAnimationFrame(iterate);
}

function draw() {
  ctx.clearRect(0, 0, screenWidth, screenHeight);

  const discHeight = (screenHeight - topGap) / discCount;
  const widthMultiplier = (screenWidth - 110) / 3 / discCount;

  for (let i = 0; i < 3; i++) {
    const towerX = (2*i + 1) * screenWidth / 6;

    ctx.fillStyle = "black";
    drawRect(10, screenHeight - topGap/50,
        towerX, screenHeight/2 + topGap/2);

    for (let j = 0; j < towers[i].length; j++) {
      const hue = Math.floor(towers[i][j] / discCount * 360);
      ctx.fillStyle = "hsl(" + hue + ", 100%, 50%)";
      const discWidth = towers[i][j] * widthMultiplier + 10;
      const discY = screenHeight - (j + 0.5) * discHeight;
      drawRect(discWidth, discHeight, towerX, discY);
    }
  }
}

function drawRect(width, height, centerX, centerY) {
  ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
}

function stopAnim() {
  if (animationHandle !== 0) {
    window.cancelAnimationFrame(animationHandle);
    animationHandle = 0;
    waited = 0;
  }
}

// Init
window.onload = function() {
  cvs = document.getElementById("cvs");
  ctx = cvs.getContext("2d");
  screenWidth = cvs.width;
  screenHeight = cvs.height;
  
  document.getElementById("speed").oninput = function() {
    waitTime = 1 << (7 - this.value);
  }
  
  init();
}
