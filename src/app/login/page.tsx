'use client';

import { supabase } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // Kalau sudah login, langsung lempar ke beranda
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) router.replace('/'); // auto-redirect setelah klik magic link
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Masuk</h1>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          magicLink
          appearance={{ theme: ThemeSupa }}
          // pastikan ini cocok dengan yang kamu set di Supabase → Authentication → URL Configuration
          redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
        />
        <p className="text-xs text-gray-500">
          Masukkan email kerja kamu. Cek inbox/spam untuk magic link-nya.
        </p>
      </div>
    </main>
  );
}
