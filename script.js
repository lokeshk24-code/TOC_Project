// =====================================================
// script.js — Turing Machine Simulator Logic
// =====================================================

// ===== GLOBAL STATE =====
let tape = [];
let head = 0;
let curState = "";
let machine = null;
let halted = false;
let autoTimer = null;
let lastTransRowIndex = -1;

let stepCount = 0;
let cellsTouched = new Set();
let stateStepCount = {};
let runHistory = [];
let tapeHistory = [];
let customMachine = null;

// ===== DOM REFS =====
const machineSelect = document.getElementById("machineSelect");
const inputStr      = document.getElementById("inputStr");
const loadBtn       = document.getElementById("loadBtn");
const stepBtn       = document.getElementById("stepBtn");
const runBtn        = document.getElementById("runBtn");
const pauseBtn      = document.getElementById("pauseBtn");
const resetBtn      = document.getElementById("resetBtn");
const speedSlider   = document.getElementById("speedSlider");
const speedValEl    = document.getElementById("speedVal");
const tapeEl        = document.getElementById("tape");
const headLabel     = document.getElementById("headLabel");
const statesRow     = document.getElementById("statesRow");
const curStateDisp  = document.getElementById("curStateDisplay");
const plainEng      = document.getElementById("plainEnglish");
const transBody     = document.getElementById("transBody");
const resultBanner  = document.getElementById("resultBanner");
const logEl         = document.getElementById("log");
const canvas        = document.getElementById("stateDiagram");
const ctx           = canvas.getContext("2d");


// =====================================================
// TAB SWITCHING — fixed: pass button element directly
// =====================================================
function switchTab(name, btn) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  btn.classList.add("active");
  if (name === "history")    renderHistory();
  if (name === "complexity") renderComplexity();
}


// =====================================================
// LOAD MACHINE
// KEY FIX: loadMachine() only loads the machine definition
// and updates the transition table.
// It does NOT reset the tape or overwrite the input field.
// That is only done by initMachine().
// =====================================================
function loadMachine() {
  const key = machineSelect.value;

  if (key === "custom") {
    if (!customMachine || customMachine.transitions.length === 0) {
      alert("No custom machine saved yet! Go to the Custom Builder tab first.");
      machineSelect.value = "equal01";
      machine = MACHINES["equal01"];
    } else {
      machine = customMachine;
    }
  } else {
    machine = MACHINES[key];
  }

  // Only set default input if the field is empty
  if (inputStr.value.trim() === "") {
    inputStr.value = machine.defaultInput || "";
  }

  renderTransTable();
}


// =====================================================
// INIT / RESET MACHINE
// This reads whatever is currently in the input box
// and loads it onto the tape.
// =====================================================
function initMachine() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }

  // Use user's typed input — fallback to machine default
  const input = inputStr.value.trim() !== ""
    ? inputStr.value.trim()
    : (machine.defaultInput || "");

  tape      = ["B", ...input.split(""), "B", "B", "B"];
  head      = 1;
  curState  = machine.startState;
  halted    = false;
  lastTransRowIndex = -1;

  // Reset tracking
  stepCount      = 0;
  cellsTouched   = new Set();
  stateStepCount = {};
  machine.states.forEach(s => { stateStepCount[s] = 0; });
  tapeHistory    = [];

  // Reset UI
  resultBanner.className = "result-banner hidden";
  resultBanner.textContent = "";
  stepBtn.disabled  = false;
  runBtn.disabled   = false;
  pauseBtn.disabled = true;

  logEl.innerHTML = `<p class="log-info">Machine: "${machine.name}" loaded. Input: "${input}". Press Step or Run Auto.</p>`;
  plainEng.textContent = `Machine loaded. Starting in state "${machine.startState}". Head at position 1.`;

  renderTape([]);
  renderStates();
  highlightTransRow(-1);
  drawDiagram();
  saveTapeSnapshot();
}


// =====================================================
// RENDER TAPE
// =====================================================
function renderTape(writtenCells) {
  tapeEl.innerHTML = "";

  tape.forEach((sym, i) => {
    const cell = document.createElement("div");
    cell.className = "cell";

    if (i === head)                         cell.classList.add("head");
    else if (writtenCells.includes(i))      cell.classList.add("written");
    else if (sym === "X" || sym === "Y")    cell.classList.add("marked");

    cell.textContent = (sym === "B") ? "▫" : sym;
    tapeEl.appendChild(cell);
  });

  // Scroll head into view
  const cells = tapeEl.querySelectorAll(".cell");
  if (cells[head]) cells[head].scrollIntoView({ block: "nearest", inline: "center" });

  headLabel.textContent  = "▲ head at position " + head;
  curStateDisp.textContent = curState;
  cellsTouched.add(head);
}


// =====================================================
// RENDER STATES
// =====================================================
function renderStates() {
  statesRow.innerHTML = "";
  machine.states.forEach(s => {
    const badge = document.createElement("div");
    badge.className = "state-badge";
    if (s === curState) {
      if (s === machine.acceptState)      badge.classList.add("accept");
      else if (s === machine.rejectState) badge.classList.add("reject");
      else                                badge.classList.add("active");
    }
    badge.textContent = s;
    statesRow.appendChild(badge);
  });
}


// =====================================================
// RENDER TRANSITION TABLE
// =====================================================
function renderTransTable() {
  transBody.innerHTML = "";
  machine.transitions.forEach((tr, i) => {
    const row = document.createElement("tr");
    row.id = "trow" + i;
    row.innerHTML = `
      <td>${tr.from}</td>
      <td>${tr.read}</td>
      <td>${tr.write}</td>
      <td>${tr.move}</td>
      <td>${tr.to}</td>
    `;
    transBody.appendChild(row);
  });
}

function highlightTransRow(index) {
  if (lastTransRowIndex >= 0) {
    const old = document.getElementById("trow" + lastTransRowIndex);
    if (old) old.className = "";
  }
  if (index >= 0) {
    const row = document.getElementById("trow" + index);
    if (row) { row.className = "active-row"; row.scrollIntoView({ block: "nearest" }); }
  }
  lastTransRowIndex = index;
}


// =====================================================
// PLAIN ENGLISH
// =====================================================
function makePlainEnglish(tr, symbol) {
  const dir   = tr.move === "R" ? "right" : "left";
  const sym   = symbol === "B" ? "blank" : "'" + symbol + "'";
  const wrote = tr.write === symbol
    ? `kept ${sym} as it is`
    : `replaced ${sym} with '${tr.write}'`;
  return `In state "${tr.from}", the head read ${sym}. It ${wrote}, moved ${dir}, and switched to state "${tr.to}".`;
}


// =====================================================
// LOG
// =====================================================
function addLog(msg, type) {
  const line = document.createElement("p");
  if (type) line.className = "log-" + type;
  line.textContent = msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}


// =====================================================
// TAPE SNAPSHOT
// =====================================================
function saveTapeSnapshot() {
  tapeHistory.push({
    step:  stepCount,
    state: curState,
    head:  head,
    tape:  [...tape]
  });
}


// =====================================================
// STEP
// =====================================================
function stepMachine() {
  if (halted) return;

  // Extend tape if head goes out of bounds
  if (head < 0)            { tape.unshift("B"); head = 0; }
  if (head >= tape.length) { tape.push("B"); }

  const symbol = tape[head];

  // Count steps per state
  stateStepCount[curState] = (stateStepCount[curState] || 0) + 1;

  // Find matching transition
  const tr = machine.transitions.find(t => t.from === curState && t.read === symbol);

  if (!tr) {
    addLog(`No transition from state "${curState}" on symbol '${symbol}' — Rejected!`, "err");
    plainEng.textContent = `The machine is in state "${curState}" and read '${symbol === "B" ? "blank" : symbol}', but no rule is defined for this. The machine halts and REJECTS.`;
    curState = machine.rejectState;
    halted   = true;
    showResult(false);
    renderStates();
    renderTape([]);
    drawDiagram();
    saveTapeSnapshot();
    disableControls();
    return;
  }

  const tidx = machine.transitions.indexOf(tr);
  highlightTransRow(tidx);

  const writtenCells = (tr.write !== symbol) ? [head] : [];
  tape[head] = tr.write;

  stepCount++;
  plainEng.textContent = makePlainEnglish(tr, symbol);
  addLog(`Step ${stepCount} | State: ${curState} | Read: '${symbol}' → Write: '${tr.write}', Move: ${tr.move}, Next: ${tr.to}`, "info");

  curState = tr.to;
  head    += (tr.move === "R") ? 1 : -1;

  renderTape(writtenCells);
  renderStates();
  drawDiagram();
  saveTapeSnapshot();

  // Check halting
  if (curState === machine.acceptState) {
    halted = true;
    showResult(true);
    disableControls();
    plainEng.textContent = `The machine reached the ACCEPT state after ${stepCount} steps. Input is accepted!`;
  } else if (curState === machine.rejectState) {
    halted = true;
    showResult(false);
    disableControls();
    plainEng.textContent = `The machine reached the REJECT state after ${stepCount} steps. Input is rejected.`;
  }
}


// =====================================================
// RUN AUTO
// =====================================================
function runAuto() {
  if (halted) return;
  pauseBtn.disabled = false;
  runBtn.disabled   = true;

  const speed = parseInt(speedSlider.value);
  const delay = Math.round(1200 / speed);

  autoTimer = setInterval(() => {
    if (halted) {
      clearInterval(autoTimer);
      autoTimer = null;
      pauseBtn.disabled = true;
      return;
    }
    stepMachine();
  }, delay);
}

function pauseMachine() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  pauseBtn.disabled = true;
  runBtn.disabled   = false;
}


// =====================================================
// SHOW RESULT + update complexity stats
// =====================================================
function showResult(accepted) {
  const inputLen  = inputStr.value.trim().length;
  const cellsUsed = cellsTouched.size;
  const resultTxt = accepted ? "Accept" : "Reject";

  if (accepted) {
    resultBanner.textContent = "✓ ACCEPTED — Input is valid!";
    resultBanner.className   = "result-banner accept";
    addLog(`ACCEPTED in ${stepCount} steps | Tape cells used: ${cellsUsed}`, "ok");
  } else {
    resultBanner.textContent = "✗ REJECTED — Input is not valid.";
    resultBanner.className   = "result-banner reject";
    addLog(`REJECTED in ${stepCount} steps | Tape cells used: ${cellsUsed}`, "err");
  }

  // Save run to history
  runHistory.unshift({
    machine: machine.name,
    input:   inputStr.value.trim() || machine.defaultInput,
    steps:   stepCount,
    cells:   cellsUsed,
    result:  resultTxt
  });
  if (runHistory.length > 5) runHistory.pop();

  // Update stat cards
  document.getElementById("stat-steps").textContent  = stepCount;
  document.getElementById("stat-cells").textContent  = cellsUsed;
  document.getElementById("stat-input").textContent  = inputLen;
  document.getElementById("stat-result").textContent = resultTxt;
  document.getElementById("stat-result").style.color = accepted ? "#15803d" : "#b91c1c";
}

function disableControls() {
  stepBtn.disabled  = true;
  runBtn.disabled   = true;
  pauseBtn.disabled = true;
}


// =====================================================
// STATE DIAGRAM (Canvas)
// =====================================================
function drawDiagram() {
  if (!machine) return;

  const states = machine.states;
  const n      = states.length;
  const W      = canvas.parentElement.clientWidth || 860;
  canvas.width  = Math.max(W - 10, 500);
  canvas.height = 240;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx     = canvas.width / 2;
  const cy     = 115;
  const radius = Math.min(cx - 70, 160);
  const nodeR  = 26;

  // Compute positions around a circle
  const pos = {};
  states.forEach((s, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    pos[s] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  });

  // Draw transition arrows
  machine.transitions.forEach(tr => {
    if (!pos[tr.from] || !pos[tr.to]) return;
    const label = `${tr.read}/${tr.write},${tr.move}`;
    ctx.strokeStyle = "#b0bec5";
    ctx.lineWidth   = 1.2;
    ctx.fillStyle   = "#b0bec5";

    if (tr.from === tr.to) {
      drawSelfLoop(ctx, pos[tr.from].x, pos[tr.from].y, nodeR, label);
    } else {
      drawArrow(ctx, pos[tr.from], pos[tr.to], nodeR, label);
    }
  });

  // Draw state circles
  states.forEach(s => {
    const p         = pos[s];
    const isAccept  = (s === machine.acceptState);
    const isReject  = (s === machine.rejectState);
    const isCurrent = (s === curState);

    // Double ring for accept state
    if (isAccept) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, nodeR + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    // Fill circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, nodeR, 0, 2 * Math.PI);
    if      (isCurrent && isAccept)  ctx.fillStyle = "#dcfce7";
    else if (isCurrent && isReject)  ctx.fillStyle = "#fee2e2";
    else if (isCurrent)              ctx.fillStyle = "#dbeafe";
    else if (isAccept)               ctx.fillStyle = "#f0fdf4";
    else if (isReject)               ctx.fillStyle = "#fff1f2";
    else                             ctx.fillStyle = "#f8fafc";
    ctx.fill();

    // Border
    ctx.strokeStyle = isCurrent ? "#2563eb" : isAccept ? "#16a34a" : isReject ? "#ef4444" : "#90a4ae";
    ctx.lineWidth   = isCurrent ? 2.5 : 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle     = isCurrent ? "#1e40af" : isAccept ? "#14532d" : isReject ? "#7f1d1d" : "#374151";
    ctx.font          = "bold 11px Segoe UI, sans-serif";
    ctx.textAlign     = "center";
    ctx.textBaseline  = "middle";
    ctx.fillText(s, p.x, p.y);
  });

  // Start arrow
  const sp = pos[machine.startState];
  if (sp) {
    ctx.strokeStyle = "#555";
    ctx.fillStyle   = "#555";
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(sp.x - nodeR - 28, sp.y);
    ctx.lineTo(sp.x - nodeR - 3,  sp.y);
    ctx.stroke();
    arrowHead(ctx, sp.x - nodeR - 3, sp.y, 0, "#555");
    ctx.font         = "10px Segoe UI, sans-serif";
    ctx.textAlign    = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("start", sp.x - nodeR - 30, sp.y - 9);
  }
}

function drawArrow(ctx, from, to, r, label) {
  const dx   = to.x - from.x;
  const dy   = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx   = dx / dist;
  const ny   = dy / dist;

  const sx = from.x + nx * r;
  const sy = from.y + ny * r;
  const ex = to.x   - nx * r;
  const ey = to.y   - ny * r;

  // Slight curve offset
  const mx = (sx + ex) / 2 - ny * 20;
  const my = (sy + ey) / 2 + nx * 20;

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(mx, my, ex, ey);
  ctx.stroke();

  const angle = Math.atan2(ey - my, ex - mx);
  arrowHead(ctx, ex, ey, angle, ctx.strokeStyle);

  // Label at midpoint of curve
  const lx = 0.25 * sx + 0.5 * mx + 0.25 * ex;
  const ly = 0.25 * sy + 0.5 * my + 0.25 * ey;
  ctx.fillStyle     = "#607d8b";
  ctx.font          = "9px Courier New, monospace";
  ctx.textAlign     = "center";
  ctx.textBaseline  = "middle";
  ctx.fillText(label, lx, ly);
}

function drawSelfLoop(ctx, x, y, r, label) {
  ctx.beginPath();
  ctx.arc(x, y - r - 15, 14, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle     = "#607d8b";
  ctx.font          = "9px Courier New, monospace";
  ctx.textAlign     = "center";
  ctx.textBaseline  = "middle";
  ctx.fillText(label, x, y - r - 15);
}

function arrowHead(ctx, x, y, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color || "#b0bec5";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-8,  4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}


// =====================================================
// TAPE HISTORY TAB
// =====================================================
function renderHistory() {
  const list = document.getElementById("historyList");
  if (tapeHistory.length === 0) {
    list.innerHTML = "<p class='log-info'>Run a simulation first to see tape history here.</p>";
    return;
  }

  list.innerHTML = "";
  tapeHistory.forEach((snap, i) => {
    const item = document.createElement("div");
    item.className = "history-item";

    const stepEl = document.createElement("div");
    stepEl.className   = "history-step";
    stepEl.textContent = (i === 0) ? "Start" : "Step " + snap.step;

    const stateEl = document.createElement("div");
    stateEl.className   = "history-state";
    stateEl.textContent = snap.state;

    const tapeDiv = document.createElement("div");
    tapeDiv.className = "history-tape";

    const start = Math.max(0, snap.head - 3);
    const end   = Math.min(snap.tape.length - 1, snap.head + 6);

    if (start > 0) {
      const dot = document.createElement("div");
      dot.className   = "h-cell";
      dot.style.border = "none";
      dot.textContent  = "...";
      tapeDiv.appendChild(dot);
    }

    for (let j = start; j <= end; j++) {
      const c = document.createElement("div");
      c.className   = "h-cell" + (j === snap.head ? " h-head" : "");
      c.textContent = (snap.tape[j] === "B") ? "▫" : snap.tape[j];
      tapeDiv.appendChild(c);
    }

    item.appendChild(stepEl);
    item.appendChild(stateEl);
    item.appendChild(tapeDiv);
    list.appendChild(item);
  });
}


// =====================================================
// COMPLEXITY TAB
// =====================================================
function renderComplexity() {
  // Bar chart
  const bars    = document.getElementById("stateStepBars");
  bars.innerHTML = "";
  const maxSteps = Math.max(...Object.values(stateStepCount), 1);

  const hasData = Object.values(stateStepCount).some(v => v > 0);
  if (!hasData) {
    bars.innerHTML = "<p class='log-info' style='font-size:13px;'>Run a simulation to see stats.</p>";
  } else {
    Object.entries(stateStepCount).forEach(([state, count]) => {
      if (count === 0) return;
      const row = document.createElement("div");
      row.className = "bar-row";
      const pct = Math.round((count / maxSteps) * 100);
      row.innerHTML = `
        <div class="bar-label">${state}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="bar-count">${count}</div>
      `;
      bars.appendChild(row);
    });
  }

  // Run history table
  const tbody   = document.getElementById("runHistoryBody");
  tbody.innerHTML = "";
  if (runHistory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:#aaa; font-family:sans-serif; padding:10px;">No runs yet.</td></tr>`;
    return;
  }
  runHistory.forEach((r, i) => {
    const row   = document.createElement("tr");
    const color = r.result === "Accept" ? "#15803d" : "#b91c1c";
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${r.machine}</td>
      <td>${r.input}</td>
      <td>${r.steps}</td>
      <td>${r.cells}</td>
      <td style="color:${color}; font-weight:700;">${r.result}</td>
    `;
    tbody.appendChild(row);
  });
}


// =====================================================
// CUSTOM MACHINE BUILDER
// =====================================================
function addBuilderRow() {
  const tbody = document.getElementById("builderBody");
  const row   = document.createElement("tr");
  row.innerHTML = `
    <td><input class="builder-input" type="text" placeholder="q0"/></td>
    <td><input class="builder-input" type="text" placeholder="0" style="width:55px;"/></td>
    <td><input class="builder-input" type="text" placeholder="X" style="width:55px;"/></td>
    <td><input class="builder-input" type="text" placeholder="R" style="width:55px;"/></td>
    <td><input class="builder-input" type="text" placeholder="q1"/></td>
    <td><button class="del-btn" onclick="this.closest('tr').remove()">✕</button></td>
  `;
  tbody.appendChild(row);
}

function saveCustomMachine() {
  const name    = document.getElementById("b-name").value.trim()   || "My Custom TM";
  const start   = document.getElementById("b-start").value.trim()  || "q0";
  const accept  = document.getElementById("b-accept").value.trim() || "accept";
  const reject  = document.getElementById("b-reject").value.trim() || "reject";
  const testInp = document.getElementById("b-input").value.trim();
  const msg     = document.getElementById("builderMsg");

  const rows       = document.querySelectorAll("#builderBody tr");
  const transitions = [];
  const stateSet   = new Set([start, accept, reject]);
  let valid        = true;

  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const from   = inputs[0].value.trim();
    const read   = inputs[1].value.trim();
    const write  = inputs[2].value.trim();
    const move   = inputs[3].value.trim().toUpperCase();
    const to     = inputs[4].value.trim();

    if (!from || !read || !write || !move || !to) { valid = false; return; }
    if (move !== "L" && move !== "R")             { valid = false; return; }

    transitions.push({ from, read, write, move, to });
    stateSet.add(from);
    stateSet.add(to);
  });

  if (!valid || transitions.length === 0) {
    msg.textContent = "❌ Please fill all fields. Move must be L or R.";
    msg.style.color = "#b91c1c";
    return;
  }

  customMachine = {
    name,
    states:      Array.from(stateSet),
    startState:  start,
    acceptState: accept,
    rejectState: reject,
    defaultInput: testInp,
    transitions
  };
  MACHINES["custom"] = customMachine;

  msg.textContent = `✓ Machine "${name}" saved with ${transitions.length} transitions! Switching to Simulate tab...`;
  msg.style.color = "#15803d";

  setTimeout(() => {
    // Switch tab manually
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(el => el.classList.remove("active"));
    document.getElementById("tab-simulate").classList.add("active");
    document.querySelectorAll(".tab")[0].classList.add("active");

    machineSelect.value = "custom";
    machine = customMachine;
    inputStr.value = customMachine.defaultInput || "";
    renderTransTable();
    initMachine();
  }, 900);
}


// =====================================================
// EVENT LISTENERS
// =====================================================

// Load & Reset button — loads selected machine AND resets tape with current input
loadBtn.addEventListener("click", () => {
  loadMachine();
  initMachine();
});

// Reset button — just resets tape (keeps same machine, restores default input)
resetBtn.addEventListener("click", () => {
  inputStr.value = machine.defaultInput || "";
  initMachine();
});

stepBtn.addEventListener("click",  stepMachine);
runBtn.addEventListener("click",   runAuto);
pauseBtn.addEventListener("click", pauseMachine);

speedSlider.addEventListener("input", () => {
  speedValEl.textContent = speedSlider.value;
  if (autoTimer) { pauseMachine(); runAuto(); }
});

// When dropdown changes — load new machine and put its default input
machineSelect.addEventListener("change", () => {
  const key = machineSelect.value;
  if (key === "custom") {
    if (!customMachine || customMachine.transitions.length === 0) {
      alert("No custom machine saved yet! Go to the Custom Builder tab first.");
      machineSelect.value = "equal01";
    }
  }
  machine = MACHINES[machineSelect.value];
  inputStr.value = machine.defaultInput || "";
  renderTransTable();
  initMachine();
});

window.addEventListener("resize", () => { if (machine) drawDiagram(); });


// =====================================================
// STARTUP
// =====================================================
(function initBuilder() {
  for (let i = 0; i < 3; i++) addBuilderRow();
})();

// Load first machine on page open
machine = MACHINES["equal01"];
inputStr.value = machine.defaultInput;
renderTransTable();
initMachine();
