import { Plus, Check, Minus } from 'lucide-react';
import { SmartImage } from '../ui/SmartImage';
import { Badge } from '../ui/Badge';
import { useCart } from '../../context/CartContext';
import { formatINR, STOCK_STATUS_META, cn } from '../../lib/utils';
import { sfx } from '../../lib/sound';
import type { Product } from '../../lib/types';

export function ProductCard({ product }: { product: Product }) {
  const { add, getItem, setQty } = useCart();
  const inCart = getItem(product.id);
  const outOfStock = product.stock_status === 'out_of_stock' || !product.is_active;
  const stock = STOCK_STATUS_META[product.stock_status];

  return (
    <div className="card p-3 flex flex-col animate-fade-in">
      <div className="relative">
        <SmartImage
          src={product.image_url}
          alt={product.name}
          className="aspect-square w-full"
          fallbackClassName="aspect-square w-full"
        />
        <div className="absolute top-2 left-2">
          <Badge className={cn('bg-white/90 backdrop-blur', stock.color)}>{stock.label}</Badge>
        </div>
      </div>
      <div className="mt-3 flex-1">
        <h3 className="font-bold text-ink-900 text-sm leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-xs text-ink-500 mt-0.5">Per {product.unit}</p>
        <p className="mt-1.5 text-lg font-extrabold text-brand-700">{formatINR(product.price)}</p>
      </div>
      {outOfStock ? (
        <button disabled className="btn-secondary w-full opacity-60 mt-2">
          Out of Stock
        </button>
      ) : inCart ? (
        <div className="flex items-center justify-between gap-2 mt-2 bg-brand-50 rounded-2xl p-1">
          <button
            onClick={() => { sfx.tap(); setQty(product.id, inCart.quantity - 1); }}
            className="grid place-items-center h-9 w-9 rounded-xl bg-white text-brand-700 shadow-soft hover:bg-brand-100"
          >
            <Minus size={16} />
          </button>
          <span className="font-bold text-brand-800">{inCart.quantity}</span>
          <button
            onClick={() => { sfx.tap(); setQty(product.id, inCart.quantity + 1); }}
            className="grid place-items-center h-9 w-9 rounded-xl bg-brand-700 text-white shadow-soft hover:bg-brand-800"
          >
            <Plus size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => add(product, 1)}
          className="btn-primary w-full mt-2 py-2.5 text-sm"
        >
          <Plus size={16} /> Add to Cart
        </button>
      )}
    </div>
  );
}
