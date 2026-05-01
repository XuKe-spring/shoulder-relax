import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isOnboardingComplete } from "./utils/storage";
import { SettingsProvider, useSettings } from "./hooks/SettingsContext";
import { useReminder } from "./hooks/useReminder";
import Home from "./pages/Home";
import Train from "./pages/Train";
import Complete from "./pages/Complete";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  if (!isOnboardingComplete()) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function ReminderSync() {
  const { settings } = useSettings();
  useReminder(settings.reminderInterval, settings.reminderEnabled);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <ReminderSync />
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/"
            element={
              <OnboardingGuard>
                <Home />
              </OnboardingGuard>
            }
          />
          <Route
            path="/train/:id"
            element={
              <OnboardingGuard>
                <Train />
              </OnboardingGuard>
            }
          />
          <Route
            path="/complete/:id"
            element={
              <OnboardingGuard>
                <Complete />
              </OnboardingGuard>
            }
          />
          <Route
            path="/history"
            element={
              <OnboardingGuard>
                <History />
              </OnboardingGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <OnboardingGuard>
                <Settings />
              </OnboardingGuard>
            }
          />
        </Routes>
      </SettingsProvider>
    </BrowserRouter>
  );
}
