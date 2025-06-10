import { useEffect, useState } from 'react';
import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

export default function About({ locale = 'fr' }) {
  const [data, setData] = useState<{ titre: string; texte: string; image: string } | null>(null);

  useEffect(() => {
  const fetchData = async () => {
    const ref = doc(db, 'content', locale);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const raw = snap.data();
      const aPropos = raw.aPropos || { titre: '', texte:'', image: '' };
    
      setData({ ...aPropos });
    }
  };

  fetchData();

  const handler = (e: MessageEvent) => {
    if (e.data?.type === 'UPDATE_FORMDATA' && e.data.payload?.aPropos) {
      const updated = e.data.payload.aPropos;
      setData({ ...updated });
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, [locale]);

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-prune border-opacity-50" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12" style={{ backgroundColor: 'var(--color-bg)' }}>
      <h1 className="text-4xl font-bold text-prune mb-6 text-center" style={{ color: 'var(--color-titreH1)' }}>{data.titre}</h1>
      <p className="text-gray-700 text-lg leading-relaxed text-center" style={{ color: 'var(--color-texte)' }}>{data.texte}</p>
      {data.image && (
        <img
          src={data.image}
          alt="À propos"
          className="mx-auto mt-6 max-w-[400px] rounded shadow"
        />
      )}
    </main>
  );
}
