// lib/slugify.ts
//
// Turns a display name ("Marie Dupont") into a URL-friendly slug
// ("marie-dupont"), used both to propose a candidate at /api/claim-slug and
// (with a numeric suffix) to resolve collisions.
export function slugify(name: string): string {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return cleaned || 'therapeute';
}

/** "marie-dupont", then "marie-dupont-2", "marie-dupont-3", ... */
export function slugCandidate(baseSlug: string, attempt: number): string {
  return attempt <= 1 ? baseSlug : `${baseSlug}-${attempt}`;
}
