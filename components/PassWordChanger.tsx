import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { db } from '../lib/firebaseClient';

function PasswordChanger() {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [hash, setHash] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHash = async () => {
      const snap = await getDoc(doc(db, 'config', 'admin'));
      if (snap.exists()) setHash(snap.data().password);
    };
    fetchHash();
  }, []);

  const handleChange = async () => {
    setMessage('');
    setError('');

    if (!oldPwd || !newPwd || !confirmPwd) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    const isValid = await bcrypt.compare(oldPwd, hash);
    if (!isValid) {
      setError('Ancien mot de passe incorrect ❌');
      return;
    }

    if (newPwd !== confirmPwd) {
      setError('Les nouveaux mots de passe ne correspondent pas ❌');
      return;
    }

    if (newPwd.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    const newHash = await bcrypt.hash(newPwd, 10);
    try {
      const newHash = await bcrypt.hash(newPwd, 10);
      await updateDoc(doc(db, 'config', 'admin'), { password: newHash });

      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setMessage('✅ Mot de passe modifié avec succès');
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement dans Firestore ❌");
    }
  };

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="font-semibold text-lg text-indigo-700 mb-2">🔑 Modifier le mot de passe</h3>

      <div className="space-y-3">
        <input
          type="password"
          placeholder="Ancien mot de passe"
          value={oldPwd}
          onChange={(e) => setOldPwd(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <input
          type="password"
          placeholder="Confirmer le nouveau mot de passe"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <button
          onClick={handleChange}
          className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
        >
          Enregistrer
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}
      </div>
    </div>
  );
}

export default PasswordChanger;
