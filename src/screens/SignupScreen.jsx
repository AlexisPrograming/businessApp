import { useState } from "react";
import { sanitize, validateEmail } from "../utils/sanitizers.js";
import { GLOBAL_CSS } from "../constants/defaults.js";

export function SignupScreen({ onSignup, onGoLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    const name = sanitize(form.name);
    const email = sanitize(form.email);
    if (!name || !email || !form.password) {
      setError("All fields are required.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    onSignup({ name, email });
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 10,
    border: "2px solid #E8D5B7",
    background: "#FAF7F2",
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    color: "#2C1A0E",
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF7F2",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 4,
              color: "#A67C52",
              fontFamily: "'DM Mono', monospace",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Clearpath Finance
          </div>
          <div style={{ width: 32, height: 2, background: "#A67C52", margin: "0 auto 16px" }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2C1A0E" }}>
            Create your account
          </div>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#9B8878", marginTop: 8 }}>
            Your financial journey starts here
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "36px 32px",
            boxShadow: "0 4px 40px rgba(90,60,30,0.08)",
            border: "1px solid #F0EAE0",
          }}
        >
          {[
            { key: "name", label: "Full Name", type: "text", placeholder: "Alex Morgan" },
            { key: "email", label: "Email Address", type: "email", placeholder: "alex@example.com" },
            { key: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" },
            { key: "confirm", label: "Confirm Password", type: "password", placeholder: "Repeat your password" },
          ].map(({ key, label, type, placeholder }) => (
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
              <input type={type} value={form[key]} onChange={set(key)} placeholder={placeholder} style={inputStyle} />
            </div>
          ))}
          {error && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#E07060", marginBottom: 14 }}>
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
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
              marginTop: 4,
            }}
          >
            Create Account →
          </button>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878" }}>
              Already have an account?{" "}
            </span>
            <button
              onClick={onGoLogin}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#A67C52",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
