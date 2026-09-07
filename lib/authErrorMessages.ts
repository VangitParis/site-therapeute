// lib/authErrorMessages.ts
//
// Translates Firebase Auth error codes (and any other caught error) into
// short, non-technical French messages safe to show a visitor. Used
// everywhere an auth or API error reaches the UI — never forward
// err.message, a stack trace, an error code, or words like "Firebase" /
// "Firestore" / "undefined" straight to a screen a cliente can see.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/user-not-found': "Aucun compte n'existe avec cette adresse e-mail.",
  'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse e-mail.',
  'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/missing-email': 'Adresse e-mail requise.',
  'auth/too-many-requests': 'Trop de tentatives, réessaie plus tard.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/network-request-failed': 'Problème de connexion — vérifie ton réseau et réessaie.',
};

const DEFAULT_MESSAGE = 'Une erreur est survenue, réessaie dans un instant.';

/**
 * Maps a caught error (typically from Firebase Auth, sometimes from a
 * fetch()/API call) to a user-facing French message. Falls back to a single
 * generic message for anything not explicitly recognized — deliberately
 * never surfaces err.message, since that can contain raw Firebase wording,
 * stack traces, or internal details.
 */
export function getAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | null | undefined)?.code;
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }
  return DEFAULT_MESSAGE;
}
