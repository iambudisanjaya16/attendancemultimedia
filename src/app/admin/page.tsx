'use client';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

type Row = {
  user_id: string;
  a_date: string;
  shift: number;
  clock_in_at: string | null;
  clock_out_at: string | null;
  notes: string | null;
  photo_url: string | null;
};

function downloadCSV(rows: Row[]) {
  const header = ['user_id','a_date','shift','clock_in','clock_out','notes','photo_url'];
  const body = rows.map(r=>[
    r.user_id,
    r.a_date,
    r.shift.toString(),
    r.clock_in_at ? new Date(r.clock_in_at).toISOString() : '',
    r.clock_out_at ? new Date(r.clock_out_at).toISOString() : '',
    (r.notes || '').replaceAll(',', ';'),
    r.photo_url || ''
  ]);
  const csv = [header, ...body].map(a=>a.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'rekap_bulan_ini.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Admin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    (async () => {
      const from = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const to   = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance')
        .select('user_id, a_date, shift, clock_in_at, clock_out_at, notes, photo_url')
        .gte('a_date', from).lte('a_date', to)
        .order('user_id', { ascending: true })
        .order('a_date', { ascending: true })
        .order('shift', { ascending: true });
      if (error) setNote(error.message);
      setRows((data as Row[]) ?? []);
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin — Rekap Bulan Ini</h1>
      {note && <div className="text-sm text-red-600 mb-2">{note}</div>}
      <div className="mb-3">
        <button onClick={()=>downloadCSV(rows)} className="px-4 py-2 rounded-lg border">
          Download CSV
        </button>
      </div>
      <div className="border rounded-xl overflow-auto">
        <table className="w-full text-sm min-w-[880px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">User ID</th>
              <th className="p-2">Tanggal</th>
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
                <td className="p-2">{r.user_id}</td>
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
      <p className="text-xs text-gray-500 mt-2">
        Catatan: kalau tabel kosong, pastikan emailmu ada di <code>admin_emails</code> (RLS aktif).
      </p>
    </div>
  );
}
