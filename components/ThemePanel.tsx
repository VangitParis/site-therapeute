// components/ThemePanel.tsx
export default function ThemePanel({ formData, setFormData }) {
  const theme = formData.theme || {};

  const applyThemeToDOM = (theme: any) => {
    const root = document.documentElement;
    if (theme?.background) root.style.setProperty('--color-bg', theme.background);
    if (theme?.primary) root.style.setProperty('--color-primary', theme.primary);
    if (theme?.accent) root.style.setProperty('--color-accent', theme.accent);
    if (theme?.texte) root.style.setProperty('--color-texte', theme.texte);
    if (theme?.textButton) root.style.setProperty('--color-text-button', theme.textButton);
    if (theme?.titreH1) root.style.setProperty('--color-titreH1', theme.titreH1);
    if (theme?.titreH2) root.style.setProperty('--color-titreH2', theme.titreH2);
    if (theme?.titreH3) root.style.setProperty('--color-titreH3', theme.titreH3);
  };

  // Fonction pour envoyer le thème à l'iframe
  const sendThemeToIframe = (theme: any) => {
    // Trouve l'iframe de prévisualisation
    const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'UPDATE_THEME',
          payload: theme,
          timestamp: Date.now(),
        },
        '*'
      );
    }
  };

  const handleThemeChange = (key: string, value: string) => {
    const updatedTheme = {
      ...theme,
      [key]: value,
    };
    console.log('🎨 Thème modifié ===', updatedTheme);

    setFormData((prev) => ({
      ...prev,
      theme: updatedTheme,
    }));

    // Applique le thème localement ET à l'iframe
    applyThemeToDOM(updatedTheme);
    sendThemeToIframe(updatedTheme);
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
          onChange={(e) => {
            const newColor = e.target.value;
            const updatedTheme = {
              ...theme,
              titreH2: newColor,
              titreH3: newColor,
            };

            setFormData((prev) => ({
              ...prev,
              theme: updatedTheme,
            }));

            applyThemeToDOM(updatedTheme);

            sendThemeToIframe(updatedTheme);
          }}
          className="w-full h-10 border rounded"
        />
      </label>
    </div>
  );
}
