import { describe, it, expect } from 'vitest';
import { canWriteOwnContent } from '../../lib/contentOwnership';

// Extracted from pages/admin/live.tsx handleSave() — this is the fast-fail
// check that stops a cliente authenticated as uid A from saving over
// content/{uid B} by editing the ?uid= query param.
describe('canWriteOwnContent', () => {
  it('rejects a cross-tenant write attempt (auth uid A, target doc uid B)', () => {
    expect(canWriteOwnContent('uid-A', 'uid-B')).toBe(false);
  });

  it('allows writing to your own content document', () => {
    expect(canWriteOwnContent('uid-A', 'uid-A')).toBe(true);
  });

  it('rejects when nobody is authenticated', () => {
    expect(canWriteOwnContent(undefined, 'uid-A')).toBe(false);
    expect(canWriteOwnContent(null, 'uid-A')).toBe(false);
  });

  it('rejects when there is no resolved target document', () => {
    expect(canWriteOwnContent('uid-A', undefined)).toBe(false);
    expect(canWriteOwnContent('uid-A', null)).toBe(false);
    expect(canWriteOwnContent('uid-A', '')).toBe(false);
  });
});
