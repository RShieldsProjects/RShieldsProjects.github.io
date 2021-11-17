function initShuffle(newDiscCount) {
  stopAnim();

  discCount = newDiscCount;
  towers = [[], [], []];
  for (let i = 0; i < discCount; i++) {
    const col = Math.floor(Math.random() * 3);
    towers[col].push(discCount - i);
  }

  draw();
}

function toNum() {
  let res = 0;
  for (let d of towers[1]) {
    res += 3 ** (d - 1);
  }
  for (let d of towers[2]) {
    res += 2 * (3 ** (d - 1));
  }
  return res;
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
