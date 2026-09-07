// pages/api/admin-logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { clearAdminSessionCookie } from '../../lib/adminSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  res.setHeader('Set-Cookie', clearAdminSessionCookie());
  return res.status(200).json({ ok: true });
}
