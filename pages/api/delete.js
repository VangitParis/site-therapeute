import { v2 as cloudinary } from 'cloudinary';
import { getAdminAuth } from '../../lib/firebaseAdmin';
import { isValidAdminSession } from '../../lib/adminSession';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { public_id } = req.body;

  if (!public_id) {
    return res.status(400).json({ error: 'public_id manquant' });
  }

  // Identité vérifiée côté serveur, exactement comme pour /api/cloudinary-signature
  // — c'est ce qui détermine le préfixe de dossier auquel l'appelant a droit.
  //
  // Le cookie admin est vérifié EN PREMIER (même correctif que
  // cloudinary-signature) : un en-tête Authorization présent — même un
  // token Firebase périmé/résiduel d'une session cliente testée plus tôt
  // dans le même navigateur — faisait sinon échouer la requête avant même
  // de regarder le cookie admin, ignorant une session admin par ailleurs
  // valide.
  let allowedFolder;
  const authHeader = req.headers.authorization;

  if (isValidAdminSession(req)) {
    const targetUid = typeof req.body?.targetUid === 'string' ? req.body.targetUid : 'fr';
    allowedFolder = `therapeutes/${targetUid}/`;
  } else if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.slice('Bearer '.length);
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      allowedFolder = `therapeutes/${decoded.uid}/`;
    } catch {
      return res.status(401).json({ error: 'Session invalide, reconnecte-toi.' });
    }
  } else {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  if (!public_id.startsWith(allowedFolder)) {
    return res.status(403).json({ error: "Vous n'êtes pas autorisée à supprimer cette image" });
  }

  try {
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== 'ok' && result.result !== 'not found') {
      console.error('Échec suppression Cloudinary:', result);
      return res.status(400).json({ error: 'Échec de la suppression' });
    }

    return res.status(200).json({ message: 'Image supprimée' });
  } catch (error) {
    console.error('delete.js error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
