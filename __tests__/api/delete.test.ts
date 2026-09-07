import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';

const { verifyIdTokenMock, isValidAdminSessionMock, destroyMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
  isValidAdminSessionMock: vi.fn(),
  destroyMock: vi.fn(async () => ({ result: 'ok' })),
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
    uploader: { destroy: destroyMock },
  },
}));

import handler from '../../pages/api/delete';

function mockReq(
  public_id: string,
  authHeader?: string,
  extra?: Record<string, unknown>
) {
  return createMocks({
    method: 'POST',
    body: { public_id, ...extra },
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('/api/delete (Cloudinary destroy — cross-tenant deletion guard)', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    isValidAdminSessionMock.mockReset();
    destroyMock.mockClear();
  });

  it('rejects with 401 when there is no authentication at all', async () => {
    isValidAdminSessionMock.mockReturnValue(false);
    const { req, res } = mockReq('therapeutes/client-A/accueil/photo');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it("allows deleting your own image (public_id under therapeutes/{your uid}/)", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    const { req, res } = mockReq('therapeutes/client-A/accueil/photo', 'Bearer token-A');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(destroyMock).toHaveBeenCalledWith('therapeutes/client-A/accueil/photo');
  });

  it("rejects deleting another client's image (public_id under a different uid) with 403", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    const { req, res } = mockReq('therapeutes/client-B/accueil/photo', 'Bearer token-A');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('rejects a public_id that does not even look like a therapeutes/{uid}/ path', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    const { req, res } = mockReq('some/unrelated/path', 'Bearer token-A');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it("allows the admin session to delete under therapeutes/fr/", async () => {
    isValidAdminSessionMock.mockReturnValue(true);
    const { req, res } = mockReq('therapeutes/fr/accueil/photo');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(destroyMock).toHaveBeenCalledWith('therapeutes/fr/accueil/photo');
  });

  it("does not let the admin session delete another client's image", async () => {
    isValidAdminSessionMock.mockReturnValue(true);
    const { req, res } = mockReq('therapeutes/client-A/accueil/photo');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  // Regression: same root cause as cloudinary-signature — a stray/invalid
  // Authorization header made the request fail before the valid admin
  // cookie was ever checked.
  it('accepts a valid admin session even when a stray/invalid Authorization header is also present', async () => {
    isValidAdminSessionMock.mockReturnValue(true);
    verifyIdTokenMock.mockRejectedValueOnce(new Error('expired/unrelated token'));
    const { req, res } = mockReq(
      'therapeutes/fr/accueil/photo',
      'Bearer some-leftover-or-expired-token'
    );

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(destroyMock).toHaveBeenCalledWith('therapeutes/fr/accueil/photo');
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  it("lets an admin session delete a specific cliente's image via targetUid", async () => {
    isValidAdminSessionMock.mockReturnValue(true);
    const { req, res } = mockReq('therapeutes/client-A/accueil/photo', undefined, {
      targetUid: 'client-A',
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(destroyMock).toHaveBeenCalledWith('therapeutes/client-A/accueil/photo');
  });

  it("rejects an admin session with targetUid='client-A' trying to delete client-B's image", async () => {
    isValidAdminSessionMock.mockReturnValue(true);
    const { req, res } = mockReq('therapeutes/client-B/accueil/photo', undefined, {
      targetUid: 'client-A',
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it('ignores a client-supplied targetUid for a regular cliente session (no admin cookie) — no privilege escalation', async () => {
    isValidAdminSessionMock.mockReturnValue(false);
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    const { req, res } = mockReq('therapeutes/client-B/accueil/photo', 'Bearer token-for-client-A', {
      targetUid: 'client-B', // attempted escalation — must still be scoped to client-A
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(403);
    expect(destroyMock).not.toHaveBeenCalled();
  });
});
