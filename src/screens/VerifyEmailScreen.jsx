import { useState, useEffect } from "react";
import { GLOBAL_CSS } from "../constants/defaults.js";
import { sendVerificationCode, verifyCode } from "../utils/emailVerification.js";

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
  letterSpacing: 4,
  textAlign: "center",
};

export function VerifyEmailScreen({ pendingUser, onVerified, onGoLogin }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [sentCode, setSentCode] = useState(null);

  const email = pendingUser?.email ?? "";

  useEffect(() => {
    if (!email) return;
    const c = sendVerificationCode(email);
    setSentCode(c);
    if (import.meta.env?.DEV && c) console.log("[Clearpath] Verification code (dev only):", c);
  }, [email]);

  const handleVerify = () => {
    const trimmed = String(code).trim();
    if (!trimmed) {
      setError("Enter the 6-digit code.");
      return;
    }
    if (!verifyCode(email, trimmed)) {
      setError("Invalid or expired code. Check your email or request a new code.");
      return;
    }
    setError("");
    onVerified(pendingUser);
  };

  const handleResend = () => {
    setError("");
    const c = sendVerificationCode(email);
    setSentCode(c);
    if (import.meta.env?.DEV && c) console.log("[Clearpath] New verification code (dev only):", c);
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
        <div style={{ textAlign: "center", marginBottom: 24 }}>
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
            Verify your email
          </div>
          <div style={{ width: 32, height: 2, background: "#A67C52", margin: "0 auto 16px" }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2C1A0E", marginBottom: 8 }}>
            We sent a code to
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#5C3D2E" }}>{email}</div>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "0 4px 40px rgba(90,60,30,0.08)",
            border: "1px solid #F0EAE0",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: "#A67C52",
              letterSpacing: 2,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            6-digit code
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          {import.meta.env?.DEV && sentCode && (
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: "#9B8878",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Dev: code is <strong>{sentCode}</strong>
            </div>
          )}
          {error && (
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#E07060",
                marginTop: 12,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}
          <button
            onClick={handleVerify}
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
              marginTop: 20,
            }}
          >
            Verify →
          </button>
          <button
            onClick={handleResend}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: 12,
              border: "none",
              background: "transparent",
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: "#A67C52",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Resend code
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={onGoLogin}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: "#9B8878",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
