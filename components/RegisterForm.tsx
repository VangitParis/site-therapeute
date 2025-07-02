import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';
import { duplicateContentForUser } from '../lib/duplicateContent';
import { useRouter } from 'next/router';

export default function RegisterForm() {
  const [name, setName] = useState('');
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

      // 1. Dupliquer contenu
      await duplicateContentForUser(user.uid);

      // 2. Enregistrer client avec nom
      await setDoc(doc(db, 'clients', user.uid), {
        email: user.email,
        name: name,
        isClient: false,
        createdAt: new Date(),
      });

      // 3. Rediriger
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Créer un compte</h2>

      {/* Champ Nom */}
      <div>
        <label className="block text-sm font-medium">Nom complet</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border p-2 w-full"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 w-full"
        />
      </div>

      {/* Mot de passe */}
      <div>
        <label className="block text-sm font-medium">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 w-full"
        />
      </div>

      {/* Bouton */}
      <button type="submit" className="bg-black text-white py-2 px-4">
        {loading ? 'Création en cours...' : 'Créer mon compte'}
      </button>

      {/* Erreur */}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
