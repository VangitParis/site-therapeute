// pages/api/admin-login.ts
//
// Server-side admin login. Replaces the old flow where the browser fetched
// the bcrypt hash from Firestore (`config/admin`) and compared it to the
// typed password with bcryptjs *in the client bundle*. Now the hash never
// leaves the server, and a successful check sets a signed httpOnly cookie
// instead of a client-writable sessionStorage flag.
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { getAdminDb } from '../../lib/firebaseAdmin';
import { createAdminSessionCookie } from '../../lib/adminSession';
import { checkRateLimit, getClientIp } from '../../lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // 10 tentatives / 5 minutes / IP : ralentit un brute-force sans gêner une
  // personne qui se trompe deux ou trois fois de mot de passe.
  if (!checkRateLimit(`admin-login:${getClientIp(req)}`, 10, 5 * 60_000)) {
    return res.status(429).json({ error: 'Trop de tentatives, réessaie dans quelques minutes.' });
  }

  const { password } = req.body ?? {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Mot de passe requis' });
  }

  try {
    let storedHash: string | undefined;

    try {
      const snap = await getAdminDb().collection('config').doc('admin').get();
      storedHash = snap.exists ? (snap.data()?.password as string | undefined) : undefined;
    } catch (e) {
      console.error('admin-login: lecture Firestore impossible', e);
    }

    // Filet de secours si le document config/admin est absent : un hash
    // serveur configuré directement en variable d'environnement (jamais
    // NEXT_PUBLIC_, donc jamais exposé au navigateur).
    if (!storedHash) {
      storedHash = process.env.ADMIN_PASSWORD_HASH;
    }

    if (!storedHash) {
      console.error('admin-login: aucun hash configuré (ni config/admin, ni ADMIN_PASSWORD_HASH)');
      return res.status(500).json({ error: 'Authentification admin non configurée' });
    }

    const isValid = await bcrypt.compare(password, storedHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    res.setHeader('Set-Cookie', createAdminSessionCookie());
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('admin-login error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
