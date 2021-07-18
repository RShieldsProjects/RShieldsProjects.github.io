var tds = [];
var highlight = -1;
var requestId = null;
var iters = 0;

function setHighlight(id) {
  if (highlight != -1)
    tds[highlight].classList.remove("highlight");
  highlight = id;
  if (highlight != -1)
    tds[highlight].classList.add("highlight");
  render();
}

function handleKeyPress(e) {
  if (highlight == -1)
    return;
  
  if (e.key === "Backspace" || e.key === "Delete") {
    tds[highlight].p.textContent = "";
    render();
    return;
  }
  
  let key = Number(e.key)
  if (isNaN(key) || key === 0)
    return;
  
  tds[highlight].p.textContent = key;
  tds[highlight].values = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  tds[highlight].values[key - 1] = 1;
  render();
}

function makeTable(table) {
  for (let i = 0; i < 9; i++) {
    let tr = document.createElement("tr");
    for (let j = 0; j < 9; j++) {
      let td = document.createElement("td");
      td.onclick = function () { setHighlight(i * 9 + j); };
      let p = document.createElement("p");
      td.appendChild(p);
      td.p = p;
      td.spans = [];
      for (let i = 0; i < 9; i++) {
        let span = document.createElement("span");
        span.textContent = i + 1;
        td.appendChild(span);
        td.spans.push(span);
      }
      
      tr.appendChild(td);
      tds.push(td);
    }
    table.appendChild(tr);
  }
}

function solveClick() {
  setHighlight(-1);
  if (requestId !== null) {
    window.cancelAnimationFrame(requestId);
    requestId = null;
    document.getElementById("solve").textContent = "Solve!";
  } else {
    requestId = window.requestAnimationFrame(solve);
    document.getElementById("solve").textContent = "Stop";
  }
  iters = 0;
}

function reset() {
  if (requestId !== null) {
    solveClick();
  }
  
  for (td of tds) {
    if (td.p.textContent === null || td.p.textContent === "") {
      td.values = [1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9];
    } else {
      td.values = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      td.values[Number(td.p.textContent) - 1] = 1;
    }
  }
  
  render();
}

function solve() {
  iters++;
  if (iters > 3600) {
    alert("Took too long");
    solveClick();
    return;
  }
  
  let rows = new Array(9);
  let cols = new Array(9);
  let ssqs = new Array(9);
  
  for (let i = 0; i < 9; i++) {
    rows[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    cols[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    ssqs[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  
  for (let i = 0; i < 9; i++) {  // row
    for (let j = 0; j < 9; j++) {  // column
      let s = Math.floor(i / 3) * 3 + Math.floor(j / 3);  // subsquare
      let td = tds[i * 9 + j];

      for (let k = 0; k < 9; k++) {  // number
        rows[i][k] += td.values[k];
        cols[j][k] += td.values[k];
        ssqs[s][k] += td.values[k];
      }
    }
  }
  
  for (let i = 0; i < 9; i++) {  // row
    for (let j = 0; j < 9; j++) {  // column
      let s = Math.floor(i / 3) * 3 + Math.floor(j / 3);  // subsquare
      let td = tds[i * 9 + j];

      let sumPow = 0;
      for (let k = 0; k < 9; k++) {  // number
        if (rows[i][k] === 0 || cols[i][k] === 0 || ssqs[i][k] === 0) {
          td.values[k] = 1/9;
        } else {
          td.values[k] = 3 * td.values[k] / (rows[i][k] + cols[j][k] + ssqs[s][k]);
        }
        
        sumPow += Math.pow(td.values[k], 1.02);
      }
      
      for (let k = 0; k < 9; k++) {
        if (sumPow === 0) {
          td.values[k] = 1/9;
        } else {
          td.values[k] = Math.pow(td.values[k], 1.02) / sumPow;
        }
      }
    }
  }
  
  render();
  
  for (let i = 0; i < 9; i++) {  // row
    for (let j = 0; j < 9; j++) {  // column
      if (Math.max(...tds[i * 9 + j].values) < 0.999) {
        requestId = window.requestAnimationFrame(solve);
        return;
      }
    }
  }
  
  solveClick();
  checkValid();
}

function render() {
  for (let td of tds) {
    for (let i = 0; i < 9; i++) {
      if (td.p.textContent != "") {
        td.spans[i].style.color = "#0000";
      } else {
        td.spans[i].style.color = "rgba(0, 0, 255, " + td.values[i] + ")";
      }
    }
    
    if (td.classList.contains("highlight")) {
      td.p.style.backgroundColor = "#0000";
    } else {
      td.p.style.backgroundColor = "hsl(" + (Math.max(...td.values) - 1/9) * 9/8 * 120 + ", 100%, 80%)";
    }
  }
}

function checkValid() {
  let rows = new Array(9);
  let cols = new Array(9);
  let ssqs = new Array(9);
  
  for (let i = 0; i < 9; i++) {
    rows[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    cols[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    ssqs[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  
  for (let i = 0; i < 9; i++) {  // row
    for (let j = 0; j < 9; j++) {  // column
      let s = Math.floor(i / 3) * 3 + Math.floor(j / 3);  // subsquare
      let td = tds[i * 9 + j];
      for (let k = 0; k < 9; k++) {  // number
        if (td.values[k] > 0.999) {
          rows[i][k]++;
          cols[j][k]++;
          ssqs[s][k]++;
        }
      }
    }
  }
  
  let flatRows = rows.flat();
  let flatCols = cols.flat();
  let flatSsqs = ssqs.flat();
  
  if (Math.max(...flatRows) === 1 && Math.min(...flatRows) === 1 &&
      Math.max(...flatCols) === 1 && Math.min(...flatCols) === 1 &&
      Math.max(...flatSsqs) === 1 && Math.min(...flatSsqs) === 1) {
    alert("Correct solution found");
  } else {
    alert("Problem occurred");
  }
}

window.onload = function() {
  makeTable(document.getElementById("table"));
  document.addEventListener("keydown", handleKeyPress);
  document.getElementById("solve").onclick = solveClick;
  document.getElementById("reset").onclick = reset;
  reset();
}
