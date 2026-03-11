import { useState } from "react";
import { ModalOverlay } from "../ui/ModalOverlay.jsx";
import { sanitize } from "../../utils/sanitizers.js";
import { isDefaultCategory } from "../../constants/defaults.js";

const ICON_OPTIONS = ["🍽️", "🚗", "🏠", "🛍️", "🎭", "💊", "📱", "📌", "✈️", "🎓", "💼", "🐾", "🎮", "☕", "🌿", "💡"];
const COLOR_OPTIONS = ["#C4A882", "#A67C52", "#E8D5B7", "#8B5E3C", "#5C3D2E", "#6B9B6B", "#7B6B5B", "#9B8878", "#D4A882", "#B87A5A"];

export function CategoriesModal({ categories, onChange, onClose }) {
  const [cats, setCats] = useState(Array.isArray(categories) ? [...categories] : []);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📌");
  const [newColor, setNewColor] = useState("#C4A882");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  const addCategory = () => {
    const name = sanitize(newName);
    if (!name || cats.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    const updated = [...cats, { id: `custom_${Date.now()}`, name, color: newColor, icon: newIcon }];
    setCats(updated);
    setNewName("");
    setNewIcon("📌");
    setNewColor("#C4A882");
  };

  const deleteCategory = (id) => {
    if (isDefaultCategory(id)) return;
    setCats((prev) => prev.filter((c) => c.id !== id));
  };

  const saveEdit = (id) => {
    const name = sanitize(editName);
    if (!name) return;
    setCats((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    setEditing(null);
  };

  const handleDone = () => {
    onChange(cats);
    onClose();
  };

  return (
    <ModalOverlay onClose={handleDone}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2C1A0E", marginBottom: 4 }}>
        Custom Categories
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 20 }}>
        MANAGE YOUR SPENDING CATEGORIES
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {cats.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#fff",
              border: "1px solid #F0EAE0",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: c.color || "#E8D5B7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {c.icon}
            </div>
            {editing === c.id ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(c.id)}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "2px solid #A67C52",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  color: "#2C1A0E",
                }}
                autoFocus
              />
            ) : (
              <span style={{ flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#2C1A0E" }}>
                {c.name}
              </span>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {editing === c.id ? (
                <button
                  onClick={() => saveEdit(c.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: "#A67C52",
                    color: "#fff",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditing(c.id);
                    setEditName(c.name);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #E8D5B7",
                    background: "transparent",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "#9B8878",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              )}
              {!isDefaultCategory(c.id) && (
                <button
                  onClick={() => deleteCategory(c.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #F0EAE0",
                    background: "transparent",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "#C4A882",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#FBF3EA", borderRadius: 16, padding: 20, border: "1px solid #E8D5B7" }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "#A67C52",
            letterSpacing: 2,
            marginBottom: 14,
            textTransform: "uppercase",
          }}
        >
          Add New Category
        </div>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Category name"
          maxLength={30}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: 10,
            border: "2px solid #E8D5B7",
            background: "#fff",
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            color: "#2C1A0E",
            marginBottom: 12,
          }}
        />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#9B8878", marginBottom: 8, letterSpacing: 1 }}>
          ICON
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {ICON_OPTIONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setNewIcon(ic)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: newIcon === ic ? "2px solid #A67C52" : "2px solid #E8D5B7",
                background: newIcon === ic ? "#FBF3EA" : "#fff",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              {ic}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#9B8878", marginBottom: 8, letterSpacing: 1 }}>
          COLOR
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {COLOR_OPTIONS.map((col) => (
            <button
              key={col}
              onClick={() => setNewColor(col)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: newColor === col ? "3px solid #2C1A0E" : "2px solid transparent",
                background: col,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
        <button
          onClick={addCategory}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 10,
            border: "none",
            background: "#5C3D2E",
            color: "#FAF7F2",
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: 2,
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          + Add Category
        </button>
      </div>

      <button
        onClick={handleDone}
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: 12,
          border: "2px solid #E8D5B7",
          background: "transparent",
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: "#5C3D2E",
          letterSpacing: 2,
          cursor: "pointer",
          textTransform: "uppercase",
          marginTop: 16,
        }}
      >
        Done ✓
      </button>
    </ModalOverlay>
  );
}
