import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Category, Product } from '../../lib/types';
import { SmartImage } from '../../components/ui/SmartImage';
import { ProductCard } from '../../components/shop/ProductCard';
import { ProductGridSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { cn } from '../../lib/utils';

export function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [cRes, pRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);
      setCategories((cRes.data ?? []) as Category[]);
      setProducts((pRes.data ?? []) as Product[]);
      setLoading(false);
    })();
  }, []);

  const filtered = active ? products.filter((p) => p.category_id === active) : products;

  return (
    <div>
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-ink-100">
        <div className="flex items-center gap-3 px-4 h-16">
          <button
            onClick={() => navigate('/')}
            className="grid place-items-center h-10 w-10 rounded-xl text-ink-700 hover:bg-ink-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-ink-900">Categories</h1>
            <p className="text-xs text-ink-500">Browse by product type</p>
          </div>
        </div>
      </header>

      <div className="px-4 mt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="No categories yet"
            description="Check back soon for our wholesale catalog."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActive(null)}
              className={cn(
                'card p-3 flex items-center gap-3 text-left transition-all',
                !active && 'ring-2 ring-brand-500',
              )}
            >
              <div className="grid place-items-center h-12 w-12 rounded-2xl bg-brand-100 text-brand-700">
                <LayoutGrid size={22} />
              </div>
              <div>
                <p className="font-bold text-ink-900 text-sm">All Products</p>
                <p className="text-xs text-ink-500">{products.length} items</p>
              </div>
            </button>
            {categories.map((c) => {
              const count = products.filter((p) => p.category_id === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={cn(
                    'card p-3 flex items-center gap-3 text-left transition-all',
                    active === c.id && 'ring-2 ring-brand-500',
                  )}
                >
                  <SmartImage
                    src={c.image_url}
                    alt={c.name}
                    className="h-12 w-12 shrink-0"
                    fallbackClassName="h-12 w-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-ink-900 text-sm truncate">{c.name}</p>
                    <p className="text-xs text-ink-500">{count} items</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 mt-6">
        <h2 className="font-extrabold text-ink-900 mb-3">
          {active ? categories.find((c) => c.id === active)?.name : 'All Products'}
        </h2>
        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="No products in this category"
            description="Try another category."
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
