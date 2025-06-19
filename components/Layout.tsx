import Link from 'next/link';
import Head from 'next/head';
import { ReactNode, useEffect, useState } from 'react';
import { db, auth } from '../lib/firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [layout, setLayout] = useState<any>(null);
  const [theme, setTheme] = useState<any>({});
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdminPage = router.pathname.startsWith('/admin');
  const isPreview = router.query.admin === 'true';
  const uidParam = typeof router.query.uid === 'string' ? router.query.uid : null;
  const isAdminDev = router.query.frdev === '1';
  const querySuffix =
    isPreview && auth.currentUser ? `?uid=${auth.currentUser.uid}&admin=true` : '';

  const applyThemeToDOM = (theme: any) => {
    const root = document.documentElement;
    if (theme?.background) root.style.setProperty('--color-bg', theme.background);
    if (theme?.primary) root.style.setProperty('--color-primary', theme.primary);
    if (theme?.accent) root.style.setProperty('--color-accent', theme.accent);
    if (theme?.texte) root.style.setProperty('--color-texte', theme.texte);
    if (theme?.titreH1) root.style.setProperty('--color-titreH1', theme.titreH1);
    if (theme?.titreH2) root.style.setProperty('--color-titreH2', theme.titreH2);
    if (theme?.titreH3) root.style.setProperty('--color-titreH3', theme.titreH3);
    if (theme?.textButton) root.style.setProperty('--color-text-button', theme.textButton);
  };

  useEffect(() => {
    let docId = 'fr';
    const unsubscribeFns: (() => void)[] = [];

    const messageHandler = (e: MessageEvent) => {
      const isPreview = router.query.admin === 'true';
      if (isPreview && e.data?.type === 'UPDATE_FORMDATA') {
        if (e.data.payload.layout) setLayout(e.data.payload.layout);
        if (e.data.payload.theme) {
          setTheme(e.data.payload.theme);
          applyThemeToDOM(e.data.payload.theme);
        }
      }
    };

    const init = async () => {
      const uidParam = typeof router.query.uid === 'string' ? router.query.uid : null;

      if (uidParam) {
        docId = uidParam;
      } else if (isPreview) {
        await new Promise<void>((resolve) => {
          const unsub = onAuthStateChanged(auth, (user) => {
            if (user) docId = user.uid; // ✅ Chaque thérapeute voit son contenu
            unsub();
            resolve();
          });
        });
      }

      const ref = doc(db, 'content', docId);
      const unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setTheme(data.theme || {});
          setLayout(data.layout || {});
          applyThemeToDOM(data.theme);
        }
      });
      unsubscribeFns.push(unsub);

      window.addEventListener('message', messageHandler);
      unsubscribeFns.push(() => window.removeEventListener('message', messageHandler));
    };

    init();

    return () => unsubscribeFns.forEach((fn) => fn());
  }, [router.query]);

  if (!layout) return <p className="text-center p-6">Chargement du layout…</p>;

  const finalUidParam = uidParam ? `?uid=${uidParam}` : isAdminDev ? '?frdev=1' : '';

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {layout.favicon && <link rel="icon" href={layout.favicon} />}
      </Head>

      <div className="font-serif text-gray-800 min-h-screen flex flex-col">
        {!isAdminPage && (
          <header className="bg-white shadow p-4 sm:p-6 flex justify-between items-center sticky top-0 z-50 gap-4">
            <Link href={`/${finalUidParam}`}>
              {/* <Link href={`/${querySuffix}`}> */}
              <div className="flex gap-4 items-center">
                {layout.logo && (
                  <img src={layout.logo} alt="Logo" className="max-h-16 object-contain rounded" />
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold" style={{ color: theme.primary }}>
                    {layout.nom}
                  </h1>
                  <p className="text-xs italic text-gray-500">{layout.titre}</p>
                </div>
              </div>
            </Link>

            {/* Navigation mobile */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-3xl focus:outline-none"
                style={{ color: theme.primary }}
              >
                ☰
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded shadow p-4 text-sm z-50">
                  {layout.liens?.map((lien: any, i: number) => (
                    <div key={i} className="mb-2">
                      <Link href={`${lien.href}${finalUidParam}`}>
                        <span className="block" style={{ color: theme.primary }}>
                          {lien.label}
                        </span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop nav */}
            <nav className="hidden sm:flex space-x-4 text-lg">
              {layout.liens?.map((lien: any, i: number) => (
                <Link key={i} href={`${lien.href}${finalUidParam}`}>
                  {/* <Link href={`${lien.href}${querySuffix}`}> */}
                  <span style={{ color: theme.primary }}>{lien.label}</span>
                </Link>
              ))}
            </nav>
          </header>
        )}

        <main className="flex-1 w-full">{children}</main>

        {!isAdminPage && (
          <footer className="bg-white border-t mt-12 text-center py-6 text-xs sm:text-sm text-gray-500">
            {layout.footer} |{' '}
            <a href={`/mentions_legales${finalUidParam}`} className="text-prune hover:underline">
              Mentions légales
            </a>
          </footer>
        )}
      </div>
    </>
  );
}
