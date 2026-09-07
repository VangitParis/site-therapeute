// pages/[slug].tsx
//
// The pretty, shareable link: site-therapeute.vercel.app/marie-dupont.
// Resolves the slug to a uid (slugs/{slug}, server-side via firebase-admin —
// this collection is locked to client reads/writes entirely, see
// firestore.rules) then renders the exact same homepage as
// /users/home?uid=<uid>, but the address bar keeps showing /marie-dupont —
// nothing redirects. Internal navigation from there (À propos, Contact...)
// falls back to the existing ?uid= links, same as everywhere else in the app.
import type { GetServerSideProps } from 'next';
import { getAdminDb } from '../lib/firebaseAdmin';
import { checkTenantActive } from '../lib/checkTenantActive';
import HomePage from './users/home';

type SlugPageProps = { uid: string };

export const getServerSideProps: GetServerSideProps<SlugPageProps> = async (context) => {
  const slug = context.params?.slug;
  if (typeof slug !== 'string') return { notFound: true };

  const slugSnap = await getAdminDb().collection('slugs').doc(slug).get();
  if (!slugSnap.exists) return { notFound: true };

  const uid = slugSnap.data()?.uid;
  if (typeof uid !== 'string' || !uid) return { notFound: true };

  // Même garde d'activation que toutes les pages publiques — un slug ne
  // contourne pas la vérification isActive.
  const gate = await checkTenantActive({ ...context, query: { uid } } as any);
  if (gate.redirect) return { redirect: gate.redirect };

  return { props: { uid } };
};

export default function SlugPage({ uid }: SlugPageProps) {
  return <HomePage overrideUid={uid} />;
}
