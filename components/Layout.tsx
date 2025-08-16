import Link from 'next/link';
import Head from 'next/head';
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import useLiveLayout from '../hooks/useLiveLayout';
import UserLink from './UserLinks';

export default function Layout({ children, uid }: { children: ReactNode; uid?: string }) {
  const router = useRouter();
  const { layout, theme } = useLiveLayout();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdminPage = router.pathname.startsWith('/admin') || router.pathname.startsWith('/login');
  const uidParam = typeof router.query.uid === 'string' ? router.query.uid : null;
  const isDev = router.query.frdev === '1';
  const isPreview = router.query.admin === 'true';

  // Vérifier si on doit afficher la landing page
  const shouldShowLanding =
    (!uidParam && !isDev && !isPreview && router.pathname === '/') ||
    router.pathname === '/attente-validation';

  const finalUidParam = uidParam ? `?uid=${uidParam}` : isDev ? '?frdev=1' : '';

  // VERSION COMPLÈTE (avec animations multiples) :
  if (!layout && !shouldShowLanding) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[200px]">
        <div className="relative">
          {/* Spinner principal */}
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>

          {/* Petit point central */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
        </div>

        {/* Texte avec animation */}
        <p className="mt-4 text-gray-600 text-sm font-medium animate-pulse">
          Chargement du layout...
        </p>

        {/* Points animés */}
        <div className="flex space-x-1 mt-2">
          <div
            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {layout?.favicon && <link rel="icon" href={layout.favicon} />}
      </Head>

      <div className="font-serif text-gray-800 min-h-screen flex flex-col">
        {/* N'afficher le header que si ce n'est pas une page admin ET pas la landing page */}
        {!isAdminPage && !shouldShowLanding && layout && (
          <header className="bg-white shadow p-4 sm:p-6 flex justify-between items-center sticky top-0 z-50 gap-4">
            <Link href={`/users/home${finalUidParam}`}>
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
                  <span style={{ color: theme.primary }}>{lien.label}</span>
                </Link>
              ))}
            </nav>
          </header>
        )}

        <main className="flex-1 w-full">{children}</main>

        {/* N'afficher le footer que si ce n'est pas une page admin ET pas la landing page */}
        {!isAdminPage && !shouldShowLanding && layout && (
          <footer className="bg-white border-t mt-12 text-center py-6 text-xs sm:text-sm text-gray-500">
            {layout.footer} |{' '}
            <a
              href={`/users/mentions_legales${finalUidParam}`}
              className="text-prune hover:underline"
            >
              Mentions légales
            </a>
            {/* Liens sociaux */}
            <div className="py-6">
              {layout.liens && layout.liens.length > 0 && (
                <div className="flex justify-center gap-6 mb-6">
                  {layout.liens.map((lien: any, index: number) => (
                    <UserLink
                      key={index}
                      href={lien.url}
                      uid={uid}
                      isDev={isDev}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-text-button)',
                      }}
                    >
                      <span className="text-lg font-medium">{lien.nom}</span>
                    </UserLink>
                  ))}
                </div>
              )}
            </div>
          </footer>
        )}
      </div>
    </>
  );
}
