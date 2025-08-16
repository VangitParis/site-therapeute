export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const { domain, uid } = req.body;
  if (!domain || !uid) return res.status(400).json({ error: 'Domain and UID required' });

  try {
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    if (!VERCEL_TOKEN || !PROJECT_ID) throw new Error('Variables d\'environnement Vercel manquantes');

    const response = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erreur lors de la suppression');
    }

    console.log(`Domaine ${domain} supprimé pour UID: ${uid}`);
    return res.status(200).json({ success: true, domain, uid });
  } catch (error) {
    console.error('Erreur API remove-domain:', error);
    return res.status(500).json({ error: error.message });
  }
}
