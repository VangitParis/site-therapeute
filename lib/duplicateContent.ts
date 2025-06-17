import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseClient';

export async function duplicateContentForUser(uid: string) {
  try {
    const defaultDoc = doc(db, 'content', 'fr');
    const userDoc = doc(db, 'content', uid);

    // Vérifie si le document existe déjà (évite la duplication)
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists()) {
      console.log(`Le document content/${uid} existe déjà.`);
      return;
    }

    // Récupère les données de content.fr
    const defaultSnap = await getDoc(defaultDoc);
    if (!defaultSnap.exists()) {
      throw new Error("Le document 'content.fr' est introuvable.");
    }

    const defaultData = defaultSnap.data();

    // Crée le document personnalisé de l'utilisateur
    await setDoc(userDoc, defaultData);
    console.log(`Contenu copié vers content/${uid}`);
  } catch (error) {
    console.error('Erreur lors de la duplication du contenu :', error);
  }
}
