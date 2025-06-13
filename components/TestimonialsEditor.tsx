import ImageUploadField, { ImageUploadRef } from './ImageUploadField';

interface Props {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  imageFieldTestimonialsRef: React.RefObject<ImageUploadRef>;
}

interface Testimonial {
  texte: string;
  auteur: string;
  stars: number;
  avatar: string;
}

export default function TestimonialsEditor({ formData, setFormData, imageFieldTestimonialsRef }: Props) {
  const testimonials: Testimonial[] = formData.testimonials || [];

  const handleChange = <K extends keyof Testimonial>(
    index: number,
    key: K,
    value: Testimonial[K]
  ) => {
    const updated = [...testimonials];
    updated[index][key] = value;
    setFormData((prev) => ({
      ...prev,
      testimonials: updated,
    }));
  };

  const removeTestimonial = (index: number) => {
    const updated = testimonials.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      testimonials: updated,
    }));
  };

  const addTestimonial = () => {
    const newItem: Testimonial = { texte: '', auteur: '', stars: 5, avatar: '' };
    setFormData((prev) => ({
      ...prev,
      testimonials: [...(prev.testimonials || []), newItem],
    }));
  };

  return (
    <div className="space-y-4">
      {testimonials.map((item, index) => (
        <div key={index} className="border p-4 rounded bg-gray-50 space-y-2">
          <label className="block">
            <span className="font-medium">📝 Témoignage</span>
            <textarea
              value={item.texte}
              onChange={(e) => handleChange(index, 'texte', e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </label>

          <label className="block">
            <span className="font-medium">👤 Auteur</span>
            <input
              type="text"
              value={item.auteur}
              onChange={(e) => handleChange(index, 'auteur', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </label>

          <ImageUploadField
            ref={imageFieldTestimonialsRef}
            label="🖼️ Avatar du témoignage"
            value={item.avatar}
            folderName={formData.layout?.nom || 'default'}
            sectionName="testimonials"
            onUpload={(url) => handleChange(index, 'avatar', url)}
          />

          <label className="block">
            <span className="font-medium">⭐ Étoiles (1 à 5)</span>
            <input
              type="number"
              min={1}
              max={5}
              value={item.stars}
              onChange={(e) => {
                const raw = parseInt(e.target.value, 10);
                const stars = isNaN(raw) ? 5 : Math.max(1, Math.min(5, raw));
                handleChange(index, 'stars', stars);
              }}
              className="w-full border rounded px-3 py-2"
            />
          </label>

          <button
            type="button"
            onClick={() => removeTestimonial(index)}
            className="text-red-500 text-sm hover:underline mt-2"
          >
            🗑 Supprimer ce témoignage
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addTestimonial}
        className="text-sm text-blue-600 hover:underline"
      >
        ➕ Ajouter un témoignage
      </button>
    </div>
  );
}
