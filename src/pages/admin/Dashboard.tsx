import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  LayoutGrid,
  ClipboardList,
  Store,
  Clock,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../lib/types';
import { OrderSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ORDER_STATUS_META, formatINR, formatDate, relativeTime, cn } from '../../lib/utils';

interface Stats {
  products: number;
  categories: number;
  orders: number;
  shops: number;
  pending: number;
  delivered: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, c, o, s, pending, delivered, recentRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('shops').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
        supabase
          .from('orders')
          .select('*, shop:shops(*)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      setStats({
        products: p.count ?? 0,
        categories: c.count ?? 0,
        orders: o.count ?? 0,
        shops: s.count ?? 0,
        pending: pending.count ?? 0,
        delivered: delivered.count ?? 0,
      });
      setRecent((recentRes.data ?? []) as Order[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500">Overview of your wholesale business</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats?.products ?? null}
          color="from-brand-600 to-brand-800"
          to="/admin/products"
        />
        <StatCard
          icon={LayoutGrid}
          label="Categories"
          value={stats?.categories ?? null}
          color="from-blue-600 to-blue-800"
          to="/admin/categories"
        />
        <StatCard
          icon={ClipboardList}
          label="Total Orders"
          value={stats?.orders ?? null}
          color="from-indigo-600 to-indigo-800"
          to="/admin/orders"
        />
        <StatCard
          icon={Store}
          label="Registered Shops"
          value={stats?.shops ?? null}
          color="from-amber-600 to-amber-700"
          to="/admin/shops"
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={stats?.pending ?? null}
          color="from-orange-500 to-orange-700"
          to="/admin/orders"
        />
        <StatCard
          icon={CheckCircle2}
          label="Delivered Orders"
          value={stats?.delivered ?? null}
          color="from-brand-600 to-brand-800"
          to="/admin/orders"
        />
      </div>

      {/* Recent orders */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-ink-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-600" /> Recent Orders
          </h2>
          <Link to="/admin/orders" className="text-sm font-semibold text-brand-700">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={ClipboardList}
              title="No orders yet"
              description="When shopkeepers place orders, they'll appear here instantly."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((o) => {
              const meta = ORDER_STATUS_META[o.status];
              return (
                <Link
                  key={o.id}
                  to={`/admin/orders/${o.id}`}
                  className="card p-4 flex items-center justify-between hover:shadow-soft transition-all animate-fade-in"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-ink-900">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <Badge className={meta.color} dot={meta.dot}>
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-500 mt-1">
                      {o.shop?.shop_name ?? 'Unknown shop'} • {relativeTime(o.created_at)}
                    </p>
                    <p className="mt-1 font-extrabold text-brand-700">{formatINR(o.total_amount)}</p>
                  </div>
                  <ChevronRight size={20} className="text-ink-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  to,
}: {
  icon: typeof Package;
  label: string;
  value: number | null;
  color: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="card p-4 flex flex-col gap-3 hover:shadow-soft transition-all animate-fade-in"
    >
      <div className={cn('grid place-items-center h-11 w-11 rounded-2xl bg-gradient-to-br text-white', color)}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-ink-900">
          {value === null ? '—' : value}
        </p>
        <p className="text-xs font-semibold text-ink-500">{label}</p>
      </div>
    </Link>
  );
}
