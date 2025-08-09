import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';
import TitreMultiligne from '../../components/TitreMultiligne';
import UserLink from '../../components/UserLinks';
import AnimatedSection from '../../components/AnimatedSection';
import { sanitizeHTML } from '../../utils/sanitizeHTML';
import {
  DEFAULT_A_PROPOS,
  DEFAULT_CONTACT,
  DEFAULT_SERVICES,
  DEFAULT_TESTIMONIALS,
} from '../../utils/default';

const DEFAULT_THEME = {
  background: '#f4f0fa',
  primary: '#7f5a83',
  accent: '#e6f0ff',
  bgImage: '',
  titreH1: '#000',
  titreH2: '#000',
  titreH3: '#000',
  texte: '#000',
  textButton: '#FFFFFF',
};

const DEFAULT_IMAGE =
  'https://res.cloudinary.com/dwadzodje/image/upload/v1750498500/assets/image_defaut.png';

export default function HomePage({ locale = 'fr' }) {
  const router = useRouter();

  // États pour la gestion des données
  const [formData, setFormData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(true);
  const [dataSource, setDataSource] = useState('loading');

  // Paramètres URL
  const uid = router.query.uid as string;
  const isDev = router.query.frdev === '1';
  const isAdminMode = router.query.admin === 'true';

  // 🔥 Fonction pour vérifier si le contenu HTML est vide
  function isContentEmpty(html: string): boolean {
    const cleaned = html
      .replace(/<br\s*\/?>/gi, '')
      .replace(/&nbsp;/gi, '')
      .replace(/\s+/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();
    return cleaned.length === 0;
  }

  // 🔥 Fonction pour appliquer le thème au DOM
  const applyThemeToDOM = (theme: any) => {
    if (!theme) return;

    console.log('🎨 Application du thème:', theme);

    const root = document.documentElement;
    if (theme.background) {
      root.style.setProperty('--color-bg', theme.background);
      console.log('🎨 Background appliqué:', theme.background);
    }
    if (theme.primary) root.style.setProperty('--color-primary', theme.primary);
    if (theme.accent) root.style.setProperty('--color-accent', theme.accent);
    if (theme.texte) root.style.setProperty('--color-texte', theme.texte);
    if (theme.textButton) root.style.setProperty('--color-text-button', theme.textButton);
    if (theme.titreH1) root.style.setProperty('--color-titreH1', theme.titreH1);
    if (theme.titreH2) root.style.setProperty('--color-titreH2', theme.titreH2);
    if (theme.titreH3) root.style.setProperty('--color-titreH3', theme.titreH3);
  };

  // 🔥 Charger les données depuis Firestore (fallback)
  const loadFromFirestore = async (docId: string) => {
    try {
      setIsLoadingFirestore(true);
      console.log('📥 Chargement depuis Firestore pour UID:', docId);

      const snap = await getDoc(doc(db, 'content', docId));

      if (snap.exists()) {
        const raw = snap.data();

        // Normaliser les services
        const services = raw.services || { titre: '', liste: [], image: '', bouton: '' };
        services.liste = services.liste.map((s: any) =>
          typeof s === 'string' ? { text: s, image: '' } : s
        );

        const firestoreData = {
          layout: raw.layout || { nom: '', titre: '', footer: '', liens: [] },
          theme: raw.theme || DEFAULT_THEME,
          accueil: raw.accueil || {
            titre: '',
            texte: '',
            bouton: '',
            image: '',
            SectionAProposTitre: '',
            SectionAProposDescription: '',
            SectionAProposCTA: '',
            SectionServicesTitre: '',
            SectionServicesDescription: '',
            SectionServicesCTA: '',
            SectionTestimonialsTitre: '',
            SectionTestimonialsDescription: '',
            SectionTestimonialsCTA: '',
            SectionContactTitre: '',
            SectionContactDescription: '',
            SectionContactCTA: '',
          },
          aPropos: raw.aPropos || { titre: '', texte: '', image: '', bouton: '' },
          services,
          testimonials: raw.testimonials || [],
          testimonialsButton: raw.testimonialsButton || '',
          contact: raw.contact || {
            titre: '',
            texte: '',
            bouton: '',
            image: '',
            lien: '',
            titreH2: '',
            titreTarifs: '',
          },
        };

        console.log('✅ Données Firestore chargées:', firestoreData);
        setFormData(firestoreData);

        // Si on n'est pas en mode admin, utiliser ces données directement
        if (!isAdminMode) {
          setDataSource('firestore');
          applyThemeToDOM(firestoreData.theme);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement Firestore:', error);
    } finally {
      setIsLoadingFirestore(false);
    }
  };

  // 🔥 Initialisation et gestion des données
  useEffect(() => {
    const docId = isDev ? 'fr' : uid || locale;
    if (!docId) return;

    // Charger les données Firestore
    loadFromFirestore(docId);

    // 🔥 Gestionnaire des messages en mode admin
    const handleMessage = (event: MessageEvent) => {
      if (isAdminMode && event.data?.type === 'UPDATE_FORMDATA') {
        console.log('📨 Message reçu en mode admin:', event.data);
        const updatedData = event.data.payload;

        console.log('🔄 Données temps réel reçues, theme:', updatedData.theme);
        setLiveData(updatedData);
        setDataSource('live');

        // Appliquer le thème avec un petit délai pour éviter les conflits
        setTimeout(() => {
          applyThemeToDOM(updatedData.theme);
        }, 10);

        console.log('🔄 Mise à jour des données temps réel appliquée');
      }
    };

    window.addEventListener('message', handleMessage);

    // Signaler que l'iframe est prête si en mode admin
    if (isAdminMode) {
      window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
      console.log('📡 Iframe prête - Signal envoyé au parent');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [locale, isAdminMode, isDev, uid]);

  // 🔥 Déterminer quelles données utiliser
  const getDisplayData = () => {
    if (isAdminMode && liveData) {
      console.log('🎯 Utilisation des données temps réel');
      return liveData;
    } else if (formData) {
      console.log('🗃️ Utilisation des données Firestore');
      return formData;
    } else {
      console.log('⏳ Données par défaut');
      return {
        layout: { nom: '', titre: '', footer: '', liens: [] },
        theme: DEFAULT_THEME,
        accueil: {
          titre: 'Chargement...',
          texte: '',
          bouton: '',
          image: '',
          SectionAProposTitre: '',
          SectionAProposDescription: '',
          SectionAProposCTA: '',
          SectionServicesTitre: '',
          SectionServicesDescription: '',
          SectionServicesCTA: '',
          SectionTestimonialsTitre: '',
          SectionTestimonialsDescription: '',
          SectionTestimonialsCTA: '',
          SectionContactTitre: '',
          SectionContactDescription: '',
          SectionContactCTA: '',
        },
        aPropos: { titre: '', texte: '', image: '', bouton: '' },
        services: { titre: '', liste: [], image: '', bouton: '' },
        testimonials: [],
        testimonialsButton: '',
        contact: {
          titre: '',
          texte: '',
          bouton: '',
          image: '',
          lien: '',
          titreH2: '',
          titreTarifs: '',
        },
      };
    }
  };

  const data = getDisplayData();

  // 🔥 useEffect pour appliquer le thème quand les données changent
  useEffect(() => {
    if (data?.theme) {
      console.log('🎨 Application du thème depuis useEffect:', data.theme);
      applyThemeToDOM(data.theme);
    }
  }, [data?.theme, dataSource]);

  // 🔥 Indicateur de statut pour le debug
  const getStatusIndicator = () => {
    if (isLoadingFirestore) {
      return { text: '⏳ Chargement...', color: 'bg-gray-500' };
    } else if (dataSource === 'live') {
      return { text: '🔄 Temps réel', color: 'bg-green-500' };
    } else if (dataSource === 'firestore') {
      return { text: '🗃️ Firestore', color: 'bg-blue-500' };
    } else {
      return { text: '❓ Aucune donnée', color: 'bg-red-500' };
    }
  };

  const statusIndicator = getStatusIndicator();

  // Affichage du loader si pas de données
  if (!data || isLoadingFirestore) {
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: data?.theme?.background || 'var(--color-bg, #f4f0fa)' }}
    >
      {/* Indicateur de mode admin */}
      {isAdminMode && (
        <div
          className={`fixed bottom-4 right-4 text-white px-3 py-1 rounded text-xs z-50 ${statusIndicator.color}`}
        >
          {statusIndicator.text}
        </div>
      )}

      {/* Section Accueil */}
      <section
        className="relative overflow-hidden py-24 px-6 md:px-24 mb-16 animate-fadeInUp delay-200"
        style={{
          ...bgImageStyle,
          height: '700px',
        }}
      >
        <div className="flex flex-col m-3 sm:m-4 gap-15 max-w-2xl">
          <TitreMultiligne
            text={
              data.accueil.titre ||
              'Sophrologie : Retrouvez Sérénité intérieure et Équilibre au quotidien'
            }
            className="text-3xl lg:text-6xl font-bold text-prune tracking-tight leading-tight animate-fadeInUp delay-200"
            style={{ color: 'var(--color-titreH1)' }}
            tag="h1"
          />

          <p className="text-xl text-gray-700 max-w-2xl" style={{ color: 'var(--color-texte)' }}>
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
                href="/users/services"
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
              href="/users/services"
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
        {/* Section À propos */}
        {/* <section className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl"> */}
        <AnimatedSection
          animation="animate-fadeZoom"
          className="mb-16 p-8 bg-white rounded-3xl shadow-xl max-w-7xl"
        >
          <TitreMultiligne
            text={data.accueil.SectionAProposTitre || 'Mon approche en tant que sophrologue'}
            className="text-3xl font-semibold mb-5 text-center"
            style={{ color: 'var(--color-titreH2)' }}
            tag="h2"
          />
          <div className="flex flex-col items-center gap-8">
            <UserLink href="/users/about" uid={uid} isDev={isDev}>
              {' '}
              {data?.accueil?.image !== null && (
                <img
                  src={data.accueil.image !== '' ? data.accueil.image : DEFAULT_IMAGE}
                  alt="Illustration sophrologie, bien-être et relaxation"
                  className="mx-auto rounded-xl shadow-xl w-120 m-h-150 flex-1object-fill transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer"
                />
              )}
            </UserLink>
            <p
              className="text-gray-700 leading-relaxed text-lg whitespace-pre-line mb-6 m-h-150 flex-1"
              style={{ color: 'var(--color-texte)' }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(
                  !isContentEmpty(data.accueil.SectionAProposDescription || '')
                    ? data.accueil.SectionAProposDescription
                    : DEFAULT_A_PROPOS
                ),
              }}
            />
          </div>
          <div className="text-center mt-6">
            <UserLink
              href="/users/about"
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
        </AnimatedSection>

        {/* Section Services */}
        <AnimatedSection
          animation="animate-fadeZoom"
          className="mb-16 p-8 bg-white rounded-3xl shadow-xl max-w-7xl"
        >
          {/* <section id="services" className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl"> */}
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
              href="/users/services"
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
        </AnimatedSection>

        {/* Section Témoignages */}
        <AnimatedSection
          animation="animate-fadeZoom"
          className="mb-16 p-8 bg-white rounded-3xl shadow-xl max-w-7xl"
        >
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
              href="/users/testimonials"
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
        </AnimatedSection>

        {/* Section Contact */}
        <AnimatedSection
          animation="animate-fadeZoom"
          className="mb-16 p-8 bg-white rounded-3xl shadow-xl max-w-7xl"
        >
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
          <div className="text-center mt-6">
            <UserLink
              href="/users/contact"
              uid={uid}
              isDev={isDev}
              className="inline-block mt-6 py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-600"
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
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
