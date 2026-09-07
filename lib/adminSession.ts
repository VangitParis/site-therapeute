// lib/adminSession.ts
//
// Server-side admin session: a signed, httpOnly, 8h-lived cookie. Replaces
// the old `sessionStorage.getItem('admin_auth') === 'true'` pattern, which
// was pure client-side state anyone could set from devtools.
//
// The cookie only ever holds a JWT signed with ADMIN_SESSION_SECRET (a
// server-only secret — never NEXT_PUBLIC_). Nothing about the admin
// password or its hash lives in the token; it just asserts "this browser
// completed a successful /api/admin-login within the last 8h".

import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import type { IncomingMessage } from 'http';

export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8h

interface AdminSessionPayload {
  role: 'admin';
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET est manquant ou trop court (32 caractères minimum). Génère-en un " +
        "avec `openssl rand -hex 32` et ajoute-le comme variable d'environnement serveur " +
        '(jamais NEXT_PUBLIC_).'
    );
  }
  return secret;
}

/** Builds the Set-Cookie header value for a fresh 8h admin session. */
export function createAdminSessionCookie(): string {
  const token = jwt.sign({ role: 'admin' } satisfies AdminSessionPayload, getSecret(), {
    expiresIn: SESSION_TTL_SECONDS,
  });
  return serialize(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Builds the Set-Cookie header value that clears the admin session (logout). */
export function clearAdminSessionCookie(): string {
  return serialize(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/** True if the incoming request carries a currently-valid admin session cookie. */
export function isValidAdminSession(req: Pick<IncomingMessage, 'headers'>): boolean {
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return false;
    const token = parse(cookieHeader)[ADMIN_SESSION_COOKIE];
    if (!token) return false;
    const payload = jwt.verify(token, getSecret()) as AdminSessionPayload;
    return payload?.role === 'admin';
  } catch {
    // Missing/expired/tampered token — treat exactly like "not logged in".
    return false;
  }
}
