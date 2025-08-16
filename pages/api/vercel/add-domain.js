export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { domain, uid } = req.body;
  if (!domain || !uid) return res.status(400).json({ error: 'Domain and UID required' });

  try {
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    if (!VERCEL_TOKEN || !PROJECT_ID) throw new Error('Variables d\'environnement Vercel manquantes');

    const checkResponse = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/domains`, {
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
    });
    const existingDomains = await checkResponse.json();
    if (existingDomains.domains?.some(d => d.name === domain)) {
      return res.status(400).json({ error: 'Ce domaine est déjà utilisé' });
    }

    const addResponse = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/domains`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain.toLowerCase(), gitBranch: null })
    });

    const result = await addResponse.json();
    console.log(`Domaine ${domain} ajouté pour UID: ${uid}`);

    return res.status(200).json({ success: true, domain, uid, vercelResponse: result });
  } catch (error) {
    console.error('Erreur API add-domain:', error);
    return res.status(500).json({ error: error.message });
  }
}
