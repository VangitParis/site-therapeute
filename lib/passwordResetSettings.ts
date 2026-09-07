// lib/passwordResetSettings.ts
//
// Extracted from pages/login.tsx's handleForgotPassword so the
// ActionCodeSettings passed to sendPasswordResetEmail can be unit-tested.
// Without a continueUrl, Firebase's default password-reset action page just
// confirms "password reset" with no way back to the app — this is what
// fixes that.
import type { ActionCodeSettings } from 'firebase/auth';

export function buildPasswordResetSettings(origin: string): ActionCodeSettings {
  return { url: `${origin}/login` };
}
