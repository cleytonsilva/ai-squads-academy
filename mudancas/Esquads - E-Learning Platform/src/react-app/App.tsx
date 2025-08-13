import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import DashboardPage from "@/react-app/pages/Dashboard";
import CoursesPage from "@/react-app/pages/Courses";
import UsersPage from "@/react-app/pages/Users";
import BadgesPage from "@/react-app/pages/Badges";
import CertificatesPage from "@/react-app/pages/Certificates";
import ChallengesPage from "@/react-app/pages/Challenges";
import RankingsPage from "@/react-app/pages/Rankings";
import AIGeneratorPage from "@/react-app/pages/AIGenerator";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/ai-generator" element={<AIGeneratorPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
