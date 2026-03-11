import { useState } from "react";
import { ModalOverlay } from "../ui/ModalOverlay.jsx";
import { sanitize, sanitizeAmount } from "../../utils/sanitizers.js";
import { formatShortDate } from "../../utils/dateHelpers.js";

export function AddTransactionModal({ categories, onSave, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const catList = Array.isArray(categories) ? categories : [];
  const firstCat = catList[0]?.name ?? "Other";
  const [form, setForm] = useState({
    merchant: "",
    amount: "",
    category: firstCat,
    date: today,
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    const errs = {};
    if (!sanitize(form.merchant)) errs.merchant = "Merchant name required";
    if (sanitizeAmount(form.amount) === null) errs.amount = "Enter a valid amount";
    if (!form.date) errs.date = "Date required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const amount = sanitizeAmount(form.amount);
    const dateStr = formatShortDate(form.date);
    const catObj = catList.find((c) => c.name === form.category);
    onSave({
      id: Date.now(),
      merchant: sanitize(form.merchant),
      amount,
      category: form.category,
      isoDate: form.date,
      date: dateStr,
      notes: sanitize(form.notes),
      icon: catObj?.icon ?? "📌",
    });
  };

  const inputStyle = (hasErr) => ({
    width: "100%",
    padding: "13px 16px",
    borderRadius: 10,
    border: `2px solid ${hasErr ? "#E07060" : "#E8D5B7"}`,
    background: "#fff",
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    color: "#2C1A0E",
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2C1A0E", marginBottom: 4 }}>
        Add Transaction
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 24 }}>
        MANUAL ENTRY
      </div>
      {[
        { label: "Merchant Name", key: "merchant", type: "text" },
        { label: "Amount ($)", key: "amount", type: "number" },
        { label: "Date", key: "date", type: "date" },
      ].map(({ label, key, type }) => (
        <div key={key} style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: "#A67C52",
              letterSpacing: 2,
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
          <input
            type={type}
            value={form[key]}
            onChange={set(key)}
            style={inputStyle(errors[key])}
            min={type === "number" ? "0" : undefined}
            step={type === "number" ? "0.01" : undefined}
          />
          {errors[key] && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#E07060", marginTop: 4 }}>
              {errors[key]}
            </div>
          )}
        </div>
      ))}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "#A67C52",
            letterSpacing: 2,
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          Category
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {catList.map((c) => (
            <button
              key={c.id}
              onClick={() => setForm((f) => ({ ...f, category: c.name }))}
              style={{
                padding: "8px 14px",
                borderRadius: 20,
                border: form.category === c.name ? "2px solid #A67C52" : "2px solid #E8D5B7",
                background: form.category === c.name ? "#FBF3EA" : "#fff",
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: form.category === c.name ? "#5C3D2E" : "#9B8878",
                cursor: "pointer",
              }}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "#A67C52",
            letterSpacing: 2,
            marginBottom: 6,
            textTransform: "uppercase",
          }}
        >
          Notes
        </div>
        <textarea
          value={form.notes}
          onChange={set("notes")}
          rows={2}
          maxLength={300}
          style={{ ...inputStyle(false), resize: "none" }}
          placeholder="Optional note…"
        />
      </div>
      <button
        onClick={handleSave}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: 12,
          border: "none",
          background: "#5C3D2E",
          color: "#FAF7F2",
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          letterSpacing: 2,
          cursor: "pointer",
          textTransform: "uppercase",
        }}
      >
        Add Transaction ✓
      </button>
    </ModalOverlay>
  );
}
