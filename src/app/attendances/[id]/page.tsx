'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ✅ Definisikan tipe di file ini (paling atas, setelah import)
type AttendanceRow = {
  id: string;
  created_at: string;
  name: string | null;
  note: string | null;
  photo_url: string | null;
  user_id: string | null; // kalau tabelmu belum punya kolom ini, boleh hapus baris ini + di SELECT
};

export default function EditAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [row, setRow] = useState<AttendanceRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from('attendancesmultimedia')
        .select('id,created_at,name,note,photo_url,user_id') // kalau gak ada user_id, hapus dari sini
        .eq('id', id)
        .single();

      if (!error && data) setRow(data as AttendanceRow);
      if (error) console.error(error.message);
    })();
  }, [id]);

  async function save() {
    if (!row) return;
    setSaving(true);
    const { error } = await supabase
      .from('attendancesmultimedia')
      .update({ name: row.name, note: row.note })
      .eq('id', id);

    setSaving(false);
    if (error) {
      alert(error.message);
    } else {
      router.push('/admin'); // sesuaikan tujuan setelah simpan
    }
  }

  if (!row) return <div className="p-6">Memuat…</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 bg-white rounded-2xl shadow">
      <h1 className="text-xl font-semibold">Edit Absen</h1>

      <label className="block text-sm font-medium text-gray-700">Nama</label>
      <input
        value={row.name ?? ''}
        onChange={e => setRow({ ...row, name: e.target.value })}
        className="w-full rounded-lg border-gray-300"
      />

      <label className="block text-sm font-medium text-gray-700">Catatan</label>
      <textarea
        value={row.note ?? ''}
        onChange={e => setRow({ ...row, note: e.target.value })}
        className="w-full rounded-lg border-gray-300"
      />

      <div className="text-sm text-gray-600">
        Foto:{' '}
        {row.photo_url ? (
          <a className="text-indigo-600 underline" href={row.photo_url} target="_blank">
            Lihat foto
          </a>
        ) : (
          '-'
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-xl bg-gray-100 text-gray-800 px-4 py-2 hover:bg-gray-200"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
