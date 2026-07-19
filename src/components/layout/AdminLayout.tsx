import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  LayoutGrid,
  ClipboardList,
  Store,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  CheckCheck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { Logo } from '../ui/Logo';
import { cn, relativeTime } from '../../lib/utils';
import type { AdminNotification } from '../../lib/types';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/admin' },
  { to: '/admin/products', label: 'Products', icon: Package, match: (p: string) => p.startsWith('/admin/products') },
  { to: '/admin/categories', label: 'Categories', icon: LayoutGrid, match: (p: string) => p.startsWith('/admin/categories') },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList, match: (p: string) => p.startsWith('/admin/orders') },
  { to: '/admin/shops', label: 'Shops', icon: Store, match: (p: string) => p.startsWith('/admin/shops') },
  { to: '/admin/settings', label: 'Settings', icon: Settings, match: (p: string) => p.startsWith('/admin/settings') },
];

function playNotificationSound() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t0 = ctx.currentTime + start;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    };
    playTone(880, 0, 0.18);
    playTone(1175, 0.16, 0.22);
    setTimeout(() => ctx.close(), 600);
  } catch {
    // audio not available
  }
}

export function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(true);
  const knownIds = useRef<Set<string>>(new Set());

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data ?? []) as AdminNotification[]);
    setLoadingNotif(false);
    if (knownIds.current.size === 0) {
      (data ?? []).forEach((n) => knownIds.current.add(n.id));
    }
  };

  useEffect(() => {
    loadNotifications();
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          const n = payload.new as AdminNotification;
          setNotifications((prev) => [n, ...prev]);
          if (!knownIds.current.has(n.id)) {
            knownIds.current.add(n.id);
            playNotificationSound();
            toast('New order received!', 'success');
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAllRead = async () => {
    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5 border-b border-ink-100">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <button
              key={item.to}
              onClick={() => {
                navigate(item.to);
                setMobileOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all',
                active
                  ? 'bg-brand-700 text-white shadow-glow'
                  : 'text-ink-600 hover:bg-ink-100',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-ink-100">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold text-ink-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-ink-100 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white animate-slide-up">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 grid place-items-center h-9 w-9 rounded-xl text-ink-500 hover:bg-ink-100"
            >
              <X size={20} />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-ink-100">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden grid place-items-center h-10 w-10 rounded-xl text-ink-700 hover:bg-ink-100"
              >
                <Menu size={22} />
              </button>
              <div className="lg:hidden">
                <Logo size="sm" showText={false} />
              </div>
              <div className="hidden lg:block">
                <p className="text-sm text-ink-500">Welcome back,</p>
                <p className="text-base font-bold text-ink-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative grid place-items-center h-10 w-10 rounded-xl text-ink-700 hover:bg-ink-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 max-w-[92vw] bg-white rounded-2xl shadow-card border border-ink-100 z-40 animate-scale-in overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
                        <p className="font-bold text-ink-900">Notifications</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                          >
                            <CheckCheck size={14} /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {loadingNotif ? (
                          <div className="p-4 text-sm text-ink-500">Loading…</div>
                        ) : notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-ink-500">No notifications yet.</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={cn(
                                'px-4 py-3 border-b border-ink-50 flex gap-3',
                                !n.is_read && 'bg-brand-50/60',
                              )}
                            >
                              <div
                                className={cn(
                                  'mt-1.5 h-2 w-2 rounded-full shrink-0',
                                  n.is_read ? 'bg-ink-200' : 'bg-brand-600',
                                )}
                              />
                              <div className="min-w-0">
                                <p className="text-sm text-ink-900">{n.message}</p>
                                <p className="text-xs text-ink-400 mt-0.5">
                                  {relativeTime(n.created_at)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
