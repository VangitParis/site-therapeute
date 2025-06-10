import Link from 'next/link';
import Head from 'next/head';
import { ReactNode, useEffect, useState } from 'react';
import { db } from '../lib/firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isAdminPage = router.pathname.startsWith('/admin');
  const isPreview = router.query.admin === 'true';
  const [layout, setLayout] = useState<any>(null);
  const [theme, setTheme] = useState<any>({});

  const applyThemeToDOM = (theme: any) => {
    const root = document.documentElement;
    if (theme?.background) root.style.setProperty('--color-bg', theme.background);
    if (theme?.primary) root.style.setProperty('--color-primary', theme.primary);
    if (theme?.accent) root.style.setProperty('--color-accent', theme.accent);
    if (theme?.texte) root.style.setProperty('--color-texte', theme.texte);
    if (theme?.titreH1) root.style.setProperty('--color-titreH1', theme.titreH1);
    if (theme?.titreH2) root.style.setProperty('--color-titreH2', theme.titreH2);
    if (theme?.titreH3) root.style.setProperty('--color-titreH3', theme.titreH3);
  };

  useEffect(() => {
    const ref = doc(db, 'content', 'fr');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLayout(data.layout || {});
        setTheme(data.theme || {});
        applyThemeToDOM(data.theme);
      }
    });

    const handler = (e: MessageEvent) => {
      if (isPreview && e.data?.type === 'UPDATE_FORMDATA') {
        if (e.data.payload.layout) setLayout(e.data.payload.layout);
        if (e.data.payload.theme) {
          setTheme(e.data.payload.theme);
          applyThemeToDOM(e.data.payload.theme);
        }
      }
    };

    window.addEventListener('message', handler);
    return () => {
      unsub();
      window.removeEventListener('message', handler);
    };
  }, [isPreview]);

  if (!layout) return <p className="text-center p-6">Chargement du layout...</p>;

  return (
    <>
      {/* Favicon dynamique */}
      <Head>
        {layout.favicon && <link rel="icon" href={layout.favicon} />}
      </Head>

      <div className="font-serif text-gray-800 min-h-screen">
        {!isAdminPage && (
          <header className="bg-white shadow p-6 flex justify-between items-center sticky top-0 z-50">
            <div className='flex'>
                  {layout.logo && (
              <img
                src={layout.logo}
                alt="Logo"
                className="max-h-16 max-w-[190px] object-contain rounded"
              />
            )}
            <div className='flex flex-col justify-center px-6 '>
              <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
                {layout.nom}
              </h1>
              
              <p className="text-sm italic text-gray-500">{layout.titre}</p>
              </div>
            </div>
            
            
            <nav className="space-x-4 text-sm">
              {layout.liens?.map((lien: any, i: number) => (
                <Link key={i} href={lien.href}>
                  <span style={{ color: theme.primary }}>{lien.label}</span>
                </Link>
              ))}
            </nav>
          </header>
        )}

        <main>{children}</main>

        {!isAdminPage && (
          <footer className="bg-white border-t mt-12 text-center py-6 text-sm text-gray-500">
            {layout.footer} |{' '}
            <a href="#" className="text-prune hover:underline">
              Mentions légales
            </a>
          </footer>
        )}
      </div>
    </>
  );
}
