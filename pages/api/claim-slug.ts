// pages/api/claim-slug.ts
//
// Called either:
// - at signup, with `displayName` — proposes a slug derived from the name,
//   auto-suffixing on collision (marie-dupont-2, ...) since the cliente
//   isn't deliberately choosing a specific string here.
// - from the editor, with `customSlug` — the cliente deliberately picked a
//   brand name (e.g. "cabinet-serenite" instead of her own name). A single
//   attempt at that exact string: reject clearly on collision rather than
//   silently substituting a suffixed variant she never asked for.
//
// Runs server-side via firebase-admin because checking "is this slug already
// taken?" requires querying across ALL clientes' documents — something the
// client SDK can never safely do under our Firestore rules (they only ever
// grant a cliente access to her own document, by design). A transaction on
// the dedicated slugs/{slug} collection avoids two simultaneous claims of
// the same slug.
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../../lib/firebaseAdmin';
import { slugify, slugCandidate } from '../../lib/slugify';
import { checkRateLimit, getClientIp } from '../../lib/rateLimit';

const MAX_ATTEMPTS = 30;
const SLUG_CHANGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function changedAtToMs(value: any): number {
  if (!value) return 0;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  if (!checkRateLimit(`claim-slug:${getClientIp(req)}`, 10, 60_000)) {
    return res.status(429).json({ error: 'Trop de requêtes, réessaie dans une minute.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length));
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Session invalide, reconnecte-toi.' });
  }

  const { displayName, customSlug } = req.body ?? {};
  const db = getAdminDb();
  const clientRef = db.collection('clients').doc(uid);

  try {
    const clientSnap = await clientRef.get();
    const existingSlug: string | undefined = clientSnap.data()?.slug;
    const slugChangedAt = clientSnap.data()?.slugChangedAt;

    // === Cas 1 : la cliente choisit elle-même son lien ===
    if (typeof customSlug === 'string' && customSlug.trim()) {
      const requested = customSlug.trim().toLowerCase();

      if (requested.length < 3) {
        return res.status(400).json({ error: 'Ce lien doit contenir au moins 3 caractères.' });
      }
      if (slugify(requested) !== requested) {
        return res.status(400).json({
          error: 'Ce lien ne peut contenir que des lettres, des chiffres et des tirets (ex. cabinet-serenite).',
        });
      }

      // Déjà le sien : rien à faire, pas de coût sur le quota de changement.
      if (existingSlug === requested) {
        return res.status(200).json({ slug: existingSlug });
      }

      // Changement d'un slug déjà attribué : au plus une fois par 24h, pour
      // qu'un lien déjà partagé (carte de visite imprimée, etc.) ne change
      // pas sous elle sans qu'elle s'y attende.
      if (existingSlug && slugChangedAt) {
        const elapsed = Date.now() - changedAtToMs(slugChangedAt);
        if (elapsed < SLUG_CHANGE_COOLDOWN_MS) {
          const hoursLeft = Math.max(1, Math.ceil((SLUG_CHANGE_COOLDOWN_MS - elapsed) / 3_600_000));
          return res.status(429).json({
            error: `Tu pourras à nouveau changer ton lien dans ${hoursLeft}h (une fois par 24h maximum, pour que ton lien reste stable une fois partagé).`,
          });
        }
      }

      const slugRef = db.collection('slugs').doc(requested);
      const claimed = await db.runTransaction(async (tx) => {
        const snap = await tx.get(slugRef);
        if (snap.exists) return false;
        tx.set(slugRef, { uid, createdAt: new Date() });
        return true;
      });

      if (!claimed) {
        return res.status(409).json({ error: 'Ce lien est déjà utilisé, essaie autre chose.' });
      }

      // L'ancien slug ne doit plus jamais résoudre vers ce compte — sinon un
      // ancien lien déjà partagé continuerait à fonctionner en silence après
      // le changement, ou pire, pointerait un jour vers quelqu'un d'autre
      // s'il était un jour réclamé par une autre cliente.
      if (existingSlug && existingSlug !== requested) {
        await db.collection('slugs').doc(existingSlug).delete();
      }

      await clientRef.set({ slug: requested, slugChangedAt: new Date() }, { merge: true });
      return res.status(200).json({ slug: requested });
    }

    // === Cas 2 : dérivation automatique depuis le nom (inscription) ===
    if (typeof existingSlug === 'string' && existingSlug) {
      return res.status(200).json({ slug: existingSlug });
    }

    const baseSlug = slugify(typeof displayName === 'string' ? displayName : '');
    let finalSlug: string | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const candidate = slugCandidate(baseSlug, attempt);
      const slugRef = db.collection('slugs').doc(candidate);

      const claimed = await db.runTransaction(async (tx) => {
        const snap = await tx.get(slugRef);
        if (snap.exists) return false;
        tx.set(slugRef, { uid, createdAt: new Date() });
        return true;
      });

      if (claimed) {
        finalSlug = candidate;
        break;
      }
    }

    if (!finalSlug) {
      console.error(`claim-slug: aucun slug libre après ${MAX_ATTEMPTS} tentatives pour "${baseSlug}"`);
      return res.status(500).json({ error: 'Impossible de générer un lien, réessaie plus tard.' });
    }

    await clientRef.set({ slug: finalSlug, slugChangedAt: new Date() }, { merge: true });
    return res.status(200).json({ slug: finalSlug });
  } catch (err) {
    console.error('claim-slug error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
