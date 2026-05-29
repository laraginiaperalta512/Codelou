/* Mandal-Art (Mandala Chart) — 9x9 goal grid.
 *
 * Grid layout: nine 3x3 blocks arranged in reading order 0..8.
 *   0 1 2
 *   3 4 5      Block 4 is the CENTER block.
 *   6 7 8
 *
 * - Center block (4): the middle cell (local 4) is the MAIN GOAL.
 *   Its 8 surrounding cells are the 8 SUB-GOALS.
 * - Each sub-goal's position in the center block matches the block that
 *   carries it: sub-goal at center-block local index B becomes the center
 *   (local 4) of outer block B, surrounded by 8 ACTIONS.
 *
 * Because the spatial arrangement is identical, a sub-goal shows up twice:
 * once in the center block (planning view) and once as the title of its
 * outer block. Editing either keeps both in sync.
 */

const CENTER = 4;
const STORAGE_KEY = "mandalart-state-v1";

/** Default empty state. subGoals/tasks ignore index 4 (the center). */
function emptyState() {
  return {
    mainGoal: "",
    subGoals: Array(9).fill(""),
    tasks: Array.from({ length: 9 }, () => Array(9).fill("")),
  };
}

let state = loadState();

/* ---------- Persistence ---------- */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    // Merge defensively so older/partial data never crashes the app.
    const s = emptyState();
    if (typeof parsed.mainGoal === "string") s.mainGoal = parsed.mainGoal;
    if (Array.isArray(parsed.subGoals))
      parsed.subGoals.forEach((v, i) => { if (typeof v === "string") s.subGoals[i] = v; });
    if (Array.isArray(parsed.tasks))
      parsed.tasks.forEach((row, b) => {
        if (Array.isArray(row)) row.forEach((v, l) => { if (typeof v === "string") s.tasks[b][l] = v; });
      });
    return s;
  } catch {
    return emptyState();
  }
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      flashStatus("Saved");
    } catch {
      flashStatus("Could not save (storage full?)");
    }
  }, 250);
}

let statusTimer = null;
function flashStatus(msg) {
  const el = document.getElementById("save-status");
  if (!el) return;
  el.textContent = msg;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { el.textContent = ""; }, 1200);
}

/* ---------- Rendering ---------- */

const chartEl = document.getElementById("chart");

function makeCell({ role, block, local, tint }) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.setAttribute("role", "gridcell");

  const ta = document.createElement("textarea");
  ta.rows = 3;
  ta.dataset.role = role;

  if (role === "main") {
    cell.classList.add("main");
    ta.value = state.mainGoal;
    ta.placeholder = "Main goal";
    ta.setAttribute("aria-label", "Main goal");
  } else if (role === "subgoal") {
    cell.classList.add("subgoal");
    cell.dataset.tint = String(tint);
    ta.dataset.sg = String(block); // block index this sub-goal belongs to
    ta.value = state.subGoals[block];
    ta.placeholder = "Sub-goal";
    ta.setAttribute("aria-label", `Sub-goal ${block}`);
  } else {
    ta.dataset.block = String(block);
    ta.dataset.local = String(local);
    ta.value = state.tasks[block][local];
    ta.placeholder = "Action";
    ta.setAttribute("aria-label", `Action for sub-goal ${block}`);
  }

  cell.appendChild(ta);
  return cell;
}

function render() {
  chartEl.innerHTML = "";
  for (let b = 0; b < 9; b++) {
    const block = document.createElement("div");
    block.className = `block block-${b}`;
    block.setAttribute("role", "rowgroup");

    for (let l = 0; l < 9; l++) {
      let cell;
      if (b === CENTER) {
        if (l === CENTER) {
          cell = makeCell({ role: "main" });
        } else {
          // Sub-goal for the outer block that shares this position.
          cell = makeCell({ role: "subgoal", block: l, tint: l });
        }
      } else {
        if (l === CENTER) {
          // Outer block's center = its sub-goal title (mirror).
          cell = makeCell({ role: "subgoal", block: b, tint: b });
        } else {
          cell = makeCell({ role: "task", block: b, local: l });
        }
      }
      block.appendChild(cell);
    }
    chartEl.appendChild(block);
  }
}

/* ---------- Input handling (event delegation) ---------- */

chartEl.addEventListener("input", (e) => {
  const ta = e.target;
  if (ta.tagName !== "TEXTAREA") return;
  const role = ta.dataset.role;

  if (role === "main") {
    state.mainGoal = ta.value;
  } else if (role === "subgoal") {
    const b = Number(ta.dataset.sg);
    state.subGoals[b] = ta.value;
    // Keep the twin copy (center-block cell + outer-block center) in sync.
    document.querySelectorAll(`textarea[data-sg="${b}"]`).forEach((other) => {
      if (other !== ta) other.value = ta.value;
    });
  } else if (role === "task") {
    const b = Number(ta.dataset.block);
    const l = Number(ta.dataset.local);
    state.tasks[b][l] = ta.value;
  }
  save();
});

/* ---------- Toolbar actions ---------- */

document.getElementById("btn-clear").addEventListener("click", () => {
  if (!confirm("Clear the entire chart? This cannot be undone.")) return;
  state = emptyState();
  render();
  save();
});

document.getElementById("btn-example").addEventListener("click", () => {
  if (hasContent(state) && !confirm("Replace your current chart with the example?")) return;
  state = exampleState();
  render();
  save();
});

document.getElementById("btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mandalart.json";
  a.click();
  URL.revokeObjectURL(url);
});

const fileInput = document.getElementById("file-input");
document.getElementById("btn-import").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      state = loadState();
      render();
      flashStatus("Imported");
    } catch {
      alert("That file isn't a valid Mandal-Art export.");
    }
    fileInput.value = "";
  };
  reader.readAsText(file);
});

document.getElementById("btn-print").addEventListener("click", () => window.print());

/* ---------- Helpers & example data ---------- */

function hasContent(s) {
  return s.mainGoal.trim() ||
    s.subGoals.some((v) => v.trim()) ||
    s.tasks.some((row) => row.some((v) => v.trim()));
}

/** A friendly, illustrative example (wellness goal). */
function exampleState() {
  const s = emptyState();
  s.mainGoal = "Live a healthier, balanced life";

  const subs = {
    0: "Nutrition",
    1: "Exercise",
    2: "Sleep",
    3: "Mindfulness",
    5: "Relationships",
    6: "Learning",
    7: "Finances",
    8: "Environment",
  };
  Object.entries(subs).forEach(([b, v]) => { s.subGoals[b] = v; });

  const actions = {
    0: ["Cook at home 5×/week", "Eat 5 servings of veg", "Drink 2 L water", "Cut added sugar",
        "Meal-prep on Sundays", "No food after 9pm", "Track meals for a week", "Learn 3 new recipes"],
    1: ["Walk 8,000 steps", "Strength train 3×/week", "Stretch 10 min daily", "Take the stairs",
        "Weekend hike", "Try a new sport", "Schedule workouts", "30-day plank challenge"],
    2: ["Fixed bedtime", "No screens 1h before bed", "Sleep 7–8 hours", "Dark, cool room",
        "No caffeine after 2pm", "Morning sunlight", "Wind-down routine", "Track sleep quality"],
    3: ["Meditate 10 min", "Journal daily", "Breathing exercises", "Daily gratitude list",
        "1-hour digital detox", "Eat mindfully", "Time in nature", "Limit doom-scrolling"],
    5: ["Call family weekly", "Weekly date / friend night", "Make one new friend", "Practice active listening",
        "Express gratitude", "Help someone", "Join a club", "Limit social media"],
    6: ["Read 12 books / year", "Take an online course", "Learn a language 15 min", "Practice an instrument",
        "One documentary / week", "Take notes & review", "Teach someone", "Attend a workshop"],
    7: ["Set a monthly budget", "Save 20% of income", "Build emergency fund", "Track expenses",
        "Cancel unused subscriptions", "Invest monthly", "Read a finance book", "Weekly no-spend day"],
    8: ["Declutter weekly", "Recycle consistently", "Reduce single-use plastic", "Tidy desk daily",
        "Keep houseplants", "Clean 15 min / day", "Donate unused items", "Energy-saving habits"],
  };
  Object.entries(actions).forEach(([b, list]) => {
    const block = Number(b);
    // Fill the 8 non-center local positions (0,1,2,3,5,6,7,8) in order.
    const locals = [0, 1, 2, 3, 5, 6, 7, 8];
    locals.forEach((l, i) => { s.tasks[block][l] = list[i] || ""; });
  });

  return s;
}

/* ---------- Boot ---------- */

render();
