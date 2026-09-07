import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../lib/firebaseClient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { GetServerSideProps } from 'next';
import { checkTenantActive } from '../../lib/checkTenantActive';
import { resolveDocId } from '../../lib/resolveDocId';
import { canWriteOwnContent } from '../../lib/contentOwnership';

// Même garde d'activation que les autres pages publiques (home, about,
// contact, services, testimonials) — avant, cette page n'en avait aucune,
// et pointait toujours vers le même document partagé content/fr.
export const getServerSideProps: GetServerSideProps = async (context) => {
  const gate = await checkTenantActive(context);
  if (gate.redirect) return { redirect: gate.redirect };
  return { props: {} };
};

export default function MentionsLegales({ locale = 'fr' }: { locale?: string }) {
  const router = useRouter();
  // AVANT : toujours doc(db, 'content', 'fr') — toutes les clientes
  // partageaient le même PDF. On résout maintenant le document par cliente,
  // exactement comme pages/users/contact.tsx.
  const docId = resolveDocId(router, locale);
  const isDev = router.query.frdev === '1';

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!docId) return;
    const fetchData = async () => {
      const snap = await getDoc(doc(db, 'content', docId));
      if (snap.exists()) {
        setPdfUrl(snap.data().mentions?.url || null);
      }
    };
    fetchData();
  }, [docId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !docId) return;

    setUploading(true);
    try {
      // Même schéma que components/ImageUploadField.tsx (section 1 de
      // l'audit) : la signature est calculée côté serveur à partir de
      // l'identité vérifiée (token Firebase ou session admin) — jamais d'un
      // uid/folder envoyé par ce composant. Sans session valide,
      // /api/cloudinary-signature répond 401 et rien n'est uploadé : une
      // visiteuse non connectée qui tomberait sur cette page ne peut rien
      // écraser.
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const sigRes = await fetch('/api/cloudinary-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          section: 'mentions',
          desiredName: 'mentions-legales',
          resourceType: 'raw',
        }),
      });

      if (!sigRes.ok) {
        alert("Vous n'êtes pas autorisée à modifier ce document.");
        return;
      }

      const { signature, timestamp, apiKey, cloudName, folder, publicId, resourceType } =
        await sigRes.json();

      const data = new FormData();
      data.append('file', file);
      data.append('api_key', apiKey);
      data.append('timestamp', String(timestamp));
      data.append('signature', signature);
      data.append('folder', folder);
      data.append('public_id', publicId);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        { method: 'POST', body: data }
      );
      const json = await uploadRes.json();

      if (!json.secure_url) {
        alert("Échec de l'upload.");
        return;
      }

      // Écriture Firestore : content/fr est verrouillé côté règles (écriture
      // client interdite, voir firestore.rules) donc le mode admin repasse
      // par la même route serveur que live.tsx ; les clientes ordinaires
      // continuent d'écrire directement, protégées par la règle
      // request.auth.uid == userId.
      if (isDev) {
        const res = await fetch('/api/admin-save-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { mentions: { url: json.secure_url } } }),
        });
        if (!res.ok) throw new Error('Échec de la sauvegarde admin');
      } else {
        if (!canWriteOwnContent(auth.currentUser?.uid, docId)) {
          alert("Vous n'êtes pas autorisée à modifier ce document.");
          return;
        }
        await updateDoc(doc(db, 'content', docId), { mentions: { url: json.secure_url } });
      }

      setPdfUrl(json.secure_url);
    } catch (err) {
      console.error('Erreur mise à jour mentions légales:', err);
      alert('Erreur lors de la mise à jour.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 px-6 py-12 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-prune">Mentions légales</h1>

        {pdfUrl && (
          <p className="text-center mb-6">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">
              📄 Voir le document actuel
            </a>
          </p>
        )}

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
