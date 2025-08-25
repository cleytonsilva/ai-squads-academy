import { Outlet, useLocation } from "react-router-dom";
import TopNav from "@/components/TopNav";

export default function AppLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isLandingPage && <TopNav />}
      <Outlet />
    </div>
  );
}
