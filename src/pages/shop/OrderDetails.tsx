import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Wallet, Clock, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import type { Order } from '../../lib/types';
import { SmartImage } from '../../components/ui/SmartImage';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ORDER_STATUS_META, formatINR, formatDate, cn } from '../../lib/utils';
import { Package } from 'lucide-react';

const STEPS: { key: Order['status']; label: string }[] = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();
    setOrder(data as Order | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!id || !user) return;
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const cancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id);
    setCancelling(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setCancelOpen(false);
    toast('Order cancelled', 'success');
    load();
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <BackHeader />
        <EmptyState icon={Package} title="Order not found" description="This order may have been removed." />
      </div>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const currentStepIdx = STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';
  const canCancel = order.status === 'pending';

  return (
    <div>
      <BackHeader />

      <div className="px-4 mt-4 space-y-4">
        {/* Status tracker */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-500">Order</p>
              <p className="font-extrabold text-ink-900">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <Badge className={meta.color} dot={meta.dot}>
              {meta.label}
            </Badge>
          </div>
          <p className="text-xs text-ink-500 mt-2">{formatDate(order.created_at)}</p>

          {!isCancelled ? (
            <div className="mt-5">
              <div className="flex items-center">
                {STEPS.map((step, idx) => (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div
                      className={cn(
                        'grid place-items-center h-8 w-8 rounded-full text-xs font-bold shrink-0',
                        idx <= currentStepIdx ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400',
                      )}
                    >
                      {idx + 1}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'h-1 flex-1 mx-1 rounded-full',
                          idx < currentStepIdx ? 'bg-brand-600' : 'bg-ink-100',
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {STEPS.map((step, idx) => (
                  <span
                    key={step.key}
                    className={cn(
                      'text-[10px] font-semibold text-center flex-1',
                      idx <= currentStepIdx ? 'text-brand-700' : 'text-ink-400',
                    )}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 bg-red-50 text-red-700 rounded-2xl px-3 py-2.5 text-sm font-semibold">
              <X size={16} /> This order was {order.status === 'rejected' ? 'rejected' : 'cancelled'}.
            </div>
          )}
        </div>

        {/* Items */}
        <div className="card p-4">
          <h3 className="font-bold text-ink-900 mb-3">Items ({order.order_items?.length ?? 0})</h3>
          <div className="space-y-3">
            {order.order_items?.map((it) => (
              <div key={it.id} className="flex gap-3">
                <SmartImage
                  src={it.product_image}
                  alt={it.product_name}
                  className="h-14 w-14 shrink-0"
                  fallbackClassName="h-14 w-14 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink-900 text-sm line-clamp-1">{it.product_name}</p>
                  <p className="text-xs text-ink-500">
                    {formatINR(it.price)} × {it.quantity} {it.unit}
                  </p>
                </div>
                <p className="font-bold text-ink-900">{formatINR(it.line_total)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-ink-100 mt-3 pt-3 flex justify-between">
            <span className="font-bold text-ink-900">Total</span>
            <span className="font-extrabold text-brand-700 text-lg">{formatINR(order.total_amount)}</span>
          </div>
        </div>

        {/* Info */}
        <div className="card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-brand-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-ink-500">Delivery Address</p>
              <p className="text-sm text-ink-900">{order.delivery_address}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wallet size={18} className="text-brand-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-ink-500">Payment</p>
              <p className="text-sm text-ink-900">Cash on Delivery</p>
            </div>
          </div>
          {order.notes && (
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-brand-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-ink-500">Notes</p>
                <p className="text-sm text-ink-900">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {canCancel && (
          <button
            className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setCancelOpen(true)}
          >
            Cancel Order
          </button>
        )}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this order?"
        message="Are you sure you want to cancel this order? This cannot be undone."
        confirmLabel="Yes, Cancel"
        onConfirm={cancelOrder}
        onClose={() => !cancelling && setCancelOpen(false)}
        loading={cancelling}
      />
    </div>
  );
}

function BackHeader() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-ink-100">
      <div className="flex items-center gap-3 px-4 h-16">
        <button
          onClick={() => navigate('/orders')}
          className="grid place-items-center h-10 w-10 rounded-xl text-ink-700 hover:bg-ink-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-ink-900">Order Details</h1>
      </div>
    </header>
  );
}
