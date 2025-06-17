import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebaseClient';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function ClientAuth({ children }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, 'clients', user.uid));
        if (snap.exists() && snap.data().isClient) {
          localStorage.setItem('UID_CLIENT', user.uid);
          setAuthenticated(true);
        } else {
          setError("⛔ Accès refusé. Ce compte n'est pas autorisé.");
          await signOut(auth);
        }
      }
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      setError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError('Email ou mot de passe incorrect.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthenticated(false);
    localStorage.removeItem('UID_CLIENT');
  };

  if (checking) return <p className="text-center p-6">Chargement...</p>;

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <h1 className="text-2xl font-semibold mb-4">🔐 Connexion client</h1>
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
      </div>
      {children}
    </div>
  );
}
