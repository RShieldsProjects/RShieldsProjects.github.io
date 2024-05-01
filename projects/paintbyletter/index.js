let loadUrl;
let loadFile;

const baseScale = 3;
const maxScale = 12;
let scale = 0;
let scaleFactor = 1.3;

let translateX = 0;
let translateY = 0;
const translationPadding = 5;

const baseMaxPixels = 1250;
let quality;
let width = 200;
let height = 300;

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXY';
let palette;
let colors;
let progress;
let selected = 0;

const toolButtons = {};
let tool;

let correct;
let current;

let cvs;
let ctx;

function sizeCanvas() {
  const { width, height } = cvs.getBoundingClientRect();
  cvs.width = width;
  cvs.height = height;

  scaleMulti = baseScale * Math.pow(scaleFactor, scale);
  ctx.scale(scaleMulti, scaleMulti);

  ctx.textRendering = "optimizeSpeed";
  ctx.font = '1px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.imageSmoothingEnabled = false;

  drawCanvas();
}

function drawCanvas() {
  transformContext();

  ctx.fillStyle = 'gray';
  ctx.fillRect(-9999, -9999, 19999, 19999);

  ctx.fillStyle = 'gray';
  ctx.fillRect(1, 1, 1, 1);

  if (!current) return;

  ctx.fillStyle = 'black';
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      drawPixel(i, j);
    }
  }
}

function transformContext() {
  if (scale < 0) scale = 0;
  else if (scale > maxScale) scale = maxScale;

  const scaleMulti = baseScale * Math.pow(scaleFactor, scale);

  const cvsPixelWidth = cvs.width / scaleMulti;
  const cvsPixelHeight = cvs.height / scaleMulti;

  const maxTranslateX = translationPadding;
  const minTranslateX = cvsPixelWidth - width - translationPadding;
  const maxTranslateY = translationPadding;
  const minTranslateY = cvsPixelHeight - height - translationPadding;

  if (cvsPixelWidth >= width + translationPadding * 2) translateX = (minTranslateX + maxTranslateX) / 2;
  else if (translateX > maxTranslateX) translateX = maxTranslateX;
  else if (translateX < minTranslateX) translateX = minTranslateX;
  if (cvsPixelHeight >= height + translationPadding * 2) translateY = (minTranslateY + maxTranslateY) / 2;
  else if (translateY > maxTranslateY) translateY = maxTranslateY;
  else if (translateY < minTranslateY) translateY = minTranslateY;

  ctx.setTransform(scaleMulti, 0, 0, scaleMulti, translateX * scaleMulti, translateY * scaleMulti);
}

function drawPixel(i, j) {
  const indexIj = i + j * width;
  const correctIj = correct[indexIj];
  const currentIj = current[indexIj];

  if (currentIj !== -1) {
    ctx.fillStyle = `rgb(${palette[currentIj].join(',')})`;
    ctx.fillRect(i, j, 1, 1);
  }

  if (correctIj !== undefined && currentIj !== correctIj) {
    const chr = alphabet[correctIj];
    if (currentIj !== -1 && lightness(palette[currentIj]) < 75) {
      ctx.fillStyle = '#bbb';
    } else {
      ctx.fillStyle = 'black';
    }
    ctx.fillText(chr, i + 0.5, j + 0.37);
  }
}

// https://stackoverflow.com/a/596243
function lightness(color) {
  return 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2];
}

function stopEffects(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleScroll(e) {
  stopEffects(e);

  direction = Math.sign(e.deltaY);
  if (direction === 0) return;

  newScale = scale - direction;
  if (newScale < 0 || newScale > maxScale) return;
  scale = newScale;

  const largerScale = direction === 1 ? scale + 1 : scale;
  const largerScaleMulti = baseScale * Math.pow(scaleFactor, largerScale);
  translateX -= (1 - scaleFactor) * direction / largerScaleMulti * e.offsetX;
  translateY -= (1 - scaleFactor) * direction / largerScaleMulti * e.offsetY;

  drawCanvas();
}

let isPainting = false;
let isDragging = false;

function handleMouseDown(e) {
  stopEffects(e);

  if (e.button === 0) {
    isPainting = true;
    isDragging = false;
    paint(e.offsetX, e.offsetY);
  } else if (e.button === 1 || e.button === 2) {
    isDragging = true;
    isPainting = false;
  }
}

function handleMouseUp(e) {
  if (e.button === 0) {
    isPainting = false;
  } else if (e.button === 1 || e.button === 2) {
    isDragging = false;
  }
}

function handleDrag(e) {
  if (isPainting) {
    paint(e.offsetX, e.offsetY);
  } else if (isDragging) {
    const scaleMulti = baseScale * Math.pow(scaleFactor, scale);
    const deltaX = e.movementX / scaleMulti;
    const deltaY = e.movementY / scaleMulti;
    translateX += deltaX;
    translateY += deltaY;
    drawCanvas();
  }
}

function handleKeyPress(e) {
  if (e.key.length > 1) return;
  const n = alphabet.indexOf(e.key.toUpperCase());
  if (n < 0) return;
  selectColor(n);
}

function paint(mouseX, mouseY) {
  if(!current) return;

  const scaleMulti = baseScale * Math.pow(scaleFactor, scale);
  const i = Math.floor((mouseX - translateX * scaleMulti) / scaleMulti);
  const j = Math.floor((mouseY - translateY * scaleMulti) / scaleMulti);
  if (i < 0 || j < 0 || i >= width || j >= height) return;
  const index = i + j * width;
  if (current[index] === selected || correct[index] === undefined) return;

  if (tool === 'pencil') {
    setPixel(i, j);
  } else if (tool === 'wand') {
    selectColor(correct[index]);
    setPixel(i, j);
  } else if (tool === 'bucket') {
    if (selected !== correct[index]) {
      setPixel(i, j);
    } else {
      const startColor = current[index];
      const queue = [[i, j]];
      while (queue.length > 0) {
        const [i, j] = queue.pop();
        if (i < 0 || j < 0 || i >= width || j >= height) continue;
        const index = i + j * width;
        if (current[index] !== startColor || correct[index] !== selected) continue;

        setPixel(i, j);
        queue.push(
          [i+1,j+1], [i+1,j], [i+1,j-1],
          [i,  j+1],          [i,  j-1],
          [i-1,j+1], [i-1,j], [i-1,j-1]
        );
      }
    }
  }

  updateProgress();
}

function setPixel(i, j) {
  if (!current) return;
  if (i < 0 || j < 0 || i >= width || j >= height) return;
  const index = i + j * width;
  if (current[index] === selected || correct[index] === undefined) return;
  current[index] = selected;
  drawPixel(i, j);
}

const tempImg = new Image();
tempImg.crossOrigin = 'anonymous';
tempImg.addEventListener('load', completeLoadImage);
tempImg.addEventListener('error', function(e) {
  alert('Could not load image.\n\nThis can sometimes happen due to CORS. Download an extension such as CorsEverywhere, enable it here, and try again.\n\nIf that still does not work, download the image and use the file interface.');
  console.error(e);
});

function beginLoadImage(src) {
  tempImg.src = src;
  colors.innerHTML = '';
}

function completeLoadImage() {
  const maxPixels = baseMaxPixels * Math.pow(2, Number(quality.value));
  const pixelCount = tempImg.width * tempImg.height;
  const scaling = Math.sqrt(Math.min(maxPixels / pixelCount, 1));
  width = Math.round(scaling * tempImg.width);
  height = Math.round(scaling * tempImg.height);

  const tempImgCvs = document.createElement('canvas');
  tempImgCvs.width = width;
  tempImgCvs.height = height;
  const tempImgCtx = tempImgCvs.getContext('2d');
  //imgCtx.imageSmoothingEnabled = false;
  tempImgCtx.drawImage(tempImg, 0, 0, width, height);

  const q = new RgbQuant({ colors: alphabet.length, method: 1 });
  q.sample(tempImgCtx);
  palette = q.palette(true);

  correct = q.reduce(tempImgCtx, 2);
  current = correct.map(() => -1);
  drawCanvas();

  for (let i = 0; i < alphabet.length; i++) {
    const b = document.createElement('div');
    b.classList.add('colorselector');
    b.innerText = alphabet[i];
    b.style.backgroundColor = 'rgb(' + palette[i].join(',') + ')';
    b.addEventListener('click', () => { selectColor(i) });
    colors.appendChild(b);
  }

  selectColor(0);
}

function selectTool(newTool) {
  tool = newTool;

  for (const [key, val] of Object.entries(toolButtons)) {
    if (key === newTool) {
      val.classList.add('selected');
    } else {
      val.classList.remove('selected');
    }
  }
}

function selectColor(n) {
  if (!colors.children[selected]) return;
  colors.children[selected].classList.remove('selected');
  selected = n;
  colors.children[n].classList.add('selected');
  updateProgress();
}

function updateProgress() {
  if (!current) return;

  let selectedTotal = 0;
  let selectedCorrect = 0;
  let totalTotal = 0;
  let totalCorrect = 0;

  for (let i = 0; i < current.length; i++) {
    if (correct[i] === undefined) continue;
    totalTotal++;
    if (correct[i] === selected) selectedTotal++;
    if (correct[i] === selected && current[i] === correct[i]) selectedCorrect++;
    if (current[i] === correct[i]) totalCorrect++;
  }

progress.innerText = `${alphabet[selected]}:\n${selectedCorrect}/${selectedTotal} (${Math.floor(100 * selectedCorrect / selectedTotal)}%)\nTotal:\n${totalCorrect}/${totalTotal} (${Math.floor(100 * totalCorrect / totalTotal)}%)`;
}

window.addEventListener('load', function () {
  quality = document.getElementById('quality');
  colors = document.getElementById('colors');
  progress = document.getElementById('progress');
  cvs = document.getElementById('canvas');
  ctx = cvs.getContext('2d');

  loadUrl = document.getElementById('loadurl');
  document.getElementById('loadurlbutton').addEventListener('click', function() {
    beginLoadImage(loadUrl.value);
  });
  loadFile = document.getElementById('loadfile');
  loadFile.addEventListener('change', function() {
    beginLoadImage(URL.createObjectURL(loadFile.files[0]));
  });

  toolButtons['pencil'] = document.getElementById('pencil');
  toolButtons['bucket'] = document.getElementById('bucket');
  toolButtons['wand'] = document.getElementById('wand');
  for (const [key, val] of Object.entries(toolButtons)) {
    val.addEventListener('click', () => { selectTool(key) })
  }

  document.addEventListener('keydown', handleKeyPress);
  cvs.addEventListener('wheel', handleScroll, { passive: false });
  cvs.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  cvs.addEventListener('mousemove', handleDrag);
  document.addEventListener('contextmenu', stopEffects);

  sizeCanvas();
  drawCanvas();
  selectTool('pencil');
});

window.addEventListener('resize', sizeCanvas);
