import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebaseClient';
import { resolveAdminTargetUid } from '../lib/adminTargetUid';

const IMAGE_PAR_DEFAUT =
  'https://res.cloudinary.com/dwadzodje/image/upload/v1750498500/assets/image_defaut.png';

// Demande une autorisation d'upload signée au serveur : le dossier Cloudinary
// est déterminé côté serveur à partir de l'identité vérifiée (token Firebase
// ou session admin), jamais à partir d'une valeur envoyée par ce composant.
// Ça remplace l'ancien upload_preset non signé, qui laissait n'importe qui
// écrire dans le dossier Cloudinary de n'importe quelle cliente.
//
// targetUid : le uid de la cliente actuellement éditée dans /admin/live
// (ou 'fr' en mode ?frdev=1). Le serveur ne s'en sert QUE si une session
// admin valide (cookie) est présente — pour une cliente ordinaire (token
// Firebase), il est ignoré et le uid vient uniquement du token vérifié.
async function getSignedUploadParams(section: string, desiredName: string, targetUid?: string) {
  const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const res = await fetch('/api/cloudinary-signature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ section, desiredName, targetUid }),
  });
  if (!res.ok) {
    throw new Error("Autorisation d'upload refusée");
  }
  return res.json() as Promise<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
    publicId: string;
  }>;
}

async function uploadToCloudinarySigned(
  file: File | Blob,
  section: string,
  desiredName: string,
  targetUid?: string
) {
  const { signature, timestamp, apiKey, cloudName, folder, publicId } = await getSignedUploadParams(
    section,
    desiredName,
    targetUid
  );

  const data = new FormData();
  data.append('file', file);
  data.append('api_key', apiKey);
  data.append('timestamp', String(timestamp));
  data.append('signature', signature);
  data.append('folder', folder);
  data.append('public_id', publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: data,
  });
  return res.json();
}

export type ImageUploadRef = {
  upload: () => Promise<string | null>;
  hasPendingUpload: () => boolean;
};

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onUpload: (url: string) => void;
  folderName: string; // nom du thérapeute
  sectionName: string; // accueil, services, background, favicon
};

const ImageUploadField = forwardRef<ImageUploadRef, ImageUploadFieldProps>(
  ({ label, value, onUpload, folderName, sectionName }, ref) => {
    const router = useRouter();
    // La cliente actuellement éditée dans /admin/live : son uid, ou 'fr' en
    // mode ?frdev=1. Utile uniquement si une session admin valide couvre la
    // requête (voir /api/cloudinary-signature) — sans ça, ignoré.
    const targetUid = resolveAdminTargetUid(router.query);

    const [compressedFile, setCompressedFile] = useState<null | {
      original: File;
      compressed: File;
    }>(null);
    const [preview, setPreview] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      async upload() {
        if (!compressedFile) return value || IMAGE_PAR_DEFAUT;

        setLoading(true);

        const baseName = compressedFile.original.name
          .split('.')[0]
          .replace(/[^\w\d_-]+/g, '-')
          .toLowerCase()
          .slice(0, 50);

        const json = await uploadToCloudinarySigned(
          compressedFile.compressed,
          sectionName,
          baseName,
          targetUid
        );
        setLoading(false);

        if (json.secure_url) {
          onUpload(json.secure_url);
          setCompressedFile(null);
          setPreview('');
          setSuccess('✅ Image envoyée avec succès');
          return json.secure_url;
        } else {
          alert('❌ Upload échoué');
          return null;
        }
      },
      hasPendingUpload() {
        return !!compressedFile;
      },
    }));

    const compressImage = (file: File): Promise<File> =>
      new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.src = e.target?.result as string;
          setPreview(e.target?.result as string);
        };

        img.onload = () => {
          const MAX_WIDTH = 800;
          const ratio = MAX_WIDTH / img.width;
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(MAX_WIDTH, img.width);
          canvas.height = img.height * ratio;

          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              const compressed = new File([blob!], file.name.replace(/\.\w+$/, '.webp'), {
                type: 'image/webp',
              });
              resolve(compressed);
            },
            'image/webp',
            0.8
          );
        };

        reader.readAsDataURL(file);
      });

    const handleSelection = async (file: File) => {
      if (!file) return; //
      setSuccess('');

      // Vérifie extension favicon
      if (label.toLowerCase().includes('favicon') && !file.name.match(/\.(ico|png|svg)$/i)) {
        alert('Le favicon doit être au format .ico, .png ou .svg');
        return;
      }

      let finalFile = file;
      if (!label.toLowerCase().includes('favicon')) {
        finalFile = await compressImage(file);
      }

      setCompressedFile({ original: file, compressed: finalFile });
      setSuccess('🕓 Image prête à être sauvegardée');

      const baseName = file.name
        .split('.')[0]
        .replace(/[^\w\d_-]+/g, '-')
        .toLowerCase()
        .slice(0, 50);

      const json = await uploadToCloudinarySigned(finalFile, sectionName, baseName, targetUid);

      if (json.secure_url) {
        setPreview(json.secure_url);
        onUpload(json.secure_url);
      } else {
        alert('❌ Upload échoué');
      }
    };

    const handleDelete = async () => {
      if (!value) return alert('Aucune image à supprimer');
      // 🔒 Bloquer les images par défaut
      if (value.includes('/assets/')) {
        alert(
          'Cette image est protégée et ne peut pas être supprimée, vous pouvez simplement en charger une autre par dessus.'
        );
        return;
      }
      try {
        const match = value.match(/upload\/(?:v\d+\/)?(.+)\.(webp|jpg|jpeg|png|gif|ico|svg)/i);
        if (!match) return alert("Impossible d'extraire le public_id");

        const publicId = match[1];
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        const res = await fetch('/api/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ public_id: publicId, targetUid }),
        });

        if (res.ok) {
          onUpload(IMAGE_PAR_DEFAUT);
          setCompressedFile(null);
          setPreview('');
          setSuccess('🗑 Image supprimée avec succès');
          // ✅ ici : on reset explicitement le champ file
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        } else {
          const json = await res.json();
          //alert(`❌ Échec suppression : ${json.error}`);
          alert(
            `❌ OUPS ! Cette image a déjà été supprimée ou n'existe pas. Vous pouvez en charger une autre dès maintenant.`
          );
          // Pas de reset de input ici : on pourra toujours charger une autre image
          setPreview(IMAGE_PAR_DEFAUT);
          onUpload(IMAGE_PAR_DEFAUT);
        }
      } catch (err: any) {
        console.error('Erreur suppression image:', err);
        alert('❌ Une erreur est survenue, réessaie dans un instant.');
      }
    };

    return (
      <div className="mb-6">
        <label className="block font-medium mb-1">{label}</label>
        <label className="inline-block cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded shadow">
          📤 Choisir une image
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleSelection(e.target.files![0])}
            className="hidden"
          />
        </label>
        {loading && (
          <p className="mt-2 text-blue-600 text-sm animate-pulse">🌀 Upload en cours...</p>
        )}

        {(preview || value) && !loading && (
          <div className="mt-4 space-y-2">
            <img
              src={preview || value}
              alt="Image"
              className="w-[150px] h-[150px] rounded shadow border"
            />
            {value && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(value)}
                  className="text-sm text-gray-600 underline hover:text-black"
                >
                  📋 Copier l’URL
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-sm text-red-500 underline hover:text-red-700"
                >
                  🗑 Supprimer cette image
                </button>
              </div>
            )}
          </div>
        )}

        {success && <p className="text-green-600 mt-2 text-sm">{success}</p>}
      </div>
    );
  }
);

export default ImageUploadField;
