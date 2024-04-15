let colorCountInput;
let colorSelectors;
let tubeCountInput;
let playfield;
let solutionRange;
let solutionButtons;

let tubeWaterColors = [];
let solution = null;

//
// UI
//

const defaultColors = [
  '#ffa500', // orange
  '#0000ff', // blue
  '#ff0000', // red
  '#3cb371', // mediumspringgreen
  '#ff69b4', // hotpink
  '#ffff00', // yellow
  '#696969', // dimgray
];

function changeColorCount() {
  clearSolution();

  const tubeCount = Number(tubeCountInput.value);
  const colorCount = Number(colorCountInput.value);

  while (colorSelectors.children.length > colorCount) {
    colorSelectors.removeChild(colorSelectors.lastChild);
  }
  while (colorSelectors.children.length < colorCount) {
    const colorSelector = document.createElement('input');
    colorSelector.type = 'color';
    colorSelector.value = defaultColors[colorSelectors.children.length];
    colorSelector.addEventListener('change', recolorAll);
    colorSelectors.appendChild(colorSelector);
  }

  for (let i = 0; i < tubeCount; i++) {
    for (let j = 0; j < 4; j++) {
      if (tubeWaterColors[i][j] >= colorCount) {
        tubeWaterColors[i][j] = -1;
        recolorSingle(i, j);
      }
    }
  }
}

function changeTubeCount() {
  clearSolution();

  const tubeCount = Number(tubeCountInput.value);
  
  while (tubeWaterColors.length > tubeCount) {
    tubeWaterColors.pop();
  }
  while (tubeWaterColors.length < tubeCount) {
    tubeWaterColors.push([-1, -1, -1, -1]);
  }

  while (playfield.children.length > tubeCount) {
    playfield.removeChild(playfield.lastChild);
  }

  while (playfield.children.length < tubeCount) {
    const i = playfield.children.length;

    const tube = document.createElement('div');
    tube.classList.add('tube');

    for (let j = 0; j < 4; j++) {
      const water = document.createElement('div');
      water.classList.add('water');
      water.addEventListener('click', () => { cycleTubeWaterColor(i, j) });
      water.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        cycleTubeWaterColor(i, j, true)
      });
      tube.appendChild(water);
    }

    playfield.appendChild(tube);
  }
}

function clearTubeWaterColors() {
  clearSolution();

  const tubeCount = Number(tubeCountInput.value);

  tubeWaterColors = Array(tubeCount);
  for (let i = 0; i < tubeCount; i++) {
    tubeWaterColors[i] = [-1, -1, -1, -1];
  }

  recolorAll();
}

function cycleTubeWaterColor(tubeNum, waterNum, reverse) {
  clearSolution();

  const colorCount = Number(colorCountInput.value);

  tubeWaterColors[tubeNum][waterNum] += reverse ? -1 : 1;
  if (tubeWaterColors[tubeNum][waterNum] >= colorCount) {
    tubeWaterColors[tubeNum][waterNum] = -1;
  }
  if (tubeWaterColors[tubeNum][waterNum] < -1) {
    tubeWaterColors[tubeNum][waterNum] = colorCount - 1;
  }

  recolorSingle(tubeNum, waterNum);
}

function recolorAll() {
  const tubeCount = Number(tubeCountInput.value);

  for (let i = 0; i < tubeCount; i++) {
    for (let j = 0; j < 4; j++) {
      recolorSingle(i, j);
    }
  }
}

function recolorSingle(tubeNum, waterNum) {
  const colorIndex = tubeWaterColors[tubeNum][waterNum];
  const color = (
    colorIndex == -1 ? 'transparent' : colorSelectors.children[colorIndex].value
  );
  playfield.children[tubeNum].children[waterNum].style.backgroundColor = color;
}

function clearSolution() {
  solution = null;

  solutionRange.disabled = true;

  for (const solutionButton of solutionButtons.children) {
    solutionButton.disabled = true;
  }
}

function enableSolution() {
  solutionRange.disabled = false;
  solutionRange.max = solution.length - 1;
  solutionRange.value = 0;

  for (const solutionButton of solutionButtons.children) {
    solutionButton.disabled = false;
  }
}

function loadSolutionStep() {
  const stepNumber = Number(solutionRange.value);
  tubeWaterColors = solution[stepNumber];
  recolorAll();
}

function playSolution() {
  if (!solution) return;

  const stepNumber = Number(solutionRange.value);
  if (stepNumber === solution.length - 1) return;

  solutionRange.value = stepNumber + 1;
  loadSolutionStep();

  setTimeout(playSolution, 500);
}

//
// Solver logic
//

function validateTubes() {
  const colorCount = Number(colorCountInput.value);

  const flatTubes = tubeWaterColors.flat();
  for (let i = 0; i < colorCount; i++) {
    const iCount = flatTubes.filter((x) => x === i).length;
    if (iCount !== 4 && iCount !== 0) return false;
  }

  for (const tube of tubeWaterColors) {
    const firstWaterIndex = tube.findIndex((water) => water >= 0);
    if (firstWaterIndex == -1) continue;
    const lastEmptyIndex = tube.findLastIndex((water) => water === -1);
    if (lastEmptyIndex == -1) continue;
    if (firstWaterIndex < lastEmptyIndex) return false;
  }

  return true;
}

function isComplete(tube) {
  return tube.every((water) => water == tube[0]);
}

function allComplete(tubes) {
  return tubes.every(isComplete);
}

function applyMove(tubes, move) {
  const newTubes = JSON.parse(JSON.stringify(tubes));

  const [start, end] = move;
  const startTube = newTubes[start];
  const endTube = newTubes[end];

  const startTubeTopIndex = startTube.findIndex((water) => water >= 0);
  if (startTubeTopIndex === -1) return null;
  const startTubeTopWater = startTube[startTubeTopIndex];

  const endTubeTopIndex = endTube.findIndex((water) => water >= 0);
  if (endTubeTopIndex === 0) return null;
  if (endTubeTopIndex !== -1 && startTubeTopWater !== endTube[endTubeTopIndex]) return null;
  const endTubeFirstOpenIndex = endTubeTopIndex === -1 ? 3 : endTubeTopIndex - 1;

  let endTubeIndex = endTubeFirstOpenIndex;
  let startTubeIndex = startTubeTopIndex;
  while (true) {
    endTube[endTubeIndex] = startTubeTopWater;
    startTube[startTubeIndex] = -1;

    endTubeIndex--;
    startTubeIndex++;

    if (endTubeIndex < 0) break;
    if (startTubeIndex >= 4) break;
    if (startTube[startTubeIndex] !== startTubeTopWater) break;
  }

  return newTubes;
}

function serialize(tubes) {
  return JSON.stringify(tubes.toSorted());
}

function solve() {
  if (!validateTubes()) {
    alert('Cannot start from this position');
    return;
  }
  if (allComplete(tubeWaterColors)) return;

  clearSolution();

  const data = {};
  data[serialize(tubeWaterColors)] = { form: tubeWaterColors };

  const queue = [tubeWaterColors];

  while (queue.length > 0) {
    const tubes = queue.shift();
    const serializedTubes = serialize(tubes);

    for (let i = 0; i < tubes.length; i++) {
      for (let j = 0; j < tubes.length; j++) {
        if (i === j) continue;

        const move = [i, j];
        const result = applyMove(tubes, move);
        if (!result) continue;

        if (allComplete(result)) {
          buildSolution(data, result, serializedTubes);
          return;
        }

        const serializedResult = serialize(result);
        if (serializedResult in data) continue;
        data[serializedResult] = {
          serializedPrior: serializedTubes,
          //move,
          form: result,
        };
        queue.push(result);
      }
    }
  }

  alert('No solution found');
}

function buildSolution(data, end, serializedPrior) {
  const reverseSolution = [end];

  while (serializedPrior) {
    const priorData = data[serializedPrior];
    reverseSolution.push(priorData.form);
    serializedPrior = priorData.serializedPrior;
  }

  solution = reverseSolution.reverse();
  enableSolution();
}

//
// Initialization
//

window.addEventListener('load', function () {
  playfield = document.getElementById('playfield');
  colorCountInput = document.getElementById('colorCount');
  colorSelectors = document.getElementById('colorSelectors');
  tubeCountInput = document.getElementById('tubeCount');
  solutionRange = document.getElementById('solutionRange');
  solutionButtons = document.getElementById('solutionButtons');

  colorCountInput.addEventListener('change', changeColorCount);
  tubeCountInput.addEventListener('change', changeTubeCount);
  solutionRange.addEventListener('input', loadSolutionStep);

  solutionButtons.children[0].addEventListener('click', function() {
    solutionRange.value = Math.max(Number(solutionRange.value) - 1, 0);
    loadSolutionStep();
  });
  solutionButtons.children[1].addEventListener('click', playSolution);
  solutionButtons.children[2].addEventListener('click', function() {
    solutionRange.value = Math.min(Number(solutionRange.value) + 1, solution.length - 1);
    loadSolutionStep();
  });

  document.getElementById('clearTubes').addEventListener('click', clearTubeWaterColors);
  document.getElementById('solve').addEventListener('click', solve);

  document.getElementById('colorNumButtons').children[0].addEventListener('click', function() {
    colorCountInput.value = Math.min(Number(colorCountInput.value) + 1, 12);
    changeColorCount();
  });
  document.getElementById('colorNumButtons').children[1].addEventListener('click', function() {
    colorCountInput.value = Math.max(Number(colorCountInput.value) - 1, 2);
    changeColorCount();
  });
  document.getElementById('tubeNumButtons').children[0].addEventListener('click', function() {
    tubeCountInput.value = Math.min(Number(tubeCountInput.value) + 1, 15);
    changeTubeCount();
  });
  document.getElementById('tubeNumButtons').children[1].addEventListener('click', function() {
    tubeCountInput.value = Math.max(Number(tubeCountInput.value) - 1, 3);
    changeTubeCount();
  });

  colorCountInput.value = 3;
  tubeCountInput.value = Number(colorCountInput.value) + 2;
  changeTubeCount();
  changeColorCount();
});
