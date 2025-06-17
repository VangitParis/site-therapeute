import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function AdminAuth({ children }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingClient, setCheckingClient] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forceFR, setForceFR] = useState(false);

  // Active automatiquement le mode FR local si query ?frdev=1
  useEffect(() => {
    if (typeof window !== 'undefined' && router.query.frdev === '1') {
      localStorage.setItem('FORCE_FR', 'true');
      setForceFR(true);
    } else if (localStorage.getItem('FORCE_FR') === 'true') {
      setForceFR(true);
    }
  }, [router.query]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, 'clients', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().isClient === true) {
          setAuthenticated(true);
        } else {
          setError("⛔ Accès refusé : vous n'êtes pas autorisé.");
          await signOut(auth);
        }
      }
      setCheckingClient(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Email ou mot de passe incorrect.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthenticated(false);
  };

  const disableForceFR = () => {
    localStorage.removeItem('FORCE_FR');
    setForceFR(false);
    router.push('/'); // ou window.location.reload()
  };

  if (checkingClient && !forceFR) return <p className="text-center p-6">⏳ Vérification...</p>;

  if (!authenticated && !forceFR) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <h1 className="text-2xl font-semibold mb-4">🔐 Connexion</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 mb-2 w-full max-w-sm"
        />
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
        {forceFR && (
          <button onClick={disableForceFR} className="text-sm text-orange-600 underline">
            🔒 Désactiver le mode dev
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
