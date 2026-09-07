import { describe, it, expect } from 'vitest';
import { buildSitePreviewUrl } from '../../lib/sitePreviewUrl';

// Regression test for: right after a successful admin login, the live-editing
// iframe (components/SitePreview.tsx) loaded /users/home?admin=true&uid=fr —
// carrying uid='fr' but no frdev=1 — so checkTenantActive's getServerSideProps
// guard on /users/home didn't recognize the admin context, looked up a
// non-existent clients/fr document, and redirected the preview to
// /attente-validation ("compte en attente de validation").
describe('buildSitePreviewUrl', () => {
  it('carries frdev=1 for the admin preview (?frdev=1 session) — never just uid=fr', () => {
    const url = buildSitePreviewUrl({ uid: 'fr', isAdminDev: true });
    expect(url).toContain('frdev=1');
  });

  it('does not carry a bare uid=fr for the admin preview (the exact combination that broke)', () => {
    const url = buildSitePreviewUrl({ uid: 'fr', isAdminDev: true });
    expect(url).not.toBe('/users/home/?admin=true&uid=fr');
  });

  it("still scopes the preview to the cliente's own uid when not in admin mode", () => {
    const url = buildSitePreviewUrl({ uid: 'client-A', isAdminDev: false });
    expect(url).toBe('/users/home/?admin=true&uid=client-A');
  });

  it('falls back to the bare preview when there is no uid and no admin session', () => {
    const url = buildSitePreviewUrl({});
    expect(url).toBe('/users/home/?admin=true');
  });
});
