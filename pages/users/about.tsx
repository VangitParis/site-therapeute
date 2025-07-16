import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { appendQueryParams } from '../../utils/appendQueryParams';
import UserLink from '../../components/UserLinks';

export default function About({ locale = 'fr' }) {
  const [data, setData] = useState<{
    titre: string;
    texte: string;
    image: string;
    bouton: string;
  } | null>(null);
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
        const aPropos = raw.aPropos || { titre: '', texte: '', image: '', bouton: '' };
        setData({ ...aPropos });
        applyThemeToDOM(raw.theme);
      }
    };

    fetchData();

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_FORMDATA') {
        if (e.data.payload?.aPropos) {
          setData({ ...e.data.payload.aPropos });
        }
        if (e.data.payload?.theme) {
          applyThemeToDOM(e.data.payload.theme);
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [locale, isDev, uid]);

  const cleaned = data?.texte?.replace(/<br\s*\/?>/gi, '').trim();

  if (!data) {
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
        className="text-4xl font-bold text-prune mb-6 text-center"
        style={{ color: 'var(--color-titreH1)' }}
      >
        {data.titre || 'Mon Parcours'}
      </h1>
      <div className="flex flex-col gap-8">
        {data.image && (
          <img
            src={data.image}
            alt="À propos"
            className="mx-auto mt-6 max-w-[450px] rounded-full shadow h-auto w-full"
          />
        )}

        <div
          className="text-gray-700 text-lg leading-relaxed text-justify mb-8"
          style={{ color: 'var(--color-texte)' }}
          dangerouslySetInnerHTML={{
            __html: cleaned ? data.texte : `<p>salut !</p>`,
          }}
        />
      </div>
      <UserLink
        href="/users/contact"
        uid={uid}
        isDev={isDev}
        className="flex-1 text-white py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-300 hover:brightness-90"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-button)',
        }}
      >
        {data.bouton || ''}
      </UserLink>
    </div>
  );
}
