// lib/adminLiveGuard.ts
//
// getServerSideProps for pages/admin/live.tsx, extracted so it can be
// unit-tested without importing the page's full component tree (AdminSidebar,
// SitePreview, LiveWrapper, and everything they pull in).
import type { GetServerSideProps } from 'next';
import { isValidAdminSession } from './adminSession';

export const adminLiveGetServerSideProps: GetServerSideProps = async (context) => {
  const isDev = context.query.frdev === '1';

  if (isDev) {
    if (!isValidAdminSession(context.req)) {
      return { redirect: { destination: '/login', permanent: false } };
    }
    return { props: { isAdminSession: true } };
  }

  return { props: { isAdminSession: false } };
};
