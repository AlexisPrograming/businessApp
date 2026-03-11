import { Component } from "react";

/**
 * Clearpath Finance — Error boundary for graceful failure and debugging
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env?.DEV) {
      console.error("[Clearpath] ErrorBoundary caught:", error?.message, info?.componentStack);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const msg = this.state.error?.message || "Something went wrong.";
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
            fontFamily: "'Georgia', serif",
          }}
        >
          <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2C1A0E", marginBottom: 8 }}>
              Something went wrong
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#E07060",
                marginBottom: 20,
                wordBreak: "break-word",
              }}
            >
              {msg}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: "14px 24px",
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
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
