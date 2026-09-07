// lib/contentOwnership.ts
//
// Extracted from pages/admin/live.tsx's handleSave() so the ownership check
// that prevents a cliente authentifiée as uid A from saving over
// content/{uid B} can be unit-tested without rendering the whole editor page.
// This is a defense-in-depth / fast-fail check on the client — the real
// enforcement is the Firestore rule `allow write: if request.auth.uid ==
// userId` on content/{userId} (see firestore.rules).

/**
 * True only if `currentUid` (the Firebase Auth user actually signed in) is
 * non-empty and matches `targetDocId` (the content/{docId} being saved to).
 * Used for the "regular cliente" save path — the admin ?frdev=1 path never
 * calls this, it goes through /api/admin-save-content instead.
 */
export function canWriteOwnContent(
  currentUid: string | null | undefined,
  targetDocId: string | null | undefined
): boolean {
  return Boolean(currentUid) && Boolean(targetDocId) && currentUid === targetDocId;
}
