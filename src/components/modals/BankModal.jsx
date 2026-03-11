import { useState } from "react";
import { ModalOverlay } from "../ui/ModalOverlay.jsx";

export function BankModal({ onClose, onConnect }) {
  const [step, setStep] = useState(0);
  const [selectedBank, setSelectedBank] = useState(null);
  const banks = [
    { name: "Chase", icon: "🏦" },
    { name: "Bank of America", icon: "🏛️" },
    { name: "Wells Fargo", icon: "🏠" },
    { name: "Citi", icon: "🌐" },
    { name: "Capital One", icon: "💳" },
  ];

  return (
    <ModalOverlay onClose={step < 2 ? onClose : undefined}>
      {step === 0 && (
        <>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2C1A0E", marginBottom: 4 }}>
            Connect Your Bank
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 16 }}>
            POWERED BY PLAID · 256-BIT ENCRYPTION
          </div>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#6B5B4E", lineHeight: 1.6, marginBottom: 20 }}>
            Securely link your account. We never store banking credentials.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {banks.map((b) => (
              <button
                key={b.name}
                onClick={() => {
                  setSelectedBank(b.name);
                  setStep(1);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "2px solid #E8D5B7",
                  background: "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 20 }}>{b.icon}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#2C1A0E" }}>{b.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2C1A0E", marginBottom: 4 }}>
            Secure Authentication
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", letterSpacing: 1, marginBottom: 20 }}>
            {selectedBank?.toUpperCase()} · SECURE PORTAL
          </div>
          <div style={{ background: "#FBF3EA", borderRadius: 14, padding: "20px", border: "1px solid #E8D5B7", marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#A67C52", letterSpacing: 1, marginBottom: 8 }}>
              🔒 SECURE REDIRECT
            </div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#5C3D2E", lineHeight: 1.6 }}>
              You'll be redirected to {selectedBank}'s authentication. Clearpath never sees your banking password.
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
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
              marginBottom: 10,
            }}
          >
            Proceed to {selectedBank} →
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2C1A0E", marginBottom: 8 }}>
              {selectedBank} Connected!
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B9B6B", letterSpacing: 1, marginBottom: 24 }}>
              ACCOUNT LINKED SUCCESSFULLY
            </div>
            <button
              onClick={() => {
                if (selectedBank) onConnect(selectedBank);
                onClose();
              }}
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
              Back to App ✓
            </button>
          </div>
        </>
      )}
    </ModalOverlay>
  );
}
