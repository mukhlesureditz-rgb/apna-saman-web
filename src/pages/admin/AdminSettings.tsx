import { useEffect, useState } from 'react';
import { Loader2, Save, Truck, MapPin, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AdminSettings } from '../../lib/types';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';

export function AdminSettings() {
  const toast = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ delivery_fee: '0', delivery_radius_km: '5' });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 'admin')
        .maybeSingle();
      const s = data as AdminSettings | null;
      setSettings(s);
      setForm({
        delivery_fee: s ? String(s.delivery_fee) : '0',
        delivery_radius_km: s ? String(s.delivery_radius_km) : '5',
      });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const payload = {
      id: 'admin',
      delivery_fee: Number(form.delivery_fee) || 0,
      delivery_radius_km: Number(form.delivery_radius_km) || 5,
    };
    const { error } = await supabase
      .from('admin_settings')
      .upsert(payload, { onConflict: 'id' });
    setSaving(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Settings saved', 'success');
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500">Manage your delivery and account settings</p>
      </div>

      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="font-bold text-ink-900 flex items-center gap-2 mb-4">
            <Truck size={18} className="text-brand-600" /> Delivery Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">Delivery Fee (₹)</label>
              <input
                type="number"
                inputMode="decimal"
                className="input"
                value={form.delivery_fee}
                onChange={(e) => setForm((f) => ({ ...f, delivery_fee: e.target.value }))}
              />
              <p className="text-xs text-ink-400 mt-1">Set 0 for free delivery.</p>
            </div>
            <div>
              <label className="label">Delivery Radius (km)</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="number"
                  inputMode="numeric"
                  className="input pl-11"
                  value={form.delivery_radius_km}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_radius_km: e.target.value }))}
                />
              </div>
            </div>
            <button className="btn-primary w-full" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-bold text-ink-900 flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-brand-600" /> Admin Account
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-ink-500">Admin Email</p>
              <p className="text-sm text-ink-900 font-semibold">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 bg-brand-50 text-brand-800 rounded-2xl px-3 py-2.5 text-xs font-semibold">
              <ShieldCheck size={14} /> This account has admin access.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
