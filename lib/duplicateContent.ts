import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseClient';
import { applyTemplateVariant } from './templateVariants';

type DuplicateOptions = {
  displayName?: string;
  email?: string;
};

export async function duplicateContentForUser(
  uid: string,
  templateId?: string,
  options: DuplicateOptions = {}
) {
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

    const baseClone = JSON.parse(JSON.stringify(defaultData));
    baseClone.templateId = templateId || 'sophrologie';
    const dataToSave = applyTemplateVariant(baseClone, templateId);

    if (options.displayName) {
      dataToSave.layout = dataToSave.layout || {};
      dataToSave.layout.nom = options.displayName;
      if (dataToSave.accueil) {
        dataToSave.accueil.titre = dataToSave.accueil.titre || options.displayName;
      }
    }

    if (options.email) {
      dataToSave.contact = dataToSave.contact || {};
      dataToSave.contact.lien = `mailto:${options.email}`;
    }

    // Crée le document personnalisé de l'utilisateur
    await setDoc(userDoc, dataToSave);
    console.log(`Contenu copié vers content/${uid}`);
  } catch (error) {
    console.error('Erreur lors de la duplication du contenu :', error);
  }
}
