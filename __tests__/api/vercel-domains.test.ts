import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks, RequestMethod } from 'node-mocks-http';

const { verifyIdTokenMock, clientDocGetMock, auditAddMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
  clientDocGetMock: vi.fn(),
  auditAddMock: vi.fn(async () => ({ id: 'audit-1' })),
}));

vi.mock('../../lib/firebaseAdmin', () => ({
  getAdminAuth: () => ({ verifyIdToken: verifyIdTokenMock }),
  getAdminDb: () => ({
    collection: (name: string) => {
      if (name === 'clients') {
        return { doc: () => ({ get: clientDocGetMock }) };
      }
      if (name === 'domainAuditLog') {
        return { add: auditAddMock };
      }
      throw new Error(`unexpected collection ${name}`);
    },
  }),
}));

import addDomainHandler from '../../pages/api/vercel/add-domain';
import removeDomainHandler from '../../pages/api/vercel/remove-domain';

function mockReq(method: RequestMethod, body: Record<string, unknown>, authHeader?: string) {
  return createMocks({ method, body, headers: authHeader ? { authorization: authHeader } : {} });
}

describe('/api/vercel/add-domain', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    auditAddMock.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ domains: [] }) }))
    );
    process.env.VERCEL_TOKEN = 'test-token';
    process.env.VERCEL_PROJECT_ID = 'test-project';
  });

  it('rejects with 401 when there is no valid Firebase session', async () => {
    const { req, res } = mockReq('POST', { domain: 'client-a.com' });
    await addDomainHandler(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    expect((global.fetch as any)).not.toHaveBeenCalled();
  });

  it('adds the domain and logs the call (uid, domain) once authenticated', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    const { req, res } = mockReq('POST', { domain: 'client-a.com' }, 'Bearer token-A');
    await addDomainHandler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(auditAddMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'add', uid: 'client-A', domain: 'client-a.com' })
    );
  });
});

describe('/api/vercel/remove-domain', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    clientDocGetMock.mockReset();
    auditAddMock.mockClear();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })));
    process.env.VERCEL_TOKEN = 'test-token';
    process.env.VERCEL_PROJECT_ID = 'test-project';
  });

  it('rejects with 401 when there is no valid Firebase session', async () => {
    const { req, res } = mockReq('DELETE', { domain: 'client-a.com' });
    await removeDomainHandler(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    expect((global.fetch as any)).not.toHaveBeenCalled();
  });

  it("rejects with 403 when the domain does not match clients/{uid}.customDomain (can't unpublish someone else's site)", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    clientDocGetMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({ customDomain: 'my-real-domain.com' }),
    });
    const { req, res } = mockReq('DELETE', { domain: 'victim-clients-domain.com' }, 'Bearer token-A');
    await removeDomainHandler(req as any, res as any);

    expect(res._getStatusCode()).toBe(403);
    expect((global.fetch as any)).not.toHaveBeenCalled();
  });

  it('rejects with 403 when the caller has no customDomain on record at all', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    clientDocGetMock.mockResolvedValueOnce({ exists: false, data: () => undefined });
    const { req, res } = mockReq('DELETE', { domain: 'anything.com' }, 'Bearer token-A');
    await removeDomainHandler(req as any, res as any);

    expect(res._getStatusCode()).toBe(403);
  });

  it("removes the domain and logs the call when it matches the caller's own record", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });
    clientDocGetMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({ customDomain: 'my-real-domain.com' }),
    });
    const { req, res } = mockReq('DELETE', { domain: 'my-real-domain.com' }, 'Bearer token-A');
    await removeDomainHandler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect((global.fetch as any)).toHaveBeenCalledTimes(1);
    expect(auditAddMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'remove', uid: 'client-A', domain: 'my-real-domain.com' })
    );
  });
});
