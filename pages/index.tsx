import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import TitreMultiligne from '../components/TitreMultiligne';

import UserLink from '../components/UserLinks';
import { sanitizeHTML } from '../utils/sanitizeHTML';
import {
  DEFAULT_A_PROPOS,
  DEFAULT_CONTACT,
  DEFAULT_SERVICES,
  DEFAULT_TESTIMONIALS,
} from '../utils/default';

export default function Home({ locale = 'fr' }) {
  const DEFAULT_IMAGE =
    'https://res.cloudinary.com/dwadzodje/image/upload/v1750498500/assets/image_defaut.png';

  const [data, setData] = useState(null);

  const router = useRouter();
  const uid = router.query.uid as string;
  const isDev = router.query.frdev === '1';
  const isPreview = router.query.admin === 'true';

  //   data?.accueil?.SectionContactDescription?.replace(/<br\s*\/?>/gi, '').trim() || '';
  function isContentEmpty(html: string): boolean {
    const cleaned = html
      .replace(/<br\s*\/?>/gi, '') // supprime tous les <br>
      .replace(/&nbsp;/gi, '') // supprime les espaces insécables
      .replace(/\s+/g, '') // supprime tous les espaces
      .replace(/<[^>]*>/g, '') // supprime toutes les balises HTML
      .trim();

    return cleaned.length === 0;
  }

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
    const isDev = router.query.frdev === '1';
    const uidParam = router.query.uid as string | undefined;

    const fetchData = async () => {
      const docId = isDev ? 'fr' : uidParam || locale;
      if (!docId) return;

      const ref = doc(db, 'content', docId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const d = snap.data();
        setData(d);
        applyThemeToDOM(d.theme);
      }
    };

    fetchData();

    const handler = (e: MessageEvent) => {
      if (isPreview && e.data?.type === 'UPDATE_FORMDATA') {
        const updated = e.data.payload;
        setData({ ...updated });
        applyThemeToDOM(updated.theme);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [locale, isPreview, router.query.frdev, router.query.uid]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 border-opacity-50"></div>
      </div>
    );
  }

  const lienCalendly = data.contact?.lien?.trim() || '';

  const isExternal = lienCalendly.length > 0;

  const bgImageStyle = data?.theme?.bgImage
    ? {
        backgroundImage: `url(${data.theme.bgImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'var(--custom-bg-position)',
      }
    : {};

  return (
    <>
      {/* Section Accueil (inchangée) */}
      <section
        className="relative overflow-hidden py-24 px-6 md:px-24 mb-16"
        style={{
          ...bgImageStyle,
          height: '700px',
        }}
      >
        <div className="flex flex-col m-3 sm:m-4 gap-15 max-w-2xl">
          {/* Titre H1 optimisé pour la sophrologie */}

          <TitreMultiligne
            text={
              data.accueil.titre ||
              'Sophrologie : Retrouvez Sérénité intérieure et Équilibre au quotidien'
            }
            className="text-3xl lg:text-6xl font-bold text-prune tracking-tight leading-tight"
            style={{ color: 'var(--color-titreH1)' }}
            tag="h1"
          />

          <p className="text-xl l text-gray-700 max-w-2xl" style={{ color: 'var(--color-texte)' }}>
            {/* Texte d'accroche sophrologie */}
            {data.accueil.texte ||
              `Découvrez la sophrologie, une méthode pour mieux gérer le stress,
              l'anxiété et les émotions, et renforcer votre bien-être au quotidien.`}
          </p>
          <div className="flex flex-col md:flex-row gap-4 text-center">
            {isExternal ? (
              <UserLink
                href={lienCalendly}
                uid={uid}
                isDev={isDev}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-white py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-300 hover:brightness-90"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-text-button)',
                }}
              >
                Prendre Rendez‑vous
              </UserLink>
            ) : (
              <UserLink
                href="/services"
                uid={uid}
                isDev={isDev}
                className="flex-1 text-white py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-300 hover:brightness-90"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-text-button)',
                }}
              >
                Prendre Rendez‑vous
              </UserLink>
            )}

            <UserLink
              href="/services"
              uid={uid}
              isDev={isDev}
              className="flex-1 py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-300 hover:brightness-95 hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--color-white)',
                color: 'var(--color-text-dark)',
              }}
            >
              {data.accueil.bouton || 'Découvrir mes services'}
            </UserLink>
          </div>
        </div>
      </section>
      <div className="flex items-center flex-col">
        {/* Section À propos (CTA) */}
        <section className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl">
          {/* Titre H2 sophrologie */}

          <TitreMultiligne
            text={data.accueil.SectionAProposTitre || 'Mon approche en tant que sophrologue'}
            className="text-3xl font-semibold mb-5 text-center"
            style={{ color: 'var(--color-titreH2)' }}
            tag="h2"
          />
          <p
            className="text-gray-700 leading-relaxed text-lg whitespace-pre-line mb-6"
            style={{ color: 'var(--color-texte)' }}
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(
                !isContentEmpty(data.accueil.SectionAProposDescription || '')
                  ? data.accueil.SectionAProposDescription
                  : DEFAULT_A_PROPOS
              ),
            }}
          />
          <div className="text-center mt-6">
            <UserLink
              href="/about"
              uid={uid}
              isDev={isDev}
              className="mb-8 inline-block mt-6 text-white py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-300"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-button)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  'color-mix(in srgb, var(--color-primary), black 15%)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
            >
              {data.accueil.SectionAProposCTA || '➤ En savoir plus sur la sophrologie'}
            </UserLink>
          </div>

          {data?.accueil?.image !== null && (
            <img
              src={data.accueil.image !== '' ? data.accueil.image : DEFAULT_IMAGE}
              alt="Illustration sophrologie, bien-être et relaxation"
              className="mx-auto rounded-xl shadow-xl w-80 h-[350px] object-fill"
            />
          )}
        </section>

        {/* Section Services */}
        <section id="services" className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl">
          {/* Titre H2 sophrologie */}

          <TitreMultiligne
            text={data.accueil.SectionServicesTitre || 'Mes accompagnements en sophrologie'}
            className="text-3xl font-semibold mb-5 text-center"
            style={{ color: 'var(--color-titreH2)' }}
            tag="h2"
          />
          <p
            className="text-gray-700 text-lg leading-relaxed space-y-4 mb-6"
            style={{ color: 'var(--color-texte)' }}
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(
                !isContentEmpty(data.accueil.SectionServicesDescription || '')
                  ? data.accueil.SectionServicesDescription
                  : DEFAULT_SERVICES
              ),
            }}
          />
          <div className="text-center mt-6">
            <UserLink
              href="/services"
              uid={uid}
              isDev={isDev}
              className="inline-block py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-300"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-button)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  'color-mix(in srgb, var(--color-primary), black 15%)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
            >
              {data.accueil.SectionServicesCTA || '➤ Découvrir le programme de sophrologie'}
            </UserLink>
          </div>
        </section>

        {/* Section Témoignages (CTA) */}
        <section className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl">
          {/* Titre H2 témoignages sophrologie */}

          <TitreMultiligne
            text={
              data.accueil.SectionTestimonialsTitre ||
              'Ils ont retrouvé la sérénité grâce à la sophrologie'
            }
            className="text-3xl font-semibold mb-5 text-center"
            style={{ color: 'var(--color-titreH2)' }}
            tag="h2"
          />

          <p
            className="text-gray-700 leading-relaxed text-lg"
            style={{ color: 'var(--color-texte)' }}
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(
                !isContentEmpty(data.accueil.SectionTestimonialsDescription || '')
                  ? data.accueil.SectionTestimonialsDescription
                  : DEFAULT_TESTIMONIALS
              ),
            }}
          />

          <div className="text-center mt-6">
            <UserLink
              href="/testimonials"
              uid={uid}
              isDev={isDev}
              className="mb-8 inline-block mt-6 py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-300"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-button)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  'color-mix(in srgb, var(--color-primary), black 15%)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
            >
              {data.accueil.SectionTestimonialsCTA || '➤ Lire les témoignages sur la sophrologie'}
            </UserLink>
          </div>
        </section>

        {/* Section Contact (CTA) */}
        <section className="mb-16 bg-white p-8 rounded-xl shadow text-center max-w-7xl">
          {/* Titre H2 contact sophrologie */}
          <TitreMultiligne
            text={
              data.accueil.SectionContactTitre ||
              'Prêt(e) à découvrir les bienfaits de la sophrologie ?'
            }
            className="text-3xl font-semibold mb-5 text-center"
            style={{ color: 'var(--color-titreH2)' }}
            tag="h2"
          />
          <p
            className="text-gray-700 leading-relaxed text-lg max-w-3xl mx-auto"
            style={{ color: 'var(--color-texte)' }}
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(
                !isContentEmpty(data.accueil.SectionContactDescription || '')
                  ? data.accueil.SectionContactDescription
                  : DEFAULT_CONTACT
              ),
            }}
          />
          <UserLink
            href="/contact"
            uid={uid}
            isDev={isDev}
            className="inline-block mt-6 py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-300"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-button)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                'color-mix(in srgb, var(--color-primary), black 15%)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
          >
            {data.accueil.SectionContactCTA || '➤ Réserver ma séance de sophrologie maintenant'}
          </UserLink>
        </section>
      </div>
    </>
  );
}
