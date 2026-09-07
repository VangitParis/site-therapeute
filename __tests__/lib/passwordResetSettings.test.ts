import { describe, it, expect } from 'vitest';
import { buildPasswordResetSettings } from '../../lib/passwordResetSettings';

// Regression: sendPasswordResetEmail was called with no ActionCodeSettings,
// so Firebase's default action page confirmed the reset with no way back to
// the app. `url` (continueUrl) must point back to /login on whichever origin
// served the page (localhost in dev, the real domain in prod).
describe('buildPasswordResetSettings', () => {
  it('points continueUrl at /login on the given origin', () => {
    expect(buildPasswordResetSettings('https://site-therapeute.vercel.app')).toEqual({
      url: 'https://site-therapeute.vercel.app/login',
    });
  });

  it('works for a local dev origin too', () => {
    expect(buildPasswordResetSettings('http://localhost:3000')).toEqual({
      url: 'http://localhost:3000/login',
    });
  });
});
