const c = 20;
const E = 0.000000000001;

var debug;
var requestId = 0;

var table;

function init() {
  table = document.getElementById("table");
}

// [y][x] [i][j]
var grid = [];
var cells = [];

var ver = [];
var hor = [];

function load() {
  stop();

  let inputstr = window.prompt("Load from teal", "");
  let obj = JSON.parse(inputstr);
  ver = obj.ver;
  hor = obj.hor;

  makeGrid();
}

function makeGrid() {
  table.innerHTML = "";

  grid = [];
  cells = [];

  const hr = document.createElement("tr");
  hr.appendChild(document.createElement("th"));
  for (var j = 0; j < hor.length; j++) {
    const th = document.createElement("th");
    th.innerHTML = hor[j].join("<br>");
    th.className = "top";
    hr.appendChild(th);
  }
  table.appendChild(hr);

  for (var i = 0; i < ver.length; i++) {
    const gridRow = [];
    const cellRow = [];
    const tr = document.createElement("tr");

    const th = document.createElement("th");
    th.innerHTML = "&nbsp;" + ver[i].join(" ") + "&nbsp;";
    th.className = "left";
    tr.appendChild(th);

    for (var j = 0; j < hor.length; j++) {
      gridRow.push(0.5);

      let td = document.createElement("td");
      cellRow.push(td);
      tr.appendChild(td);
    }
    grid.push(gridRow);
    cells.push(cellRow);

    table.appendChild(tr);
  }

  drawGrid();
}

function drawGrid() {
  for (var i = 0; i < ver.length; i++) {
    for (var j = 0; j < hor.length; j++) {
      let percent = Math.round((1 - grid[i][j]) * 100);
      cells[i][j].style.backgroundColor = "hsl(0, 0%, " + percent + "%)";
    }
  }
}

function sum(arr) {
  let s = 0;
  for (const a of arr) {
    s += a;
  }
  return s;
}

function makeSquare(h, v, val) {
  arr = [];
  for (var i = 0; i < v; i++) {
    let row = [];
    for (var j = 0; j < h; j++) {
      row.push(val);
    }
    arr.push(row);
  }
  return arr;
}

function step(arr) {
  let i = 0;
  while (arr[i] == 0) {
    i++;
    if (i >= arr.length - 1) {
      return false;
    }
  }

  arr[i]--;
  arr[i+1]++;
  if (i > 0) {
    arr[0] = arr[i];
    arr[i] = 0;
  }

  return true;
}

function avgFunc(a, b) {
  const x = 2 * a - 1;
  const y = 2 * b - 1;
  if (x * y < -0.99) {
    return 0.5;
  }
  const o = (x + y)/(1 + x*y);
  return (o + 1)/2;
}

function pow(a, b) {
  let o = 1;
  for (let i = 0; i < b; i++) {
    o *= a;
  }
  return o;
}

function solve() {
  // across
  const hwhite = makeSquare(hor.length, ver.length, 0);
  const hblack = makeSquare(hor.length, ver.length, 0);
  for (let i = 0; i < ver.length; i++) {
    const blacks = ver[i];
    const totalWhites = hor.length - sum(blacks) - blacks.length + 1;
    const whites = [totalWhites];
    for (let x = 0; x < blacks.length; x++) {
      whites.push(0);
    }

    let ps = []
    let rows = []
    do {
      let p = 0;
      let j = 0;
      let row = []

      for (let y = 0; y < whites[0]; y++) {
        row.push(-1);
        p += pow(grid[i][j], c);
        j++;
      }
      for (let y = 0; y < blacks[0]; y++) {
        row.push(1);
        p += pow(1 - grid[i][j], c);
        j++;
      }
      for (let x = 1; x < blacks.length; x++) {
        for (let y = 0; y < whites[x] + 1; y++) {
          row.push(-1);
          p += pow(grid[i][j], c);
          j++;
        }
        for (let y = 0; y < blacks[x]; y++) {
          row.push(1);
          p += pow(1 - grid[i][j], c);
          j++;
        }
      }
      for (let y = 0; y < whites[whites.length - 1]; y++) {
        row.push(-1);
        p += pow(grid[i][j], c);
        j++;
      }

      p = (p <= E ? 9999 : 1/p);
      for (let j = 0; j < row.length; j++) {
        if (row[j] == -1) {
          hwhite[i][j] += p;
        } else {
          hblack[i][j] += p;
        }
      }
      /*ps.push(p);
      rows.push(row);*/
    } while (step(whites));

    /*const min = Math.min(...ps);
    for (let x = 0; x < ps.length; x++) {
      for (let j = 0; j < rows[x].length; j++) {
        if (rows[x][j] == -1) {
          hwhite[i][j] += ps[x] - min * 0.99;
        } else {
          hblack[i][j] += ps[x] - min * 0.99;
        }
      }
    }*/
  }
  const htotal = makeSquare(hor.length, ver.length, 0);
  for (let i = 0; i < ver.length; i++) {
    for (let j = 0; j < hor.length; j++) {
      if (hwhite[i][j] <= E && hblack[i][j] <= E) {
        htotal[i][j] = 0.5;
      } else {
        htotal[i][j] = hblack[i][j] / (hblack[i][j] + hwhite[i][j]);
      }
    }
  }

  // down
  const vwhite = makeSquare(hor.length, ver.length, 0);
  const vblack = makeSquare(hor.length, ver.length, 0);
  for (let j = 0; j < hor.length; j++) {
    const blacks = hor[j];
    const totalWhites = ver.length - sum(blacks) - blacks.length + 1;
    const whites = [totalWhites];
    for (let x = 0; x < blacks.length; x++) {
      whites.push(0);
    }

    let ps = []
    let cols = []

    do {
      let p = 0;
      let i = 0;
      let col = []

      for (let y = 0; y < whites[0]; y++) {
        col.push(-1);
        p += pow(grid[i][j], c);
        i++;
      }
      for (let y = 0; y < blacks[0]; y++) {
        col.push(1);
        p += pow(1 - grid[i][j], c);
        i++;
      }
      for (let x = 1; x < blacks.length; x++) {
        for (let y = 0; y < whites[x] + 1; y++) {
          col.push(-1);
          p += pow(grid[i][j], c);
          i++;
        }
        for (let y = 0; y < blacks[x]; y++) {
          col.push(1);
          p += pow(1 - grid[i][j], c);
          i++;
        }
      }
      for (let y = 0; y < whites[whites.length - 1]; y++) {
        col.push(-1);
        p += pow(grid[i][j], c);
        i++;
      }

      p = (p <= E ? 9999 : 1/p);
      for (let i = 0; i < col.length; i++) {
        if (col[i] == -1) {
          vwhite[i][j] += p;
        } else {
          vblack[i][j] += p;
        }
      }
      /*ps.push(p);
      cols.push(col);*/
    } while (step(whites));

    /*const min = Math.min(...ps);
    for (let x = 0; x < ps.length; x++) {
      for (let i = 0; i < cols[x].length; i++) {
        if (cols[x][i] == -1) {
          vwhite[i][j] += ps[x] - min * 0.99;
        } else {
          vblack[i][j] += ps[x] - min * 0.99;
        }
      }
    }*/
  }
  const vtotal = makeSquare(hor.length, ver.length, 0);
  for (let i = 0; i < ver.length; i++) {
    for (let j = 0; j < hor.length; j++) {
      if (vwhite[i][j] <= E && vblack[i][j] <= E) {
        vtotal[i][j] = 0.5;
      } else {
        vtotal[i][j] = vblack[i][j] / (vblack[i][j] + vwhite[i][j]);
      }
    }
  }
  debug = [vtotal, htotal];

  for (let i = 0; i < ver.length; i++) {
    for (let j = 0; j < hor.length; j++) {
      grid[i][j] = avgFunc(htotal[i][j], vtotal[i][j]);
    }
  }

  drawGrid();
  requestId = window.requestAnimationFrame(solve);
}

function stop() {
  if (requestId == 0) {
    return;
  }

  window.cancelAnimationFrame(requestId);
  requestId = 0;
}

window.onload = function() {
  document.getElementById("load").onclick = load;
  document.getElementById("solve").onclick = solve;
  document.getElementById("stop").onclick = stop;
  
  init();
}
