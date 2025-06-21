// components/HomeContentEditor.tsx
import ImageUploadField, { ImageUploadRef } from './ImageUploadField';
import RichTextEditor from './RichTextEditor';

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
      {/* HERO HOMEPAGE */}
      <label>
        <span className="block font-medium">📝 Titre d’accueil</span>
        <textarea
          value={accueil.titre || ''}
          onChange={(e) => handleChange('titre', e.target.value)}
          className="w-full border px-3 py-2 rounded resize-none"
          rows={2}
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
      {/* A PROPOS HOMEPAGE*/}
      <label>
        <span className="block font-medium">📝 Section À Propos : Titre</span>
        <input
          type="text"
          value={accueil.SectionAProposTitre || ''}
          onChange={(e) => handleChange('SectionAProposTitre', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>

      <div className="block mb-4">
        <RichTextEditor
          label="💬 Section À Propos : Description"
          value={formData.accueil?.SectionAProposDescription || ''}
          onChange={(val) =>
            setFormData((prev: any) => ({
              ...prev,
              accueil: {
                ...prev.accueil,
                SectionAProposDescription: val,
              },
            }))
          }
        />
      </div>

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
        sectionName="accueil"
        onUpload={(url) =>
          setFormData((prev) => ({
            ...prev,
            accueil: { ...prev.accueil, image: url },
          }))
        }
      />
      {/* SERVICES HOMEPAGE*/}
      <label>
        <span className="block font-medium">📝 Section Service : Titre</span>
        <input
          type="text"
          value={accueil.SectionServicesTitre || ''}
          onChange={(e) => handleChange('SectionServicesTitre', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>
      <div className="block mb-4">
        <RichTextEditor
          label="💬 Section Services : Description"
          value={formData.accueil?.SectionServicesDescription || ''}
          onChange={(val) =>
            setFormData((prev: any) => ({
              ...prev,
              accueil: {
                ...prev.accueil,
                SectionServicesDescription: val,
              },
            }))
          }
        />
      </div>

      <label>
        <span className="block font-medium">🔘 Section Services : Texte du bouton CTA</span>
        <input
          type="text"
          value={accueil.SectionServicesCTA || ''}
          onChange={(e) => handleChange('SectionServicesCTA', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>
      {/* Temoignages HomePage */}
      <label>
        <span className="block font-medium">📝 Section Témoignages : Titre</span>
        <input
          type="text"
          value={accueil.SectionTestimonialsTitre || ''}
          onChange={(e) => handleChange('SectionTestimonialsTitre', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>
      <div className="block mb-4">
        <RichTextEditor
          label="💬 Section Témoignages : Description"
          value={formData.accueil?.SectionTestimonialsDescription || ''}
          onChange={(val) =>
            setFormData((prev: any) => ({
              ...prev,
              accueil: {
                ...prev.accueil,
                SectionTestimonialsDescription: val,
              },
            }))
          }
        />
      </div>

      <label>
        <span className="block font-medium">🔘 Section Témoignages : Texte du bouton CTA</span>
        <input
          type="text"
          value={accueil.SectionTestimonialsCTA || ''}
          onChange={(e) => handleChange('SectionTestimonialsCTA', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>
      {/* Contact Homepage */}
      <label>
        <span className="block font-medium">📝 Section Contact : Titre</span>
        <input
          type="text"
          value={accueil.SectionContactTitre || ''}
          onChange={(e) => handleChange('SectionContactTitre', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>
      <div className="block mb-4">
        <RichTextEditor
          label="💬 Section Contact : Description"
          value={formData.accueil?.SectionContactDescription || ''}
          onChange={(val) =>
            setFormData((prev: any) => ({
              ...prev,
              accueil: {
                ...prev.accueil,
                SectionContactDescription: val,
              },
            }))
          }
        />
      </div>

      <label>
        <span className="block font-medium">🔘 Section Contact : Texte du bouton CTA</span>
        <input
          type="text"
          value={accueil.SectionContactCTA || ''}
          onChange={(e) => handleChange('SectionContactCTA', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>
    </div>
  );
}
