import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getDocMock, setClientDoc } = vi.hoisted(() => {
  let currentDoc: { exists: boolean; data?: Record<string, any> } = { exists: false };
  const getDocMock = vi.fn(async () => ({
    exists: currentDoc.exists,
    data: () => currentDoc.data,
  }));
  return {
    getDocMock,
    setClientDoc: (doc: { exists: boolean; data?: Record<string, any> }) => {
      currentDoc = doc;
    },
  };
});

vi.mock('../../lib/firebaseAdmin', () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({ get: getDocMock }),
    }),
  }),
}));

import { checkTenantActive } from '../../lib/checkTenantActive';

function fakeContext(query: Record<string, string>) {
  const headers: Record<string, string> = {};
  return {
    query,
    res: { setHeader: vi.fn((k: string, v: string) => (headers[k] = v)) },
    _headers: headers,
  } as any;
}

describe('checkTenantActive (public pages activation gate)', () => {
  beforeEach(() => {
    getDocMock.mockClear();
  });

  it('never checks Firestore for the admin template (?frdev=1)', async () => {
    const ctx = fakeContext({ frdev: '1' });
    const result = await checkTenantActive(ctx);
    expect(result).toEqual({});
    expect(getDocMock).not.toHaveBeenCalled();
  });

  // Regression test: the admin live-preview iframe (components/SitePreview.tsx)
  // used to load /users/home?admin=true&uid=fr — carrying uid='fr' but no
  // frdev=1 — which made checkTenantActive look up a non-existent
  // clients/fr document and redirect the admin's own preview to
  // /attente-validation right after a successful admin login. A valid admin
  // session (frdev=1) must bypass this check no matter what uid rides along.
  it('bypasses the check when frdev=1 is present, even with a uid that has no clients/{uid} document (admin session never blocked)', async () => {
    setClientDoc({ exists: false });
    const ctx = fakeContext({ frdev: '1', uid: 'fr' });
    const result = await checkTenantActive(ctx);
    expect(result).toEqual({});
    expect(getDocMock).not.toHaveBeenCalled();
    expect(ctx._headers['X-Robots-Tag']).toBeUndefined();
  });

  it('lets pages with no uid at all through untouched (landing page etc.)', async () => {
    const ctx = fakeContext({});
    const result = await checkTenantActive(ctx);
    expect(result).toEqual({});
    expect(getDocMock).not.toHaveBeenCalled();
  });

  it('redirects to /attente-validation and sets noindex when clients/{uid} does not exist', async () => {
    setClientDoc({ exists: false });
    const ctx = fakeContext({ uid: 'brand-new-uid' });
    const result = await checkTenantActive(ctx);
    expect(result).toEqual({ redirect: { destination: '/attente-validation', permanent: false } });
    expect(ctx._headers['X-Robots-Tag']).toBe('noindex');
  });

  // Regression: a real account stayed stuck on "en attente de validation"
  // after being manually flipped in the Firestore console. The account
  // predated the isActive field entirely (created before this feature
  // existed) and the console edit never actually reached the document — but
  // the two most common ways such a manual edit silently fails are (a)
  // setting the wrong field name and (b) the console saving the value as the
  // string "true" instead of the boolean true. Both must still redirect:
  // checkTenantActive requires the exact field name `isActive` with a
  // strict boolean `true`, nothing looser.
  it('redirects when the document has a French "actif" field instead of "isActive" (field-name mismatch)', async () => {
    setClientDoc({ exists: true, data: { actif: true } });
    const ctx = fakeContext({ uid: 'legacy-uid' });
    const result = await checkTenantActive(ctx);
    expect(result.redirect).toEqual({ destination: '/attente-validation', permanent: false });
  });

  it('redirects when isActive is saved as the string "true" instead of the boolean true', async () => {
    setClientDoc({ exists: true, data: { isActive: 'true' } });
    const ctx = fakeContext({ uid: 'legacy-uid' });
    const result = await checkTenantActive(ctx);
    expect(result.redirect).toEqual({ destination: '/attente-validation', permanent: false });
  });

  it('redirects and sets noindex when isActive is false', async () => {
    setClientDoc({ exists: true, data: { isActive: false } });
    const ctx = fakeContext({ uid: 'unpaid-uid' });
    const result = await checkTenantActive(ctx);
    expect(result).toEqual({ redirect: { destination: '/attente-validation', permanent: false } });
    expect(ctx._headers['X-Robots-Tag']).toBe('noindex');
  });

  it('redirects when isActive is missing entirely from the document', async () => {
    setClientDoc({ exists: true, data: { email: 'a@example.com' } });
    const ctx = fakeContext({ uid: 'legacy-uid' });
    const result = await checkTenantActive(ctx);
    expect(result.redirect).toBeDefined();
  });

  it('lets the page render, with no noindex header, when isActive is true', async () => {
    setClientDoc({ exists: true, data: { isActive: true } });
    const ctx = fakeContext({ uid: 'paid-uid' });
    const result = await checkTenantActive(ctx);
    expect(result).toEqual({});
    expect(ctx._headers['X-Robots-Tag']).toBeUndefined();
  });

  it('fails closed (redirects) if Firestore itself errors out', async () => {
    getDocMock.mockRejectedValueOnce(new Error('Firestore unavailable'));
    const ctx = fakeContext({ uid: 'any-uid' });
    const result = await checkTenantActive(ctx);
    expect(result.redirect).toEqual({ destination: '/attente-validation', permanent: false });
  });

  it('reflects an isActive flip from false to true immediately (no stale caching)', async () => {
    setClientDoc({ exists: true, data: { isActive: false } });
    const before = await checkTenantActive(fakeContext({ uid: 'flipping-uid' }));
    expect(before.redirect).toBeDefined();

    // Admin flips the toggle in Firestore between the two requests.
    setClientDoc({ exists: true, data: { isActive: true } });
    const after = await checkTenantActive(fakeContext({ uid: 'flipping-uid' }));
    expect(after).toEqual({});
  });
});
