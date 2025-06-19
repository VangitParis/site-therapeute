import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { useRouter } from 'next/router';

export default function AdminTarifsEditor() {
  const [tarifs, setTarifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isDev = router.query.frdev === '1';
  const uid = router.query.uid as string | undefined;
  const docId = isDev ? 'fr' : uid || 'fr';

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDoc(doc(db, 'content', docId));
      if (snap.exists()) {
        setTarifs(snap.data().tarifs || []);
      }
    };
    fetchData();
  }, [docId]);

  const updateTarifs = async () => {
    setLoading(true);
    await updateDoc(doc(db, 'content', docId), { tarifs });
    setLoading(false);
  };

  const handleChange = (index: number, field: string, value: string) => {
    const newTarifs = [...tarifs];
    newTarifs[index][field] = value;
    setTarifs(newTarifs);
  };

  const addCard = () => {
    setTarifs([...tarifs, { titre: '', prix: '', description: '' }]);
  };

  const removeCard = (index: number) => {
    const newTarifs = tarifs.filter((_, i) => i !== index);
    setTarifs(newTarifs);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Modifier les tarifs</h2>

      {tarifs.map((tarif, index) => (
        <div key={index} className="border p-4 rounded-lg bg-white space-y-2 shadow">
          <input
            type="text"
            placeholder="Titre"
            value={tarif.titre}
            onChange={(e) => handleChange(index, 'titre', e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="Prix"
            value={tarif.prix}
            onChange={(e) => handleChange(index, 'prix', e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <textarea
            placeholder="Description"
            value={tarif.description}
            onChange={(e) => handleChange(index, 'description', e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <button
            onClick={() => removeCard(index)}
            className="text-red-600 border border-red-300 px-4 py-1 rounded hover:bg-red-50"
          >
            Supprimer
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={addCard}
          className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded border"
        >
          Ajouter un tarif
        </button>
        <button
          onClick={updateTarifs}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
