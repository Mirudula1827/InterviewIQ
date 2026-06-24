import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import NewInterview from "./pages/NewInterview";
import LiveInterview from "./pages/LiveInterview";
import Reports from "./pages/Reports";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-interview" element={<NewInterview />} />
        <Route path="/live-interview" element={<LiveInterview />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
