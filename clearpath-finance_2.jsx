import { useState, useEffect, useRef, useCallback } from "react";

/* ════════════════════════════════════════════════════════════════════════
   CLEARPATH FINANCE — ENHANCED EDITION
   Architecture: Single-file React component with logical section separation
   Security: Input sanitization, XSS protection, injection prevention
   Features: AI Chat, real weekly calc, full tx editing, custom categories
════════════════════════════════════════════════════════════════════════ */

/* ─── Security Utilities ──────────────────────────────────────────────── */
const sanitize = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
    .slice(0, 500); // max length guard
};

const sanitizeAmount = (val) => {
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
  if (isNaN(num) || num < 0 || num > 1_000_000) return null;
  return Math.round(num * 100) / 100;
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitizePrompt = (input) => {
  // Strip prompt injection patterns
  const stripped = input
    .replace(/ignore (previous|all|above|system) instructions?/gi, "")
    .replace(/you are now|pretend to be|act as|jailbreak/gi, "")
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .trim()
    .slice(0, 1000);
  return stripped;
};

/* ─── Real Weekly Calculation ─────────────────────────────────────────── */
const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
};

const getWeeklySpendByDay = (transactions) => {
  const { monday } = getWeekRange();
  const days = [0, 0, 0, 0, 0, 0, 0]; // Mon–Sun
  transactions.forEach((tx) => {
    const txDate = new Date(tx.isoDate);
    const diff = Math.floor((txDate - monday) / 86400000);
    if (diff >= 0 && diff < 7) {
      days[diff] += tx.amount;
    }
  });
  return days;
};

const parseTxDate = (dateStr) => {
  // Parse "Mar 7" into ISO using current year
  const year = new Date().getFullYear();
  const d = new Date(`${dateStr} ${year}`);
  return isNaN(d) ? new Date() : d;
};

/* ─── Initial Data ────────────────────────────────────────────────────── */
const BASE_TRANSACTIONS = [
  { id: 1, merchant: "Whole Foods Market", amount: 84.32, date: "Mar 7", isoDate: "2026-03-07", category: "Food", icon: "🛒", notes: "" },
  { id: 2, merchant: "Shell Gas Station", amount: 62.0, date: "Mar 6", isoDate: "2026-03-06", category: "Transport", icon: "⛽", notes: "" },
  { id: 3, merchant: "Amazon Purchase", amount: 47.99, date: "Mar 6", isoDate: "2026-03-06", category: "Shopping", icon: "📦", notes: "" },
  { id: 4, merchant: "Chipotle", amount: 14.5, date: "Mar 5", isoDate: "2026-03-05", category: "Food", icon: "🌯", notes: "" },
  { id: 5, merchant: "Uber Ride", amount: 22.8, date: "Mar 5", isoDate: "2026-03-05", category: "Transport", icon: "🚗", notes: "" },
  { id: 6, merchant: "Target", amount: 138.0, date: "Mar 4", isoDate: "2026-03-04", category: "Shopping", icon: "🎯", notes: "" },
  { id: 7, merchant: "Starbucks", amount: 6.75, date: "Mar 4", isoDate: "2026-03-04", category: "Food", icon: "☕", notes: "" },
  { id: 8, merchant: "Planet Fitness", amount: 10.0, date: "Mar 3", isoDate: "2026-03-03", category: "Health", icon: "🏋️", notes: "" },
  { id: 9, merchant: "Netflix", amount: 15.99, date: "Mar 3", isoDate: "2026-03-03", category: "Subscriptions", icon: "🎬", notes: "" },
  { id: 10, merchant: "Spotify", amount: 9.99, date: "Mar 3", isoDate: "2026-03-03", category: "Subscriptions", icon: "🎵", notes: "" },
];

const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food", color: "#C4A882", icon: "🍽️" },
  { id: "transport", name: "Transport", color: "#A67C52", icon: "🚗" },
  { id: "housing", name: "Housing", color: "#E8D5B7", icon: "🏠" },
  { id: "shopping", name: "Shopping", color: "#8B5E3C", icon: "🛍️" },
  { id: "entertainment", name: "Entertainment", color: "#5C3D2E", icon: "🎭" },
  { id: "health", name: "Health", color: "#6B9B6B", icon: "💊" },
  { id: "subscriptions", name: "Subscriptions", color: "#7B6B5B", icon: "📱" },
  { id: "other", name: "Other", color: "#9B8878", icon: "📌" },
];

const FINANCIAL_DATA = {
  balance: 4823.5,
  monthlyIncome: 6200,
  monthSpent: 2841.2,
  monthBudget: 3800,
  savingsGoal: 12000,
  savedSoFar: 7340,
  upcomingBills: [
    { name: "Rent", amount: 1450, due: 3, icon: "🏠" },
    { name: "Netflix", amount: 15.99, due: 7, icon: "🎬" },
    { name: "Spotify", amount: 9.99, due: 12, icon: "🎵" },
    { name: "Gym", amount: 45, due: 15, icon: "💪" },
  ],
  plans: [
    { id: 0, tag: "Flexible", title: "Save Without Sacrifice", desc: "Small weekly targets, minimal lifestyle changes.", monthly: 420, pressure: 1, color: "#C4A882" },
    { id: 1, tag: "Structured", title: "Build Real Momentum", desc: "Moderate spending limits. Reach your goal 2× faster.", monthly: 860, pressure: 2, color: "#A67C52" },
    { id: 2, tag: "Freedom", title: "Aggressive Wealth Mode", desc: "Strict targets, investment focus.", monthly: 1540, pressure: 3, color: "#5C3D2E" },
  ],
};

/* ─── Global Styles ───────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Mono:wght@300;400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { display: none; }
  body { background: #FAF7F2; }
  button { transition: opacity 0.2s, transform 0.1s; }
  button:hover { opacity: 0.88; }
  button:active { transform: scale(0.97); }
  input, textarea { outline: none; font-family: inherit; }
  .fade-in { animation: fadeIn 0.35s ease both; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .chat-bubble-in { animation: bubbleIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
  @keyframes bubbleIn { from { opacity: 0; transform: scale(0.88) translateY(10px); } to { opacity: 1; transform: none; } }
  .modal-slide { animation: slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }
`;

/* ─── Sub-components ──────────────────────────────────────────────────── */
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setDisplay((1 - Math.pow(1 - p, 3)) * value);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span>{prefix}{display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

function DonutChart({ categories }) {
  const [hovered, setHovered] = useState(null);
  const size = 160, r = 60, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = categories.map((c) => {
    const dash = (c.pct / 100) * circ;
    const s = { ...c, dash, gap: circ - dash, offset };
    offset += dash;
    return s;
  });
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
            strokeWidth={hovered === i ? 26 : 22}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            style={{ transition: "all 0.4s ease", cursor: "pointer" }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
        ))}
      </svg>
      {hovered !== null && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#2C1A0E", fontWeight: 400 }}>{segs[hovered]?.name}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>{segs[hovered]?.pct}%</div>
        </div>
      )}
    </div>
  );
}

function SparkBar({ values, highlightToday = true }) {
  const max = Math.max(...values, 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
      {values.map((v, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: i === todayIdx ? "#A67C52" : "#C4A882", letterSpacing: 0 }}>
            {v > 0 ? `$${Math.round(v)}` : ""}
          </div>
          <div style={{
            width: "100%", height: `${(v / max) * 54}px`, minHeight: v > 0 ? 4 : 0,
            background: i === todayIdx && highlightToday ? "linear-gradient(180deg, #A67C52, #C4A882)" : "#E8D5B7",
            borderRadius: "4px 4px 2px 2px",
            transition: `height 0.8s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.06}s`
          }} />
          <span style={{ fontSize: 8, color: i === todayIdx ? "#A67C52" : "#9B8878", fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 46, height: 26, borderRadius: 13, border: "none",
      background: value ? "#A67C52" : "#E8D5B7", cursor: "pointer",
      position: "relative", transition: "background 0.3s", flexShrink: 0
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: value ? 23 : 3,
        transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)"
      }} />
    </button>
  );
}

function PressureDots({ level }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3].map((l) => (
        <div key={l} style={{ width: 8, height: 8, borderRadius: "50%", background: l <= level ? "#5C3D2E" : "#E8D5B7" }} />
      ))}
    </div>
  );
}

function ModalOverlay({ onClose, children, center = false }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(44,26,14,0.65)", zIndex: 200,
      display: "flex", alignItems: center ? "center" : "flex-end", justifyContent: "center",
      backdropFilter: "blur(2px)"
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="modal-slide" style={{
        background: "#FAF7F2", borderRadius: center ? 20 : "20px 20px 0 0",
        width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto",
        padding: "28px 24px 44px", boxShadow: "0 -8px 60px rgba(44,26,14,0.25)"
      }}>
        {!center && <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E8D5B7", margin: "0 auto 24px" }} />}
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   TRANSACTION EDIT MODAL — Full editing with validation
════════════════════════════════════════════════════════════════════════ */
function TransactionModal({ tx, categories, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    merchant: tx.merchant,
    amount: tx.amount,
    category: tx.category,
    date: tx.isoDate,
    notes: tx.notes || "",
  });
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!sanitize(form.merchant)) errs.merchant = "Merchant name required";
    if (sanitizeAmount(form.amount) === null) errs.amount = "Enter a valid amount (0–1,000,000)";
    if (!form.date) errs.date = "Date required";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const amount = sanitizeAmount(form.amount);
    const dateObj = new Date(form.date);
    const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    onSave({ ...tx, merchant: sanitize(form.merchant), amount, category: form.category, isoDate: form.date, date: dateStr, notes: sanitize(form.notes) });
  };

  const inputStyle = (hasErr) => ({
    width: "100%", padding: "13px 16px", borderRadius: 10,
    border: `2px solid ${hasErr ? "#E07060" : "#E8D5B7"}`,
    background: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 14,
    color: "#2C1A0E"
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2C1A0E", marginBottom: 4 }}>Edit Transaction</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 24 }}>MAKE CORRECTIONS BELOW</div>

      {[
        { label: "Merchant Name", key: "merchant", type: "text" },
        { label: "Amount ($)", key: "amount", type: "number" },
        { label: "Date", key: "date", type: "date" },
      ].map(({ label, key, type }) => (
        <div key={key} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
          <input type={type} value={form[key]} onChange={set(key)} style={inputStyle(errors[key])} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} />
          {errors[key] && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#E07060", marginTop: 4 }}>{errors[key]}</div>}
        </div>
      ))}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>Category</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setForm((f) => ({ ...f, category: c.name }))} style={{
              padding: "8px 14px", borderRadius: 20,
              border: form.category === c.name ? "2px solid #A67C52" : "2px solid #E8D5B7",
              background: form.category === c.name ? "#FBF3EA" : "#fff",
              fontFamily: "'DM Mono', monospace", fontSize: 11,
              color: form.category === c.name ? "#5C3D2E" : "#9B8878", cursor: "pointer"
            }}>{c.icon} {c.name}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Notes (optional)</div>
        <textarea value={form.notes} onChange={set("notes")} rows={2} maxLength={300} style={{ ...inputStyle(false), resize: "none" }} placeholder="Add a note…" />
      </div>

      <button onClick={handleSave} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "#5C3D2E", color: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase", marginBottom: 12 }}>
        Save Changes ✓
      </button>

      {!confirmDelete ? (
        <button onClick={() => setConfirmDelete(true)} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "2px solid #F0EAE0", background: "transparent", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#C4A882", cursor: "pointer", textTransform: "uppercase" }}>
          Delete Transaction
        </button>
      ) : (
        <div style={{ background: "#FBF3EA", borderRadius: 12, padding: "16px", border: "1px solid #E8D5B7" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#5C3D2E", marginBottom: 12, textAlign: "center" }}>Delete this transaction permanently?</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => onDelete(tx.id)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#A67C52", color: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: "pointer" }}>Yes, delete</button>
            <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "2px solid #E8D5B7", background: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ADD TRANSACTION MODAL
════════════════════════════════════════════════════════════════════════ */
function AddTransactionModal({ categories, onSave, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ merchant: "", amount: "", category: categories[0]?.name || "Other", date: today, notes: "" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    const errs = {};
    if (!sanitize(form.merchant)) errs.merchant = "Merchant name required";
    if (sanitizeAmount(form.amount) === null) errs.amount = "Enter a valid amount";
    if (!form.date) errs.date = "Date required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const amount = sanitizeAmount(form.amount);
    const dateObj = new Date(form.date);
    const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const catObj = categories.find(c => c.name === form.category);
    onSave({ id: Date.now(), merchant: sanitize(form.merchant), amount, category: form.category, isoDate: form.date, date: dateStr, notes: sanitize(form.notes), icon: catObj?.icon || "📌" });
  };

  const inputStyle = (hasErr) => ({ width: "100%", padding: "13px 16px", borderRadius: 10, border: `2px solid ${hasErr ? "#E07060" : "#E8D5B7"}`, background: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#2C1A0E" });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2C1A0E", marginBottom: 4 }}>Add Transaction</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 24 }}>MANUAL ENTRY</div>
      {[{ label: "Merchant Name", key: "merchant", type: "text" }, { label: "Amount ($)", key: "amount", type: "number" }, { label: "Date", key: "date", type: "date" }].map(({ label, key, type }) => (
        <div key={key} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
          <input type={type} value={form[key]} onChange={set(key)} style={inputStyle(errors[key])} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} />
          {errors[key] && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#E07060", marginTop: 4 }}>{errors[key]}</div>}
        </div>
      ))}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>Category</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.name }))} style={{ padding: "8px 14px", borderRadius: 20, border: form.category === c.name ? "2px solid #A67C52" : "2px solid #E8D5B7", background: form.category === c.name ? "#FBF3EA" : "#fff", fontFamily: "'DM Mono', monospace", fontSize: 11, color: form.category === c.name ? "#5C3D2E" : "#9B8878", cursor: "pointer" }}>{c.icon} {c.name}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Notes</div>
        <textarea value={form.notes} onChange={set("notes")} rows={2} maxLength={300} style={{ ...inputStyle(false), resize: "none" }} placeholder="Optional note…" />
      </div>
      <button onClick={handleSave} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "#5C3D2E", color: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" }}>
        Add Transaction ✓
      </button>
    </ModalOverlay>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   CUSTOM CATEGORIES MODAL
════════════════════════════════════════════════════════════════════════ */
function CategoriesModal({ categories, onChange, onClose }) {
  const [cats, setCats] = useState(categories);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📌");
  const [newColor, setNewColor] = useState("#C4A882");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const ICON_OPTIONS = ["🍽️", "🚗", "🏠", "🛍️", "🎭", "💊", "📱", "📌", "✈️", "🎓", "💼", "🐾", "🎮", "☕", "🌿", "💡"];
  const COLOR_OPTIONS = ["#C4A882", "#A67C52", "#E8D5B7", "#8B5E3C", "#5C3D2E", "#6B9B6B", "#7B6B5B", "#9B8878", "#D4A882", "#B87A5A"];

  const addCategory = () => {
    const name = sanitize(newName);
    if (!name || cats.find(c => c.name.toLowerCase() === name.toLowerCase())) return;
    const updated = [...cats, { id: Date.now().toString(), name, color: newColor, icon: newIcon }];
    setCats(updated); setNewName(""); setNewIcon("📌"); setNewColor("#C4A882");
  };

  const deleteCategory = (id) => {
    if (DEFAULT_CATEGORIES.find(c => c.id === id)) return; // protect defaults
    setCats(cats.filter(c => c.id !== id));
  };

  const saveEdit = (id) => {
    const name = sanitize(editName);
    if (!name) return;
    setCats(cats.map(c => c.id === id ? { ...c, name } : c));
    setEditing(null);
  };

  return (
    <ModalOverlay onClose={() => { onChange(cats); onClose(); }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2C1A0E", marginBottom: 4 }}>Custom Categories</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 20 }}>MANAGE YOUR SPENDING CATEGORIES</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {cats.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: "#fff", border: "1px solid #F0EAE0" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{c.icon}</div>
            {editing === c.id ? (
              <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit(c.id)} style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "2px solid #A67C52", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }} autoFocus />
            ) : (
              <span style={{ flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#2C1A0E" }}>{c.name}</span>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {editing === c.id ? (
                <button onClick={() => saveEdit(c.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#A67C52", color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: "pointer" }}>Save</button>
              ) : (
                <button onClick={() => { setEditing(c.id); setEditName(c.name); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E8D5B7", background: "transparent", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", cursor: "pointer" }}>Edit</button>
              )}
              {!DEFAULT_CATEGORIES.find(d => d.id === c.id) && (
                <button onClick={() => deleteCategory(c.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #F0EAE0", background: "transparent", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C4A882", cursor: "pointer" }}>✕</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#FBF3EA", borderRadius: 16, padding: 20, border: "1px solid #E8D5B7" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>Add New Category</div>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" maxLength={30} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "2px solid #E8D5B7", background: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#2C1A0E", marginBottom: 12 }} />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#9B8878", marginBottom: 8, letterSpacing: 1 }}>ICON</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {ICON_OPTIONS.map(ic => (
            <button key={ic} onClick={() => setNewIcon(ic)} style={{ width: 36, height: 36, borderRadius: 8, border: newIcon === ic ? "2px solid #A67C52" : "2px solid #E8D5B7", background: newIcon === ic ? "#FBF3EA" : "#fff", fontSize: 16, cursor: "pointer" }}>{ic}</button>
          ))}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#9B8878", marginBottom: 8, letterSpacing: 1 }}>COLOR</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {COLOR_OPTIONS.map(col => (
            <button key={col} onClick={() => setNewColor(col)} style={{ width: 28, height: 28, borderRadius: "50%", border: newColor === col ? "3px solid #2C1A0E" : "2px solid transparent", background: col, cursor: "pointer" }} />
          ))}
        </div>
        <button onClick={addCategory} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "#5C3D2E", color: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" }}>
          + Add Category
        </button>
      </div>

      <button onClick={() => { onChange(cats); onClose(); }} style={{ width: "100%", padding: "15px", borderRadius: 12, border: "2px solid #E8D5B7", background: "transparent", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#5C3D2E", letterSpacing: 2, cursor: "pointer", textTransform: "uppercase", marginTop: 16 }}>
        Done ✓
      </button>
    </ModalOverlay>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   AI CHAT ASSISTANT
   Improvements:
   ① Updated model strings (claude-sonnet-4-6 / claude-haiku-4-5-20251001)
   ② Smart model routing — Haiku for simple queries, Sonnet for complex
   ③ Prompt caching via cache_control on the static system prompt block
   ④ Streaming responses for instant perceived speed
   ⑤ Extended thinking for deep financial analysis questions
════════════════════════════════════════════════════════════════════════ */

/* ─── Model Config ────────────────────────────────────────────────────── */
const MODELS = {
  fast: "claude-haiku-4-5-20251001",    // Simple lookups — cheapest & fastest
  smart: "claude-sonnet-4-6",            // Balanced production conversations
};

/* ─── Query Classifier — routes to cheapest capable model ────────────── */
const classifyQuery = (text) => {
  const deep = [
    "analyz", "strateg", "recommend", "project", "trend", "anomal",
    "invest", "plan", "compare", "explain", "why", "how much", "should i",
    "forecast", "optimize", "report", "breakdown", "detail",
  ];
  const lower = text.toLowerCase();
  const isComplex = deep.some(kw => lower.includes(kw)) || text.length > 80;
  return {
    model: isComplex ? MODELS.smart : MODELS.fast,
    useThinking: isComplex && text.length > 60,  // Extended thinking for deep Qs
    label: isComplex ? "Deep Analysis" : "Quick Answer",
  };
};

/* ─── Financial Context Builder — aggregate only, never raw data ──────── */
function buildFinancialContext(transactions, categories, financialData) {
  const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);
  const byCat = {};
  transactions.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const weeklySpend = getWeeklySpendByDay(transactions);
  const weekTotal = weeklySpend.reduce((s, v) => s + v, 0);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return {
    totalTransactions: transactions.length,
    totalSpentThisMonth: Math.round(totalSpent * 100) / 100,
    monthlyBudget: financialData.monthBudget,
    budgetUsedPct: Math.round((totalSpent / financialData.monthBudget) * 100),
    remainingBudget: Math.round((financialData.monthBudget - totalSpent) * 100) / 100,
    topCategory: topCat ? { name: topCat[0], amount: Math.round(topCat[1] * 100) / 100 } : null,
    categoryBreakdown: Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 })),
    weeklySpendByDay: weeklySpend.map((v, i) => ({ day: dayNames[i], amount: Math.round(v * 100) / 100 })),
    weeklyTotal: Math.round(weekTotal * 100) / 100,
    savingsGoal: financialData.savingsGoal,
    savedSoFar: financialData.savedSoFar,
    savingsPct: Math.round((financialData.savedSoFar / financialData.savingsGoal) * 100),
    remainingToGoal: financialData.savingsGoal - financialData.savedSoFar,
    monthlyIncome: financialData.monthlyIncome,
    netMonthly: financialData.monthlyIncome - totalSpent,
  };
}

/* ─── Static System Prompt — built once and cached by the API ────────── */
function buildSystemPrompt(ctx) {
  return `You are a warm, expert personal financial assistant embedded in the Clearpath finance app.

FINANCIAL SUMMARY (aggregate data only — no raw account details):
${JSON.stringify(ctx, null, 2)}

RESPONSE RULES:
- Be concise (under 200 words), warm, and specific — cite real numbers from the summary above.
- Give actionable advice with concrete next steps.
- Never request sensitive info (account numbers, SSN, passwords, PINs).
- Never make definitive predictions about markets or returns.
- Format key figures with $ and % for clarity.
- If the user asks something outside finance, gently redirect.`;
}

/* ─── Streaming fetch helper ─────────────────────────────────────────── */
async function streamMessage({ systemPrompt, messages, model, useThinking, onChunk, onDone, onError }) {
  try {
    const body = {
      model,
      max_tokens: useThinking ? 8000 : 1000,
      stream: true,
      // ③ Prompt caching — static system prompt block is cached after first call
      // Cache hits cost ~10% of normal input price
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        }
      ],
      messages,
    };

    // ⑤ Extended thinking for complex financial questions
    if (useThinking) {
      body.thinking = { type: "enabled", budget_tokens: 3000 };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }

    // ④ Stream reader — updates UI token-by-token
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assembled = "";
    let inThinkingBlock = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        try {
          const evt = JSON.parse(raw);

          // Track thinking vs text blocks to skip internal reasoning in UI
          if (evt.type === "content_block_start") {
            inThinkingBlock = evt.content_block?.type === "thinking";
          }
          if (evt.type === "content_block_stop") {
            inThinkingBlock = false;
          }

          // Only stream visible text deltas
          if (evt.type === "content_block_delta" && !inThinkingBlock) {
            const delta = evt.delta?.text || evt.delta?.partial_json || "";
            assembled += delta;
            onChunk(assembled);
          }
        } catch {
          // Malformed SSE line — skip
        }
      }
    }

    onDone(assembled || "I couldn't generate a response. Please try again.");
  } catch (err) {
    onError(err.message || "Connection issue. Please try again.");
  }
}

/* ─── AI Chat Panel Component ─────────────────────────────────────────── */
function AIChatPanel({ transactions, categories, financialData, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your Clearpath AI advisor. I can analyze your spending, project your savings timeline, flag unusual patterns, and suggest strategies tailored to your data. What would you like to explore?",
      meta: null,
    }
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);    // true while response generating
  const [streamingText, setStreamingText] = useState(""); // live text accumulator
  const [currentMeta, setCurrentMeta] = useState(null);  // model used for in-progress msg
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const QUICK_PROMPTS = [
    "How am I doing this week?",
    "Where can I cut spending?",
    "When will I hit my savings goal?",
    "Analyze my spending patterns",
  ];

  const sendMessage = async (text) => {
    const userText = sanitizePrompt(text || input);
    if (!userText || streaming) return;
    setInput("");

    // Build conversation history (strip meta field for API)
    const history = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userText },
    ];

    setMessages(prev => [...prev, { role: "user", content: userText, meta: null }]);
    setStreaming(true);
    setStreamingText("");

    // ② Route to cheapest capable model
    const { model, useThinking, label } = classifyQuery(userText);
    setCurrentMeta({ model, label });

    const ctx = buildFinancialContext(transactions, categories, financialData);
    const systemPrompt = buildSystemPrompt(ctx);

    await streamMessage({
      systemPrompt,
      messages: history,
      model,
      useThinking,
      onChunk: (text) => setStreamingText(text),
      onDone: (finalText) => {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: finalText, meta: { model, label } },
        ]);
        setStreamingText("");
        setStreaming(false);
        setCurrentMeta(null);
        inputRef.current?.focus();
      },
      onError: (errMsg) => {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: `⚠️ ${errMsg}`, meta: null },
        ]);
        setStreamingText("");
        setStreaming(false);
        setCurrentMeta(null);
      },
    });
  };

  // Model badge colours
  const modelBadge = (meta) => {
    if (!meta) return null;
    const isDeep = meta.model === MODELS.smart;
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        marginTop: 6, padding: "2px 8px", borderRadius: 10,
        background: isDeep ? "#FBF3EA" : "#F0F5EE",
        border: `1px solid ${isDeep ? "#E8D5B7" : "#D0DFD0"}`,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: isDeep ? "#A67C52" : "#6B9B6B" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: isDeep ? "#A67C52" : "#6B9B6B", letterSpacing: 1, textTransform: "uppercase" }}>
          {meta.label}
        </span>
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", background: "#FAF7F2", maxWidth: 480, margin: "0 auto" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Header ── */}
      <div style={{ background: "#2C1A0E", padding: "20px 24px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 3, textTransform: "uppercase" }}>AI Assistant</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#FAF7F2", marginTop: 2 }}>Clearpath Intelligence</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.1)", color: "#E8D5B7", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Quick prompts */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, overflowX: "auto", paddingBottom: 2 }}>
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)} disabled={streaming} style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 20, border: "1px solid rgba(228,213,183,0.3)", background: "rgba(228,213,183,0.08)", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C4A882", cursor: streaming ? "default" : "pointer", whiteSpace: "nowrap", letterSpacing: 0.5, opacity: streaming ? 0.5 : 1 }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((m, i) => (
          <div key={i} className="chat-bubble-in" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2C1A0E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 10, flexShrink: 0, alignSelf: "flex-end" }}>✦</div>
            )}
            <div style={{ maxWidth: "78%" }}>
              <div style={{
                padding: "12px 16px",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? "#2C1A0E" : "#fff",
                border: m.role === "assistant" ? "1px solid #F0EAE0" : "none",
                fontFamily: "'Georgia', serif", fontSize: 14, lineHeight: 1.65,
                color: m.role === "user" ? "#FAF7F2" : "#2C1A0E",
                boxShadow: "0 1px 8px rgba(44,26,14,0.07)",
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
              {m.role === "assistant" && modelBadge(m.meta)}
            </div>
          </div>
        ))}

        {/* ④ Live streaming bubble */}
        {streaming && (
          <div className="chat-bubble-in" style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2C1A0E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 10, flexShrink: 0, alignSelf: "flex-end" }}>✦</div>
            <div style={{ maxWidth: "78%" }}>
              <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "#fff", border: "1px solid #F0EAE0", fontFamily: "'Georgia', serif", fontSize: 14, lineHeight: 1.65, color: "#2C1A0E", boxShadow: "0 1px 8px rgba(44,26,14,0.07)", minWidth: 60, whiteSpace: "pre-wrap" }}>
                {streamingText || (
                  // Thinking dots while waiting for first token
                  <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "2px 0" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#C4A882", animation: `bounce 1s ease ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                )}
                {streamingText && <span style={{ display: "inline-block", width: 2, height: 14, background: "#C4A882", marginLeft: 2, verticalAlign: "text-bottom", animation: "blink 0.8s step-end infinite" }} />}
              </div>
              {currentMeta && modelBadge(currentMeta)}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div style={{ padding: "12px 16px 24px", background: "#fff", borderTop: "1px solid #F0EAE0", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask me anything about your finances…"
            rows={1}
            maxLength={1000}
            disabled={streaming}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 14, border: "2px solid #E8D5B7", background: "#FAF7F2", fontFamily: "'Georgia', serif", fontSize: 14, color: "#2C1A0E", resize: "none", lineHeight: 1.4, opacity: streaming ? 0.6 : 1 }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={streaming || !input.trim()}
            style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: (!streaming && input.trim()) ? "#5C3D2E" : "#E8D5B7", color: "#FAF7F2", fontSize: 18, cursor: (!streaming && input.trim()) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}
          >
            {streaming ? "…" : "↑"}
          </button>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#C4A882", marginTop: 8, textAlign: "center", letterSpacing: 0.5 }}>
          Smart routing: simple queries → Haiku · deep analysis → Sonnet · responses streamed live
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   BANK MODAL
════════════════════════════════════════════════════════════════════════ */
function BankModal({ onClose, onConnect }) {
  const [step, setStep] = useState(0);
  const [selectedBank, setSelectedBank] = useState(null);
  const banks = [{ name: "Chase", icon: "🏦" }, { name: "Bank of America", icon: "🏛️" }, { name: "Wells Fargo", icon: "🏠" }, { name: "Citi", icon: "🌐" }, { name: "Capital One", icon: "💳" }];

  return (
    <ModalOverlay onClose={step < 2 ? onClose : undefined}>
      {step === 0 && <>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2C1A0E", marginBottom: 4 }}>Connect Your Bank</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 16 }}>POWERED BY PLAID · 256-BIT ENCRYPTION</div>
        <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#6B5B4E", lineHeight: 1.6, marginBottom: 20 }}>Securely link your account. We never store banking credentials.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {banks.map((b) => (
            <button key={b.name} onClick={() => { setSelectedBank(b.name); setStep(1); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, border: "2px solid #E8D5B7", background: "#fff", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 20 }}>{b.icon}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#2C1A0E" }}>{b.name}</span>
            </button>
          ))}
        </div>
      </>}
      {step === 1 && <>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2C1A0E", marginBottom: 4 }}>Secure Authentication</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 20 }}>{selectedBank?.toUpperCase()} · SECURE PORTAL</div>
        <div style={{ background: "#FBF3EA", borderRadius: 14, padding: "20px", border: "1px solid #E8D5B7", marginBottom: 20 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#A67C52", letterSpacing: 1, marginBottom: 8 }}>🔒 SECURE REDIRECT</div>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#5C3D2E", lineHeight: 1.6 }}>You'll be redirected to {selectedBank}'s authentication. Clearpath never sees your banking password.</div>
        </div>
        <button onClick={() => setStep(2)} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "#5C3D2E", color: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase", marginBottom: 10 }}>
          Proceed to {selectedBank} →
        </button>
      </>}
      {step === 2 && <>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2C1A0E", marginBottom: 8 }}>{selectedBank} Connected!</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B9B6B", letterSpacing: 1, marginBottom: 24 }}>ACCOUNT LINKED SUCCESSFULLY</div>
          <button onClick={() => { onConnect(selectedBank); onClose(); }} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "#5C3D2E", color: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" }}>
            Back to App ✓
          </button>
        </div>
      </>}
    </ModalOverlay>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   LOGIN SCREEN
════════════════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    const cleanEmail = sanitize(email);
    if (!cleanEmail || !password) { setError("Please enter your email and password."); return; }
    if (!validateEmail(cleanEmail)) { setError("Enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ name: cleanEmail.split("@")[0], email: cleanEmail }); }, 600);
  };

  const inputStyle = { width: "100%", padding: "13px 16px", borderRadius: 10, border: "2px solid #E8D5B7", background: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#2C1A0E", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#A67C52", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", marginBottom: 8 }}>Clearpath Finance</div>
          <div style={{ width: 32, height: 2, background: "#A67C52", margin: "0 auto 16px" }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2C1A0E" }}>Welcome back</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", boxShadow: "0 4px 40px rgba(90,60,30,0.08)", border: "1px solid #F0EAE0" }}>
          <button onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); onLogin({ name: "Alex", email: "alex@example.com" }); }, 900); }}
            style={{ width: "100%", padding: "16px", borderRadius: 14, border: "2px solid #E8D5B7", background: "#FAF7F2", cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔐</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#5C3D2E", letterSpacing: 1 }}>USE FACE ID / FINGERPRINT</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#F0EAE0" }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C4A882", letterSpacing: 1 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#F0EAE0" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Email Address</div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@example.com" style={inputStyle} autoComplete="email" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Password</div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} autoComplete="current-password" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>
          {error && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#E07060", marginBottom: 14 }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "#5C3D2E", color: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing In…" : "Sign In →"}
          </button>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878" }}>Don't have an account? </span>
            <button onClick={onGoSignup} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#A67C52", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Create one</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SIGNUP SCREEN
════════════════════════════════════════════════════════════════════════ */
function SignupScreen({ onSignup, onGoLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    const name = sanitize(form.name);
    const email = sanitize(form.email);
    if (!name || !email || !form.password) { setError("All fields are required."); return; }
    if (!validateEmail(email)) { setError("Enter a valid email address."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    onSignup({ name, email });
  };

  const inputStyle = { width: "100%", padding: "13px 16px", borderRadius: 10, border: "2px solid #E8D5B7", background: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#2C1A0E", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#A67C52", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", marginBottom: 8 }}>Clearpath Finance</div>
          <div style={{ width: 32, height: 2, background: "#A67C52", margin: "0 auto 16px" }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2C1A0E" }}>Create your account</div>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#9B8878", marginTop: 8 }}>Your financial journey starts here</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", boxShadow: "0 4px 40px rgba(90,60,30,0.08)", border: "1px solid #F0EAE0" }}>
          {[{ key: "name", label: "Full Name", type: "text", placeholder: "Alex Morgan" }, { key: "email", label: "Email Address", type: "email", placeholder: "alex@example.com" }, { key: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" }, { key: "confirm", label: "Confirm Password", type: "password", placeholder: "Repeat your password" }].map(({ key, label, type, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
              <input type={type} value={form[key]} onChange={set(key)} placeholder={placeholder} style={inputStyle} />
            </div>
          ))}
          {error && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#E07060", marginBottom: 14 }}>{error}</div>}
          <button onClick={handleSubmit} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "#5C3D2E", color: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase", marginTop: 4 }}>
            Create Account →
          </button>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878" }}>Already have an account? </span>
            <button onClick={onGoLogin} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#A67C52", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ONBOARDING
════════════════════════════════════════════════════════════════════════ */
function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const questions = [
    { key: "income", q: "What's your monthly income (after tax)?", opts: ["Under $3,000", "$3,000–$5,000", "$5,000–$8,000", "Over $8,000"] },
    { key: "goal", q: "What's your primary financial goal?", opts: ["Emergency fund", "Pay off debt", "Buy a home", "Build wealth"] },
    { key: "habits", q: "How would you describe your spending?", opts: ["Very disciplined", "Usually controlled", "Sometimes impulsive", "Working on it"] },
    { key: "budget", q: "Do you currently track a budget?", opts: ["Yes, strictly", "Loosely", "Not really", "Starting now"] },
  ];
  const q = questions[step];

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#A67C52", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", marginBottom: 8 }}>Step {step + 1} of {questions.length}</div>
          <div style={{ width: "100%", height: 3, background: "#F0EAE0", borderRadius: 2, marginBottom: 24 }}>
            <div style={{ height: "100%", width: `${((step + 1) / questions.length) * 100}%`, background: "#A67C52", borderRadius: 2, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#2C1A0E", lineHeight: 1.3 }}>{q.q}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {q.opts.map((opt) => (
            <button key={opt} onClick={() => {
              const next = { ...answers, [q.key]: opt };
              setAnswers(next);
              if (step < questions.length - 1) setStep(s => s + 1);
              else onComplete(next);
            }} style={{ padding: "18px 24px", borderRadius: 14, border: "2px solid #E8D5B7", background: "#fff", fontFamily: "'Georgia', serif", fontSize: 15, color: "#2C1A0E", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════════════════════════════════ */
function MainApp({ user, onLogout }) {
  const [tab, setTab] = useState(0);
  const [transactions, setTransactions] = useState(BASE_TRANSACTIONS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [editingTx, setEditingTx] = useState(null);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showCatsModal, setShowCatsModal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [connectedBanks, setConnectedBanks] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [recentlyCorrected, setRecentlyCorrected] = useState([]);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [aiNotifications, setAiNotifications] = useState(true);
  const [profileData, setProfileData] = useState({ name: user?.name || "Alex", email: user?.email || "alex@example.com" });

  const displayName = profileData.name ? profileData.name.charAt(0).toUpperCase() + profileData.name.slice(1) : "Alex";
  const savingsPct = Math.round((FINANCIAL_DATA.savedSoFar / FINANCIAL_DATA.savingsGoal) * 100);
  const budgetPct = Math.round((FINANCIAL_DATA.monthSpent / FINANCIAL_DATA.monthBudget) * 100);

  // Real weekly spend
  const weeklySpend = getWeeklySpendByDay(transactions);
  const weekTotal = weeklySpend.reduce((s, v) => s + v, 0);
  const maxDayIdx = weeklySpend.indexOf(Math.max(...weeklySpend));
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Category spending from transactions
  const categoryTotals = {};
  transactions.forEach(t => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount; });
  const totalSpent = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
  const dynamicCategories = categories.map(c => ({
    ...c, amount: categoryTotals[c.name] || 0,
    pct: totalSpent > 0 ? Math.round(((categoryTotals[c.name] || 0) / totalSpent) * 100) : 0
  })).filter(c => c.amount > 0);

  const handleSaveTx = (updated) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    setRecentlyCorrected(prev => [...new Set([...prev, updated.id])]);
    setEditingTx(null);
  };

  const handleDeleteTx = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setEditingTx(null);
  };

  const handleAddTx = (tx) => {
    setTransactions(prev => [tx, ...prev]);
    setShowAddTx(false);
  };

  const TABS = ["Home", "Spend", "Save", "Insights", "Profile"];
  const TAB_ICONS = ["◈", "◉", "◎", "◐", "○"];

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", fontFamily: "'Georgia', serif", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Modals */}
      {editingTx && <TransactionModal tx={editingTx} categories={categories} onSave={handleSaveTx} onDelete={handleDeleteTx} onClose={() => setEditingTx(null)} />}
      {showAddTx && <AddTransactionModal categories={categories} onSave={handleAddTx} onClose={() => setShowAddTx(false)} />}
      {showBankModal && <BankModal onClose={() => setShowBankModal(false)} onConnect={(bank) => setConnectedBanks(b => [...new Set([...b, bank])])} />}
      {showCatsModal && <CategoriesModal categories={categories} onChange={setCategories} onClose={() => setShowCatsModal(false)} />}
      {showAI && <AIChatPanel transactions={transactions} categories={categories} financialData={FINANCIAL_DATA} onClose={() => setShowAI(false)} />}

      {/* Header */}
      <div style={{ background: "#2C1A0E", padding: "18px 24px 0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#A67C52", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>Clearpath</div>
            <div style={{ fontFamily: "'Playfair Display', serif", color: "#FAF7F2", fontSize: 17, marginTop: 2 }}>
              {tab === 0 ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${displayName}` :
               tab === 1 ? "Spending" : tab === 2 ? "Savings" : tab === 3 ? "Insights" : "Profile"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setShowAI(true)} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(166,124,82,0.3)", color: "#E8D5B7", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="AI Assistant">✦</button>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#A67C52", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", color: "#FAF7F2", fontSize: 15, cursor: "pointer" }} onClick={() => setTab(4)}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ flex: 1, padding: "10px 2px", border: "none", background: "transparent", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, color: tab === i ? "#E8D5B7" : "#6B5B4E", textTransform: "uppercase", cursor: "pointer", borderBottom: tab === i ? "2px solid #A67C52" : "2px solid transparent", transition: "all 0.2s ease" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "22px 20px 100px" }} className="fade-in">

        {/* ── HOME / DASHBOARD ── */}
        {tab === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Balance card */}
            <div style={{ background: "#2C1A0E", borderRadius: 20, padding: "28px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -20, top: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(166,124,82,0.12)" }} />
              <div style={{ position: "absolute", right: 30, bottom: -30, width: 90, height: 90, borderRadius: "50%", background: "rgba(166,124,82,0.06)" }} />
              <div style={{ fontSize: 10, color: "#A67C52", fontFamily: "'DM Mono', monospace", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Current Balance</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, color: "#FAF7F2", marginBottom: 4 }}>
                <AnimatedNumber value={FINANCIAL_DATA.balance} prefix="$" decimals={2} />
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B5B4E" }}>↑ $340 more saved than last month</div>
              <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
                {[{ label: "Monthly In", val: `$${FINANCIAL_DATA.monthlyIncome.toLocaleString()}` }, { label: "Monthly Out", val: `$${FINANCIAL_DATA.monthSpent.toLocaleString()}` }].map((s) => (
                  <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontSize: 9, color: "#6B5B4E", fontFamily: "'DM Mono', monospace", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: "#E8D5B7" }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>Monthly Budget</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: budgetPct > 80 ? "#A67C52" : "#9B8878" }}>{budgetPct}% used</div>
              </div>
              <div style={{ height: 8, background: "#F0EAE0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(budgetPct, 100)}%`, background: budgetPct > 85 ? "linear-gradient(90deg, #A67C52, #C4A882)" : "#C4A882", transition: "width 1.2s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878" }}>${FINANCIAL_DATA.monthSpent.toLocaleString()} spent</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878" }}>${FINANCIAL_DATA.monthBudget.toLocaleString()} limit</div>
              </div>
            </div>

            {/* Real This Week */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>This Week</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52" }}>${weekTotal.toFixed(0)} total</div>
              </div>
              <SparkBar values={weeklySpend} highlightToday />
              {weekTotal > 0 && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", marginTop: 12, letterSpacing: 0.5 }}>
                  {dayNames[maxDayIdx].toUpperCase()} WAS YOUR HIGHEST SPEND DAY — ${Math.max(...weeklySpend).toFixed(0)}
                </div>
              )}
              {weekTotal === 0 && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C4A882", marginTop: 12 }}>No transactions this week yet</div>
              )}
            </div>

            {/* Upcoming Bills */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E", marginBottom: 14 }}>Upcoming Bills</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {FINANCIAL_DATA.upcomingBills.map((b) => (
                  <div key={b.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{b.icon}</div>
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#2C1A0E" }}>{b.name}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: b.due <= 3 ? "#A67C52" : "#C4A882" }}>Due in {b.due} days</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>${b.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insight CTA */}
            <button onClick={() => setShowAI(true)} style={{ background: "#2C1A0E", borderRadius: 16, padding: "18px 20px", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>✦ Ask Your AI Advisor</div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#E8D5B7", lineHeight: 1.6 }}>
                Get personalized spending analysis, savings strategies, and financial Q&A. Tap to open your assistant →
              </div>
            </button>
          </div>
        )}

        {/* ── SPENDING ── */}
        {tab === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#2C1A0E", borderRadius: 20, padding: "24px", display: "flex", alignItems: "center", gap: 24 }}>
              <DonutChart categories={dynamicCategories.length > 0 ? dynamicCategories : [{ name: "No Data", pct: 100, color: "#E8D5B7" }]} />
              <div>
                <div style={{ fontSize: 10, color: "#A67C52", fontFamily: "'DM Mono', monospace", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Total spent</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#FAF7F2" }}>${totalSpent.toFixed(0)}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6B5B4E", marginTop: 4 }}>
                  {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>By Category</div>
                <button onClick={() => setShowCatsModal(true)} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#A67C52", background: "none", border: "1px solid #E8D5B7", borderRadius: 8, padding: "4px 10px", cursor: "pointer", letterSpacing: 1 }}>MANAGE</button>
              </div>
              {dynamicCategories.length === 0 && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#9B8878" }}>No transactions yet.</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {dynamicCategories.sort((a, b) => b.amount - a.amount).map((c) => (
                  <div key={c.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{c.icon}</span>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>{c.name}</div>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878" }}>{c.pct}%</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>${c.amount.toFixed(2)}</div>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#F0EAE0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${c.pct}%`, background: c.color, transition: "width 1s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>Transactions</div>
                <button onClick={() => setShowAddTx(true)} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#5C3D2E", background: "#FBF3EA", border: "1px solid #E8D5B7", borderRadius: 8, padding: "5px 12px", cursor: "pointer", letterSpacing: 1 }}>+ ADD</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {transactions.length === 0 && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#9B8878", padding: "12px 0" }}>No transactions. Add one above.</div>}
                {transactions.map((tx) => (
                  <button key={tx.id} onClick={() => setEditingTx(tx)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 10px", borderRadius: 10, border: "none", background: recentlyCorrected.includes(tx.id) ? "#F0F5EE" : "transparent", cursor: "pointer", transition: "background 0.2s", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, border: "1px solid #F0EAE0", flexShrink: 0 }}>{tx.icon}</div>
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>{tx.merchant}</div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#fff", background: categories.find(c => c.name === tx.category)?.color || "#C4A882", borderRadius: 4, padding: "2px 6px" }}>{tx.category}</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#C4A882" }}>{tx.date}</span>
                          {tx.notes && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#9B8878" }}>📝</span>}
                          {recentlyCorrected.includes(tx.id) && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#6B9B6B" }}>✓ edited</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#2C1A0E", flexShrink: 0 }}>−${tx.amount.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SAVINGS ── */}
        {tab === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#2C1A0E", borderRadius: 20, padding: "28px 24px" }}>
              <div style={{ fontSize: 10, color: "#A67C52", fontFamily: "'DM Mono', monospace", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Savings Goal</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "#FAF7F2", marginBottom: 4 }}>
                $7,340 <span style={{ fontSize: 16, color: "#6B5B4E" }}>/ $12,000</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", margin: "16px 0 8px" }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${savingsPct}%`, background: "linear-gradient(90deg, #A67C52, #E8D5B7)", transition: "width 1.2s ease" }} />
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B5B4E" }}>{savingsPct}% complete · Est. finish: August 2026</div>
            </div>

            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#2C1A0E" }}>Choose your savings approach</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878", letterSpacing: 1, marginTop: -8 }}>TAILORED TO YOUR INCOME & SPENDING</div>

            {FINANCIAL_DATA.plans.map((plan) => (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{ background: selectedPlan === plan.id ? "#2C1A0E" : "#fff", border: selectedPlan === plan.id ? "2px solid #A67C52" : "2px solid #F0EAE0", borderRadius: 16, padding: "20px", textAlign: "left", cursor: "pointer", transition: "all 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, color: plan.color, textTransform: "uppercase", marginBottom: 4 }}>{plan.tag}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: selectedPlan === plan.id ? "#FAF7F2" : "#2C1A0E" }}>{plan.title}</div>
                  </div>
                  <div style={{ background: selectedPlan === plan.id ? "rgba(255,255,255,0.1)" : "#FAF7F2", borderRadius: 10, padding: "8px 12px", textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#A67C52", letterSpacing: 1 }}>SAVE / MO</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: selectedPlan === plan.id ? "#E8D5B7" : "#2C1A0E" }}>${plan.monthly}</div>
                  </div>
                </div>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: selectedPlan === plan.id ? "#9B8878" : "#6B5B4E", lineHeight: 1.5, marginBottom: 12 }}>{plan.desc}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <PressureDots level={plan.pressure} />
                  {selectedPlan === plan.id && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#A67C52", letterSpacing: 2 }}>ACTIVE ✓</div>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── INSIGHTS ── */}
        {tab === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2C1A0E", marginBottom: 4 }}>Insights & Alerts</div>

            {/* Dynamic alerts from real data */}
            {(() => {
              const alerts = [];
              const foodAmount = categoryTotals["Food"] || 0;
              const transportAmount = categoryTotals["Transport"] || 0;
              if (foodAmount > 200) alerts.push({ type: "warn", msg: `Food spending is $${foodAmount.toFixed(0)} this month — ${foodAmount > 300 ? "significantly" : "slightly"} above average.` });
              if (budgetPct > 80) alerts.push({ type: "warn", msg: `You've used ${budgetPct}% of your monthly budget. Slow down in the remaining days.` });
              if (FINANCIAL_DATA.savedSoFar > 7000) alerts.push({ type: "good", msg: `You're ${savingsPct}% of the way to your savings goal — on track for August 2026!` });
              if (weekTotal > 500) alerts.push({ type: "warn", msg: `You've spent $${weekTotal.toFixed(0)} this week. Consider slowing down.` });
              if (alerts.length === 0) alerts.push({ type: "good", msg: "Your spending looks healthy this month. Keep it up!" });
              const styles = {
                warn: { bg: "#FBF3EA", border: "#E8D5B7", dot: "#A67C52", label: "ATTENTION" },
                info: { bg: "#F0EAE0", border: "#DDD0C0", dot: "#C4A882", label: "INFO" },
                good: { bg: "#F0F5EE", border: "#D0DFD0", dot: "#6B9B6B", label: "GREAT NEWS" }
              };
              return alerts.map((a, i) => {
                const s = styles[a.type];
                return (
                  <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: s.dot, letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#2C1A0E", lineHeight: 1.5 }}>{a.msg}</div>
                    </div>
                  </div>
                );
              });
            })()}

            {/* Spending patterns */}
            <div style={{ background: "#2C1A0E", borderRadius: 16, padding: "20px", marginTop: 8 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Spending Patterns</div>
              {[
                { label: "Top category", value: Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] ? `${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]} ($${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][1].toFixed(0)})` : "—", icon: "📊" },
                { label: "Transactions", value: `${transactions.length} this month`, icon: "📋" },
                { label: "Avg per transaction", value: transactions.length > 0 ? `$${(totalSpent / transactions.length).toFixed(2)}` : "—", icon: "💳" },
                { label: "Savings progress", value: `${savingsPct}% of goal`, icon: "🎯" },
              ].map((m) => (
                <div key={m.label} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 20 }}>{m.icon}</div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#E8D5B7" }}>{m.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B5B4E" }}>{m.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowAI(true)} style={{ background: "linear-gradient(135deg, #2C1A0E, #5C3D2E)", borderRadius: 16, padding: "20px", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>✦ Deep AI Analysis</div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#E8D5B7", lineHeight: 1.6 }}>Ask your AI assistant to analyze spending trends, detect anomalies, and suggest personalized savings strategies.</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", marginTop: 12, letterSpacing: 1 }}>OPEN ASSISTANT →</div>
            </button>
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Profile card */}
            <div style={{ background: "#2C1A0E", borderRadius: 20, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#A67C52", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#FAF7F2", flexShrink: 0 }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#FAF7F2" }}>{displayName}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B5B4E", marginTop: 2 }}>{profileData.email}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#A67C52", letterSpacing: 1, marginTop: 4 }}>PREMIUM MEMBER</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                {[{ label: "Transactions", val: transactions.length }, { label: "Categories", val: categories.length }, { label: "Savings %", val: `${savingsPct}%` }].map(s => (
                  <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#E8D5B7" }}>{s.val}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#6B5B4E", marginTop: 2, letterSpacing: 0.5 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connected Banks */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#2C1A0E", marginBottom: 4 }}>Bank Accounts</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 16 }}>POWERED BY PLAID · END-TO-END ENCRYPTED</div>
              {connectedBanks.length === 0 ? (
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#9B8878", marginBottom: 16, lineHeight: 1.6 }}>No bank connected yet. Link your account to import transaction data automatically.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {connectedBanks.map((b) => (
                    <div key={b} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 10, background: "#F0F5EE", border: "1px solid #D0DFD0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>🏦</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>{b}</span>
                      </div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#6B9B6B", letterSpacing: 1 }}>CONNECTED ✓</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowBankModal(true)} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "2px solid #E8D5B7", background: "#FAF7F2", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#5C3D2E", letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" }}>
                + Connect Bank Account
              </button>
            </div>

            {/* Settings */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#2C1A0E", marginBottom: 16 }}>Settings</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Face ID / Biometric Login", desc: "Log in with your device biometrics", val: biometricEnabled, set: setBiometricEnabled },
                  { label: "AI Assistant Insights", desc: "Receive personalized spending alerts", val: aiNotifications, set: setAiNotifications },
                ].map((item, i) => (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>{item.label}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <Toggle value={item.val} onChange={item.set} />
                    </div>
                    <div style={{ height: 1, background: "#F0EAE0" }} />
                  </div>
                ))}
              </div>

              {[{ icon: "🔒", label: "End-to-end encryption", desc: "All data encrypted in transit & at rest" }, { icon: "🔑", label: "Secure token auth", desc: "No bank credentials stored on device" }, { icon: "🛡️", label: "Input sanitization", desc: "All inputs validated & sanitized" }].map((item) => (
                <div key={item.label} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F0EAE0" }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>{item.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Details */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#2C1A0E", marginBottom: 4 }}>Financial Profile</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 16 }}>YOUR FINANCIAL SUMMARY</div>
              {[
                { label: "Monthly Income", val: `$${FINANCIAL_DATA.monthlyIncome.toLocaleString()}` },
                { label: "Monthly Budget", val: `$${FINANCIAL_DATA.monthBudget.toLocaleString()}` },
                { label: "Savings Goal", val: `$${FINANCIAL_DATA.savingsGoal.toLocaleString()}` },
                { label: "Saved So Far", val: `$${FINANCIAL_DATA.savedSoFar.toLocaleString()}` },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F0EAE0" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#6B5B4E" }}>{item.label}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#2C1A0E" }}>{item.val}</span>
                </div>
              ))}
            </div>

            {/* Category management shortcut */}
            <button onClick={() => setShowCatsModal(true)} style={{ background: "#FBF3EA", borderRadius: 16, padding: "18px 20px", border: "1px solid #E8D5B7", cursor: "pointer", textAlign: "left", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#A67C52", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Custom Categories</div>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#5C3D2E" }}>Manage, add, or delete spending categories</div>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#A67C52" }}>→</div>
            </button>

            {/* Data control */}
            <div style={{ background: "#FBF3EA", borderRadius: 16, padding: "18px 20px", border: "1px solid #E8D5B7" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Your Data, Your Control</div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#5C3D2E", lineHeight: 1.7 }}>
                Correct any transaction, update financial details, or delete your account at any time. All corrections improve your AI insights.
              </div>
            </div>

            <button onClick={onLogout} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "2px solid #F0EAE0", background: "transparent", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878", letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" }}>
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* FAB — AI Button */}
      <button onClick={() => setShowAI(true)} style={{ position: "fixed", bottom: 88, right: 24, width: 52, height: 52, borderRadius: "50%", border: "none", background: "linear-gradient(135deg, #2C1A0E, #5C3D2E)", color: "#E8D5B7", fontSize: 20, cursor: "pointer", boxShadow: "0 4px 20px rgba(44,26,14,0.4)", zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        ✦
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ROOT APP — Auth State Machine
════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState("login"); // login | signup | onboarding | app
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => { setUser(userData); setScreen("app"); };
  const handleSignup = (userData) => { setUser(userData); setScreen("onboarding"); };
  const handleOnboardingComplete = () => setScreen("app");
  const handleLogout = () => { setUser(null); setScreen("login"); };

  if (screen === "login") return <LoginScreen onLogin={handleLogin} onGoSignup={() => setScreen("signup")} />;
  if (screen === "signup") return <SignupScreen onSignup={handleSignup} onGoLogin={() => setScreen("login")} />;
  if (screen === "onboarding") return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  return <MainApp user={user} onLogout={handleLogout} />;
}
