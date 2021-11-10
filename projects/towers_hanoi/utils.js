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
