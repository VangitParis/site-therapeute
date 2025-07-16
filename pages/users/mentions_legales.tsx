import { useEffect, useState, useRef } from 'react';
import { db, storage } from '../../lib/firebaseClient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function MentionsLegales() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const refDoc = doc(db, 'content', 'fr');
      const snap = await getDoc(refDoc);
      if (snap.exists()) {
        const mentions = snap.data().mentions || {};
        setPdfUrl(mentions.url || null);
      }
    };
    fetchData();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `legal/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await updateDoc(doc(db, 'content', 'fr'), {
      mentions: { url },
    });

    setPdfUrl(url);
    setUploading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 px-6 py-12 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-prune">Mentions légales</h1>

        <div className="mt-10 text-center">
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-prune text-white rounded shadow hover:bg-prune-dark"
            disabled={uploading}
          >
            {uploading ? 'Chargement...' : '📤 Mettre à jour le PDF'}
          </button>
        </div>
      </main>
    </div>
  );
}
