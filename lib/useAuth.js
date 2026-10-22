'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

// Checks that someone is logged in. If not, sends them to /login.
export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace('/login');
        return;
      }
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!active) return;
      setUser(session.user);
      setProfile(p);
      setLoading(false);
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login');
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return { user, profile, loading };
}
