// pages/api/admin-save-content.ts
//
// Saves the default template document (content/fr) for the admin "mode dev"
// editor (?frdev=1). Replaces the old client-side updateDoc(...) call that
// relied on a forgeable `adminToken: "admin"` field inside the document data
// — the Firestore rule that trusted that field let ANYONE (no login
// required) overwrite content/fr by including that string in their write.
//
// This route re-verifies the admin session cookie itself (never trust the
// caller), then writes via the Admin SDK, which bypasses Security Rules —
// so the rules can now safely deny client writes to content/fr entirely.
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';
import { isValidAdminSession } from '../../lib/adminSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: 'Session admin invalide ou expirée' });
  }

  const { data } = req.body ?? {};
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  // adminToken n'a plus de rôle protecteur (les règles Firestore ne le lisent
  // plus) — on l'enlève pour ne pas laisser traîner un champ mort.
  const { adminToken, ...cleanData } = data;

  try {
    await getAdminDb().collection('content').doc('fr').set(cleanData, { merge: true });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('admin-save-content error:', err);
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
}
