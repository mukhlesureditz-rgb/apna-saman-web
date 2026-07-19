import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RequireShop() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RedirectIfAuthed({ to }: { to: string }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (user) return <Navigate to={isAdmin ? '/admin' : to} replace />;
  return <Outlet />;
}

function FullscreenLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-ink-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        <p className="text-sm font-medium text-ink-500">Loading APNA SAMAN…</p>
      </div>
    </div>
  );
}
