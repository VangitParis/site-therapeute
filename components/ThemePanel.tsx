// components/ThemePanel.tsx
export default function ThemePanel({ formData, setFormData }) {
  const theme = formData.theme || {};

  const handleThemeChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value,
      },
    }));
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <label>
        <span className="block font-medium">🎨 Couleur Primaire</span>
        <input
          type="color"
          value={theme.primary || '#7f5a83'}
          onChange={(e) => handleThemeChange('primary', e.target.value)}
          className="w-full h-10 border rounded"
        />
      </label>

      <label>
        <span className="block font-medium">🌈 Couleur Secondaire</span> {/* accent */}
        <input
          type="color"
          value={theme.accent || '#e6f0ff'}
          onChange={(e) => handleThemeChange('accent', e.target.value)}
          className="w-full h-10 border rounded"
        />
      </label>

      <label>
        <span className="block font-medium">🪵 Fond général</span>
        <input
          type="color"
          value={theme.background || '#ffffff'}
          onChange={(e) => handleThemeChange('background', e.target.value)}
          className="w-full h-10 border rounded"
        />
      </label>

      <label>
        <span className="block font-medium">📝 Texte global</span>
        <input
          type="color"
          value={theme.texte || '#333333'}
          onChange={(e) => handleThemeChange('texte', e.target.value)}
          className="w-full h-10 border rounded"
        />
      </label>

      <label>
        <span className="block font-medium">Couleur Texte Bouton</span>
        <input
          type="color"
          value={theme.textButton || '#FFFFFF'}
          onChange={(e) => handleThemeChange('textButton', e.target.value)}
          className="w-full h-10 border rounded"
        />
      </label>

      <label>
        <span className="block font-medium">🔠 Titres H1</span>
        <input
          type="color"
          value={theme.titreH1 || '#111111'}
          onChange={(e) => handleThemeChange('titreH1', e.target.value)}
          className="w-full h-10 border rounded"
        />
      </label>

      <label>
        <span className="block font-medium">🔤 Titres H2/H3</span>
        <input
          type="color"
          value={theme.titreH2 || '#444444'}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              theme: {
                ...prev.theme,
                titreH2: e.target.value,
                titreH3: e.target.value, // lié ensemble
              },
            }))
          }
          className="w-full h-10 border rounded"
        />
      </label>
    </div>
  );
}
