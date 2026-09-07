import { describe, it, expect, vi, beforeEach } from 'vitest';

const { slugGetMock, checkTenantActiveMock } = vi.hoisted(() => ({
  slugGetMock: vi.fn(),
  checkTenantActiveMock: vi.fn(),
}));

vi.mock('../../lib/firebaseAdmin', () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({ get: slugGetMock }),
    }),
  }),
}));

vi.mock('../../lib/checkTenantActive', () => ({
  checkTenantActive: checkTenantActiveMock,
}));

describe('pages/[slug].tsx — getServerSideProps', () => {
  beforeEach(() => {
    slugGetMock.mockReset();
    checkTenantActiveMock.mockReset();
  });

  it('returns notFound for a slug that was never claimed', async () => {
    slugGetMock.mockResolvedValueOnce({ exists: false });
    const { getServerSideProps } = await import('../../pages/[slug]');
    const result = await getServerSideProps({ params: { slug: 'nobody-here' } } as any);
    expect(result).toEqual({ notFound: true });
    expect(checkTenantActiveMock).not.toHaveBeenCalled();
  });

  it('resolves the uid and renders when the tenant is active', async () => {
    slugGetMock.mockResolvedValueOnce({ exists: true, data: () => ({ uid: 'uid-marie' }) });
    checkTenantActiveMock.mockResolvedValueOnce({});
    const { getServerSideProps } = await import('../../pages/[slug]');
    const context = { params: { slug: 'marie-dupont' }, query: {} } as any;
    const result: any = await getServerSideProps(context);

    expect(result).toEqual({ props: { uid: 'uid-marie' } });
    // checkTenantActive must see uid injected into query, not the original context
    expect(checkTenantActiveMock).toHaveBeenCalledWith(
      expect.objectContaining({ query: { uid: 'uid-marie' } })
    );
  });

  it("redirects to /attente-validation when the resolved cliente isn't active yet", async () => {
    slugGetMock.mockResolvedValueOnce({ exists: true, data: () => ({ uid: 'uid-marie' }) });
    checkTenantActiveMock.mockResolvedValueOnce({
      redirect: { destination: '/attente-validation', permanent: false },
    });
    const { getServerSideProps } = await import('../../pages/[slug]');
    const result = await getServerSideProps({ params: { slug: 'marie-dupont' }, query: {} } as any);

    expect(result).toEqual({ redirect: { destination: '/attente-validation', permanent: false } });
  });
});
