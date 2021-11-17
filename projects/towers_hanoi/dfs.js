const tableMoves = [[1,3], [2,3], [1,2], [2,1], [3,2], [3,1]];
var moves = [];

var stack;
var seen;

function initMoves() {
  moves = [];
  
  const loc = toNum();
  
  stack = [];
  seen = new Array(3 ** discCount).fill(false);
  seen[loc] = true;
  
  recurse(loc);
  
  while (stack.length > 0) {
    moves.push(tableMoves[stack.pop()]);
  }
}

function recurse(loc) {
  if (loc === 3 ** discCount - 1) return true;
  
  for (let i = 0; i < 6; i++) {
    if (isValid(loc, i)) {
      const newPos = getNewPosition(loc, i);
      if (seen[newPos]) continue;
      stack.push(i);
      seen[newPos] = true;
      if (recurse(newPos)) return true;
      stack.pop();
    }
  }
  return false;
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