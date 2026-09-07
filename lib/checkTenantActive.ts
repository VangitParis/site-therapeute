// lib/checkTenantActive.ts
//
// Server-side gate for the public-facing pages (pages/users/*). Before this
// existed, `isClient`/`isActive` only ever gated the private editor
// (ClientAuth/LiveWrapper) — the public pages read content/{uid} straight
// from Firestore client-side with no check at all, so a newly-registered,
// never-paid account's site was already fully visible at
// /users/home?uid=<uid> the moment duplicateContentForUser() ran at signup,
// well before any payment. This runs in getServerSideProps (using
// firebase-admin, never trusting the browser) and blocks that.
import type { GetServerSidePropsContext } from 'next';
import { getAdminDb } from './firebaseAdmin';

export type TenantGateResult = {
  redirect?: { destination: string; permanent: false };
};

/**
 * Call from getServerSideProps on every public pages/users/* page. Returns
 * `{ redirect }` when the request should be redirected instead of rendered;
 * returns `{}` when the page may render normally. Always sets
 * X-Robots-Tag: noindex on the response while a tenant isn't active, so a
 * not-yet-paid site can't get indexed even if reached before the redirect.
 */
export async function checkTenantActive(
  context: GetServerSidePropsContext
): Promise<TenantGateResult> {
  const isDev = context.query.frdev === '1';
  const uid = typeof context.query.uid === 'string' ? context.query.uid : null;

  // Le template par défaut (content/fr) et les pages sans uid explicite
  // (landing, prévisualisation admin) ne sont pas concernés par l'activation
  // par cliente.
  if (isDev || !uid) {
    return {};
  }

  try {
    const snap = await getAdminDb().collection('clients').doc(uid).get();
    const isActive = snap.exists && snap.data()?.isActive === true;

    if (!isActive) {
      context.res.setHeader('X-Robots-Tag', 'noindex');
      return { redirect: { destination: '/attente-validation', permanent: false } };
    }
  } catch (err) {
    // En cas de panne Firestore/Admin SDK, on choisit de bloquer plutôt que
    // de laisser passer un site potentiellement non activé.
    console.error('checkTenantActive: erreur de vérification', err);
    context.res.setHeader('X-Robots-Tag', 'noindex');
    return { redirect: { destination: '/attente-validation', permanent: false } };
  }

  return {};
}
