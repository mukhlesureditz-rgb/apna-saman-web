import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Truck, ShieldCheck, X, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Category, Product } from '../../lib/types';
import { ProductCard } from '../../components/shop/ProductCard';
import { ProductGridSkeleton, CategorySkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { cn } from '../../lib/utils';

export function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');

  useEffect(() => {
    (async () => {
      const [pRes, cRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      ]);
      setProducts((pRes.data ?? []) as Product[]);
      setCategories((cRes.data ?? []) as Category[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCat !== 'all') list = list.filter((p) => p.category_id === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, activeCat, search]);

  return (
    <div>
      {/* Header */}
      <header className="bg-gradient-to-br from-brand-700 to-brand-900 text-white px-4 pt-5 pb-6 rounded-b-3xl shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-100 text-xs font-semibold tracking-wide">APNA SAMAN</p>
            <h1 className="text-xl font-extrabold">Har Dukaan Ka Wholesale Partner</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
            <Clock size={14} className="text-brand-100" />
            <span className="text-xs font-bold">20 min delivery</span>
          </div>
        </div>

        <div className="mt-4 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="w-full rounded-2xl bg-white pl-11 pr-10 py-3.5 text-sm text-ink-900 placeholder:text-ink-400 shadow-soft focus:outline-none"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Promo banner */}
      <div className="px-4 mt-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-brand-800 text-white p-5 shadow-glow">
          <div className="relative z-10">
            <p className="text-brand-100 text-xs font-bold tracking-wider uppercase">Wholesale made easy</p>
            <h2 className="mt-1 text-lg font-extrabold leading-tight">
              Order stock for your shop, <br /> delivered in 20 minutes.
            </h2>
            <div className="mt-3 flex gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Truck size={16} /> Free delivery
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <ShieldCheck size={16} /> Cash on delivery
              </div>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 -top-8 h-24 w-24 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-ink-900">Categories</h2>
          <button
            onClick={() => navigate('/categories')}
            className="text-sm font-semibold text-brand-700"
          >
            View all
          </button>
        </div>
        {loading ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <CategoryPill
              active={activeCat === 'all'}
              label="All"
              onClick={() => setActiveCat('all')}
            />
            {categories.map((c) => (
              <CategoryPill
                key={c.id}
                active={activeCat === c.id}
                label={c.name}
                onClick={() => setActiveCat(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-ink-900">
            {activeCat === 'all' ? 'All Products' : 'Products'}
          </h2>
          <span className="text-xs text-ink-500 flex items-center gap-1">
            <SlidersHorizontal size={13} /> {filtered.length} items
          </span>
        </div>
        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No products found"
            description="Try a different search or category."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap',
        active
          ? 'bg-brand-700 text-white shadow-glow'
          : 'bg-white text-ink-700 border border-ink-200 hover:bg-brand-50',
      )}
    >
      {label}
    </button>
  );
}
