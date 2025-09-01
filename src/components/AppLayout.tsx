import { Outlet, useLocation } from "react-router-dom";
import TopNav from "@/components/TopNav";
import TacticalSidebar from "@/components/TacticalSidebar";
import Footer from "@/components/Footer";
import { useTheme } from "@/contexts/theme-context";

export default function AppLayout() {
  const location = useLocation();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const isLandingPage = location.pathname === '/';
  const isAppDashboard = location.pathname.startsWith('/app');
  const isAuthPage = location.pathname.startsWith('/auth');
  
  // Páginas que devem mostrar o footer
  const shouldShowFooter = !isAppDashboard && !isAuthPage;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isLandingPage && !isAppDashboard && <TopNav />}
      
      {isAppDashboard ? (
        <div className={`flex h-screen ${themeColors.background}`}>
          <TacticalSidebar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      ) : (
        <div className="flex flex-col min-h-screen">
          <div className="flex-1">
            <Outlet />
          </div>
          {shouldShowFooter && <Footer />}
        </div>
      )}
    </div>
  );
}
