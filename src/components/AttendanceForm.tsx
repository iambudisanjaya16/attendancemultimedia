'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'attendancesmultimedia';
const TABLE_NAME = 'attendancesmultimedia';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

type Props = { userId: string };

export default function AttendanceForm({ userId }: Props) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    let photo_url: string | null = null;

    if (file) {
      // Validasi file
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert('File harus JPG/PNG/WEBP');
        setLoading(false);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`Maksimal ${MAX_SIZE_MB}MB`);
        setLoading(false);
        return;
      }

      // Upload ke Storage
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (upErr) {
        alert(upErr.message);
        setLoading(false);
        return;
      }

      const { data: pub } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
      photo_url = pub?.publicUrl ?? null;
    }

    // Simpan ke tabel
    const { error: insErr } = await supabase
      .from(TABLE_NAME)
      .insert([{ user_id: userId, name, note, photo_url }]);

    if (insErr) {
      alert(insErr.message);
    } else {
      setName('');
      setNote('');
      setFile(null);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-2xl shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nama</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Catatan</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload Foto (JPG/PNG/WEBP, ≤{MAX_SIZE_MB}MB)
        </label>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
        />
      </div>

      <button
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 text-white py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? 'Menyimpan…' : 'Simpan Absen'}
      </button>
    </form>
  );
}
