import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';
import { duplicateContentForUser } from '../lib/duplicateContent';
import { useRouter } from 'next/router';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 1. Créer content/<uid> à partir de content.fr
      await duplicateContentForUser(user.uid);

      // 2. Créer clients/<uid> avec isClient: false (activation manuelle)
      await setDoc(doc(db, 'clients', user.uid), {
        email: user.email,
        isClient: false,
        createdAt: new Date(),
      });

      // 3. Rediriger vers /admin (ou page de confirmation)
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold">Créer un compte</h2>
      <input
        type="email"
        placeholder="Adresse email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? 'Création en cours...' : 'Créer mon compte'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
