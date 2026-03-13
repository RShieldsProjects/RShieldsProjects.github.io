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

let highlightColor = '#00ff00';
let highlightAlpha = 100;
let lock = 2;

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
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

// TODO: lock UI
// TODO: highlight UI
// TODO: robot?

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

  ctx.fillStyle = '#808080';
  ctx.fillRect(-9999, -9999, 19999, 19999);

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
  const scaleMulti = baseScale * Math.pow(scaleFactor, scale);
  const screenCoordsIj = [(i + translateX) * scaleMulti, (j + translateY) * scaleMulti];
  const screenCoordsIpoJpo = [(i + 1 + translateX) * scaleMulti, (j + 1 + translateY) * scaleMulti];
  if (screenCoordsIj[0] > ctx.width || screenCoordsIj[1] > ctx.height || screenCoordsIpoJpo[0] < 0 || screenCoordsIpoJpo[1] < 0) {
    return;
  }

  const indexIj = i + j * width;
  const correctIj = correct[indexIj];
  const currentIj = current[indexIj];

  if (currentIj !== -1) {
    ctx.fillStyle = `rgb(${palette[currentIj].join(',')})`;
    ctx.fillRect(i, j, 1, 1);
  }

  if (correctIj !== undefined && currentIj !== correctIj) {
    const highlighted = highlightAlpha > 0 && correctIj === selected;
    if (highlighted) {
      ctx.fillStyle = highlightColor + ('0' + highlightAlpha.toString(16)).slice(-2);
      ctx.fillRect(i, j, 1, 1);
    }

    const chr = alphabet[correctIj];
    // #808080 = (128, 128, 128)
    const lumaIj = lumaWithHighlight(currentIj === -1 ? [128, 128, 128] : palette[currentIj], highlighted);
    if (lumaIj < 75) {
      ctx.fillStyle = '#bbb';
    } else {
      ctx.fillStyle = 'black';
    }
    ctx.fillText(chr, i + 0.5, j + 0.37);
  }
}

// https://stackoverflow.com/a/596243
function lumaWithHighlight(baseColor, highlighted) {
  const color = [...baseColor];
  if (highlighted) {
    color[0] = lerp(color[0], parseInt(highlightColor.slice(1, 3), 16), highlightAlpha / 255);
    color[1] = lerp(color[1], parseInt(highlightColor.slice(3, 5), 16), highlightAlpha / 255);
    color[2] = lerp(color[2], parseInt(highlightColor.slice(5, 7), 16), highlightAlpha / 255);
  }
  return 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2];
}

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
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

function handlePaste(e) {
  const files = (event.clipboardData || event.originalEvent.clipboardData).files;
  if (files.length < 1) return;
  stopEffects(e);
  beginLoadImageFile(files[0]);
}

function paint(mouseX, mouseY) {
  if(!current) return;

  const scaleMulti = baseScale * Math.pow(scaleFactor, scale);
  const i = Math.floor((mouseX - translateX * scaleMulti) / scaleMulti);
  const j = Math.floor((mouseY - translateY * scaleMulti) / scaleMulti);
  if (i < 0 || j < 0 || i >= width || j >= height) return;
  const index = i + j * width;
  if (current[index] === selected || correct[index] === undefined) return;
  if (lock > 0 && current[index] === correct[index]) return;
  if (lock === 2 && tool !== 'wand' && correct[index] !== selected) return;

  if (tool === 'pencil') {
    setPixel(i, j);
  } else if (tool === 'wand') {
    setPixel(i, j, correct[index]);
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

function setPixel(i, j, forceColor) {
  const color = forceColor !== undefined ? forceColor : selected;
  if (!current) return;
  if (i < 0 || j < 0 || i >= width || j >= height) return;
  const index = i + j * width;
  if (current[index] === color || correct[index] === undefined) return;
  current[index] = color;
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

function beginLoadImageFile(file) {
  const fileReader = new FileReader();
  fileReader.onload = (e) => beginLoadImage(e.target.result);
  fileReader.readAsDataURL(file);
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

  //const q = new RgbQuant({ colors: alphabet.length, method: 1 });
  //q.sample(tempImgCtx);
  //palette = q.palette(true);
  const kmeansResult = kmeans(tempImgCtx.getImageData(0, 0, width, height).data);
  palette = kmeansResult.palette;

  //correct = q.reduce(tempImgCtx, 2);
  correct = kmeansResult.indices;
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

function kmeans(pixels) {
  const length = pixels.length / 4;

  let palette = [];
  for (let i = 0; i < alphabet.length; i++) {
    pixelIndex = Math.floor(Math.random() * length);
    palette.push([...pixels.slice(pixelIndex * 4, pixelIndex * 4 + 3)]);
  }

  let runsLeft = 100;
  while (runsLeft > 0) {
    runsLeft--;

    const sums = palette.map(() => [0, 0, 0]);
    const counts = palette.map(() => 0);
    for (let i = 0; i < length; i++) {
      if (pixels[i * 4 + 3] < 128) continue;
      const pixel = pixels.slice(i * 4, i * 4 + 3);
      const minIndex = minIndexBy(palette, (c) => pixelDist(c, pixel));
      sums[minIndex][0] += pixel[0];
      sums[minIndex][1] += pixel[1];
      sums[minIndex][2] += pixel[2];
      counts[minIndex]++;
    }

    for (let i = 0; i < sums.length; i++) {
      if (counts[i] === 0) {
        pixelIndex = Math.floor(Math.random() * length);
        sums[i] = [...pixels.slice(pixelIndex * 4, pixelIndex * 4 + 3)];
      } else {
        sums[i][0] /= counts[i];
        sums[i][1] /= counts[i];
        sums[i][2] /= counts[i];
      }
    }

    let changed = false;
    for (let i = 0; i < sums.length; i++) {
      if (sums[i][0] !== palette[i][0]) changed = true;
      if (sums[i][1] !== palette[i][1]) changed = true;
      if (sums[i][2] !== palette[i][2]) changed = true;
      if (changed) break;
    }
    if (!changed) break;

    palette = sums;
  }
  console.log(runsLeft);

  palette = palette.map((color) => color.map(Math.floor));
  palette.sort(compareColors);

  const indices = [];
  for (let i = 0; i < length; i++) {
    if (pixels[i * 4 + 3] < 128) {
      indices.push(undefined);
      continue;
    }

    const pixel = pixels.slice(i * 4, i * 4 + 3);
    const minIndex = minIndexBy(palette, (c) => pixelDist(c, pixel));
    indices.push(minIndex);
  }

  return { palette, indices };
}

function minIndexBy(arr, f) {
  let minVal = Infinity;
  let minIndex;
  for (let i = 0; i < arr.length; i++) {
    const val = f(arr[i]);
    if (val < minVal) {
      minVal = val;
      minIndex = i;
    }
  }
  return minIndex;
}

function pixelDist(a, b) {
  const d0 = a[0] - b[0];
  const d1 = a[1] - b[1];
  const d2 = a[2] - b[2];
  return d0 * d0 + d1 * d1 + d2 * d2;
}

function compareColors(a, b) {
  const hslA = hueSatLum(a);
  const hslB = hueSatLum(b);
  
  const dHue = hslB.hue - hslA.hue;
  const dLuma = hslB.luma - hslA.luma;
  const dSat = hslB.sat - hslA.sat;

  if (hslA.luma < 0.1 && hslB.luma > 0.1) return 1;
  if (hslB.luma < 0.1 && hslA.luma > 0.1) return -1;

  if (hslA.luma > 0.9 && hslB.luma < 0.9) return -1;
  if (hslB.luma > 0.9 && hslA.luma < 0.9) return 1;

  if (hslA.luma < 0.1 || hslA.luma > 0.9) return dLuma;

  return 4 * dHue + 2 * dLuma + dSat;
}

// 0 to 1
function hueSatLum(color) {
  let [r, g, b] = color;
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r,g,b);
  const min = Math.min(r,g,b);
  const range = max - min;
  
  let hue;
  if (range === 0) {
    hue = 0;
  } else if (max === r) {
    hue = ((g - b) / range + 6) % 6
  } else if (max === g) {
    hue = (b - r) / range + 2
  } else if (max === b) {
    hue = (r - g) / range + 4
  }
  hue /= 6;

  const lum = (max + min) / 2;

  const luma = 0.2627 * r + 0.6780 * g + 0.0593 * b;
  
  let sat;
  if (lum < 0.5) {
    sat = range / max;
  } else {
    sat = range / (1 - Math.abs(2 * lum - 1));
  }

  return { hue, sat, lum, luma };
}

function clamp(x, min, max) {
  if (x < min) return min;
  if (x > max) return max;
  return x;
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
  if (highlightAlpha) drawCanvas();
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
  loadFile.addEventListener('change', () => { beginLoadImageFile(loadFile.files[0]) });

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
  document.addEventListener('paste', handlePaste);

  sizeCanvas();
  drawCanvas();
  selectTool('pencil');
});

window.addEventListener('resize', sizeCanvas);
