import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="app-shell">
      <main className="mx-auto w-full max-w-6xl px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
