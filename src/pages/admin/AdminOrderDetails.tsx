import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Wallet,
  Phone,
  User,
  Store,
  Check,
  X,
  Truck,
  CheckCircle2,
  Loader2,
  Package,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderStatus } from '../../lib/types';
import { useToast } from '../../components/ui/Toast';
import { SmartImage } from '../../components/ui/SmartImage';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ORDER_STATUS_META, formatINR, formatDate, cn } from '../../lib/utils';

export function AdminOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), shop:shops(*)')
      .eq('id', id)
      .maybeSingle();
    setOrder(data as Order | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!id) return;
    const channel = supabase
      .channel(`admin-order-${id}`)
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
  }, [id]);

  const updateStatus = async (status: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id);
    setUpdating(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast(`Order marked as ${ORDER_STATUS_META[status].label}`, 'success');
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
        <EmptyState icon={Package} title="Order not found" />
      </div>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const shop = order.shop;

  return (
    <div>
      <BackHeader />

      <div className="space-y-4">
        {/* Header card */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-500">Order ID</p>
              <p className="font-extrabold text-ink-900 text-lg">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <Badge className={meta.color} dot={meta.dot}>
              {meta.label}
            </Badge>
          </div>
          <p className="text-xs text-ink-500 mt-2">{formatDate(order.created_at)}</p>
        </div>

        {/* Shop info */}
        {shop && (
          <div className="card p-4">
            <h3 className="font-bold text-ink-900 mb-3 flex items-center gap-2">
              <Store size={18} className="text-brand-600" /> Shop Details
            </h3>
            <div className="space-y-3">
              <InfoRow icon={Store} label="Shop Name" value={shop.shop_name} />
              <InfoRow icon={User} label="Owner" value={shop.owner_name} />
              <InfoRow icon={Phone} label="Mobile" value={shop.mobile_number} />
              <InfoRow icon={MapPin} label="Address" value={shop.shop_address} multiline />
            </div>
          </div>
        )}

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

        {/* Payment + notes */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Wallet size={18} className="text-brand-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-ink-500">Payment</p>
              <p className="text-sm text-ink-900">Cash on Delivery</p>
            </div>
          </div>
          {order.notes && (
            <div className="flex items-start gap-3">
              <Package size={18} className="text-brand-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-ink-500">Notes</p>
                <p className="text-sm text-ink-900">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="card p-4">
          <h3 className="font-bold text-ink-900 mb-3">Update Order Status</h3>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              icon={Check}
              label="Accept"
              color="bg-blue-600 hover:bg-blue-700"
              disabled={order.status !== 'pending' || updating}
              onClick={() => updateStatus('accepted')}
            />
            <ActionButton
              icon={X}
              label="Reject"
              color="bg-red-600 hover:bg-red-700"
              disabled={order.status !== 'pending' || updating}
              onClick={() => setRejectOpen(true)}
            />
            <ActionButton
              icon={Truck}
              label="Out for Delivery"
              color="bg-indigo-600 hover:bg-indigo-700"
              disabled={order.status !== 'accepted' || updating}
              onClick={() => updateStatus('out_for_delivery')}
            />
            <ActionButton
              icon={CheckCircle2}
              label="Mark Delivered"
              color="bg-brand-700 hover:bg-brand-800"
              disabled={order.status !== 'out_for_delivery' || updating}
              onClick={() => updateStatus('delivered')}
            />
          </div>
          {updating && (
            <p className="mt-2 text-xs text-ink-500 flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" /> Updating…
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        title="Reject this order?"
        message="The shopkeeper will be notified that this order was rejected."
        confirmLabel="Reject Order"
        onConfirm={async () => {
          setRejectOpen(false);
          await updateStatus('rejected');
        }}
        onClose={() => setRejectOpen(false)}
      />
    </div>
  );
}

function BackHeader() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-ink-100 -mx-4 lg:-mx-8 px-4 lg:px-8">
      <div className="flex items-center gap-3 h-16">
        <button
          onClick={() => navigate('/admin/orders')}
          className="grid place-items-center h-10 w-10 rounded-xl text-ink-700 hover:bg-ink-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-ink-900">Order Details</h1>
      </div>
    </header>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  multiline,
}: {
  icon: typeof Store;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="grid place-items-center h-9 w-9 rounded-xl bg-brand-50 text-brand-700 shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-500">{label}</p>
        <p className={`text-sm text-ink-900 font-semibold ${multiline ? '' : 'truncate'}`}>{value}</p>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  color,
  disabled,
  onClick,
}: {
  icon: typeof Check;
  label: string;
  color: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none',
        color,
      )}
    >
      <Icon size={16} /> {label}
    </button>
  );
}
