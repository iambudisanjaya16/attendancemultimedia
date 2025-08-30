'use client';
import { supabase } from '@/lib/supabase';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';

type TodayRow = {
  a_date: string;
  shift: number;
  clock_in_at: string | null;
  clock_out_at: string | null;
  notes: string | null;
  photo_url: string | null;
};

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<1 | 2>(1);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TodayRow[]>([]);
  const [reload, setReload] = useState(0); // trigger refresh setelah clock-in/out
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // ✅ IIFE: tidak ada warning "missing dependency"
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('a_date, shift, clock_in_at, clock_out_at, notes, photo_url')
        .eq('user_id', userId)
        .eq('a_date', todayStr)
        .order('shift', { ascending: true });

      if (!cancelled && !error) setRows((data as TodayRow[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, todayStr, reload]);

  async function uploadPhotoIfAny(): Promise<string | null> {
    if (!file || !userId) return null;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${todayStr}-s${selectedShift}.${ext}`;
    const { error } = await supabase.storage.from('absen').upload(path, file, { upsert: true });
    if (error) {
      console.error(error);
      return null;
    }
    const { data } = supabase.storage.from('absen').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleClockIn() {
    if (!userId) return;
    setLoading(true);
    const photoUrl = await uploadPhotoIfAny();
    const { error } = await supabase.rpc('clock_in_shift', {
      p_shift: selectedShift,
      p_notes: note || null,
      p_photo_url: photoUrl,
    });
    setLoading(false);
    if (error) alert(error.message);
    setNote('');
    setFile(null);
    setReload((x) => x + 1); // ✅ refresh data
  }

  async function handleClockOut() {
    if (!userId) return;
    setLoading(true);
    const { error } = await supabase.rpc('clock_out_shift', { p_shift: selectedShift });
    setLoading(false);
    if (error) alert(error.message);
    setReload((x) => x + 1); // ✅ refresh data
  }

  if (!userId) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <a href="/login" className="underline">
          Login dulu →
        </a>
      </div>
    );
  }

  const s1 = rows.find((r) => r.shift === 1);
  const s2 = rows.find((r) => r.shift === 2);
  const current = selectedShift === 1 ? s1 : s2;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Absensi Hari Ini</h1>
        <button
          className="text-sm underline"
          onClick={() => supabase.auth.signOut().then(() => location.reload())}
        >
          Keluar
        </button>
      </div>

      <div className="rounded-xl border p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div>
            Tanggal: <b>{todayStr}</b>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium">Shift:</label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="shift"
                checked={selectedShift === 1}
                onChange={() => setSelectedShift(1)}
              />
              <span>1 (08:00–12:00)</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="shift"
                checked={selectedShift === 2}
                onChange={() => setSelectedShift(2)}
              />
              <span>2 (13:00–16:45)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div>
              Clock-in:{' '}
              <b>{current?.clock_in_at ? format(new Date(current.clock_in_at), 'HH:mm') : '-'}</b>
            </div>
            <div>
              Clock-out:{' '}
              <b>{current?.clock_out_at ? format(new Date(current.clock_out_at), 'HH:mm') : '-'}</b>
            </div>
          </div>
          <div className="space-y-1">
            <div>
              Catatan: <b>{current?.notes || '-'}</b>
            </div>
            <div>
              Foto:
              {current?.photo_url ? (
                <a
                  className="underline ml-1"
                  href={current.photo_url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Lihat
                </a>
              ) : (
                <span className="ml-1">-</span>
              )}
            </div>
          </div>
        </div>

        <textarea
          className="w-full border rounded-lg p-2 text-sm"
          placeholder="Catatan pekerjaan (opsional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

        <div className="flex gap-2">
          <button
            onClick={handleClockIn}
            disabled={loading || !!current?.clock_in_at}
            className="px-4 py-2 rounded-lg border disabled:opacity-50"
          >
            Clock-in (Shift {selectedShift})
          </button>
          <button
            onClick={handleClockOut}
            disabled={loading || !current?.clock_in_at || !!current?.clock_out_at}
            className="px-4 py-2 rounded-lg border disabled:opacity-50"
          >
            Clock-out (Shift {selectedShift})
          </button>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Ringkas Hari Ini</h2>
        <ul className="text-sm list-disc ml-5 space-y-1">
          <li>
            Shift 1:{' '}
            {s1?.clock_in_at ? `In ${format(new Date(s1.clock_in_at), 'HH:mm')}` : '-'} /{' '}
            {s1?.clock_out_at ? `Out ${format(new Date(s1.clock_out_at), 'HH:mm')}` : '-'}
          </li>
          <li>
            Shift 2:{' '}
            {s2?.clock_in_at ? `In ${format(new Date(s2.clock_in_at), 'HH:mm')}` : '-'} /{' '}
            {s2?.clock_out_at ? `Out ${format(new Date(s2.clock_out_at), 'HH:mm')}` : '-'}
          </li>
        </ul>
      </div>

      <div className="flex gap-4">
        <a className="underline" href="/riwayat">
          Lihat Riwayat Bulan Ini →
        </a>
        <a className="underline" href="/admin">
          Admin →
        </a>
      </div>
    </div>
  );
}
