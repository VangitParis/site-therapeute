// components/AboutContentEditor.tsx
import ImageUploadField, { ImageUploadRef } from './ImageUploadField';
import { useRef } from 'react';

type Props = {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  imageFieldAProposRef: React.RefObject<ImageUploadRef>;
};

export default function AboutContentEditor({ formData, setFormData, imageFieldAProposRef }: Props) {
  const aPropos = formData.aPropos || {};

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      aPropos: {
        ...prev.aPropos,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <label>
        <span className="block font-medium">📝 Titre "À propos"</span>
        <input
          type="text"
          value={aPropos.titre || ''}
          onChange={(e) => handleChange('titre', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>

      <label>
        <span className="block font-medium">📖 Texte de présentation</span>
        <textarea
          value={aPropos.texte || ''}
          onChange={(e) => handleChange('texte', e.target.value)}
          className="w-full border px-3 py-2 rounded"
          rows={4}
        />
      </label>

      <ImageUploadField
        ref={imageFieldAProposRef}
        label="🖼️ Image de la section À propos"
        value={aPropos.image || ''}
        folderName={formData.layout?.nom || 'default'}
        onUpload={(url) =>
          setFormData((prev) => ({
            ...prev,
            aPropos: { ...prev.aPropos, image: url },
          }))
        }
      />
    </div>
  );
}
