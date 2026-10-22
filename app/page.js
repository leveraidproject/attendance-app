'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// The home page just sends people to the right place.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      router.replace(data.session ? '/dashboard' : '/login');
    });
  }, [router]);
  return <p className="p-8 text-sm text-ink/60">Loading…</p>;
}
