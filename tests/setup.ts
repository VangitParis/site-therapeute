// tests/setup.ts — runs before every test file.
//
// Dummy values only, never the real project's secrets: real Firebase/Vercel
// access in tests always goes through mocks of lib/firebaseAdmin,
// lib/adminSession, cloudinary, etc. — nothing here should ever cause a test
// to touch the real project.
process.env.ADMIN_SESSION_SECRET ??= 'test-only-secret-do-not-use-in-prod-0123456789';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??= 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??= 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??= 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??= 'test-project.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??= '000000000000';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??= '1:000000000000:web:0000000000000000000000';
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME ??= 'test-cloud';
process.env.CLOUDINARY_API_KEY ??= 'test-cloudinary-key';
process.env.CLOUDINARY_API_SECRET ??= 'test-cloudinary-secret';
