import { useEffect, useState } from 'react';
import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

export default function Contact() {
  const [calendly, setCalendly] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'content', 'fr');
      const snap = await getDoc(ref);
      if (snap.exists()) setCalendly(snap.data().calendly || '');
    };
    fetchData();
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-center">
      <h1 className="text-4xl font-bold text-prune mb-6">Prendre rendez-vous</h1>
      <p className="text-gray-700 mb-6 text-lg">
        Les places sont limitées chaque semaine. Prenez le temps de vous prioriser. Une première séance peut tout changer.
      </p>
      {calendly && (
        <a
          href={calendly}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-prune text-white py-3 px-6 rounded-full text-lg font-semibold shadow hover:bg-purple-700 transition"
        >
          Réserver un créneau maintenant
        </a>
      )}
    </main>
  );
}
