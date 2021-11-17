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