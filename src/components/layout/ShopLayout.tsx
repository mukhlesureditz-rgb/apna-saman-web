import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { cn } from '../../lib/utils';

const tabs = [
  { to: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { to: '/categories', label: 'Categories', icon: LayoutGrid, match: (p: string) => p.startsWith('/categories') },
  { to: '/cart', label: 'Cart', icon: ShoppingCart, match: (p: string) => p.startsWith('/cart') },
  { to: '/orders', label: 'Orders', icon: ClipboardList, match: (p: string) => p.startsWith('/orders') },
  { to: '/profile', label: 'Profile', icon: User, match: (p: string) => p.startsWith('/profile') },
];

export function ShopLayout() {
  const { count } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-50 pb-24 max-w-3xl mx-auto">
      <main className="min-h-[60vh]">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 max-w-3xl mx-auto">
        <div className="mx-3 mb-3 rounded-3xl bg-white/95 backdrop-blur-md shadow-card border border-ink-100 px-2 py-1.5">
          <ul className="grid grid-cols-5">
            {tabs.map((t) => {
              const active = t.match(pathname);
              const Icon = t.icon;
              return (
                <li key={t.to}>
                  <button
                    onClick={() => navigate(t.to)}
                    className={cn(
                      'relative w-full flex flex-col items-center gap-1 py-2 rounded-2xl transition-all',
                      active ? 'text-brand-700' : 'text-ink-400 hover:text-ink-700',
                    )}
                  >
                    <div className="relative">
                      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                      {t.to === '/cart' && count > 0 && (
                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className={cn('text-[11px] font-semibold', active && 'text-brand-700')}>
                      {t.label}
                    </span>
                    {active && (
                      <span className="absolute -top-0.5 h-1 w-8 rounded-full bg-brand-600" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}
