import { useState } from "react";
import { ModalOverlay } from "../ui/ModalOverlay.jsx";
import { sanitize, validateEmail } from "../../utils/sanitizers.js";

export function ProfileEditModal({ profile, onSave, onClose }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    const safeName = sanitize(name);
    const safeEmail = sanitize(email);
    if (!safeName) {
      setError("Name is required.");
      return;
    }
    if (!validateEmail(safeEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    onSave({ name: safeName, email: safeEmail });
    onClose();
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 10,
    border: "2px solid #E8D5B7",
    background: "#fff",
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    color: "#2C1A0E",
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2C1A0E", marginBottom: 4 }}>
        Edit Profile
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 24 }}>
        UPDATE YOUR DETAILS
      </div>
      <div style={{ marginBottom: 16 }}>
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
          Full Name
        </div>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
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
          Email
        </div>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </div>
      {error && (
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#E07060", marginBottom: 12 }}>
          {error}
        </div>
      )}
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
        Save Profile ✓
      </button>
    </ModalOverlay>
  );
}
