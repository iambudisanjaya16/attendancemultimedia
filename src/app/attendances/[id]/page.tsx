'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EditAttendance() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [row, setRow] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('attendancesmultimedia').select('*').eq('id', id).single();
      if (!error) setRow(data);
    })();
  }, [id]);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from('attendancesmultimedia')
      .update({ name: row.name, note: row.note })
      .eq('id', id);
    setSaving(false);
    if (error) alert(error.message); else router.push('/admin');
  }

  if (!row) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 bg-white rounded-2xl shadow">
      <h1 className="text-xl font-semibold">Edit Absen</h1>
      <input value={row.name} onChange={e=>setRow({...row, name: e.target.value})}
        className="w-full rounded-lg border-gray-300"/>
      <textarea value={row.note} onChange={e=>setRow({...row, note: e.target.value})}
        className="w-full rounded-lg border-gray-300"/>
      <button onClick={save} disabled={saving}
        className="rounded-xl bg-indigo-600 text-white px-4 py-2">{saving?'Menyimpan…':'Simpan'}</button>
    </div>
  );
}
