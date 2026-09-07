// lib/claimSlugClient.ts
//
// Wraps /api/claim-slug for both call sites:
// - Registration (RegisterForm.tsx, login.tsx): pass `displayName`, ignore a
//   failure — the account still works fine without a pretty link yet, the
//   editor can retry later.
// - The editor (PublishSiteComponent.tsx): pass `customSlug` when the
//   cliente picks her own, and actually show the returned error (already
//   taken, bad format, changed too recently) rather than swallowing it.
import type { User } from 'firebase/auth';

export type ClaimSlugResult = { slug: string; error?: undefined } | { slug?: undefined; error: string };

const GENERIC_ERROR = 'Une erreur est survenue, réessaie dans un instant.';

export async function claimSlug(
  user: User,
  options: { displayName?: string; customSlug?: string }
): Promise<ClaimSlugResult> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/claim-slug', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(options),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: typeof data.error === 'string' ? data.error : GENERIC_ERROR };
    }
    return { slug: data.slug };
  } catch (err) {
    console.error('claimSlug: échec réseau', err);
    return { error: GENERIC_ERROR };
  }
}
