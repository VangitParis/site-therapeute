import { useState, useEffect } from 'react';
import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { useRouter } from 'next/router';

export default function AdminAuth({ children }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [storedHash, setStoredHash] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const session = sessionStorage.getItem('admin_auth');
    if (session === 'true') {
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    const fetchPasswordHash = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'admin'));
        if (snap.exists()) {
          setStoredHash(snap.data().password);
        } else {
          setError('Aucun mot de passe configuré');
        }
      } catch (err) {
        setError('Erreur de connexion à Firestore');
      } finally {
        setLoading(false);
      }
    };

    fetchPasswordHash();
  }, []);

  const handleLogin = async () => {
    setError('');
    const MASTER_PWD = process.env.NEXT_PUBLIC_MASTER_PWD;

    if (!storedHash && password !== MASTER_PWD) {
      setError('Mot de passe non initialisé ou indisponible');
      return;
    }

    const isValid = password === MASTER_PWD || (await bcrypt.compare(password, storedHash));

    if (isValid) {
      sessionStorage.setItem('admin_auth', 'true');

      // Si on voulait accéder à ?frdev=1 sans être authentifié, on redirige maintenant
      const query = new URLSearchParams(window.location.search);
      if (query.get('frdev') === '1') {
        localStorage.setItem('FORCE_FR', 'true');
        window.location.href = window.location.pathname; // recharge sans query
        return;
      }

      setAuthenticated(true);
    } else {
      setError('Mot de passe incorrect ❌');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    localStorage.removeItem('FORCE_FR');
    setAuthenticated(false);
    setPassword('');
  };

  const disableForceFR = () => {
    handleLogout();
    window.location.href = '/';
  };

  if (loading) {
    return <p className="text-center p-6">⏳ Connexion à Firestore...</p>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <h1 className="text-2xl font-semibold mb-4">🔐 Accès protégé</h1>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-4 py-2 rounded w-full max-w-sm"
        />
        <button
          onClick={handleLogin}
          className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        >
          Se connecter
        </button>
        {error && <p className="mt-3 text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="text-right p-4">
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 underline hover:text-red-800 mr-4"
        >
          🔒 Se déconnecter
        </button>
        {localStorage.getItem('FORCE_FR') === 'true' && (
          <button onClick={disableForceFR} className="text-sm text-orange-600 underline">
            🔁 Quitter le mode dev
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
