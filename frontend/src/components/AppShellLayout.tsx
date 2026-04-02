import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Authenticated layout: fixed-width sidebar + scrollable main. No top navbar.
 */
export default function AppShellLayout() {
  return (
    <div className="mm-app-shell">
      <Sidebar />
      <main className="mm-app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
