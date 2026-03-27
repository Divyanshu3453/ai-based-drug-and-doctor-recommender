/**
 * CuraPath — Frontend Application
 * ─────────────────────────────────────────────────────────────
 * Pure frontend: collects user input, sends structured query to
 * your Python backend, renders the response.
 *
 * API CONTRACT (what this file sends to your backend):
 * ─────────────────────────────────────────────────────────────
 * POST /api/analyze
 * Content-Type: application/json
 *
 * Body:
 * {
 *   "patient": {
 *     "name":     string,
 *     "age":      string,
 *     "sex":      string,
 *     "duration": string,
 *     "city":     string,
 *     "country":  string
 *   },
 *   "symptoms": string,          // text symptoms (may be empty)
 *   "image":    string | null,   // base64 image (may be null)
 *   "mode":     "text" | "image" | "both"
 * }
 *
 * Expected Response:
 * {
 *   "urgency":     "low" | "medium" | "high",
 *   "urgency_msg": string,
 *   "conditions":  [{ "name", "pct", "severity", "icd", "desc" }],
 *   "specialists": [string],
 *   "doctors":     [{ "name", "spec", "hospital", "exp", "rating", "dist", "avail" }],
 *   "drugs":       [{ "name", "class", "mechanism", "dosage", "formulation", "caution" }]
 * }
 *
 * ─────────────────────────────────────────────────────────────
 * Change BACKEND_URL below to point to your Python server.
 * ─────────────────────────────────────────────────────────────
 */

const BACKEND_URL = "http://localhost:8080/api/analyze"; // ← change this

/* ── State ── */
let activeTab = "text";
let imageB1   = null;   // base64 for "image" tab
let imageB2   = null;   // base64 for "both" tab
let history   = [];     // in-memory session history

/* ── Toast ── */
function showToast(msg, type = "") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

/* ── Navigation ── */
function showPanel(id, el) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.getElementById("panel-" + id).classList.add("active");
  document.querySelectorAll(".nav-item, .mob-item").forEach(n => n.classList.remove("active"));
  if (el) el.classList.add("active");
  if (id === "history") renderHistory();
}

/* ── Symptom Input Tabs ── */
function setTab(tab, el) {
  activeTab = tab;
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  el.classList.add("active");
  ["text", "image", "both"].forEach(id => {
    document.getElementById("tab-" + id).style.display = id === tab ? "block" : "none";
  });
}

/* ── Image Upload ── */
function loadImg(event, previewId, slot) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = document.getElementById(previewId);
    img.src = ev.target.result;
    img.style.display = "block";
    const b64 = ev.target.result.split(",")[1];
    if (slot === "b1") imageB1 = b64;
    else               imageB2 = b64;
  };
  reader.readAsDataURL(file);
}

/* ── Build Query Payload ── */
function buildPayload() {
  const sym   = activeTab === "text"  ? document.getElementById("sym1").value
               : activeTab === "both" ? document.getElementById("sym2").value : "";
  const image = activeTab === "image" ? imageB1
               : activeTab === "both" ? imageB2 : null;

  return {
    patient: {
      name:     document.getElementById("pname").value.trim()   || "Unknown",
      age:      document.getElementById("page").value.trim()    || "Unknown",
      sex:      document.getElementById("psex").value           || "Unknown",
      duration: document.getElementById("pdur").value           || "Unknown",
      city:     document.getElementById("pcity").value.trim()   || "Dhubri, Assam",
      country:  document.getElementById("pcountry").value.trim()|| "India",
    },
    symptoms: sym.trim(),
    image:    image,   // null or base64 string
    mode:     activeTab,
  };
}

/* ── Main Analyze Function ── */
async function analyze() {
  const payload = buildPayload();

  if (!payload.symptoms && !payload.image) {
    showToast("Please enter symptoms or upload an image.", "error");
    return;
  }

  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  document.getElementById("loading").style.display = "block";
  document.getElementById("results").style.display = "none";

  // Rotating loading messages
  const msgs = [
    "Analyzing symptoms…",
    "Identifying conditions…",
    "Matching specialists…",
    "Researching drug formulations…",
    "Finding nearby doctors…"
  ];
  let mi = 0;
  const ml = document.getElementById("loadMsg");
  const iv = setInterval(() => { mi = (mi + 1) % msgs.length; ml.textContent = msgs[mi]; }, 1800);

  try {
    const res  = await fetch(BACKEND_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const result = await res.json();
    renderResult(result);

    // Save to in-memory session history
    history.unshift({
      id:       Date.now(),
      symptoms: payload.symptoms || "[Image analysis]",
      urgency:  result.urgency,
      conditions: result.conditions?.length || 0,
      specialists: (result.specialists || []).join(", "),
      result,
      timestamp: new Date(),
    });

  } catch (e) {
    console.error("Analysis error:", e);
    showToast("Analysis failed — check the backend URL or server.", "error");
  }

  clearInterval(iv);
  btn.disabled = false;
  document.getElementById("loading").style.display = "none";
}

/* ── Render Results ── */
function renderResult(r) {
  const urgencyClass = r.urgency === "high" ? "urg-high" : r.urgency === "medium" ? "urg-medium" : "urg-low";
  document.getElementById("urgencyEl").innerHTML =
    `<div class="urgency ${urgencyClass}">${esc(r.urgency_msg)}</div>`;

  document.getElementById("condEl").innerHTML = (r.conditions || []).map(c => `
    <div class="condition">
      <div class="cond-top">
        <div class="cond-name">${esc(c.name)}<span class="sev sev-${c.severity}">${c.severity}</span></div>
        <span class="cond-pct">${c.pct}%</span>
      </div>
      <div class="bar-bg"><div class="bar" style="width:${c.pct}%"></div></div>
      <div class="cond-desc">${esc(c.desc)}</div>
      ${c.icd ? `<div class="icd">ICD-10: ${esc(c.icd)}</div>` : ""}
    </div>`).join("");

  document.getElementById("specEl").innerHTML = (r.specialists || [])
    .map(s => `<span class="chip">${esc(s)}</span>`).join("");

  document.getElementById("docEl").innerHTML = (r.doctors || []).map(d => {
    const ini = esc(d.name.replace("Dr.", "").trim().split(" ").map(x => x[0]).join("").slice(0, 2));
    return `<div class="doc">
      <div class="doc-av">${ini}</div>
      <div style="flex:1">
        <div class="doc-name">${esc(d.name)}</div>
        <div class="doc-spec">${esc(d.spec)} — ${esc(d.hospital)}</div>
        <div class="pills">
          <span class="pill">${d.rating} rating</span>
          <span class="pill">${esc(d.exp)}</span>
          <span class="pill">${esc(d.dist)}</span>
          <span class="pill ${d.avail ? "pill-avail" : ""}">${d.avail ? "Available today" : "Check schedule"}</span>
        </div>
      </div>
    </div>`;
  }).join("");

  document.getElementById("drugEl").innerHTML = (r.drugs || []).map(d => `
    <div class="drug">
      <div class="drug-top">
        <span class="drug-name">${esc(d.name)}</span>
        <span class="drug-class">${esc(d.class)}</span>
      </div>
      <div class="drug-detail">${esc(d.mechanism)}</div>
      <div class="drug-detail"><strong>Dosage:</strong> ${esc(d.dosage)} &nbsp;—&nbsp; <strong>Formulation:</strong> ${esc(d.formulation)}</div>
      <div class="drug-caution">Caution: ${esc(d.caution)}</div>
    </div>`).join("");

  document.getElementById("results").style.display = "block";
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
}

/* ── History (in-memory session) ── */
function renderHistory() {
  const container = document.getElementById("historyList");

  if (!history.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        <p>No analyses yet. Start by analyzing your symptoms.</p>
      </div>`;
    return;
  }

  container.innerHTML = history.map(item => {
    const dc   = item.urgency === "high" ? "dot-red" : item.urgency === "medium" ? "dot-amber" : "dot-green";
    const time = item.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const pl   = item.conditions !== 1 ? "s" : "";
    return `
      <div class="chat-item" onclick="reopenResult(${item.id})">
        <div class="chat-dot ${dc}"></div>
        <div class="chat-info">
          <div class="chat-title">${esc(item.symptoms)}</div>
          <div class="chat-preview">${item.conditions} condition${pl} · ${esc(item.specialists)} · ${item.urgency} urgency</div>
        </div>
        <div class="chat-time">${time}</div>
      </div>`;
  }).join("");
}

function reopenResult(id) {
  const item = history.find(h => h.id === id);
  if (!item) return;
  showPanel("analyze", document.querySelector(".nav-item"));
  renderResult(item.result);
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
}

function filterHistory() {
  const q = document.getElementById("historySearch").value.toLowerCase();
  const filtered = history.filter(i =>
    (i.symptoms    || "").toLowerCase().includes(q) ||
    (i.specialists || "").toLowerCase().includes(q)
  );
  const container = document.getElementById("historyList");
  container.innerHTML = filtered.map(item => {
    const dc   = item.urgency === "high" ? "dot-red" : item.urgency === "medium" ? "dot-amber" : "dot-green";
    const time = item.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return `
      <div class="chat-item" onclick="reopenResult(${item.id})">
        <div class="chat-dot ${dc}"></div>
        <div class="chat-info">
          <div class="chat-title">${esc(item.symptoms)}</div>
          <div class="chat-preview">${item.conditions} condition(s) · ${esc(item.specialists)} · ${item.urgency} urgency</div>
        </div>
        <div class="chat-time">${time}</div>
      </div>`;
  }).join("");
}

/* ── Utility ── */
function esc(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Expose to HTML ── */
window.showPanel     = showPanel;
window.setTab        = setTab;
window.loadImg       = loadImg;
window.analyze       = analyze;
window.filterHistory = filterHistory;
window.reopenResult  = reopenResult;
