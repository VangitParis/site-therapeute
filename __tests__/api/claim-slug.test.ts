import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';

const { verifyIdTokenMock, store, slugStore } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
  store: new Map<string, any>(), // clients/{uid}
  slugStore: new Map<string, any>(), // slugs/{slug}
}));

vi.mock('../../lib/firebaseAdmin', () => ({
  getAdminAuth: () => ({ verifyIdToken: verifyIdTokenMock }),
  getAdminDb: () => ({
    collection: (name: string) => {
      const backing = name === 'clients' ? store : slugStore;
      return {
        doc: (id: string) => ({
          get: async () => ({ exists: backing.has(id), data: () => backing.get(id) }),
          set: async (data: any, opts?: { merge?: boolean }) => {
            backing.set(id, opts?.merge ? { ...(backing.get(id) || {}), ...data } : data);
          },
          delete: async () => {
            backing.delete(id);
          },
        }),
      };
    },
    runTransaction: async (fn: (tx: any) => Promise<boolean>) => {
      const tx = {
        get: async (ref: { get: () => Promise<any> }) => ref.get(),
        // Same Map mutation as ref.set() outside a transaction — our fake
        // store's writes are synchronous under the hood, so firing this
        // without awaiting still lands before runTransaction resolves.
        set: (ref: { set: (data: any) => Promise<void> }, data: any) => {
          ref.set(data);
        },
      };
      return fn(tx);
    },
  }),
}));

import handler from '../../pages/api/claim-slug';

let ipCounter = 0;

// Chaque test utilise une IP distincte pour ne pas se heurter au rate-limit
// général (10/min/IP) accumulé par les tests précédents dans ce même fichier
// — seul le test dédié "rate-limits repeated calls" réutilise volontairement
// la même IP pour vérifier ce comportement.
function mockReq(body: Record<string, unknown>, authHeader?: string) {
  ipCounter += 1;
  return createMocks({
    method: 'POST',
    body,
    headers: {
      ...(authHeader ? { authorization: authHeader } : {}),
      'x-forwarded-for': `10.0.1.${ipCounter}`,
    },
  });
}

describe('/api/claim-slug', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    store.clear();
    slugStore.clear();
  });

  it('rejects with 401 when there is no valid Firebase session', async () => {
    const { req, res } = mockReq({ displayName: 'Marie Dupont' });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });

  it('claims a slug derived from the display name for a brand-new client', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-marie' });
    const { req, res } = mockReq({ displayName: 'Marie Dupont' }, 'Bearer token');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().slug).toBe('marie-dupont');
    expect(store.get('uid-marie').slug).toBe('marie-dupont');
    expect(slugStore.get('marie-dupont').uid).toBe('uid-marie');
  });

  it('appends a numeric suffix when the base slug is already taken', async () => {
    slugStore.set('marie-dupont', { uid: 'someone-else' });

    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-marie-2' });
    const { req, res } = mockReq({ displayName: 'Marie Dupont' }, 'Bearer token');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().slug).toBe('marie-dupont-2');
  });

  it('returns the existing slug instead of claiming a new one if the client already has one', async () => {
    store.set('uid-marie', { slug: 'marie-dupont' });

    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-marie' });
    const { req, res } = mockReq({ displayName: 'Marie Dupont' }, 'Bearer token');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().slug).toBe('marie-dupont');
    expect(slugStore.has('marie-dupont')).toBe(false); // never re-claimed
  });

  // --- Slug personnalisé, changement après coup ---

  const HOUR = 3_600_000;

  it("lets a cliente choose her own brand-name slug instead of the auto-derived one", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-marie' });
    const { req, res } = mockReq({ customSlug: 'cabinet-serenite' }, 'Bearer token');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().slug).toBe('cabinet-serenite');
    expect(store.get('uid-marie').slug).toBe('cabinet-serenite');
    expect(slugStore.get('cabinet-serenite').uid).toBe('uid-marie');
  });

  it('rejects an invalid format (uppercase, spaces, accents) with a clear message', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-marie' });
    const { req, res } = mockReq({ customSlug: 'Cabinet Sérénité !' }, 'Bearer token');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toMatch(/lettres/i);
  });

  it('rejects a custom slug already used by someone else with a clear message', async () => {
    slugStore.set('cabinet-zen', { uid: 'someone-else' });

    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-marie' });
    const { req, res } = mockReq({ customSlug: 'cabinet-zen' }, 'Bearer token');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(409);
    expect(res._getJSONData().error).toBe('Ce lien est déjà utilisé, essaie autre chose.');
  });

  it('changing to a new slug removes the old one — it must stop resolving', async () => {
    store.set('uid-marie', { slug: 'marie-dupont', slugChangedAt: new Date(Date.now() - 25 * HOUR) });
    slugStore.set('marie-dupont', { uid: 'uid-marie' });

    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-marie' });
    const { req, res } = mockReq({ customSlug: 'cabinet-serenite' }, 'Bearer token');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(slugStore.has('marie-dupont')).toBe(false); // l'ancien lien ne résout plus vers personne
    expect(slugStore.get('cabinet-serenite').uid).toBe('uid-marie');
    expect(store.get('uid-marie').slug).toBe('cabinet-serenite');
  });

  it('requesting the exact same slug already owned is a no-op (no cooldown consumed)', async () => {
    store.set('uid-marie', { slug: 'marie-dupont', slugChangedAt: new Date() }); // changed just now
    slugStore.set('marie-dupont', { uid: 'uid-marie' });

    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-marie' });
    const { req, res } = mockReq({ customSlug: 'marie-dupont' }, 'Bearer token');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().slug).toBe('marie-dupont');
    expect(slugStore.get('marie-dupont').uid).toBe('uid-marie'); // untouched, not re-claimed
  });

  it('rejects a second slug change within 24h of the last one', async () => {
    store.set('uid-marie', { slug: 'marie-dupont', slugChangedAt: new Date(Date.now() - 2 * HOUR) });
    slugStore.set('marie-dupont', { uid: 'uid-marie' });

    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-marie' });
    const { req, res } = mockReq({ customSlug: 'cabinet-serenite' }, 'Bearer token');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData().error).toMatch(/24h/);
    // Rien n'a bougé : ni le slug, ni la table de correspondance.
    expect(store.get('uid-marie').slug).toBe('marie-dupont');
    expect(slugStore.has('cabinet-serenite')).toBe(false);
  });

  it('allows a slug change again once 24h have passed', async () => {
    store.set('uid-marie', { slug: 'marie-dupont', slugChangedAt: new Date(Date.now() - 25 * HOUR) });
    slugStore.set('marie-dupont', { uid: 'uid-marie' });

    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'uid-marie' });
    const { req, res } = mockReq({ customSlug: 'cabinet-serenite' }, 'Bearer token');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().slug).toBe('cabinet-serenite');
  });

  it('rate-limits repeated calls from the same IP', async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: 'uid-marie' });
    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const { req, res } = createMocks({
        method: 'POST',
        body: { displayName: 'Marie Dupont' },
        headers: { authorization: 'Bearer token', 'x-forwarded-for': '10.0.0.50' },
      });
      await handler(req as any, res as any);
      lastStatus = res._getStatusCode();
    }
    expect(lastStatus).toBe(429);
  });
});
