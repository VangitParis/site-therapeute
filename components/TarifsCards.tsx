import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';

export default function TarifsCards() {
  const [tarifs, setTarifs] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const isDev = router.query.frdev === '1';
    const uid = router.query.uid as string | undefined;
    const docId = isDev ? 'fr' : uid || 'fr';

    const unsubscribe = onSnapshot(doc(db, 'content', docId), (snapshot) => {
      if (snapshot.exists()) {
        setTarifs(snapshot.data().tarifs || []);
      }
    });

    return () => unsubscribe();
  }, [router.query]);

  return (
    <section className="py-12 px-6 md:px-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tarifs.map((item, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-6 border border-[#e4d5c4]">
            <h3 className="text-xl font-semibold text-[#6E4E32] mb-2">{item.titre}</h3>
            <p className="text-[#D67B4C] text-lg font-medium">{item.prix}</p>
            <p className="text-gray-600 mt-2">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
