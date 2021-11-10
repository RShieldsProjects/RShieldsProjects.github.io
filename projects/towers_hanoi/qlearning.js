const tableMoves = [[1,2], [1,3], [2,1], [2,3], [3,1], [3,2]];
var table = 0;

const alpha = 0.9;
const gamma = 0.99;
const endReward = 1000000;
const badReward = -1000000000;
const nopReward = -1;
const iters = 10000000;

const discCountQ = 8;
const positions = 3 ** discCountQ;

function train() {
  stopAnim();

  if (table === 0) {
    table = Array(positions);
    for (let i = 0; i < positions; i++) {
      table[i] = [0, 0, 0, 0, 0, 0];
    }
  }

  for (let i = 0; i < iters; i++) {
    const epsilon = 0;  // i / iters;
    
    let position = Math.floor(Math.random() * positions);
    while (position !== positions - 1) {
      let move;
      if (Math.random() < epsilon) {
        move = indexOfMax(table[position]);
      } else {
        move = Math.floor(Math.random() * 6);
      }
      
      if (!isValid(position, move)) {
        table[position][move] = badReward;
        break;
      }
      
      const nextPosition = getNewPosition(position, move);
      if (nextPosition === positions - 1) {
        table[position][move] = endReward;
        break;
      }
      
      table[position][move] = lerp(table[position][move], nopReward + gamma * Math.max(...table[nextPosition]), alpha);
      position = nextPosition;
    }
  }
}

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

function getNewPosition(position, move) {
  let start = tableMoves[move][0];
  let end = tableMoves[move][1];
  
  let iterPos = position;
  for (let i = 0; i < discCountQ; i++) {
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
  for (let i = 0; i < discCountQ; i++) {
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
  let num = toNum();
  if (num === positions - 1) return -1;
  
  const qs = table[num];
  const maxIndex = indexOfMax(qs);
  return tableMoves[maxIndex];
}

function indexOfMax(arr) {
  let maxValue = arr[0];
  let maxIndex = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > maxValue) {
      maxValue = arr[i];
      maxIndex = i;
    }
  }
  return maxIndex;
}

function init() {
  document.getElementById("shuffle").onclick = function() {
    initShuffle(discCountQ);
  }
  
  document.getElementById("train").onclick = function() {
    train();
  }
  
  document.getElementById("run").onclick = function() {
    stopAnim();
    iterate();
  }

  document.getElementById("speed").oninput = function() {
    waitTime = 1 << (7 - this.value);
  }

  initShuffle(discCountQ);
}