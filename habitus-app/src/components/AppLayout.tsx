import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

type AppLayoutProps = {
  showBack?: boolean;
  hideNav?: boolean;
};

export function AppLayout({ showBack, hideNav }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <Header showBack={showBack} />
      <Outlet />
      {!hideNav && <BottomNav />}
    </div>
  );
}
