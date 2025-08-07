import { Outlet } from "react-router-dom";
import TopNav from "@/components/TopNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <Outlet />
    </div>
  );
}
