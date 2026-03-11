import { useState, useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { LoginScreen } from "./screens/LoginScreen.jsx";
import { SignupScreen } from "./screens/SignupScreen.jsx";
import { VerifyEmailScreen } from "./screens/VerifyEmailScreen.jsx";
import { OnboardingScreen } from "./screens/OnboardingScreen.jsx";
import { MainApp } from "./components/MainApp.jsx";
import { getSession, saveSession, clearSession } from "./utils/authStorage.js";

export default function App() {
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    const session = getSession();
    if (session?.user) {
      setUser(session.user);
      setScreen("app");
    }
  }, []);

  const handleLogin = (userData) => {
    const u = userData ?? null;
    setUser(u);
    setScreen("app");
    if (u) saveSession(u);
  };

  const handleRequestVerify = (data) => {
    setPendingUser(data ?? null);
    setScreen("verify-email");
  };

  const handleVerified = (verifiedUser) => {
    setUser(verifiedUser ?? null);
    setPendingUser(null);
    setScreen("onboarding");
  };

  const handleOnboardingComplete = () => {
    setScreen("app");
    if (user) saveSession(user);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setPendingUser(null);
    setScreen("login");
  };

  if (screen === "login") {
    return (
      <ErrorBoundary>
        <LoginScreen onLogin={handleLogin} onGoSignup={() => setScreen("signup")} />
      </ErrorBoundary>
    );
  }
  if (screen === "signup") {
    return (
      <ErrorBoundary>
        <SignupScreen onRequestVerify={handleRequestVerify} onGoLogin={() => setScreen("login")} />
      </ErrorBoundary>
    );
  }
  if (screen === "verify-email") {
    return (
      <ErrorBoundary>
        <VerifyEmailScreen
          pendingUser={pendingUser}
          onVerified={handleVerified}
          onGoLogin={() => { setPendingUser(null); setScreen("login"); }}
        />
      </ErrorBoundary>
    );
  }
  if (screen === "onboarding") {
    return (
      <ErrorBoundary>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary>
      <MainApp user={user} onLogout={handleLogout} />
    </ErrorBoundary>
  );
}
