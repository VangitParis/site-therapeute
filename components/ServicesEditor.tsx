import ImageUploadField, { ImageUploadRef } from './ImageUploadField';

import { useRef } from 'react';

type Props = {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  imageFieldServicesRef: React.RefObject<ImageUploadRef>;
};

export default function ServicesEditor({ formData, setFormData, imageFieldServicesRef }: Props) {
  const services = formData.services || { titre: '', liste: [], image: '' };
  const safeFolderName = (formData.layout?.nom || 'default').replace(/\s+/g, '_').toLowerCase();

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        [key]: value,
      },
    }));
  };

  const handleListChange = (index: number, key: 'text' | 'image', value: string) => {
    const updated = [...services.liste];
    updated[index] = {
      ...(typeof updated[index] === 'string'
        ? { text: updated[index], image: '' }
        : updated[index]),
      [key]: value,
    };
    setFormData((prev) => ({
      ...prev,
      services: { ...prev.services, liste: updated },
    }));
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        liste: [...(prev.services.liste || []), { text: '', image: '' }],
      },
    }));
  };

  const removeService = (index: number) => {
    const updated = services.liste.filter((_: any, i: number) => i !== index);
    setFormData((prev) => ({
      ...prev,
      services: { ...prev.services, liste: updated },
    }));
  };

  return (
    <div className="space-y-4">
      <label>
        <span className="block font-medium">🧘 Titre de la section</span>
        <input
          type="text"
          value={services.titre || ''}
          onChange={(e) => handleChange('titre', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>

      {services.liste?.map((item: any, index: number) => (
        <div key={index} className="border p-3 rounded-md space-y-2 bg-gray-50">
          <textarea
            value={item?.text || ''}
            onChange={(e) => handleListChange(index, 'text', e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={2}
          />

          <ImageUploadField
            label={`🖼️ Image du service #${index + 1}`}
            value={item.image || ''} // ← important de ne pas injecter DEFAULT_IMAGE ici
            folderName={safeFolderName}
            sectionName="services"
            onUpload={(url) => handleListChange(index, 'image', url)}
          />

          <button
            onClick={() => removeService(index)}
            className="text-red-500 text-sm hover:underline"
          >
            Supprimer
          </button>
        </div>
      ))}

      <button onClick={addService} className="text-sm text-blue-600 underline">
        ➕ Ajouter un service
      </button>

      <hr className="my-4" />
    </div>
  );
}
