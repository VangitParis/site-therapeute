import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebaseClient';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getAuthErrorMessage } from '../lib/authErrorMessages';

export default function ClientAuth({ children }) {
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

    // Le mode admin (?frdev=1) est désormais protégé côté serveur par
    // getServerSideProps sur la page /admin/live (cookie de session httpOnly) :
    // si on arrive jusqu'ici avec frdev=1, la page hôte a déjà validé la
    // session. On ne stocke plus rien dans sessionStorage.
    if (isFRDev) {
      setAuthenticated(true);
      setChecking(false);
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
        }
      }
      setUserLoaded(true);
      setChecking(false);
    });

    return () => unsub();
  }, [router.query]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setUserLoaded(true));
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setError('');

    if (isDevMode) {
      // Ce cas ne devrait plus se présenter : frdev=1 n'atteint ce composant
      // que si la page l'a déjà validé côté serveur (voir plus haut).
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      console.error('Erreur connexion cliente:', e);
      setError(getAuthErrorMessage(e));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    if (isDevMode) {
      await fetch('/api/admin-logout', { method: 'POST' });
    }
    setAuthenticated(false);
  };

  if (checking || !userLoaded) return <p className="text-center p-6">Chargement...</p>;

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
