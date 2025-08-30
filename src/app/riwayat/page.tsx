'use client';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

type Row = {
  a_date: string;
  shift: number;
  clock_in_at: string | null;
  clock_out_at: string | null;
  notes: string | null;
  photo_url: string | null;
};

export default function Riwayat() {
  const [rows, setRows] = useState<Row[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const from = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const to   = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('attendance')
        .select('a_date, shift, clock_in_at, clock_out_at, notes, photo_url')
        .eq('user_id', userId)
        .gte('a_date', from).lte('a_date', to)
        .order('a_date', { ascending: true })
        .order('shift', { ascending: true });
      setRows((data as Row[]) ?? []);
    })();
  }, [userId]);

  if (!userId) return <div className="p-6"><a href="/login" className="underline">Login →</a></div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Riwayat Bulan Ini</h1>
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Tanggal</th>
              <th className="p-2">Shift</th>
              <th className="p-2">In</th>
              <th className="p-2">Out</th>
              <th className="p-2 text-left">Catatan</th>
              <th className="p-2">Foto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                <td className="p-2">{r.a_date}</td>
                <td className="p-2">{r.shift}</td>
                <td className="p-2">{r.clock_in_at ? new Date(r.clock_in_at).toLocaleTimeString() : '-'}</td>
                <td className="p-2">{r.clock_out_at ? new Date(r.clock_out_at).toLocaleTimeString() : '-'}</td>
                <td className="p-2">{r.notes || '-'}</td>
                <td className="p-2">{r.photo_url ? <a href={r.photo_url} target="_blank" className="underline">Lihat</a> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
