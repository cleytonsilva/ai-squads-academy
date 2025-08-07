import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppDashboard from "./pages/AppDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Courses from "./pages/Courses";
import AdminCourseEditor from "./pages/AdminCourseEditor";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import RequireAuth, { RequireRole } from "@/components/auth/RequireAuth";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            <Route element={<RequireAuth />}>
              <Route path="/app" element={<AppDashboard />} />
              <Route path="/courses" element={<Courses />} />
            </Route>

            <Route element={<RequireRole roles={["admin", "instructor"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/courses/:id" element={<AdminCourseEditor />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
