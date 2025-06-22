import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

export default function Testimonials({ locale = 'fr' }) {
  const [buttonText, setButtonText] = useState<string>('');

  const [items, setItems] = useState([]);
  const router = useRouter();
  const uid = router.query.uid as string;
  const isDev = router.query.frdev === '1';

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
      const docId = isDev ? 'fr' : uid || locale;
      const ref = doc(db, 'content', docId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const raw = snap.data();
        setButtonText(raw.testimonialsButton || '');

        setItems(raw.testimonials || []);
        applyThemeToDOM(raw.theme);
      }
    };

    fetchData();

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_FORMDATA') {
        setItems(e.data.payload.testimonials);
        if (e.data?.payload?.testimonialsButton !== undefined) {
          setButtonText(e.data.payload.testimonialsButton);
        }

        applyThemeToDOM(e.data.payload.theme);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [locale, isDev, uid]);

  if (!items.length) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-prune border-opacity-50" />
      </div>
    );
  }

  return (
    <div
      className="max-w-4xl mx-auto px-6 py-12 text-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <h1
        className="text-3xl font-bold text-prune mb-8 text-center"
        style={{ color: 'var(--color-titreH1)' }}
      >
        Témoignages
      </h1>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {items.map((item, i) => (
          <div
            key={i}
            className="bg-gray-50 p-5 rounded-xl shadow flex items-center justify-between"
          >
            <div className="flex flex-col">
              <p className="italic text-gray-700 mb-2" style={{ color: 'var(--color-texte)' }}>
                “{item.texte}”
              </p>
              <p className="text-yellow-400 text-sm mb-1">
                {'★'.repeat(item.stars)}
                {'☆'.repeat(5 - item.stars)}
              </p>
              <footer
                className="text-sm font-medium text-gray-500"
                style={{ color: 'var(--color-titreH3)' }}
              >
                {item.auteur}
              </footer>
            </div>

            <img src={item.avatar} alt="avatar" className=" h-[110px] rounded-full ml-4" />
          </div>
        ))}
      </div>
      <Link
        href="/contact#form"
        className="flex-1 text-white py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-300 hover:brightness-90"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-button)',
        }}
      >
        {buttonText.trim() || 'Je veux essayer'}
      </Link>
    </div>
  );
}
