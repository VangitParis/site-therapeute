import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebaseClient';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export default function LiveWrapper({ children }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);
  const hasCheckedAuth = useRef(false);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    const isFRDev = router.query.frdev === '1';
    setIsDevMode(isFRDev);

    if (isFRDev) {
      const session =
        typeof window !== 'undefined' ? sessionStorage.getItem('admin_auth') : null;
      if (session === 'true') {
        setAuthenticated(true);
        setChecking(false);
        return;
      }

      const checkAdmin = async () => {
        const snap = await getDoc(doc(db, 'config', 'admin'));
        if (!snap.exists()) {
          setError('⚠️ Aucun mot de passe admin configuré.');
          setChecking(false);
          return;
        }
        setChecking(false);
      };
      checkAdmin();
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (hasCheckedAuth.current) return;
      hasCheckedAuth.current = true;

      if (user) {
        const snap = await getDoc(doc(db, 'clients', user.uid));
        if (snap.exists() && snap.data().isClient) {
          setAuthenticated(true);
        } else {
          setError("⛔ Accès refusé. Ce compte n'est pas autorisé.");
          await signOut(auth);
          router.push('/');
        }
      }
      setUserLoaded(true);
      setChecking(false);
    });

    return () => unsub();
  }, [router.query]);

  const handleLogin = async () => {
    setError('');

    if (isDevMode) {
      try {
        const snap = await getDoc(doc(db, 'config', 'admin'));
        const storedHash = snap.data()?.password;
        const MASTER_PWD = process.env.NEXT_PUBLIC_MASTER_PWD;
        const isValid = password === MASTER_PWD || (await bcrypt.compare(password, storedHash));

        if (isValid) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('admin_auth', 'true');
          }
          setAuthenticated(true);
        } else {
          setError('Mot de passe incorrect ❌');
        }
      } catch (e) {
        setError('Erreur de connexion à Firestore');
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthenticated(true);
      } catch (e) {
        setError('Email ou mot de passe incorrect.');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_auth');
    }
    setAuthenticated(false);
    router.push('/');
  };

  if (checking || (!userLoaded && !isDevMode))
    return <p className="text-center p-6">Chargement...</p>;

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <h1 className="text-2xl font-semibold mb-4">
          🔐 Connexion {isDevMode ? 'admin (content/fr)' : 'client'}
        </h1>
        {!isDevMode && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border p-2 mb-2 w-full max-w-sm"
          />
        )}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="border p-2 w-full max-w-sm"
        />
        <button onClick={handleLogin} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded">
          Se connecter
        </button>
        {error && <p className="mt-3 text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="text-right p-4">
        <button onClick={handleLogout} className="text-sm text-red-600 underline mr-4">
          🔒 Se déconnecter
        </button>
      </div>
      {children}
    </div>
  );
}
