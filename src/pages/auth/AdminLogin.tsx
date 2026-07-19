import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';

export function AdminLogin() {
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast(error.message, 'error');
      return;
    }
    const role = (data.user?.app_metadata?.role as string) || '';
    if (role !== 'admin') {
      await supabase.auth.signOut();
      setLoading(false);
      toast('This account does not have admin access.', 'error');
      return;
    }
    toast('Welcome, Admin!', 'success');
    navigate('/admin', { replace: true });
  };

  return (
    <AuthShell
      admin
      title="Admin Login"
      subtitle="Secure access for the APNA SAMAN business owner."
      footer={
        <div className="flex items-center justify-center gap-1.5 text-ink-400">
          <ShieldCheck size={14} /> Authorized personnel only
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Admin Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="email"
              className="input pl-11"
              placeholder="admin@apnasaman.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="Admin password"
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
          {loading ? 'Signing in…' : 'Sign In to Dashboard'}
        </button>
      </form>
    </AuthShell>
  );
}
