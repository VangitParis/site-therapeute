import { describe, it, expect } from 'vitest';
import { resolveAdminTargetUid } from '../../lib/adminTargetUid';

describe('resolveAdminTargetUid', () => {
  it('resolves to "fr" for the default template (?frdev=1), even if a uid also rides along', () => {
    expect(resolveAdminTargetUid({ frdev: '1' })).toBe('fr');
    expect(resolveAdminTargetUid({ frdev: '1', uid: 'client-A' })).toBe('fr');
  });

  it("resolves to the cliente's uid when editing a specific site (no frdev)", () => {
    expect(resolveAdminTargetUid({ uid: 'client-A' })).toBe('client-A');
  });

  it('resolves to undefined when neither is present', () => {
    expect(resolveAdminTargetUid({})).toBeUndefined();
  });
});
