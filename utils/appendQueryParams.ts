// utils/appendQueryParams.ts
export function appendQueryParams(
  path: string,
  uid?: string,
  isDev?: boolean,
  hash?: string
): string {
  const base = 'http://localhost'; // Nécessaire pour utiliser URL correctement
  const url = new URL(path, base);

  if (uid) url.searchParams.set('uid', uid);
  if (isDev) url.searchParams.set('frdev', '1');

  let finalUrl = url.pathname + url.search;
  if (hash) finalUrl += `#${hash}`;

  return finalUrl;
}
