import { useEffect, useState } from 'react';
import { Store, Phone, MapPin, User, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Shop } from '../../lib/types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';

export function AdminShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });
      setShops((data ?? []) as Shop[]);
      setLoading(false);
    })();
  }, []);

  const filtered = shops.filter(
    (s) =>
      s.shop_name.toLowerCase().includes(search.toLowerCase()) ||
      s.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile_number.includes(search),
  );

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-ink-900">Registered Shops</h1>
        <p className="text-sm text-ink-500">{shops.length} shops onboarded</p>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          className="input pl-11"
          placeholder="Search by shop, owner or mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Store}
            title="No shops found"
            description="Registered shopkeepers will appear here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="card p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shrink-0">
                  <Store size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-ink-900 line-clamp-1">{s.shop_name}</h3>
                    <Badge
                      className={s.is_active ? 'bg-brand-100 text-brand-800' : 'bg-ink-100 text-ink-600'}
                    >
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">Joined {formatDate(s.created_at)}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                <div className="flex items-center gap-2 text-ink-700">
                  <User size={15} className="text-ink-400" /> {s.owner_name}
                </div>
                <div className="flex items-center gap-2 text-ink-700">
                  <Phone size={15} className="text-ink-400" /> {s.mobile_number}
                </div>
                <div className="flex items-start gap-2 text-ink-700 sm:col-span-2">
                  <MapPin size={15} className="text-ink-400 mt-0.5 shrink-0" /> {s.shop_address}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
