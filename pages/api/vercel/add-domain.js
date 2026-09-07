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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const uid = await requireUid(req);
  if (!uid) return res.status(401).json({ error: 'Authentification requise' });

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain requis' });

  try {
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    if (!VERCEL_TOKEN || !PROJECT_ID) throw new Error("Variables d'environnement Vercel manquantes");

    const checkResponse = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/domains`, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });
    const existingDomains = await checkResponse.json();
    if (existingDomains.domains?.some((d) => d.name === domain)) {
      return res.status(400).json({ error: 'Ce domaine est déjà utilisé' });
    }

    const addResponse = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/domains`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain.toLowerCase(), gitBranch: null }),
    });

    if (!addResponse.ok) {
      const errBody = await addResponse.json().catch(() => ({}));
      console.error('add-domain: échec API Vercel', errBody);
      return res.status(502).json({ error: "Échec de l'ajout du domaine" });
    }

    await getAdminDb()
      .collection('domainAuditLog')
      .add({ action: 'add', uid, domain: domain.toLowerCase(), at: new Date() });

    console.log(`[audit] add-domain: uid=${uid} domain=${domain}`);

    return res.status(200).json({ success: true, domain });
  } catch (error) {
    console.error('Erreur API add-domain:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
