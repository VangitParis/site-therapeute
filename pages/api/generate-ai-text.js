import OpenAI from 'openai';
import { getAdminAuth } from '../../lib/firebaseAdmin';
import { isValidAdminSession } from '../../lib/adminSession';
import { checkRateLimit, getClientIp } from '../../lib/rateLimit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Avant : accessible à n'importe qui, sans compte — un visiteur pouvait
  // consommer le crédit OpenAI du site à volonté. On exige maintenant soit un
  // compte cliente connecté, soit la session admin (mode ?frdev=1).
  let callerId;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length));
      callerId = decoded.uid;
    } catch {
      return res.status(401).json({ error: 'Session invalide, reconnecte-toi.' });
    }
  } else if (isValidAdminSession(req)) {
    callerId = 'admin';
  } else {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  // 20 générations / 10 minutes / compte : freine l'abus de crédit sans gêner
  // un usage normal de l'assistant de rédaction.
  if (!checkRateLimit(`generate-ai-text:${callerId}`, 20, 10 * 60_000)) {
    return res.status(429).json({ error: 'Trop de requêtes, réessaie dans quelques minutes.' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt manquant' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    res.status(200).json({
      text: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Erreur génération IA' });
  }
}
