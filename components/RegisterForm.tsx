import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';
import { duplicateContentForUser } from '../lib/duplicateContent';
import { getAuthErrorMessage } from '../lib/authErrorMessages';
import { claimSlug } from '../lib/claimSlugClient';
import { slugify } from '../lib/slugify';
import { useRouter } from 'next/router';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Proposé automatiquement depuis le nom, mais modifiable avant de valider —
  // certaines clientes veulent un nom de marque différent de leur nom
  // personnel (ex. "cabinet-serenite" plutôt que "marie-dupont").
  const [slugDraft, setSlugDraft] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (!slugTouched) setSlugDraft(slugify(value));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setSlugDraft(e.target.value);
  };

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
        isActive: false, // bascule à true uniquement par un admin, après paiement confirmé
        createdAt: new Date(),
      });

      // 2bis. Réserver son lien lisible (site-therapeute.vercel.app/marie-dupont
      // ou tout autre nom de marque choisi ci-dessous).
      const finalSlug = slugify(slugDraft || name);
      const slugResult = await claimSlug(user, { customSlug: finalSlug });
      if (slugResult.error) {
        // Non bloquant : le compte est créé, elle pourra choisir son lien
        // depuis son espace d'édition si celui proposé était déjà pris.
        console.error('claimSlug à l\'inscription:', slugResult.error);
      }

      // 3. Rediriger
      router.push('/admin');
    } catch (err: any) {
      // Avant : setError(err.message) affichait par ex.
      // "Firebase: Error (auth/email-already-in-use)." tel quel à la
      // cliente. Le détail technique reste en console, jamais à l'écran.
      console.error('Erreur inscription:', err);
      setError(getAuthErrorMessage(err));
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
          onChange={handleNameChange}
          required
          className="border p-2 w-full"
        />
      </div>

      {/* Lien du site — proposé automatiquement, modifiable */}
      <div>
        <label className="block text-sm font-medium">Lien de votre site</label>
        <div className="flex items-center border rounded overflow-hidden">
          <span className="px-2 py-2 bg-gray-100 text-gray-500 text-sm whitespace-nowrap">
            site-therapeute.vercel.app/
          </span>
          <input
            type="text"
            value={slugDraft}
            onChange={handleSlugChange}
            placeholder="votre-nom-ou-marque"
            className="flex-1 p-2 min-w-0"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Vous pourrez le changer plus tard depuis votre espace (une fois toutes les 24h).
        </p>
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
