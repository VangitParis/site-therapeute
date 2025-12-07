import { CSSProperties, useEffect, useMemo, useState } from 'react';

import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ContactForm from '../components/ContactForm';

export default function Home({ locale = 'fr' }) {
  const DEFAULT_IMAGE =
    'https://res.cloudinary.com/dwadzodje/image/upload/v1750498500/assets/image_defaut.png';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sitebuilder.app';
  const seoTitle =
    'SiteBuilder | Accompagnement + outil de création de sites pour thérapeutes et praticiens';
  const seoDescription =
    'SiteBuilder accompagne sophrologues, psychologues et coachs avec un diagnostic personnalisé puis un studio de création ultra-simple pour lancer un site professionnel.';
  const seoKeywords = [
    'site pour thérapeute',
    'création site sophrologue',
    'template psychologue',
    'outil site coach de vie',
    'plateforme site bien-être',
  ].join(', ');

  const [data, setData] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedProfession, setSelectedProfession] = useState<string>('sophrologie');

  type TemplatePreview = {
    id: string;
    title: string;
    description: string;
    heroTagline: string;
    heroText: string;
    badges: string[];
    features: string[];
    sections: { title: string; description: string }[];
    ctaLabel: string;
    colors: {
      hero: string;
      accent: string;
      button: string;
      section: string;
      badge: string;
    };
  };

  type PlatformHighlight = {
    id: string;
    label: string;
    tagline: string;
    description: string;
    focus: string[];
    cta: string;
  };

  type ProfessionalSuite = {
    id: string;
    title: string;
    audience: string;
    pitch: string;
    automations: string[];
    differentiator: string;
    templateRef: string;
  };

  const templatePreviews: TemplatePreview[] = [
    {
      id: 'sophrologie',
      title: 'Template Sophrologie',
      description: 'Design zen et apaisant pour les sophrologues',
      heroTagline: 'Sophrologie & respiration',
      heroText: 'Un espace doux pour guider vos séances et rassurer vos clients.',
      badges: ['Palette pastel', 'Focus respiration', 'Sections témoignages'],
      features: [
        'Accueil avec mantra et visuels inspirants',
        'Mise en avant des accompagnements et pratiques corporelles',
        'Espace blog pour partager vos protocoles',
      ],
      sections: [
        { title: 'Séances', description: 'Respiration guidée & relaxation' },
        { title: 'Programmes', description: 'Accompagnements personnalisés' },
        { title: 'Témoignages', description: 'Parcours clients inspirants' },
      ],
      ctaLabel: 'Réserver une séance',
      colors: {
        hero: '#f7f2ff',
        accent: '#a16dd4',
        button: '#7c3aed',
        section: '#fdfaff',
        badge: '#efe4ff',
      },
    },
    {
      id: 'psychologie',
      title: 'Template Psychologue',
      description: 'Professionnel et rassurant pour les psychologues',
      heroTagline: 'Cabinet de psychologie',
      heroText: 'Structure claire, rassurante et adaptée aux suivis thérapeutiques.',
      badges: ['Ton rassurant', 'Focus expertise', 'Parcours patient'],
      features: [
        'Navigation structurée avec présentation du cabinet',
        'Mise en valeur des spécialisations et approches',
        'Bloc FAQ pour répondre aux questions clés',
      ],
      sections: [
        { title: 'Cabinet', description: 'Valeurs, cadre et mission' },
        { title: 'Spécialisations', description: 'Adultes, ados, couples' },
        { title: 'FAQ', description: 'Réponses aux questions clés' },
      ],
      ctaLabel: 'Planifier une consultation',
      colors: {
        hero: '#edf6ff',
        accent: '#2563eb',
        button: '#1d4ed8',
        section: '#f8fbff',
        badge: '#dceeff',
      },
    },
    {
      id: 'coaching',
      title: 'Template Coach',
      description: 'Dynamique et motivant pour les coachs de vie',
      heroTagline: 'Coaching & mindset',
      heroText: 'Design vibrant pour booster la motivation et l’appel à l’action.',
      badges: ['Look énergique', 'CTA mis en avant', 'Calendrier intégré'],
      features: [
        'Hero percutant avec promesse claire',
        'Sections programmes et résultats clients',
        'Calendrier de prise de rendez-vous intégré',
      ],
      sections: [
        { title: 'Programmes', description: 'Offres et modules détaillés' },
        { title: 'Résultats', description: 'Études de cas & chiffres' },
        { title: 'Booking', description: 'Calendrier intégré multi-canaux' },
      ],
      ctaLabel: 'Réserver un appel découverte',
      colors: {
        hero: '#fff4f1',
        accent: '#ef4444',
        button: '#dc2626',
        section: '#fff8f6',
        badge: '#ffe1da',
      },
    },
  ];

  const platformHighlights: PlatformHighlight[] = [
    {
      id: 'sitebuilder',
      label: 'SiteBuilder',
      tagline: 'Accompagnement & ressources',
      description:
        'SiteBuilder réunit diagnostic, clarification du message, conseils design et préparation de chaque section avant de passer sur l’outil.',
      focus: [
        'Audit positionnement + stratégie',
        'Scripts de pages & textes personnalisés',
        'Checklist prête avant la création',
      ],
      cta: 'Découvrir SiteBuilder',
    },
    {
      id: 'studio',
      label: 'Studio de création',
      tagline: 'Outil de création de sites',
      description:
        'Accessible après accompagnement, le Studio est l’outil que vous utiliserez pour monter le site : glisser-déposer, textes IA et structures adaptées à votre métier.',
      focus: [
        'Bibliothèque de blocs bien-être',
        'Éditeur mobile-first en direct',
        'Intégrations rendez-vous et paiement',
      ],
      cta: 'Accéder à l’éditeur',
    },
  ];

  const professionalSuites: ProfessionalSuite[] = [
    {
      id: 'sophrologie-suite',
      title: 'Suite Sophrologues',
      audience: 'Pour praticiens en sophrologie, relaxation, hypnose douce',
      pitch:
        'Guides de séance, pages programmes et rituels de respiration intégrés pour partager vos accompagnements.',
      automations: [
        'Pages Séances & Protocoles prêtes à remplir',
        'Section audio pour exercices guidés',
        'Espace blog pour vos inspirations',
      ],
      differentiator: 'Ton apaisant et focus sur la respiration pour rassurer les visiteurs.',
      templateRef: 'sophrologie',
    },
    {
      id: 'psychologie-suite',
      title: 'Suite Psychologues',
      audience: 'Pour psychologues libéraux, neuropsychologues, psychothérapeutes',
      pitch:
        'Met en avant votre expertise clinique, votre cadre légal et vos modalités d’accompagnement pour inspirer confiance.',
      automations: [
        'Fiches approches thérapeutiques',
        'Bloc FAQ pour lever les freins',
        'Calendrier sécurisé pour RDV',
      ],
      differentiator: 'Structure rassurante, tons bleus professionnels et typographies sobres.',
      templateRef: 'psychologie',
    },
    {
      id: 'coaching-suite',
      title: 'Suite Coachs',
      audience: 'Pour coachs de vie, business, mindset et thérapeutes énergétiques',
      pitch:
        'Pages programmes dynamiques avec témoignages, modules et appels à l’action explicites pour convertir.',
      automations: [
        'Fiches Programmes & Tarifs',
        'Timeline de progression client',
        'Intégration Calendly / Visio',
      ],
      differentiator: 'Design énergique et CTA visibles pour booster les conversions.',
      templateRef: 'coaching',
    },
  ];

  const router = useRouter();
  const uid = router.query.uid as string;
  const isDev = router.query.frdev === '1';
  const isPreview = router.query.admin === 'true';

  // Vérifier si on est côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Si aucun UID n'est présent ET qu'on n'est pas en mode dev, afficher la landing page
  const shouldShowLanding = isClient && !uid && !isDev && !isPreview;

  // Fonction pour démarrer la création
  const startBuilding = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/login'); // Remplacez par votre route d'éditeur
    }, 500);
  };

  const chooseTemplate = (templateId: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(`/login?template=${templateId}`);
    }, 500);
  };

  const chooseContentProfile = (templateId: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(`/login?template=${templateId}&profile=${templateId}`);
    }, 500);
  };

  const activeTemplate = useMemo(
    () => templatePreviews.find((template) => template.id === selectedProfession) ?? templatePreviews[0],
    [selectedProfession]
  );

  function isContentEmpty(html: string): boolean {
    const cleaned = html
      .replace(/<br\s*\/?>/gi, '')
      .replace(/&nbsp;/gi, '')
      .replace(/\s+/g, '')
      .replace(/<[^>]*>/g, '')
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
    if (shouldShowLanding) return; // Ne pas charger de données pour la landing page

    const fetchData = async () => {
      const docId = isDev ? 'fr' : uid || locale;
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
  }, [locale, isPreview, isDev, uid, shouldShowLanding]);

  // AFFICHER LA LANDING PAGE
  if (shouldShowLanding) {
    return (
      <>
        <Head>
          <title>{seoTitle}</title>
          <meta name="description" content={seoDescription} />
          <meta name="keywords" content={seoKeywords} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={siteUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="SiteBuilder" />
          <meta property="og:title" content={seoTitle} />
          <meta property="og:description" content={seoDescription} />
          <meta property="og:url" content={siteUrl} />
          <meta property="og:image" content={DEFAULT_IMAGE} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={seoTitle} />
          <meta name="twitter:description" content={seoDescription} />
          <meta name="twitter:image" content={DEFAULT_IMAGE} />
        </Head>

        <div className={`app ${isTransitioning ? 'transitioning' : ''}`}>
          {/* Header */}
          <header className="header">
            <nav className="nav container">
              <a href="/" className="logo">
                🌿 SiteBuilder
              </a>
              <ul className="nav-links">
                <li>
                  <a href="#features">Fonctionnalités</a>
                </li>
                <li>
                  <a href="#templates">Templates</a>
                </li>
                <li>
                  <a href="/login">Se connecter / S'inscrire</a>
                </li>
                <li>
                  <a href="#contact">Contact</a>
                </li>
              </ul>
            </nav>
          </header>
          <main>
            {/* Hero Section */}
            <section className="hero">
              <div className="floating-elements">
                <div className="floating-element"></div>
                <div className="floating-element"></div>
                <div className="floating-element"></div>
              </div>
              <div className="hero-content">
                <h1>Créez votre site de thérapeute</h1>
                <p>
                  SiteBuilder clarifie votre positionnement et prépare vos contenus. Ensuite, vous
                  prenez la main sur le Studio de création, l’outil ultra-simple qui assemble votre
                  site en quelques clics. Parfait pour sophrologues, psychologues et coachs.
                </p>
                <button className="cta-button" onClick={startBuilding}>
                  Créer mon site maintenant
                </button>
              </div>
            </section>

            {/* Platform distinction */}
            <section className="platform" id="plateforme">
              <div className="container">
                <h2>SiteBuilder + Outil de création</h2>
                <p className="platform-subtitle">
                  SiteBuilder est la plateforme d’accompagnement (diagnostic, contenus, conseils).
                  Une fois guidé, vous basculez sur l’outil de création pour mettre en place le site
                  final, sans complexité technique.
                </p>
                <div className="platform-grid">
                  {platformHighlights.map((block) => (
                    <article key={block.id} className="platform-card">
                      <div className="platform-card-header">
                        <span className="platform-label">{block.label}</span>
                        <span className="platform-tagline">{block.tagline}</span>
                      </div>
                      <p>{block.description}</p>
                      <ul>
                        {block.focus.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <button
                        className="platform-cta"
                        onClick={startBuilding}
                        aria-label={block.cta}
                      >
                        {block.cta}
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="features" id="features">
              <div className="container">
                <h2>Parfait pour les thérapeutes</h2>
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">🧘‍♀️</div>
                    <h3>Templates Thérapie</h3>
                    <p>
                      Templates spécialement conçus pour sophrologues, psychologues, coachs et
                      praticiens du bien-être.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📅</div>
                    <h3>Prise de RDV</h3>
                    <p>
                      Intégration facile avec Calendly et autres systèmes de réservation en ligne.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🎨</div>
                    <h3>Design Apaisant</h3>
                    <p>
                      Couleurs et designs pensés pour inspirer confiance et sérénité à vos clients.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📱</div>
                    <h3>Mobile-First</h3>
                    <p>
                      Vos clients peuvent vous trouver et prendre RDV depuis leur téléphone
                      facilement.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3>Création Rapide</h3>
                    <p>
                      Votre site professionnel prêt en moins de 30 minutes, sans compétences
                      techniques.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🔒</div>
                    <h3>Sécurisé</h3>
                    <p>
                      Protection des données de vos clients et conformité aux standards du secteur
                      médical.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Professional suites */}
            <section className="solutions" id="solutions">
              <div className="container">
                <h2>Des outils adaptés à chaque profession</h2>
                <p className="solutions-subtitle">
                  Chaque suite SiteBuilder reprend vos codes, vos besoins et vos parcours clients
                  pour que vos visiteurs se sentent immédiatement à leur place.
                </p>
                <div className="solutions-grid">
                  {professionalSuites.map((suite) => (
                    <article key={suite.id} className="solution-card">
                      <header>
                        <span className="solution-badge">{suite.title}</span>
                        <h3>{suite.audience}</h3>
                        <p>{suite.pitch}</p>
                      </header>
                      <ul className="solution-list">
                        {suite.automations.map((automation) => (
                          <li key={automation}>{automation}</li>
                        ))}
                      </ul>
                      <p className="solution-note">{suite.differentiator}</p>
                      <div className="solution-actions">
                        <button
                          className="solution-cta"
                          onClick={() => chooseTemplate(suite.templateRef)}
                        >
                          Choisir le template {suite.title.split(' ')[1]}
                        </button>
                        <button className="solution-secondary" onClick={startBuilding}>
                          Tester l’outil
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* Templates Preview */}
            <section className="templates" id="templates">
              <div className="container">
                <h2>Templates pour thérapeutes</h2>
                <div className="templates-grid">
                  {templatePreviews.map((template) => {
                    const styleVars = {
                      '--mockup-hero-bg': template.colors.hero,
                      '--mockup-accent': template.colors.accent,
                      '--mockup-button': template.colors.button,
                      '--mockup-section-bg': template.colors.section,
                      '--mockup-badge-bg': template.colors.badge,
                    } as CSSProperties;

                    return (
                      <div className="template-card" key={template.id} style={styleVars}>
                        <div className="template-preview">
                          <div className="template-mockup">
                            <div className="mockup-navbar">
                              <span className="mockup-dot" />
                              <span className="mockup-dot" />
                              <span className="mockup-dot" />
                              <span className="mockup-navbar-title">studio bien-être</span>
                            </div>
                          <div className="mockup-hero">
                            <span className="mockup-pill">{template.heroTagline}</span>
                            <p className="mockup-hero-text">{template.heroText}</p>
                          </div>
                          <div className="mockup-sections">
                            {template.sections.map((section) => (
                              <div className="mockup-section-card" key={section.title}>
                                <span className="mockup-section-title">{section.title}</span>
                                <span className="mockup-section-text">{section.description}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mockup-cta">
                            <div className="mockup-line wide" />
                            <div className="mockup-cta-button">{template.ctaLabel}</div>
                          </div>
                        </div>
                      </div>
                        <div className="template-text">
                          <h3>{template.title}</h3>
                          <p>{template.description}</p>
                          <ul className="template-badges">
                            {template.badges.map((badge) => (
                              <li key={badge}>{badge}</li>
                            ))}
                          </ul>
                          <ul className="template-features">
                            {template.features.map((feature) => (
                              <li key={feature}>{feature}</li>
                            ))}
                          </ul>
                          <button
                            className="template-select"
                            onClick={() => chooseTemplate(template.id)}
                            aria-label={`Choisir ${template.title}`}
                          >
                            Choisir ce template
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Content configuration */}
            <section className="content-config" id="configuration">
              <div className="container">
                <div className="content-config-header">
                  <h2>Contenus prêts pour votre métier</h2>
                  <p>
                    Sélectionnez le ton et les visuels adaptés à votre pratique. SiteBuilder charge
                    automatiquement les textes, images et CTA correspondant à votre profession pour
                    accélérer la mise en ligne.
                  </p>
                </div>
                <div className="content-config-grid">
                  <div className="content-options">
                    {templatePreviews.map((template) => (
                      <button
                        key={template.id}
                        className={`content-option ${selectedProfession === template.id ? 'active' : ''}`}
                        onClick={() => setSelectedProfession(template.id)}
                      >
                        <span className="content-option-title">{template.title}</span>
                        <span className="content-option-desc">{template.description}</span>
                      </button>
                    ))}
                  </div>
                  <div className="content-preview-card">
                    <header>
                      <span className="content-pill">{activeTemplate?.heroTagline}</span>
                      <h3>{activeTemplate?.title}</h3>
                      <p>{activeTemplate?.heroText}</p>
                    </header>
                    <div className="content-preview-details">
                      <div>
                        <h4>Sections auto-remplies</h4>
                        <ul>
                          {activeTemplate?.sections.map((section) => (
                            <li key={section.title}>
                              <strong>{section.title}</strong> — {section.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4>CTA par défaut</h4>
                        <p className="content-cta">{activeTemplate?.ctaLabel}</p>
                        <h4>Style visuel</h4>
                        <p>{activeTemplate?.badges.join(' · ')}</p>
                      </div>
                    </div>
                    <button
                      className="content-config-cta"
                      onClick={() => chooseContentProfile(activeTemplate?.id || 'sophrologie')}
                    >
                      Utiliser ce profil de contenu
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
              <div className="container">
                <h2>Prêt à lancer votre pratique en ligne ?</h2>
                <p>
                  Rejoignez des centaines de thérapeutes qui ont déjà créé leur site professionnel
                </p>
                <button className="cta-button-secondary" onClick={startBuilding}>
                  Commencer gratuitement
                </button>
              </div>
            </section>
            {/* {Contact Section} */}
            <section className="flex flex-col items-center templates bg-white" id="contact">
              <div className="container text-center">
                <h2>Contactez-nous</h2>
                <p>
                  Si vous doutez encore n'hésitez pas à nous envoyer un message pour qu'on s'assure
                  que votre projet est possible
                </p>
              </div>
              <div>
                <p>
                  📧 Email :{' '}
                  <a href="mailto:vangitparis@gmail.com" className="text-prune underline">
                    vangitparis@gmail.com
                  </a>
                </p>
                {/* <ContactForm/> */}
              </div>
            </section>
          </main>
          {/* Footer */}
          <footer className="footer">
            <div className="container">
              <p>
                &copy; 2025 SiteBuilder. Créé avec ❤️ pour les thérapeutes et praticiens du
                bien-être.
              </p>
            </div>
          </footer>
        </div>
      </>
    );
  }
}
