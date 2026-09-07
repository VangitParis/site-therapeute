import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebaseClient';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getAuthErrorMessage } from '../lib/authErrorMessages';

type LiveWrapperProps = {
  children: React.ReactNode;
  // Passé par pages/admin/live.tsx depuis getServerSideProps : true seulement
  // si le cookie admin_session a été vérifié côté serveur pour cette requête
  // (?frdev=1). Sans ce cookie valide, la page a déjà redirigé vers /login
  // avant même que ce composant ne s'affiche.
  isAdminSession?: boolean;
};

export default function LiveWrapper({ children, isAdminSession = false }: LiveWrapperProps) {
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
      // La vérification a déjà eu lieu côté serveur (cookie admin_session,
      // voir getServerSideProps) avant que cette page ne soit rendue : si on
      // arrive ici avec isAdminSession=false, quelque chose ne va pas (par ex.
      // navigation client-side sans rechargement) — on ne fait plus jamais
      // confiance à un flag sessionStorage pour trancher.
      setAuthenticated(isAdminSession);
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
      // Le mode admin est validé côté serveur avant l'affichage de la page —
      // il n'y a plus de formulaire de mot de passe à traiter ici.
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthenticated(true);
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
