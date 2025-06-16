import { useEffect, useState } from 'react';
import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

export default function Testimonials({ locale = 'fr' }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'content', locale);
      const snap = await getDoc(ref);
      if (snap.exists()) setItems(snap.data().testimonials || []);
    };

    fetchData();

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_FORMDATA' && e.data.payload?.testimonials) {
        setItems(e.data.payload.testimonials);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [locale]);

  if (!items.length) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-prune border-opacity-50" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12" style={{ backgroundColor: 'var(--color-bg)' }}>
      <h1
        className="text-3xl font-bold text-prune mb-8 text-center"
        style={{ color: 'var(--color-titreH1)' }}
      >
        Témoignages
      </h1>
      <div className="grid md:grid-cols-2 gap-6">
        {items.map((item, i) => (
          <div
            key={i}
            className="bg-gray-50 p-5 rounded-xl shadow flex items-center justify-between"
          >
            <div className="flex flex-col">
              <p className="italic text-gray-700 mb-2" style={{ color: 'var(--color-texte)' }}>
                “{item.texte}”
              </p>
              <p className="text-yellow-400 text-sm mb-1">
                {'★'.repeat(item.stars)}
                {'☆'.repeat(5 - item.stars)}
              </p>
              <footer
                className="text-sm font-medium text-gray-500"
                style={{ color: 'var(--color-titreH3)' }}
              >
                {item.auteur}
              </footer>
            </div>

            <img src={item.avatar} alt="avatar" className=" h-[110px] rounded-full ml-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
