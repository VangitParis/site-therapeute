import { useRef, useState } from 'react';
import { db, storage } from '../lib/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

export default function MentionsAdminEditor({ formData, setFormData }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const safeName = file.name
      .normalize('NFD') // enlève les accents
      .replace(/[\u0300-\u036f]/g, '') // caractères diacritiques
      .replace(/\s+/g, '_'); // remplace espaces par des _
    const storageRef = ref(storage, `legal/${safeName}`);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    setFormData((prev: any) => ({
      ...prev,
      mentions: { url },
    }));
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mt-10 mb-2 text-indigo-700">📄 Mentions légales</h2>

      {formData.mentions?.url ? (
        <a
          href={formData.mentions.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Voir le fichier actuel
        </a>
      ) : (
        <p className="text-gray-500">Aucun fichier actuellement.</p>
      )}

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
        {uploading ? 'Chargement...' : '📤 Remplacer le fichier PDF'}
      </button>
    </div>
  );
}
