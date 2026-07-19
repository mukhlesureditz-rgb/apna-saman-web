import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { withSalt } from '../../lib/auth';

export function ShopLogin() {
  const toast = useToast();
  const navigate = useNavigate();
  const { refreshShop } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      toast('Enter a valid 10-digit mobile number', 'error');
      return;
    }
    setLoading(true);
    const fakeEmail = `${mobile}@apnasaman.shop`;
    const { error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: withSalt(password),
    });
    if (error) {
      setLoading(false);
      toast(error.message.includes('Invalid login') ? 'Invalid mobile or password' : error.message, 'error');
      return;
    }
    await refreshShop();
    toast('Welcome back!', 'success');
    navigate('/', { replace: true });
  };

  return (
    <AuthShell
      title="Shopkeeper Login"
      subtitle="Sign in to order wholesale products for your shop."
      footer={
        <>
          New shopkeeper?{' '}
          <Link to="/register" className="font-bold text-brand-700 hover:text-brand-800">
            Register your shop
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Mobile Number</label>
          <div className="relative">
            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-11"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
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
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <Link
          to="/admin/login"
          className="block text-center text-xs font-semibold text-ink-400 hover:text-ink-700"
        >
          Admin login →
        </Link>
      </form>
    </AuthShell>
  );
}
