// lib/sitePreviewUrl.ts
//
// Extracted from components/SitePreview.tsx so the iframe URL it builds for
// the live-editing preview can be unit-tested. This is exactly where the
// "admin sees 'compte en attente de validation' right after login" bug
// lived: the iframe used to load /users/home?admin=true&uid=fr — carrying
// uid='fr' but never frdev=1 — so checkTenantActive (on /users/home's
// getServerSideProps) didn't recognize the admin context, looked up a
// non-existent clients/fr document, and redirected the preview to
// /attente-validation.
export function buildSitePreviewUrl(params: { uid?: string; isAdminDev?: boolean }): string {
  const { uid, isAdminDev } = params;

  if (isAdminDev) {
    // Must carry frdev=1 — not just uid=fr — so checkTenantActive bypasses
    // the activation check the same way every other page does.
    return '/users/home/?admin=true&frdev=1';
  }

  return uid ? `/users/home/?admin=true&uid=${uid}` : '/users/home/?admin=true';
}
