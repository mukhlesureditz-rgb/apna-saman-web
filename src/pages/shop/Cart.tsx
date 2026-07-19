import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingCart, Loader2, MapPin, Wallet } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { SmartImage } from '../../components/ui/SmartImage';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { formatINR } from '../../lib/utils';

export function Cart() {
  const navigate = useNavigate();
  const { items, setQty, remove, clear, subtotal, count } = useCart();
  const { shop } = useAuth();
  const toast = useToast();
  const [placing, setPlacing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const placeOrder = async () => {
    if (!shop) {
      toast('Shop profile not loaded. Please sign in again.', 'error');
      return;
    }
    setPlacing(true);

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        shop_id: shop.id,
        owner_user_id: shop.owner_user_id,
        status: 'pending',
        total_amount: subtotal,
        payment_method: 'COD',
        delivery_address: shop.shop_address,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderErr || !order) {
      setPlacing(false);
      toast(orderErr?.message ?? 'Failed to place order', 'error');
      return;
    }

    const lineItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.product.id,
      product_name: i.product.name,
      product_image: i.product.image_url,
      unit: i.product.unit,
      price: Number(i.product.price),
      quantity: i.quantity,
      line_total: Number(i.product.price) * i.quantity,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(lineItems);
    if (itemsErr) {
      setPlacing(false);
      toast(itemsErr.message, 'error');
      return;
    }

    clear();
    setPlacing(false);
    setConfirmOpen(false);
    toast('Order placed successfully!', 'success');
    navigate('/orders', { replace: true });
  };

  if (count === 0) {
    return (
      <div>
        <Header />
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse products and add items to your cart."
          action={
            <button className="btn-primary" onClick={() => navigate('/')}>
              Start shopping
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <Header count={count} />

      <div className="px-4 mt-4 space-y-3">
        {items.map((i) => (
          <div key={i.product.id} className="card p-3 flex gap-3 animate-fade-in">
            <SmartImage
              src={i.product.image_url}
              alt={i.product.name}
              className="h-20 w-20 shrink-0"
              fallbackClassName="h-20 w-20 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-ink-900 text-sm leading-snug line-clamp-2">
                {i.product.name}
              </h3>
              <p className="text-xs text-ink-500 mt-0.5">Per {i.product.unit}</p>
              <p className="mt-1 font-extrabold text-brand-700">{formatINR(i.product.price)}</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-ink-50 rounded-xl p-1">
                  <button
                    onClick={() => setQty(i.product.id, i.quantity - 1)}
                    className="grid place-items-center h-8 w-8 rounded-lg bg-white text-ink-700 shadow-soft"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-7 text-center font-bold text-ink-900">{i.quantity}</span>
                  <button
                    onClick={() => setQty(i.product.id, i.quantity + 1)}
                    className="grid place-items-center h-8 w-8 rounded-lg bg-brand-700 text-white shadow-soft"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  onClick={() => remove(i.product.id)}
                  className="grid place-items-center h-9 w-9 rounded-xl text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="px-4 mt-4">
        <div className="card p-4">
          <h3 className="font-bold text-ink-900 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <Row label={`Items (${count})`} value={formatINR(subtotal)} />
            <Row label="Delivery" value="Free" valueClass="text-brand-700 font-semibold" />
            <div className="border-t border-ink-100 my-2" />
            <Row label="Total" value={formatINR(subtotal)} bold />
          </div>
          <div className="mt-3 flex items-center gap-2 bg-amber-50 text-amber-800 rounded-2xl px-3 py-2.5 text-xs font-semibold">
            <Wallet size={16} /> Cash on Delivery — pay when your order arrives.
          </div>
          {shop && (
            <div className="mt-3 flex items-start gap-2 text-xs text-ink-500">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>Delivering to: {shop.shop_address}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 pb-4">
        <button className="btn-primary w-full text-base" onClick={() => setConfirmOpen(true)}>
          Place Order • {formatINR(subtotal)}
        </button>
      </div>

      <Modal open={confirmOpen} onClose={() => !placing && setConfirmOpen(false)} title="Confirm your order">
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-amber-50 text-amber-800 rounded-2xl px-3 py-2.5 text-sm font-semibold">
            <Wallet size={16} /> Cash on Delivery
          </div>
          <div>
            <label className="label">Delivery notes (optional)</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Any instructions for delivery…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">{count} items</span>
            <span className="font-extrabold text-ink-900 text-lg">{formatINR(subtotal)}</span>
          </div>
          <button className="btn-primary w-full" onClick={placeOrder} disabled={placing}>
            {placing && <Loader2 size={18} className="animate-spin" />}
            {placing ? 'Placing order…' : 'Confirm & Place Order'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Header({ count }: { count?: number }) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-ink-100">
      <div className="flex items-center justify-between px-4 h-16">
        <div>
          <h1 className="text-lg font-extrabold text-ink-900">My Cart</h1>
          {count !== undefined && (
            <p className="text-xs text-ink-500">{count} items in cart</p>
          )}
        </div>
        <ShoppingCart className="text-brand-600" size={22} />
      </div>
    </header>
  );
}

function Row({
  label,
  value,
  bold,
  valueClass,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-extrabold text-ink-900' : 'text-ink-500'}>{label}</span>
      <span className={bold ? 'font-extrabold text-ink-900 text-lg' : valueClass ?? 'text-ink-900 font-semibold'}>
        {value}
      </span>
    </div>
  );
}
