// pages/api/cloudinary-signature.ts
//
// Issues a signed Cloudinary upload authorization. Replaces the old flow
// where the browser uploaded straight to Cloudinary with an *unsigned*
// upload_preset and a client-chosen `folder` — since that request never
// touched our server, literally anyone (no login needed at all) could POST
// directly to the Cloudinary API with `folder: "therapeutes/<autre-cliente>/..."`
// and write into another tenant's asset folder.
//
// Here, the folder is derived ONLY from a server-verified identity — a
// Firebase ID token (regular clients) or the admin session cookie (the
// ?frdev=1 "content/fr" template) — never from anything the client sends.
// The signature Cloudinary computes covers {folder, public_id, timestamp},
// so the browser cannot alter the folder afterwards without invalidating it.
import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminAuth } from '../../lib/firebaseAdmin';
import { isValidAdminSession } from '../../lib/adminSession';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function sanitizeSegment(value: unknown, fallback: string, maxLen = 50): string {
  const str = typeof value === 'string' ? value : '';
  const cleaned = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, maxLen);
  return cleaned || fallback;
}

// Un uid Firebase Auth est sensible \u00e0 la casse (alphanum\u00e9rique, ex.
// "5sGjh3Lb52gXTQRHnLuBLYEEwOc2") \u2014 contrairement \u00e0 sanitizeSegment (pens\u00e9e
// pour un nom de dossier lisible), on ne le passe surtout pas en minuscules :
// \u00e7a pointerait vers un dossier Cloudinary diff\u00e9rent de celui o\u00f9 cette m\u00eame
// cliente \u00e9crit d\u00e9j\u00e0 via son propre token Firebase.
function sanitizeUid(value: unknown, fallback: string, maxLen = 128): string {
  const str = typeof value === 'string' ? value : '';
  const cleaned = str.replace(/[^\w-]+/g, '').slice(0, maxLen);
  return cleaned || fallback;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // 1. Identité vérifiée côté serveur — jamais déduite d'une valeur envoyée par le client.
  //
  // Le cookie admin est vérifié EN PREMIER. Avant, un en-tête Authorization
  // présent (même un token Firebase périmé/résiduel d'une session cliente
  // testée plus tôt dans le même navigateur) faisait échouer la requête
  // avant même de regarder le cookie admin — un cookie admin valide était
  // purement et simplement ignoré dès qu'un Bearer traînait, provoquant
  // "Autorisation d'upload refusée" en plein milieu d'une session admin
  // par ailleurs valide. Une cliente normale n'a jamais de cookie
  // admin_session (elle ne passe jamais par /api/admin-login), donc ce
  // réordonnancement ne change rien à son chemin.
  let tenantFolder: string;
  const authHeader = req.headers.authorization;

  if (isValidAdminSession(req)) {
    // Admin : le folder vient de la cliente éditée dans /admin/live (son
    // uid, ou 'fr' pour le template par défaut en mode ?frdev=1) — jamais de
    // l'admin lui-même, qui n'a pas de uid Firebase Auth. On ne fait
    // confiance à ce uid envoyé par le client QUE parce que le cookie admin
    // est déjà vérifié côté serveur juste au-dessus ; sans lui, ce même uid
    // ne serait d'aucune utilité (branche Bearer ci-dessous, inchangée).
    tenantFolder = sanitizeUid(req.body?.targetUid, 'fr');
  } else if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.slice('Bearer '.length);
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      tenantFolder = decoded.uid;
    } catch {
      return res.status(401).json({ error: 'Session invalide, reconnecte-toi.' });
    }
  } else {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  const section = sanitizeSegment(req.body?.section, 'general', 30);
  const publicId = sanitizeSegment(req.body?.desiredName, 'image');
  const folder = `therapeutes/${tenantFolder}/${section}`;
  const timestamp = Math.floor(Date.now() / 1000);

  // 'raw' pour les PDF (mentions légales) — 'image' reste le défaut pour les
  // photos. Ce n'est pas un champ signé (Cloudinary ne le couvre pas dans la
  // signature, il ne fait que sélectionner l'URL d'upload côté client), donc
  // pas besoin de le valider plus que ça au-delà de cette liste fermée.
  const resourceType = req.body?.resourceType === 'raw' ? 'raw' : 'image';

  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret || !process.env.CLOUDINARY_API_KEY) {
    console.error('cloudinary-signature: CLOUDINARY_API_KEY/SECRET manquants');
    return res.status(500).json({ error: 'Configuration Cloudinary manquante côté serveur' });
  }

  const signature = cloudinary.utils.api_sign_request(
    { folder, public_id: publicId, timestamp },
    apiSecret
  );

  return res.status(200).json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME,
    folder,
    publicId,
    resourceType,
  });
}
