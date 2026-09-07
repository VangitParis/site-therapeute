// pages/api/vercel/domain-status.js
//
// Polled by PublishSiteComponent while a custom domain is "en attente" —
// asks Vercel whether it has detected correct DNS for the domain yet, so a
// non-technical cliente knows she configured things right without ever
// having to ask anyone. Same auth + ownership check as remove-domain.js:
// only the cliente who owns this exact customDomain (per clients/{uid}) can
// query its status.
import { getAdminAuth, getAdminDb } from '../../../lib/firebaseAdmin';

async function requireUid(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length));
    return decoded.uid;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const uid = await requireUid(req);
  if (!uid) return res.status(401).json({ error: 'Authentification requise' });

  const domain = typeof req.query.domain === 'string' ? req.query.domain.toLowerCase() : '';
  if (!domain) return res.status(400).json({ error: 'Domain requis' });

  try {
    const clientSnap = await getAdminDb().collection('clients').doc(uid).get();
    const clientData = clientSnap.exists ? clientSnap.data() : null;
    if (!clientData || clientData.customDomain !== domain) {
      return res.status(403).json({ error: "Ce domaine n'est pas associé à votre compte" });
    }

    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    if (!VERCEL_TOKEN || !PROJECT_ID) throw new Error("Variables d'environnement Vercel manquantes");

    const response = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );

    if (!response.ok) {
      // Le domaine n'existe plus côté Vercel (retiré manuellement, etc.)
      return res.status(200).json({ status: 'error' });
    }

    const data = await response.json();
    const status = data.verified ? 'connected' : 'pending';

    return res.status(200).json({ status });
  } catch (error) {
    console.error('Erreur API domain-status:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
