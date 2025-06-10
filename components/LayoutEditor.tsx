import { useState, useRef } from "react";
import ImageUploadField from "./ImageUploadField";

type Props = {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
};

export default function LayoutEditor({ formData, setFormData }: Props) {
  const defaultName = 'Marie Dupont';
  const hasEditedName = useRef(false);

  const handleChange = (key: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [key]: value,
      },
    }));
  };

  const handleLinkChange = (index: number, key: 'label' | 'href', value: string) => {
    const newLinks = [...(formData.layout?.liens || [])];
    newLinks[index] = { ...newLinks[index], [key]: value };

    setFormData((prev: any) => ({
      ...prev,
      layout: {
        ...prev.layout,
        liens: newLinks,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nom du site</label>
        <input
          type="text"
          value={formData.layout?.nom || ''}
          onChange={(e) => {
            const newName = e.target.value;
            if (newName.trim().toLowerCase() !== defaultName.toLowerCase()) {
              hasEditedName.current = true;
            }
            setFormData((prev) => ({
              ...prev,
              layout: { ...prev.layout, nom: newName }
            }));
          }}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Sous-titre</label>
        <input
          type="text"
          value={formData.layout?.titre || ''}
          onChange={(e) => handleChange('titre', e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Texte du footer</label>
        <input
          type="text"
          value={formData.layout?.footer || ''}
          onChange={(e) => handleChange('footer', e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Liens de navigation</label>
        {formData.layout?.liens?.map((lien: any, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              type="text"
              value={lien.label}
              placeholder="Label"
              onChange={(e) => handleLinkChange(i, 'label', e.target.value)}
              className="border p-2 rounded w-1/2"
            />
            <input
              type="text"
              value={lien.href}
              placeholder="Lien"
              onChange={(e) => handleLinkChange(i, 'href', e.target.value)}
              className="border p-2 rounded w-1/2"
            />
          </div>
        ))}
      </div>

      <ImageUploadField
        label="Logo du site (optionnel)"
        folderName={formData.layout?.nom || 'default'}
        value={formData.layout?.logo || ''}
        onUpload={(url) =>
          setFormData((prev) => ({
            ...prev,
            layout: { ...prev.layout, logo: url },
          }))
        }
      />

     <ImageUploadField
  label="Favicon du site (format .ico, .png ou .svg recommandé)"
  folderName={formData.layout?.nom || 'default'}
  value={formData.layout?.favicon || ''}
  onUpload={(url) => {
    if (!url.match(/\.(ico|png|svg)$/i)) {
      alert("Le favicon doit être au format .ico, .png ou .svg");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      layout: { ...prev.layout, favicon: url },
    }));
  }}
/>

    </div>
  );
}
