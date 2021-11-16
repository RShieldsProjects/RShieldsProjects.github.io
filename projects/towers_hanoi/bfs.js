const tableMoves = [[1,2], [1,3], [2,1], [2,3], [3,1], [3,2]];
var moves = [];

function initMoves() {
  moves = [];
  
  let toCheck = [{pos: toNum(), step: 0, prev: null}];
  let seen = new Array(3 ** discCount).fill(false);
  seen[toNum()] = true;
  
  let thisPath;
  while (true) {
    thisPath = toCheck.shift();
    if (thisPath.pos === 3 ** discCount - 1) break;
    for (let i = 0; i < 6; i++) {
      if (isValid(thisPath.pos, i)) {
        const newPos = getNewPosition(thisPath.pos, i);
        if (seen[newPos]) continue;
        toCheck.push({pos: newPos, step: i, prev: thisPath});
        seen[newPos] = true;
      }
    }
  }
  while (thisPath.prev !== null) {
    moves.push(tableMoves[thisPath.step]);
    thisPath = thisPath.prev;
  }
}

function getNewPosition(position, move) {
  const start = tableMoves[move][0];
  const end = tableMoves[move][1];
  
  let iterPos = position;
  for (let i = 0; i < discCount; i++) {
    discLoc = iterPos % 3 + 1;
    if (discLoc === start) {
      return position + (end - start) * (3 ** i);
    }
    iterPos = Math.floor(iterPos / 3);
  }
  
  return position;  // start tower was empty
}

function isValid(position, move) {
  let iterPos = position;
  // iterate from smallest disc to largest
  for (let i = 0; i < discCount; i++) {
    discLoc = iterPos % 3 + 1;
    
    // if we visited the from tower first, then its disc is smaller
    if (discLoc === tableMoves[move][0]) return true;
    // if we visited the to tower first, then its disc was smaller
    if (discLoc === tableMoves[move][1]) return false;
    
    iterPos = Math.floor(iterPos / 3);
  }
  return false;  // should never get here
}

function getMove() {
  if (moves.length === 0) return -1;
  return moves.pop();
}

function init() {
  const discCountInput = document.getElementById("discCount");
  discCountInput.oninput = function() {
    initShuffle(this.value);
  }
  
  document.getElementById("shuffle").onclick = function() {
    initShuffle(discCount);
  }

  document.getElementById("run").onclick = function() {
    initMoves();
    iterate();
  }

  initShuffle(discCountInput.value);
}