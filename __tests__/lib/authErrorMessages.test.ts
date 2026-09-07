import { describe, it, expect } from 'vitest';
import { getAuthErrorMessage } from '../../lib/authErrorMessages';

describe('getAuthErrorMessage', () => {
  it('translates known Firebase Auth codes to plain French', () => {
    expect(getAuthErrorMessage({ code: 'auth/wrong-password' })).toBe('Mot de passe incorrect.');
    expect(getAuthErrorMessage({ code: 'auth/user-not-found' })).toBe(
      "Aucun compte n'existe avec cette adresse e-mail."
    );
    expect(getAuthErrorMessage({ code: 'auth/email-already-in-use' })).toBe(
      'Un compte existe déjà avec cette adresse e-mail.'
    );
    expect(getAuthErrorMessage({ code: 'auth/weak-password' })).toBe(
      'Mot de passe trop court (6 caractères minimum).'
    );
  });

  it('falls back to one generic message for anything unrecognized, never the raw error', () => {
    const rawFirebaseError = {
      code: 'auth/some-new-code-not-in-our-table',
      message: 'Firebase: Error (auth/some-new-code-not-in-our-table).',
    };
    const message = getAuthErrorMessage(rawFirebaseError);
    expect(message).toBe('Une erreur est survenue, réessaie dans un instant.');
    expect(message).not.toContain('Firebase');
    expect(message).not.toContain('auth/');
  });

  it('never leaks a raw JS error message or stack for a plain Error object', () => {
    const message = getAuthErrorMessage(new Error('TypeError: Cannot read properties of undefined'));
    expect(message).toBe('Une erreur est survenue, réessaie dans un instant.');
    expect(message).not.toContain('undefined');
    expect(message).not.toContain('TypeError');
  });

  it('handles null/undefined without throwing', () => {
    expect(getAuthErrorMessage(null)).toBe('Une erreur est survenue, réessaie dans un instant.');
    expect(getAuthErrorMessage(undefined)).toBe('Une erreur est survenue, réessaie dans un instant.');
  });
});
