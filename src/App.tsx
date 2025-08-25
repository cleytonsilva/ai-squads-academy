import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import AppLayout from "@/components/AppLayout";
import RequireAuth, { RequireRole } from "@/components/auth/RequireAuth";
import { ThemeProvider } from "@/contexts/theme-context";

// Lazy loading para páginas principais
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AppDashboard = lazy(() => import("./pages/AppDashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthDebug = lazy(() => import("./pages/AuthDebug"));

// Lazy loading para páginas de cursos
const Courses = lazy(() => import("./pages/Courses"));
const CourseView = lazy(() => import("./pages/CourseView"));

// Lazy loading para páginas de usuário
const Achievements = lazy(() => import("./pages/achievements"));
const Challenges = lazy(() => import("./pages/challenges"));
const Ranking = lazy(() => import("./pages/ranking"));
const Badges = lazy(() => import("./pages/badges"));

// Lazy loading para páginas do dashboard do aluno
const Cursos = lazy(() => import("./pages/Cursos"));
const Missoes = lazy(() => import("./pages/Missoes"));
const Conquistas = lazy(() => import("./pages/Conquistas"));
const Simulados = lazy(() => import("./pages/Simulados"));
const Perfil = lazy(() => import("./pages/Perfil"));

// Lazy loading para páginas admin
const NewAdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminCourseEditor = lazy(() => import("./pages/AdminCourseEditor"));
const AdminTracks = lazy(() => import("./pages/AdminTracks"));
const GenerationJob = lazy(() => import("./pages/GenerationJob"));
const AdminMonitoring = lazy(() => import("./pages/AdminMonitoring"));
const AchievementManagement = lazy(() => import("./pages/admin/AchievementManagement"));
const BadgeManagement = lazy(() => import("./pages/admin/BadgeManagement"));
const AdminChallengeManagement = lazy(() => import("./pages/admin/ChallengeManagement"));
const AIGenerator = lazy(() => import("./pages/admin/AIGenerator"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const CertificateManagement = lazy(() => import("./pages/admin/CertificateManagement"));
const RankingManagement = lazy(() => import("./pages/admin/RankingManagement"));
const AdminMissions = lazy(() => import("./pages/admin/AdminMissions"));
const queryClient = new QueryClient();

// Componente de loading para Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth-debug" element={<AuthDebug />} />

              <Route element={<RequireAuth />}>
                <Route path="/app" element={<AppDashboard />} />
                <Route path="/dashboard" element={<Navigate to="/app" replace />} />
                <Route path="/app/cursos" element={<Cursos />} />
                <Route path="/app/missoes" element={<Missoes />} />
                <Route path="/app/conquistas" element={<Conquistas />} />
                <Route path="/app/simulados" element={<Simulados />} />
                <Route path="/app/perfil" element={<Perfil />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:id" element={<CourseView />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/badges" element={<Badges />} />
              </Route>

              <Route element={<RequireRole roles={["admin", "instructor"]} />}>
                <Route path="/admin" element={<NewAdminDashboard />} />
                <Route path="/admin/courses" element={<AdminDashboard />} />
                <Route path="/admin/courses/create" element={<AdminCourseEditor />} />
                <Route path="/admin/courses/:id" element={<AdminCourseEditor />} />
                <Route path="/admin/courses/:id/edit" element={<AdminCourseEditor />} />
                <Route path="/admin/ai-generator" element={<AIGenerator />} />
                <Route path="/admin/tracks" element={<AdminTracks />} />
                <Route path="/admin/generation/:jobId" element={<GenerationJob />} />
                <Route path="/admin/monitoring" element={<AdminMonitoring />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/certificates" element={<CertificateManagement />} />
                <Route path="/admin/rankings" element={<RankingManagement />} />
                <Route path="/admin/achievements" element={<AchievementManagement />} />
                <Route path="/admin/badges" element={<BadgeManagement />} />
                <Route path="/admin/challenges" element={<AdminChallengeManagement />} />
                <Route path="/admin/missions" element={<AdminMissions />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
