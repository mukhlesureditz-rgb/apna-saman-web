import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderStatus } from '../../lib/types';
import { OrderSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ORDER_STATUS_META, formatINR, relativeTime, cn } from '../../lib/utils';

const FILTERS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'rejected', label: 'Rejected' },
];

export function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, shop:shops(*)')
        .order('created_at', { ascending: false });
      setOrders((data ?? []) as Order[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel('admin-orders-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        (async () => {
          const { data } = await supabase
            .from('orders')
            .select('*, shop:shops(*)')
            .order('created_at', { ascending: false });
          setOrders((data ?? []) as Order[]);
        })();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-ink-900">Orders</h1>
        <p className="text-sm text-ink-500">{orders.length} total orders</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
              filter === f.key
                ? 'bg-brand-700 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No orders found"
            description="Orders placed by shopkeepers will appear here instantly."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const meta = ORDER_STATUS_META[o.status];
            return (
              <button
                key={o.id}
                onClick={() => navigate(`/admin/orders/${o.id}`)}
                className="card p-4 w-full text-left flex items-center justify-between hover:shadow-soft transition-all animate-fade-in"
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
