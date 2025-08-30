'use client';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

type Row = {
  a_date: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
};

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [today, setToday] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  async function fetchToday() {
    if (!userId) return;
    const { data, error } = await supabase
      .from('attendance')
      .select('a_date, clock_in_at, clock_out_at')
      .eq('a_date', new Date().toISOString().slice(0,10)) // aman karena a_date diset dari server (WIB)
      .eq('user_id', userId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') console.error(error);
    setToday(data ?? null);
  }

  useEffect(() => { fetchToday(); }, [userId]);

  async function onClockIn() {
    setLoading(true);
    await supabase.rpc('clock_in');
    await fetchToday();
    setLoading(false);
    setNote('Clock-in berhasil.');
  }
  async function onClockOut() {
    setLoading(true);
    await supabase.rpc('clock_out');
    await fetchToday();
    setLoading(false);
    setNote('Clock-out berhasil.');
  }

  if (!userId) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <a className="underline" href="/login">Login dulu →</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Absensi Hari Ini</h1>
        <button
          className="text-sm underline"
          onClick={() => supabase.auth.signOut().then(()=>location.reload())}
        >
          Keluar
        </button>
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <div>Tanggal: <b>{format(new Date(), 'yyyy-MM-dd')}</b></div>
        <div>Clock-in: <b>{today?.clock_in_at ? format(new Date(today.clock_in_at), 'HH:mm') : '-'}</b></div>
        <div>Clock-out: <b>{today?.clock_out_at ? format(new Date(today.clock_out_at), 'HH:mm') : '-'}</b></div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClockIn} disabled={loading || !!today?.clock_in_at}
            className="px-4 py-2 rounded-lg border disabled:opacity-50">
            Clock-in
          </button>
          <button onClick={onClockOut} disabled={loading || !today?.clock_in_at || !!today?.clock_out_at}
            className="px-4 py-2 rounded-lg border disabled:opacity-50">
            Clock-out
          </button>
        </div>

        {note && <div className="text-sm text-green-600">{note}</div>}
      </div>

      <a className="underline" href="/riwayat">Lihat Riwayat Bulan Ini →</a>
      <a className="underline ml-4" href="/admin">Admin →</a>
    </div>
  );
}
