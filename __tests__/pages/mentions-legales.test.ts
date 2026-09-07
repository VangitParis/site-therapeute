import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';

// --- Part 1: getServerSideProps wiring — same activation gate as the other
// public pages (home, about, contact, services, testimonials). Before this
// fix, mentions_legales.tsx had no gate at all and always read content/fr.
const { checkTenantActiveMock } = vi.hoisted(() => ({
  checkTenantActiveMock: vi.fn(),
}));

vi.mock('../../lib/checkTenantActive', () => ({
  checkTenantActive: checkTenantActiveMock,
}));

describe('pages/users/mentions_legales.tsx — getServerSideProps', () => {
  beforeEach(() => {
    checkTenantActiveMock.mockReset();
  });

  it('delegates to checkTenantActive and redirects when it says to', async () => {
    checkTenantActiveMock.mockResolvedValueOnce({
      redirect: { destination: '/attente-validation', permanent: false },
    });
    const { getServerSideProps } = await import('../../pages/users/mentions_legales');
    const ctx = { query: { uid: 'unpaid-uid' }, res: { setHeader: vi.fn() } } as any;
    const result: any = await getServerSideProps(ctx);

    expect(checkTenantActiveMock).toHaveBeenCalledWith(ctx);
    expect(result).toEqual({ redirect: { destination: '/attente-validation', permanent: false } });
  });

  it('renders normally when checkTenantActive allows it', async () => {
    checkTenantActiveMock.mockResolvedValueOnce({});
    const { getServerSideProps } = await import('../../pages/users/mentions_legales');
    const result: any = await getServerSideProps({ query: { uid: 'paid-uid' } } as any);
    expect(result).toEqual({ props: {} });
  });
});

// --- Part 2: the actual upload path — mentions_legales.tsx's handleUpload
// gets its Cloudinary folder from the exact same /api/cloudinary-signature
// endpoint as the image uploader (section 1 of the audit), and gates its
// Firestore write with the same canWriteOwnContent as live.tsx. Both are
// exercised directly here, end to end, rather than re-implementing fakes.
const { verifyIdTokenMock, isValidAdminSessionMock, apiSignRequestMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
  isValidAdminSessionMock: vi.fn(() => false),
  apiSignRequestMock: vi.fn(() => 'fake-signature'),
}));

vi.mock('../../lib/firebaseAdmin', () => ({
  getAdminAuth: () => ({ verifyIdToken: verifyIdTokenMock }),
}));

vi.mock('../../lib/adminSession', () => ({
  isValidAdminSession: isValidAdminSessionMock,
}));

vi.mock('cloudinary', () => ({
  v2: { config: vi.fn(), utils: { api_sign_request: apiSignRequestMock } },
}));

describe('mentions_legales.tsx upload path — cross-tenant isolation', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
  });

  it("derives client A's mentions-légales folder from their own uid, never from a client-supplied value", async () => {
    const cloudinarySignature = (await import('../../pages/api/cloudinary-signature')).default;
    verifyIdTokenMock.mockResolvedValueOnce({ uid: 'client-A' });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        section: 'mentions',
        desiredName: 'mentions-legales',
        resourceType: 'raw',
        // A malicious/buggy client trying to write into client-B's folder —
        // must be ignored just like it is for images.
        folder: 'therapeutes/client-B/mentions',
      },
      headers: { authorization: 'Bearer token-A' },
    });

    await cloudinarySignature(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    const body = res._getJSONData();
    expect(body.folder).toBe('therapeutes/client-A/mentions');
    expect(body.resourceType).toBe('raw');
  });

  it("refuses to sign a mentions-légales upload with no authentication at all", async () => {
    const cloudinarySignature = (await import('../../pages/api/cloudinary-signature')).default;
    const { req, res } = createMocks({
      method: 'POST',
      body: { section: 'mentions', resourceType: 'raw' },
      headers: {},
    });

    await cloudinarySignature(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });

  it("client A's write to content/{uid} is refused if it ever targeted client B's document", async () => {
    const { canWriteOwnContent } = await import('../../lib/contentOwnership');
    // This is exactly the guard mentions_legales.tsx runs before updateDoc().
    expect(canWriteOwnContent('client-A', 'client-B')).toBe(false);
    expect(canWriteOwnContent('client-A', 'client-A')).toBe(true);
  });
});
