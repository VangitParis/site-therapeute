import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

export default function Contact({ locale = 'fr' }) {
  const [data, setData] = useState({
    titre: '',
    texte: '',
    bouton: '',
    lien: '',
    image: ''
  });
 
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

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'content', locale);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const raw = snap.data()?.contact || {};
        setData({
          titre: raw.titre || 'Contact',
          texte: raw.texte || '',
          bouton: raw.bouton || 'Réserver une séance découverte',
          lien: raw.lien || '',
          image: raw.image || ''
        });
        applyThemeToDOM(raw.theme);
      }
    };

    fetchData();

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_FORMDATA' && e.data.payload?.contact) {
        
        const updated = e.data.payload;
      setData({ ...updated.contatc}); // ⚠️ Clonage nécessaire pour forcer le re-render
      applyThemeToDOM(updated.theme);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [locale]);

  return (
    <section className="max-w-4xl mx-auto px-6 py-12" style={{ backgroundColor: 'var(--color-bg)' }}>
      <h1
        className="text-4xl font-bold text-center mb-6 text-prune"
        style={{ color: 'var(--color-titreH1)' }}
      >
        {data.titre}
      </h1>

      <div
        className="text-lg leading-relaxed text-center text-gray-700"
        style={{ color: 'var(--color-texte)' }}
        dangerouslySetInnerHTML={{__html: (data.texte || '').trim()
            ? data.texte
            : `
              <p>Vous souhaitez me contacter pour en savoir plus sur mes séances de sophrologie ?</p>
              <p>📧 Email : <a href="mailto:contact@masophro.fr" class="text-prune underline">contact@masophro.fr</a></p>
              <p>📞 Téléphone : <a href="tel:+33612345678" class="text-prune underline">06 12 34 56 78</a></p>
              <p>🗓️ Vous pouvez également réserver votre séance via le bouton ci-dessous.</p>
            `
        }}
      />

      {data.lien && (
        <div className="text-center mt-8">
          <Link
            href={data.lien}
            target="_blank"
            className="inline-block bg-prune text-white py-3 px-6 rounded-full font-semibold shadow hover:bg-purple-700 transition"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-button)' }}
          >
            {data.bouton}
          </Link>
        </div>
      )}

      {data.image && (
        <img
          src={data.image}
          alt="Contact illustration"
          className="mx-auto mt-8 max-w-xs rounded shadow"
        />
      )}
    </section>
  );
}
