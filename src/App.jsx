import { useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { LoginScreen } from "./screens/LoginScreen.jsx";
import { SignupScreen } from "./screens/SignupScreen.jsx";
import { OnboardingScreen } from "./screens/OnboardingScreen.jsx";
import { MainApp } from "./components/MainApp.jsx";

export default function App() {
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData ?? null);
    setScreen("app");
  };
  const handleSignup = (userData) => {
    setUser(userData ?? null);
    setScreen("onboarding");
  };
  const handleOnboardingComplete = () => setScreen("app");
  const handleLogout = () => {
    setUser(null);
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
        <SignupScreen onSignup={handleSignup} onGoLogin={() => setScreen("login")} />
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
