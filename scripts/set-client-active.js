#!/usr/bin/env node
// scripts/set-client-active.js
//
// One-shot, run manually — sets clients/{uid}.isActive reliably (correct
// field name, correct boolean type), to avoid the exact class of mistake
// that caused a real account to show "en attente de validation" forever:
// editing Firestore by hand in the console with no feedback if the field
// name is misspelled or the value is saved as the string "true" instead of
// the boolean true (checkTenantActive requires a strict boolean === true).
//
// Usage:
//   node --env-file=.env.local scripts/set-client-active.js <email-ou-uid> <true|false>
'use strict';

const { cert, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  const identifier = process.argv[2];
  const rawValue = process.argv[3];

  if (!identifier || !['true', 'false'].includes(rawValue)) {
    console.error(
      'Usage: node --env-file=.env.local scripts/set-client-active.js <email-ou-uid> <true|false>'
    );
    process.exit(1);
  }

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) {
    console.error(
      "FIREBASE_SERVICE_ACCOUNT_KEY introuvable — relance avec --env-file=.env.local"
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(rawKey);
  const app = initializeApp({ credential: cert(serviceAccount) });
  const auth = getAuth(app);
  const db = getFirestore(app);

  let uid = identifier;
  if (identifier.includes('@')) {
    const user = await auth.getUserByEmail(identifier);
    uid = user.uid;
  }

  const isActive = rawValue === 'true';
  const ref = db.collection('clients').doc(uid);

  const before = await ref.get();
  if (!before.exists) {
    console.error(`❌ Aucun document clients/${uid} — le compte a-t-il bien été créé ?`);
    process.exit(1);
  }

  await ref.set({ isActive }, { merge: true });
  const after = await ref.get();

  console.log(`✅ clients/${uid}.isActive = ${isActive}`);
  console.log('Document complet après mise à jour :');
  console.log(JSON.stringify(after.data(), null, 2));
}

main().catch((err) => {
  console.error('❌ Échec:', err.message);
  process.exit(1);
});
