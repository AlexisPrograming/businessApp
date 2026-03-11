import { useState } from "react";
import { ModalOverlay } from "../ui/ModalOverlay.jsx";
import { sanitize, sanitizeAmount } from "../../utils/sanitizers.js";
import { formatShortDate } from "../../utils/dateHelpers.js";

export function TransactionModal({ tx, categories, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    merchant: tx?.merchant ?? "",
    amount: tx?.amount ?? "",
    category: tx?.category ?? "Other",
    date: tx?.isoDate ?? new Date().toISOString().split("T")[0],
    notes: tx?.notes ?? "",
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
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const amount = sanitizeAmount(form.amount);
    const dateStr = formatShortDate(form.date);
    onSave({
      ...tx,
      merchant: sanitize(form.merchant),
      amount,
      category: form.category,
      isoDate: form.date,
      date: dateStr,
      notes: sanitize(form.notes),
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

  const catList = Array.isArray(categories) ? categories : [];

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2C1A0E", marginBottom: 4 }}>
        Edit Transaction
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 24 }}>
        MAKE CORRECTIONS BELOW
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
          Notes (optional)
        </div>
        <textarea
          value={form.notes}
          onChange={set("notes")}
          rows={2}
          maxLength={300}
          style={{ ...inputStyle(false), resize: "none" }}
          placeholder="Add a note…"
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
          marginBottom: 12,
        }}
      >
        Save Changes ✓
      </button>

      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "2px solid #F0EAE0",
            background: "transparent",
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "#C4A882",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          Delete Transaction
        </button>
      ) : (
        <div style={{ background: "#FBF3EA", borderRadius: 12, padding: "16px", border: "1px solid #E8D5B7" }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: "#5C3D2E",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Delete this transaction permanently?
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => tx?.id != null && onDelete(tx.id)}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "#A67C52",
                color: "#FAF7F2",
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                border: "2px solid #E8D5B7",
                background: "#fff",
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#9B8878",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}
