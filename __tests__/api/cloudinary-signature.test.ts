import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';

const { verifyIdTokenMock, isValidAdminSessionMock, apiSignRequestMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
  isValidAdminSessionMock: vi.fn(),
  apiSignRequestMock: vi.fn(() => 'fake-signature'),
}));

vi.mock('../../lib/firebaseAdmin', () => ({
  getAdminAuth: () => ({ verifyIdToken: verifyIdTokenMock }),
}));

vi.mock('../../lib/adminSession', () => ({
  isValidAdminSession: isValidAdminSessionMock,
}));

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    utils: { api_sign_request: apiSignRequestMock },
  },
}));

import handler from '../../pages/api/cloudinary-signature';

function mockReq(body: Record<string, unknown>, authHeader?: string) {
  return createMocks({
    method: 'POST',
    body,
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('/api/cloudinary-signature', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    isValidAdminSessionMock.mockReset();
    apiSignRequestMock.mockClear();
  });

  it('rejects with 401 when there is no Bearer token and no admin session', async () => {
    isValidAdminSessionMock.mockReturnValue(false);
    const { req, res } = mockReq({ section: 'accueil' });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });

  it('rejects with 401 when the Bearer token fails verification', async () => {
    verifyIdTokenMock.mockRejectedValueOnce(new Error('invalid token'));
    const { req, res } = mockReq({ section: 'accueil' }, 'Bearer garbage-token');
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });

  it("derives the folder from the authenticated uid, ignoring a client-supplied folder override", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    const { req, res } = mockReq(
      {
        section: 'accueil',
        desiredName: 'photo',
        // Attempted cross-tenant override — must be ignored entirely.
        folder: 'therapeutes/client-B/accueil',
      },
      'Bearer valid-token-for-client-A'
    );
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    const body = res._getJSONData();
    expect(body.folder).toBe('therapeutes/client-A/accueil');
    expect(body.folder).not.toContain('client-B');
  });

  it('two different clients get two different, non-overlapping folders', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    const first = mockReq({ section: 'services' }, 'Bearer token-A');
    await handler(first.req as any, first.res as any);
    const folderA = first.res._getJSONData().folder;

    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-B' });
    const second = mockReq({ section: 'services' }, 'Bearer token-B');
    await handler(second.req as any, second.res as any);
    const folderB = second.res._getJSONData().folder;

    expect(folderA).toBe('therapeutes/client-A/services');
    expect(folderB).toBe('therapeutes/client-B/services');
    expect(folderA).not.toBe(folderB);
  });

  it('uses the "fr" folder for a valid admin session (?frdev=1), no Bearer token needed', async () => {
    isValidAdminSessionMock.mockReturnValue(true);
    const { req, res } = mockReq({ section: 'accueil' });
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().folder).toBe('therapeutes/fr/accueil');
  });

  // Regression: an admin editing content from /admin/live got "Autorisation
  // d'upload refusée" whenever the browser also carried a leftover/invalid
  // Authorization header (e.g. a Firebase session from testing a cliente
  // account earlier in the same browser, without ever signing out) — the
  // code checked the Bearer branch first and rejected outright, never even
  // looking at the perfectly valid admin_session cookie sitting right there.
  it('accepts a valid admin session even when a stray/invalid Authorization header is also present', async () => {
    isValidAdminSessionMock.mockReturnValue(true);
    verifyIdTokenMock.mockRejectedValueOnce(new Error('expired/unrelated token'));
    const { req, res } = mockReq({ section: 'accueil' }, 'Bearer some-leftover-or-expired-token');

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().folder).toBe('therapeutes/fr/accueil');
    // The admin path must win outright — Firebase verification is never even attempted.
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  it("derives the folder from the client-specified targetUid under a valid admin session (admin editing a cliente's site)", async () => {
    isValidAdminSessionMock.mockReturnValue(true);
    const { req, res } = mockReq({ section: 'accueil', targetUid: 'client-A' });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().folder).toBe('therapeutes/client-A/accueil');
  });

  it('falls back to the "fr" template folder under a valid admin session when no targetUid is given (?frdev=1)', async () => {
    isValidAdminSessionMock.mockReturnValue(true);
    const { req, res } = mockReq({ section: 'accueil' }); // no targetUid at all

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().folder).toBe('therapeutes/fr/accueil');
  });

  it('ignores a client-supplied targetUid for a regular cliente session (no admin cookie) — no privilege escalation', async () => {
    isValidAdminSessionMock.mockReturnValue(false);
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    const { req, res } = mockReq(
      { section: 'accueil', targetUid: 'client-B' }, // attempted escalation
      'Bearer token-for-client-A'
    );

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().folder).toBe('therapeutes/client-A/accueil');
  });

  it('still rejects with 401 when there is no admin session and the Bearer token is invalid (no fallback to "fr")', async () => {
    isValidAdminSessionMock.mockReturnValue(false);
    verifyIdTokenMock.mockRejectedValueOnce(new Error('invalid token'));
    const { req, res } = mockReq({ section: 'accueil', targetUid: 'fr' }, 'Bearer garbage-token');

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
  });

  it('defaults resourceType to "image" and accepts "raw" for PDFs', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    const asImage = mockReq({ section: 'accueil' }, 'Bearer token-A');
    await handler(asImage.req as any, asImage.res as any);
    expect(asImage.res._getJSONData().resourceType).toBe('image');

    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    const asRaw = mockReq({ section: 'mentions', resourceType: 'raw' }, 'Bearer token-A');
    await handler(asRaw.req as any, asRaw.res as any);
    expect(asRaw.res._getJSONData().resourceType).toBe('raw');
  });
});
