#!/usr/bin/env node
// scripts/reset-admin-password.js
//
// One-shot, run manually from your terminal — no UI, no PassWordChanger.tsx.
// Hashes the password you give it with bcrypt and overwrites config/admin in
// Firestore directly via firebase-admin (bypasses Security Rules, which is
// exactly why this has to run server-side/locally rather than from the app).
//
// Run this now: the previous admin password ("master123") was shipped in the
// public JS bundle via NEXT_PUBLIC_MASTER_PWD for as long as that code was
// live, so it must be treated as compromised regardless of how strong it is.
//
// Usage:
//   node --env-file=.env.local scripts/reset-admin-password.js '<nouveau-mot-de-passe>'
//
// Notes:
// - Choose something you don't reuse elsewhere, 12+ characters.
// - Your shell may keep this command (with the password) in its history.
//   If that matters to you: prefix the command with a space (many shells with
//   HISTCONTROL=ignorespace then skip it), or clear it afterwards
//   (`history -d <line>` in bash/zsh, or just clear the whole history).
// - This does not revoke admin sessions already issued before the change —
//   they stay valid for up to 8h (their JWT expiry) regardless of the
//   password. Not a concern for a one-off rotation like this.
'use strict';

const bcrypt = require('bcryptjs');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  const newPassword = process.argv[2];

  if (!newPassword || newPassword.length < 12) {
    console.error(
      'Usage: node --env-file=.env.local scripts/reset-admin-password.js "<mot-de-passe-12-caracteres-minimum>"'
    );
    process.exit(1);
  }

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) {
    console.error(
      "FIREBASE_SERVICE_ACCOUNT_KEY est introuvable dans l'environnement — relance avec " +
        '`node --env-file=.env.local scripts/reset-admin-password.js ...`'
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(rawKey);
  const app = initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore(app);

  const hash = await bcrypt.hash(newPassword, 10);
  await db.collection('config').doc('admin').set({ password: hash }, { merge: true });

  console.log('✅ Mot de passe admin mis à jour dans Firestore (config/admin).');
  console.log('   Les sessions admin déjà ouvertes restent valides jusqu’à 8h après leur connexion.');
}

main().catch((err) => {
  console.error('❌ Échec de la mise à jour:', err);
  process.exit(1);
});
