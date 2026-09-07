import { describe, it, expect } from 'vitest';
import { adminLiveGetServerSideProps } from '../../lib/adminLiveGuard';
import { createAdminSessionCookie } from '../../lib/adminSession';

// pages/admin/live.tsx re-exports this directly as its getServerSideProps.
// This is the fix for: "?frdev=1 was only gated by sessionStorage, which
// anyone can set from devtools" — now the server itself refuses to render
// the admin editor without a valid signed cookie.
function fakeContext(query: Record<string, string>, cookieHeader?: string) {
  return {
    query,
    req: { headers: cookieHeader ? { cookie: cookieHeader } : {} },
  } as any;
}

describe('adminLiveGetServerSideProps (?frdev=1 server-side guard)', () => {
  it('redirects to /login when frdev=1 is requested with no session cookie at all', async () => {
    const result = await adminLiveGetServerSideProps(fakeContext({ frdev: '1' }));
    expect(result).toEqual({ redirect: { destination: '/login', permanent: false } });
  });

  it('redirects to /login when frdev=1 is requested with a garbage cookie (not a real JWT)', async () => {
    const result = await adminLiveGetServerSideProps(
      fakeContext({ frdev: '1' }, 'admin_session=totally-fake')
    );
    expect(result).toEqual({ redirect: { destination: '/login', permanent: false } });
  });

  it('renders with isAdminSession=true when frdev=1 carries a valid signed cookie', async () => {
    const setCookie = createAdminSessionCookie();
    const cookieHeader = setCookie.split(';')[0];
    const result: any = await adminLiveGetServerSideProps(fakeContext({ frdev: '1' }, cookieHeader));
    expect(result.redirect).toBeUndefined();
    expect(result.props.isAdminSession).toBe(true);
  });

  it('does not require the admin cookie at all for a regular cliente (?uid=..., no frdev)', async () => {
    const result: any = await adminLiveGetServerSideProps(fakeContext({ uid: 'some-client-uid' }));
    expect(result.redirect).toBeUndefined();
    expect(result.props.isAdminSession).toBe(false);
  });
});
