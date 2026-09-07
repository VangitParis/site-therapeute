import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import bcrypt from 'bcryptjs';

const REAL_PASSWORD = 'correct-horse-battery-staple';
let REAL_HASH: string;

const { getDocMock } = vi.hoisted(() => ({
  getDocMock: vi.fn(),
}));

vi.mock('../../lib/firebaseAdmin', () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({ get: getDocMock }),
    }),
  }),
}));

import handler from '../../pages/api/admin-login';

function mockReq(password: unknown, ip: string) {
  return createMocks({
    method: 'POST',
    body: { password },
    headers: { 'x-forwarded-for': ip },
  });
}

describe('/api/admin-login', () => {
  beforeAll(async () => {
    REAL_HASH = await bcrypt.hash(REAL_PASSWORD, 10);
  });

  it('rejects a wrong password with 401 and sets no cookie', async () => {
    getDocMock.mockResolvedValueOnce({ exists: true, data: () => ({ password: REAL_HASH }) });
    const { req, res } = mockReq('wrong-password', '10.0.0.1');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    expect(res.getHeader('Set-Cookie')).toBeUndefined();
  });

  it('accepts the correct password with 200 and sets an httpOnly, expiring cookie', async () => {
    getDocMock.mockResolvedValueOnce({ exists: true, data: () => ({ password: REAL_HASH }) });
    const { req, res } = mockReq(REAL_PASSWORD, '10.0.0.2');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    const setCookie = String(res.getHeader('Set-Cookie'));
    expect(setCookie).toContain('admin_session=');
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Max-Age=28800/);
  });

  it('fails safely (500, no crash) when config/admin has no password configured at all', async () => {
    getDocMock.mockResolvedValueOnce({ exists: false, data: () => undefined });
    const { req, res } = mockReq('anything', '10.0.0.3');
    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(500);
  });

  it('rate-limits repeated attempts from the same IP (429 after too many tries)', async () => {
    getDocMock.mockResolvedValue({ exists: true, data: () => ({ password: REAL_HASH }) });
    const ip = '10.0.0.99';
    let lastStatus = 0;

    for (let i = 0; i < 11; i++) {
      const { req, res } = mockReq('wrong-password', ip);
      await handler(req as any, res as any);
      lastStatus = res._getStatusCode();
    }

    expect(lastStatus).toBe(429);
  });
});
