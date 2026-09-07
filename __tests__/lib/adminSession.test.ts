import { describe, it, expect } from 'vitest';
import {
  createAdminSessionCookie,
  clearAdminSessionCookie,
  isValidAdminSession,
  ADMIN_SESSION_COOKIE,
} from '../../lib/adminSession';

function reqWithCookieHeader(setCookieValue: string) {
  // Set-Cookie looks like "admin_session=<token>; HttpOnly; ...; Max-Age=28800"
  // — a real request only ever sends back "admin_session=<token>".
  const token = setCookieValue.split(';')[0];
  return { headers: { cookie: token } };
}

describe('admin session cookie', () => {
  it('createAdminSessionCookie sets httpOnly and an 8h expiration', () => {
    const setCookie = createAdminSessionCookie();
    expect(setCookie).toContain(`${ADMIN_SESSION_COOKIE}=`);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toMatch(/Max-Age=28800/); // 8h in seconds
  });

  it('isValidAdminSession is true for a freshly created cookie', () => {
    const setCookie = createAdminSessionCookie();
    expect(isValidAdminSession(reqWithCookieHeader(setCookie))).toBe(true);
  });

  it('isValidAdminSession is false with no cookie header at all (the devtools-bypass case)', () => {
    expect(isValidAdminSession({ headers: {} })).toBe(false);
  });

  it('isValidAdminSession is false for a tampered/garbage token', () => {
    expect(isValidAdminSession({ headers: { cookie: `${ADMIN_SESSION_COOKIE}=not-a-real-jwt` } })).toBe(
      false
    );
  });

  it('isValidAdminSession is false after clearAdminSessionCookie (logout)', () => {
    const cleared = clearAdminSessionCookie();
    // logout sets an empty value with Max-Age=0 — an empty cookie value never validates
    expect(isValidAdminSession(reqWithCookieHeader(cleared))).toBe(false);
  });

  it('a cookie signed with a different secret is rejected', async () => {
    const setCookie = createAdminSessionCookie();
    const originalSecret = process.env.ADMIN_SESSION_SECRET;
    try {
      process.env.ADMIN_SESSION_SECRET = 'a-completely-different-secret-0123456789ab';
      expect(isValidAdminSession(reqWithCookieHeader(setCookie))).toBe(false);
    } finally {
      process.env.ADMIN_SESSION_SECRET = originalSecret;
    }
  });
});
