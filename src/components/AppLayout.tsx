import { Outlet, useLocation } from "react-router-dom";
import TopNav from "@/components/TopNav";
import TacticalSidebar from "@/components/TacticalSidebar";

export default function AppLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAppDashboard = location.pathname.startsWith('/app');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isLandingPage && !isAppDashboard && <TopNav />}
      
      {isAppDashboard ? (
        <div className="flex h-screen bg-neutral-950">
          <TacticalSidebar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  );
}
