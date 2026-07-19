import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Phone, MapPin, LogOut, Loader2, Edit3, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { Logo } from '../../components/ui/Logo';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';

export function Profile() {
  const { shop, user, signOut, refreshShop } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [form, setForm] = useState({
    shop_name: shop?.shop_name ?? '',
    owner_name: shop?.owner_name ?? '',
    mobile_number: shop?.mobile_number ?? '',
    shop_address: shop?.shop_address ?? '',
  });

  const openEdit = () => {
    setForm({
      shop_name: shop?.shop_name ?? '',
      owner_name: shop?.owner_name ?? '',
      mobile_number: shop?.mobile_number ?? '',
      shop_address: shop?.shop_address ?? '',
    });
    setEditing(true);
  };

  const save = async () => {
    if (!shop) return;
    if (!form.shop_name || !form.owner_name || !form.shop_address) {
      toast('Please fill all fields', 'error');
      return;
    }
    if (!/^\d{10}$/.test(form.mobile_number)) {
      toast('Enter a valid 10-digit mobile number', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('shops')
      .update({
        shop_name: form.shop_name,
        owner_name: form.owner_name,
        mobile_number: form.mobile_number,
        shop_address: form.shop_address,
      })
      .eq('id', shop.id);
    setSaving(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    await refreshShop();
    setEditing(false);
    toast('Profile updated', 'success');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  if (!shop) {
    return (
      <div>
        <div className="px-4 pt-4">
          <h1 className="text-lg font-extrabold text-ink-900">Profile</h1>
        </div>
        {retrying ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="animate-spin text-brand-600" size={28} />
            <p className="mt-3 text-sm text-ink-500">Loading your shop profile…</p>
          </div>
        ) : (
          <EmptyState
            icon={Store}
            title="Shop profile not found"
            description="We couldn't load your shop details. Please try again."
            action={
              <button
                className="btn-primary"
                onClick={async () => {
                  setRetrying(true);
                  await refreshShop();
                  setRetrying(false);
                }}
              >
                Retry
              </button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <header className="bg-gradient-to-br from-brand-700 to-brand-900 text-white px-4 pt-6 pb-8 rounded-b-3xl">
        <Logo size="sm" variant="light" />
        <div className="mt-5 flex items-center gap-4">
          <div className="grid place-items-center h-16 w-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
            <Store size={28} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">{shop.shop_name}</h1>
            <p className="text-sm text-brand-100">{shop.owner_name}</p>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-4">
        <div className="card p-4 space-y-4">
          <InfoRow icon={Store} label="Shop Name" value={shop.shop_name} />
          <InfoRow icon={User} label="Owner Name" value={shop.owner_name} />
          <InfoRow icon={Phone} label="Mobile Number" value={shop.mobile_number} />
          <InfoRow icon={MapPin} label="Shop Address" value={shop.shop_address} multiline />
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        <button className="btn-secondary w-full" onClick={openEdit}>
          <Edit3 size={18} /> Edit Shop Details
        </button>
        <button
          className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      <div className="px-4 mt-6 mb-4">
        <div className="flex items-center justify-center gap-1.5 text-xs text-ink-400">
          <Shield size={13} /> Secured by APNA SAMAN
        </div>
      </div>

      <Modal open={editing} onClose={() => !saving && setEditing(false)} title="Edit Shop Details">
        <div className="space-y-4">
          <Field label="Shop Name" value={form.shop_name} onChange={(v) => setForm((f) => ({ ...f, shop_name: v }))} />
          <Field label="Owner Name" value={form.owner_name} onChange={(v) => setForm((f) => ({ ...f, owner_name: v }))} />
          <Field
            label="Mobile Number"
            value={form.mobile_number}
            onChange={(v) => setForm((f) => ({ ...f, mobile_number: v.replace(/\D/g, '') }))}
            maxLength={10}
          />
          <div>
            <label className="label">Shop Address</label>
            <textarea
              className="input min-h-[88px] resize-none"
              value={form.shop_address}
              onChange={(e) => setForm((f) => ({ ...f, shop_address: e.target.value }))}
            />
          </div>
          <button className="btn-primary w-full" onClick={save} disabled={saving}>
            {saving && <Loader2 size={18} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
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
      <div className="grid place-items-center h-10 w-10 rounded-xl bg-brand-50 text-brand-700 shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-500">{label}</p>
        <p className={`text-sm text-ink-900 font-semibold ${multiline ? '' : 'truncate'}`}>{value}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} />
    </div>
  );
}
