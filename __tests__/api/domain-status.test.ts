import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';

const { verifyIdTokenMock, clientDocGetMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
  clientDocGetMock: vi.fn(),
}));

vi.mock('../../lib/firebaseAdmin', () => ({
  getAdminAuth: () => ({ verifyIdToken: verifyIdTokenMock }),
  getAdminDb: () => ({
    collection: () => ({ doc: () => ({ get: clientDocGetMock }) }),
  }),
}));

import handler from '../../pages/api/vercel/domain-status';

function mockReq(domain: string, authHeader?: string) {
  return createMocks({
    method: 'GET',
    query: { domain },
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('/api/vercel/domain-status', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    clientDocGetMock.mockReset();
    process.env.VERCEL_TOKEN = 'test-token';
    process.env.VERCEL_PROJECT_ID = 'test-project';
  });

  it('rejects with 401 when there is no valid Firebase session', async () => {
    const { req, res } = mockReq('mon-domaine.fr');
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });

  it("rejects with 403 when the domain isn't the caller's own customDomain", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    clientDocGetMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({ customDomain: 'my-real-domain.fr' }),
    });
    const { req, res } = mockReq('someone-elses-domain.fr', 'Bearer token-A');
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(403);
  });

  it('reports "connected" when Vercel says the domain is verified', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    clientDocGetMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({ customDomain: 'mon-domaine.fr' }),
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ verified: true }) }))
    );
    const { req, res } = mockReq('mon-domaine.fr', 'Bearer token-A');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().status).toBe('connected');
  });

  it('reports "pending" when Vercel has not verified the domain yet', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    clientDocGetMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({ customDomain: 'mon-domaine.fr' }),
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ verified: false }) }))
    );
    const { req, res } = mockReq('mon-domaine.fr', 'Bearer token-A');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().status).toBe('pending');
  });
});
