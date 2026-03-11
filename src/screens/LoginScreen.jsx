import { useState } from "react";
import { sanitize, validateEmail } from "../utils/sanitizers.js";
import { GLOBAL_CSS } from "../constants/defaults.js";

export function LoginScreen({ onLogin, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    const cleanEmail = sanitize(email);
    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      setTimeout(() => {
        setLoading(false);
        onLogin({ name: cleanEmail.split("@")[0], email: cleanEmail });
      }, 600);
    } catch (e) {
      if (import.meta.env?.DEV) console.warn("[Clearpath] Login:", e?.message);
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
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
        <div style={{ textAlign: "center", marginBottom: 40 }}>
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
            Welcome back
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
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                onLogin({ name: "Alex", email: "alex@example.com" });
              }, 900);
            }}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 14,
              border: "2px solid #E8D5B7",
              background: "#FAF7F2",
              cursor: "pointer",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>🔐</span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: "#5C3D2E",
                letterSpacing: 1,
              }}
            >
              USE FACE ID / FINGERPRINT
            </span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#F0EAE0" }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C4A882", letterSpacing: 1 }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, background: "#F0EAE0" }} />
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
              Email Address
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              style={inputStyle}
              autoComplete="email"
            />
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
              Password
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          {error && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#E07060", marginBottom: 14 }}>
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
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
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing In…" : "Sign In →"}
          </button>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878" }}>
              Don't have an account?{" "}
            </span>
            <button
              onClick={onGoSignup}
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
              Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
