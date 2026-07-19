import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Shop } from '../lib/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  shop: Shop | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshShop: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = (user?.app_metadata?.role as string) === 'admin';

  const loadShop = async (uid: string) => {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_user_id', uid)
      .maybeSingle();
    if (!data) {
      // Race condition fix: signUp ne onAuthStateChange trigger kiya hoga
      // jab shop row abhi insert nahi hua tha. Ek baar retry karte hain.
      await new Promise((r) => setTimeout(r, 600));
      const { data: retry } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_user_id', uid)
        .maybeSingle();
      setShop(retry as Shop | null);
      return;
    }
    setShop(data as Shop | null);
  };

  const refreshShop = async () => {
    if (user) await loadShop(user.id);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      const done = data.session?.user
        ? loadShop(data.session.user.id)
        : Promise.resolve();
      done.finally(() => mounted && setLoading(false));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await loadShop(newSession.user.id);
        } else {
          setShop(null);
        }
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setShop(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, shop, loading, isAdmin, signOut, refreshShop }}
    >
      {children}
    </AuthContext.Provider>
  );
}
