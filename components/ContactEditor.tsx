import RichTextEditor from './RichTextEditor';

type Props = {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
};

export default function ContactEditor({ formData, setFormData }: Props) {
  const contact = formData.contact || {};

  const handleChange = (key: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <label>
        <span className="block font-medium">📌 Titre de la page</span>
        <input
          type="text"
          value={contact.titre || ''}
          onChange={(e) => handleChange('titre', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>

      <div>
        <span className="block font-medium">📝 Texte de présentation</span>
        <RichTextEditor
          label=""
          value={contact.texte || ''}
          onChange={(val) => handleChange('texte', val)}
        />
      </div>

      <label>
        <span className="block font-medium">🔗 Lien vers la prise de rendez-vous</span>
        <input
          type="url"
          value={contact.lien || ''}
          onChange={(e) => handleChange('lien', e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="https://..."
        />
      </label>

      <label>
        <span className="block font-medium">🔘 Texte du bouton</span>
        <input
          type="text"
          value={contact.bouton || ''}
          onChange={(e) => handleChange('bouton', e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Réserver une séance découverte"
        />
      </label>
    </div>
  );
}
