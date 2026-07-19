import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Order, OrderStatus } from '../../lib/types';
import { OrderSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ORDER_STATUS_META, formatINR, formatDate, cn } from '../../lib/utils';

const FILTERS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((data ?? []) as Order[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel('shop-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `owner_user_id=eq.${user.id}` },
        () => {
          (async () => {
            const { data } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('owner_user_id', user.id)
              .order('created_at', { ascending: false });
            setOrders((data ?? []) as Order[]);
          })();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-ink-100">
        <div className="flex items-center justify-between px-4 h-16">
          <div>
            <h1 className="text-lg font-extrabold text-ink-900">My Orders</h1>
            <p className="text-xs text-ink-500">{orders.length} total orders</p>
          </div>
          <ClipboardList className="text-brand-600" size={22} />
        </div>
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
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
      </header>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <OrderSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            description="When you place an order, it will appear here."
            action={
              <button className="btn-primary" onClick={() => navigate('/')}>
                Browse products
              </button>
            }
          />
        ) : (
          filtered.map((o) => {
            const meta = ORDER_STATUS_META[o.status];
            const itemCount = o.order_items?.length ?? 0;
            return (
              <button
                key={o.id}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="card p-4 w-full text-left flex items-center justify-between hover:shadow-soft transition-all animate-fade-in"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink-900">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </p>
                    <Badge className={meta.color} dot={meta.dot}>
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-500 mt-1">
                    {itemCount} item{itemCount > 1 ? 's' : ''} • {formatDate(o.created_at)}
                  </p>
                  <p className="mt-1.5 font-extrabold text-brand-700">{formatINR(o.total_amount)}</p>
                </div>
                <ChevronRight size={20} className="text-ink-400 shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
