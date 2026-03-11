import { useState } from "react";
import { GLOBAL_CSS } from "../constants/defaults.js";

export function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const questions = [
    {
      key: "income",
      q: "What's your monthly income (after tax)?",
      opts: ["Under $3,000", "$3,000–$5,000", "$5,000–$8,000", "Over $8,000"],
    },
    {
      key: "goal",
      q: "What's your primary financial goal?",
      opts: ["Emergency fund", "Pay off debt", "Buy a home", "Build wealth"],
    },
    {
      key: "habits",
      q: "How would you describe your spending?",
      opts: ["Very disciplined", "Usually controlled", "Sometimes impulsive", "Working on it"],
    },
    {
      key: "budget",
      q: "Do you currently track a budget?",
      opts: ["Yes, strictly", "Loosely", "Not really", "Starting now"],
    },
  ];
  const q = questions[step];

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
            Step {step + 1} of {questions.length}
          </div>
          <div
            style={{
              width: "100%",
              height: 3,
              background: "#F0EAE0",
              borderRadius: 2,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((step + 1) / questions.length) * 100}%`,
                background: "#A67C52",
                borderRadius: 2,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#2C1A0E", lineHeight: 1.3 }}>
            {q?.q}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(q?.opts ?? []).map((opt) => (
            <button
              key={opt}
              onClick={() => {
                const next = { ...answers, [q.key]: opt };
                setAnswers(next);
                if (step < questions.length - 1) setStep((s) => s + 1);
                else onComplete(next);
              }}
              style={{
                padding: "18px 24px",
                borderRadius: 14,
                border: "2px solid #E8D5B7",
                background: "#fff",
                fontFamily: "'Georgia', serif",
                fontSize: 15,
                color: "#2C1A0E",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
