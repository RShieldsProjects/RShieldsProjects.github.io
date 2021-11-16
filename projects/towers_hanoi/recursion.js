var moveText;
var moves = [];

function initMoves(count, start, end) {
  if (count === 1) {
    moves.push([start, end]);
    return;
  }
  
  const other = 6 - start - end;
  initMoves(count-1, start, other);
  moves.push([start, end]);
  initMoves(count-1, other, end);
}

function getMove() {
  if (moves.length === 0) return -1;
  return moves.shift();
}

function init() {
  const discCountInput = document.getElementById("discCount");
  discCountInput.oninput = function() {
    initDiscs(this.value);
  }

  document.getElementById("run").onclick = function() {
    initDiscs(discCount);
    initMoves(discCount, 1, 3);
    iterate();
  }

  initDiscs(discCountInput.value);
}
