import { useState, useEffect, useRef } from "react";
import { GLOBAL_CSS, MODELS } from "../constants/defaults.js";
import {
  hasAiApiKey,
  buildFinancialContext,
  buildSystemPrompt,
  streamMessage,
  sanitizePrompt,
  getModelForQuery,
} from "../utils/aiChat.js";

export function AIChatPanel({ transactions, categories, financialData, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: hasAiApiKey()
        ? "Hi! I'm your Clearpath AI advisor. I can analyze your spending, project your savings timeline, flag unusual patterns, and suggest strategies tailored to your data. What would you like to explore?"
        : "Hi! To use the AI advisor, add your Anthropic API key in a .env file as VITE_ANTHROPIC_API_KEY, then restart the app. You can still use the rest of Clearpath without it.",
      meta: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [currentMeta, setCurrentMeta] = useState(null);
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

    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userText },
    ];

    setMessages((prev) => [...prev, { role: "user", content: userText, meta: null }]);
    setStreaming(true);
    setStreamingText("");

    const { model, useThinking, label } = getModelForQuery(userText);
    setCurrentMeta({ model, label });

    const ctx = buildFinancialContext(transactions ?? [], categories ?? [], financialData ?? {});
    const systemPrompt = buildSystemPrompt(ctx);

    await streamMessage({
      systemPrompt,
      messages: history,
      model,
      useThinking,
      onChunk: (t) => setStreamingText(t),
      onDone: (finalText) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: finalText, meta: { model, label } },
        ]);
        setStreamingText("");
        setStreaming(false);
        setCurrentMeta(null);
        inputRef.current?.focus();
      },
      onError: (errMsg) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${errMsg}`, meta: null },
        ]);
        setStreamingText("");
        setStreaming(false);
        setCurrentMeta(null);
      },
    });
  };

  const modelBadge = (meta) => {
    if (!meta) return null;
    const isDeep = meta.model === MODELS.smart;
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginTop: 6,
          padding: "2px 8px",
          borderRadius: 10,
          background: isDeep ? "#FBF3EA" : "#F0F5EE",
          border: `1px solid ${isDeep ? "#E8D5B7" : "#D0DFD0"}`,
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: isDeep ? "#A67C52" : "#6B9B6B",
          }}
        />
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            color: isDeep ? "#A67C52" : "#6B9B6B",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {meta.label}
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        background: "#FAF7F2",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <style>{GLOBAL_CSS}</style>

      <div style={{ background: "#2C1A0E", padding: "20px 24px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: "#A67C52",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              AI Assistant
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#FAF7F2", marginTop: 2 }}>
              Clearpath Intelligence
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#E8D5B7",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, overflowX: "auto", paddingBottom: 2 }}>
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={streaming}
              style={{
                flexShrink: 0,
                padding: "7px 12px",
                borderRadius: 20,
                border: "1px solid rgba(228,213,183,0.3)",
                background: "rgba(228,213,183,0.08)",
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: "#C4A882",
                cursor: streaming ? "default" : "pointer",
                whiteSpace: "nowrap",
                letterSpacing: 0.5,
                opacity: streaming ? 0.5 : 1,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 20px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className="chat-bubble-in"
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {m.role === "assistant" && (
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#2C1A0E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  marginRight: 10,
                  flexShrink: 0,
                  alignSelf: "flex-end",
                }}
              >
                ✦
              </div>
            )}
            <div style={{ maxWidth: "78%" }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius:
                    m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: m.role === "user" ? "#2C1A0E" : "#fff",
                  border: m.role === "assistant" ? "1px solid #F0EAE0" : "none",
                  fontFamily: "'Georgia', serif",
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: m.role === "user" ? "#FAF7F2" : "#2C1A0E",
                  boxShadow: "0 1px 8px rgba(44,26,14,0.07)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
              {m.role === "assistant" && modelBadge(m.meta)}
            </div>
          </div>
        ))}

        {streaming && (
          <div
            className="chat-bubble-in"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#2C1A0E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                marginRight: 10,
                flexShrink: 0,
                alignSelf: "flex-end",
              }}
            >
              ✦
            </div>
            <div style={{ maxWidth: "78%" }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "18px 18px 18px 4px",
                  background: "#fff",
                  border: "1px solid #F0EAE0",
                  fontFamily: "'Georgia', serif",
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#2C1A0E",
                  boxShadow: "0 1px 8px rgba(44,26,14,0.07)",
                  minWidth: 60,
                  whiteSpace: "pre-wrap",
                }}
              >
                {streamingText || (
                  <div
                    style={{
                      display: "flex",
                      gap: 5,
                      alignItems: "center",
                      padding: "2px 0",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#C4A882",
                          animation: `bounce 1s ease ${i * 0.15}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {streamingText && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 14,
                      background: "#C4A882",
                      marginLeft: 2,
                      verticalAlign: "text-bottom",
                      animation: "blink 0.8s step-end infinite",
                    }}
                  />
                )}
              </div>
              {currentMeta && modelBadge(currentMeta)}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div
        style={{
          padding: "12px 16px 24px",
          background: "#fff",
          borderTop: "1px solid #F0EAE0",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask me anything about your finances…"
            rows={1}
            maxLength={1000}
            disabled={streaming}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 14,
              border: "2px solid #E8D5B7",
              background: "#FAF7F2",
              fontFamily: "'Georgia', serif",
              fontSize: 14,
              color: "#2C1A0E",
              resize: "none",
              lineHeight: 1.4,
              opacity: streaming ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={streaming || !input.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "none",
              background: !streaming && input.trim() ? "#5C3D2E" : "#E8D5B7",
              color: "#FAF7F2",
              fontSize: 18,
              cursor: !streaming && input.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            {streaming ? "…" : "↑"}
          </button>
        </div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            color: "#C4A882",
            marginTop: 8,
            textAlign: "center",
            letterSpacing: 0.5,
          }}
        >
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
