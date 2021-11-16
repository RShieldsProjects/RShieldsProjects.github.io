var moveText;
var moves = [];

function initMoves(str) {
  stopAnim();
  moves = str.trim().split("\n")
      .map(s => s.split(" ")
      .map(c => parseInt(c)));
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

  moveText = document.getElementById("moveText");

  document.getElementById("run").onclick = function() {
    initDiscs(discCount);
    initMoves(moveText.value);
    iterate();
  }

  initDiscs(discCountInput.value);
}
