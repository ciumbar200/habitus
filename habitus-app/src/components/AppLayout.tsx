import { Suspense } from "react";
import { Header } from "./Header";
import { BottomNav, bottomNavClearance } from "./BottomNav";
import { PendingGroupJoinHandler } from "./PendingGroupJoinHandler";
import { RouteTransition } from "./RouteTransition";
import { RouteFallback } from "./PageState";

type AppLayoutProps = {
  showBack?: boolean;
  hideNav?: boolean;
};

export function AppLayout({ showBack, hideNav }: AppLayoutProps) {
  const navPad = hideNav ? "0px" : bottomNavClearance();

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-background">
      <PendingGroupJoinHandler />
      <Header showBack={showBack} />
      <main
        data-scroll-root
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain md:pb-0"
        style={{ paddingBottom: navPad, WebkitOverflowScrolling: "touch" }}
      >
        <Suspense fallback={<RouteFallback />}>
          <RouteTransition />
        </Suspense>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
