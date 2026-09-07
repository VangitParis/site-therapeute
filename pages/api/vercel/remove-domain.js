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
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const uid = await requireUid(req);
  if (!uid) return res.status(401).json({ error: 'Authentification requise' });

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain requis' });

  try {
    // On ne retire que LE domaine que Firestore a enregistré pour CETTE cliente —
    // avant, cette route acceptait n'importe quel domaine, permettant à
    // quiconque de couper le site d'une autre cliente.
    const clientSnap = await getAdminDb().collection('clients').doc(uid).get();
    const clientData = clientSnap.exists ? clientSnap.data() : null;

    if (!clientData || clientData.customDomain !== domain.toLowerCase()) {
      return res
        .status(403)
        .json({ error: "Ce domaine n'est pas associé à votre compte" });
    }

    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    if (!VERCEL_TOKEN || !PROJECT_ID) throw new Error("Variables d'environnement Vercel manquantes");

    const response = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }
    );

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error('remove-domain: échec API Vercel', errBody);
      return res.status(502).json({ error: 'Erreur lors de la suppression' });
    }

    await getAdminDb()
      .collection('domainAuditLog')
      .add({ action: 'remove', uid, domain: domain.toLowerCase(), at: new Date() });

    console.log(`[audit] remove-domain: uid=${uid} domain=${domain}`);

    return res.status(200).json({ success: true, domain });
  } catch (error) {
    console.error('Erreur API remove-domain:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
