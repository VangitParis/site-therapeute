// lib/adminTargetUid.ts
//
// Extracted from components/ImageUploadField.tsx: which cliente's content is
// currently being edited in /admin/live, from the URL query — 'fr' for the
// default template (?frdev=1), the cliente's own uid otherwise. Sent to the
// server as `targetUid`, which only has any effect under a verified admin
// session (see pages/api/cloudinary-signature.ts / pages/api/delete.js) —
// for a regular cliente session it is ignored entirely.
export function resolveAdminTargetUid(query: {
  frdev?: string | string[];
  uid?: string | string[];
}): string | undefined {
  if (query.frdev === '1') return 'fr';
  return typeof query.uid === 'string' ? query.uid : undefined;
}
