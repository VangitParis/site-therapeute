import Link from 'next/link';
import Head from 'next/head';
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import useLiveLayout from '../hooks/useLiveLayout';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { layout, theme } = useLiveLayout();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdminPage = router.pathname.startsWith('/admin');
  const uidParam = typeof router.query.uid === 'string' ? router.query.uid : null;
  const isAdminDev = router.query.frdev === '1';
  const finalUidParam = uidParam ? `?uid=${uidParam}` : isAdminDev ? '?frdev=1' : '';

  if (!layout) return <p className="text-center p-6">Chargement du layout…</p>;

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
