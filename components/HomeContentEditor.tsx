// components/HomeContentEditor.tsx
import ImageUploadField, { ImageUploadRef } from './ImageUploadField';
import { useRef } from 'react';

type Props = {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  imageFieldRef: React.RefObject<ImageUploadRef>;
};
export default function HomeContentEditor({ formData, setFormData, imageFieldRef }: Props) {
  const accueil = formData.accueil || {};


  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      accueil: {
        ...prev.accueil,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <label>
        <span className="block font-medium">📝 Titre d’accueil</span>
        <input
          type="text"
          value={accueil.titre || ''}
          onChange={(e) => handleChange('titre', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>

      <label>
        <span className="block font-medium">💬 Texte d’introduction</span>
        <textarea
          value={accueil.texte || ''}
          onChange={(e) => handleChange('texte', e.target.value)}
          className="w-full border px-3 py-2 rounded"
          rows={3}
        />
      </label>

      <label>
        <span className="block font-medium">🔘 Texte du bouton</span>
        <input
          type="text"
          value={accueil.bouton || ''}
          onChange={(e) => handleChange('bouton', e.target.value)}
          className="w-full border px-3 py-2 rounded"
          
        />
      </label>

      <label>
        <span className="block font-medium">📝 Section À Propos : Titre</span>
        <input
          type="text"
          value={accueil.SectionAProposTitre || ''}
          onChange={(e) => handleChange('SectionAProposTitre', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>

      <label>
        <span className="block font-medium">💬 Section À Propos : description</span>
        <textarea
          value={accueil.SectionAProposDescription || ''}
          onChange={(e) => handleChange('SectionAProposDescription', e.target.value)}
          className="w-full border px-3 py-2 rounded"
          rows={3}
        />
      </label>

      <label>
        <span className="block font-medium">🔘 Section À Propos : Texte du bouton CTA</span>
        <input
          type="text"
          value={accueil.SectionAProposCTA || ''}
          onChange={(e) => handleChange('SectionAProposCTA', e.target.value)}
          className="w-full border px-3 py-2 rounded"
          
        />
      </label>

      <ImageUploadField
        ref={imageFieldRef}
        label="🖼️ Image de la section À propos"
        value={accueil.image || ''}
        folderName={formData.layout?.nom || 'default'}
        onUpload={(url) =>
          setFormData((prev) => ({
            ...prev,
            accueil: { ...prev.accueil, image: url },
          }))
        }
      />
    </div>
  );
}
