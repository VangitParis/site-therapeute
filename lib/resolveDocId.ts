// lib/resolveDocId.ts
import { NextRouter } from 'next/router';

export function resolveDocId(router: NextRouter, locale: string): string {
  const isDev = router.query.frdev === '1';

  // Important : utiliser seulement si explicitement dans l’URL
  const hasUid =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('uid');

  if (isDev) return 'fr';
  if (hasUid && typeof router.query.uid === 'string') return router.query.uid;
  return locale; // défaut public
}
