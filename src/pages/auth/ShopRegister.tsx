import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Phone, Lock, MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { withSalt } from '../../lib/auth';

export function ShopRegister() {
  const toast = useToast();
  const navigate = useNavigate();
  const { refreshShop } = useAuth();
  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    mobile_number: '',
    password: '',
    shop_address: '',
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shop_name || !form.owner_name || !form.shop_address) {
      toast('Please fill all fields', 'error');
      return;
    }
    if (!/^\d{10}$/.test(form.mobile_number)) {
      toast('Enter a valid 10-digit mobile number', 'error');
      return;
    }
    if (form.password.length < 4) {
      toast('Password must be at least 4 characters', 'error');
      return;
    }
    setLoading(true);

    const fakeEmail = `${form.mobile_number}@apnasaman.shop`;
    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password: withSalt(form.password),
    });

    if (error) {
      setLoading(false);
      toast(error.message, 'error');
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      toast('Registration failed. Please try again.', 'error');
      return;
    }

    const { error: shopError } = await supabase.from('shops').insert({
      owner_user_id: userId,
      shop_name: form.shop_name,
      owner_name: form.owner_name,
      mobile_number: form.mobile_number,
      shop_address: form.shop_address,
    });

    if (shopError) {
      setLoading(false);
      toast(shopError.message, 'error');
      return;
    }

    // Race fix: signUp ne onAuthStateChange trigger kiya hoga jisme shop
    // abhi insert nahi hua tha. Ab insert ho gaya, isliye context refresh karo.
    await refreshShop();
    setLoading(false);
    toast('Registration successful! Welcome to APNA SAMAN.', 'success');
    navigate('/', { replace: true });
  };

  return (
    <AuthShell
      title="Register Your Shop"
      subtitle="Join APNA SAMAN and order wholesale in 20 minutes."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Shop Name</label>
          <div className="relative">
            <Store size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-11"
              placeholder="e.g. Sharma Kirana Store"
              value={form.shop_name}
              onChange={(e) => set('shop_name', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Owner Name</label>
          <div className="relative">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-11"
              placeholder="Your full name"
              value={form.owner_name}
              onChange={(e) => set('owner_name', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Mobile Number</label>
          <div className="relative">
            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-11"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={form.mobile_number}
              onChange={(e) => set('mobile_number', e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type={show ? 'text' : 'password'}
              className="input pl-11 pr-11"
              placeholder="Choose any password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Shop Address</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3.5 top-4 text-ink-400" />
            <textarea
              className="input pl-11 min-h-[88px] resize-none"
              placeholder="Full shop address with area / landmark"
              value={form.shop_address}
              onChange={(e) => set('shop_address', e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Registering…' : 'Register Shop'}
        </button>
      </form>
    </AuthShell>
  );
}
