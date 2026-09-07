import { describe, it, expect } from 'vitest';
import { slugify, slugCandidate } from '../../lib/slugify';

describe('slugify', () => {
  it('turns a display name into a lowercase, hyphenated slug', () => {
    expect(slugify('Marie Dupont')).toBe('marie-dupont');
  });

  it('strips accents', () => {
    expect(slugify('Éléonore Bénédicte')).toBe('eleonore-benedicte');
  });

  it('falls back to a default for an empty or unusable name', () => {
    expect(slugify('')).toBe('therapeute');
    expect(slugify('   ')).toBe('therapeute');
    expect(slugify('!!!')).toBe('therapeute');
  });

  it('caps length to keep URLs reasonable', () => {
    const long = 'a'.repeat(200);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });
});

describe('slugCandidate', () => {
  it('returns the base slug unchanged for the first attempt', () => {
    expect(slugCandidate('marie-dupont', 1)).toBe('marie-dupont');
  });

  it('appends a numeric suffix for subsequent attempts (collision handling)', () => {
    expect(slugCandidate('marie-dupont', 2)).toBe('marie-dupont-2');
    expect(slugCandidate('marie-dupont', 3)).toBe('marie-dupont-3');
  });
});
