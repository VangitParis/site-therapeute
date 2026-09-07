// lib/firebaseAdmin.ts
//
// Firebase Admin SDK — SERVER-SIDE ONLY. Never import this file from a
// component, a page's client code, or anything bundled to the browser: it
// holds a service account key with elevated privileges (bypasses Firestore
// Security Rules entirely). Only import it from pages/api/*, getServerSideProps,
// or other lib/*.ts files that are themselves only used server-side.
//
// Requires the env var FIREBASE_SERVICE_ACCOUNT_KEY: the full JSON key
// downloaded from Firebase Console → Project settings → Service accounts →
// Generate new private key, stored as a single-line JSON string (no
// NEXT_PUBLIC_ prefix — this must never reach the client bundle).
//
// Initialization is lazy (only happens on first use) so that simply
// importing this module never crashes the dev server or the build before
// the env var is configured.

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App | null = null;
let db: Firestore | null = null;
let authInstance: Auth | null = null;

function getAdminApp(): App {
  if (app) return app;

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY est manquant. Génère une clé de compte de service depuis " +
        'la console Firebase (Paramètres du projet > Comptes de service > Générer une nouvelle ' +
        "clé privée) et colle le JSON complet (une seule ligne) dans cette variable d'environnement serveur."
    );
  }

  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(rawKey);
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY contient un JSON invalide — colle le fichier de clé de ' +
        'service tel quel (JSON complet), sans le modifier.'
    );
  }

  app = initializeApp({ credential: cert(serviceAccount as any) });
  return app;
}

/** Firestore access with admin privileges (bypasses Security Rules). Server-only. */
export function getAdminDb(): Firestore {
  if (!db) db = getFirestore(getAdminApp());
  return db;
}

/** Firebase Auth admin access (verify ID tokens, manage users). Server-only. */
export function getAdminAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getAdminApp());
  return authInstance;
}
