// components/AboutContentEditor.tsx
import RichTextEditor from './RichTextEditor';
import ImageUploadField, { ImageUploadRef } from './ImageUploadField';

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

      <div className="block mb-4">
        <RichTextEditor
          label="📖 Texte de présentation"
          value={formData.aPropos?.texte || ''}
          onChange={(val) =>
            setFormData((prev: any) => ({
              ...prev,
              aPropos: {
                ...prev.aPropos,
                texte: val,
              },
            }))
          }
        />
      </div>
      <label>
        <span className="block font-medium">🔘 Texte du bouton</span>
        <input
          type="text"
          value={formData.aPropos?.bouton || ''}
          onChange={(e) => handleChange('bouton', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>
      <ImageUploadField
        ref={imageFieldAProposRef}
        label="🖼️ Image de la page À propos"
        value={aPropos.image || ''}
        folderName={formData.layout?.nom || 'default'}
        sectionName="aPropos"
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
