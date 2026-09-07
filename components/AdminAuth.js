// components/AdminAuth.js
//
// Le mot de passe n'est plus jamais vérifié dans le navigateur : on poste au
// serveur (/api/admin-login), qui compare le hash bcrypt côté serveur et pose
// un cookie de session httpOnly signé. Ce composant ne lit plus jamais
// config/admin ni ne fait de bcrypt.compare côté client.
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminAuth({ children }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setAuthenticated(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Mot de passe incorrect ❌');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin-logout', { method: 'POST' });
    setAuthenticated(false);
    setPassword('');
  };

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
          disabled={loading}
          className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
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
      </div>
      {children}
    </div>
  );
}
