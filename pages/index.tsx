import { useEffect, useState } from 'react';

import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home({ locale = 'fr' }) {
  const DEFAULT_IMAGE =
    'https://res.cloudinary.com/dwadzodje/image/upload/v1750498500/assets/image_defaut.png';

  const [data, setData] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isClient, setIsClient] = useState(false);

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
          <title>SiteBuilder - Créez votre site de thérapeute en quelques clics</title>
          <meta
            name="description"
            content="Créez des sites web magnifiques pour thérapeutes et praticiens en quelques minutes avec notre éditeur intuitif"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className={`app ${isTransitioning ? 'transitioning' : ''}`}>
          {/* Header */}
          <header className="header">
            <nav className="nav container">
              <a href="/" className="logo">
                🌿 TherapyBuilder
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
                Construisez un site web professionnel pour votre pratique thérapeutique en quelques
                minutes. Parfait pour sophrologues, psychologues, coachs et tous praticiens du
                bien-être.
              </p>
              <button className="cta-button" onClick={startBuilding}>
                Créer mon site maintenant
              </button>
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

          {/* Templates Preview */}
          <section className="templates" id="templates">
            <div className="container">
              <h2>Templates pour thérapeutes</h2>
              <div className="templates-grid">
                <div className="template-card">
                  <div className="template-preview">
                    <div className="template-mockup sophrologie">
                      <div className="mockup-header"></div>
                      <div className="mockup-content">
                        <div className="mockup-title">Sophrologie</div>
                        <div className="mockup-text"></div>
                        <div className="mockup-button"></div>
                      </div>
                    </div>
                  </div>
                  <h3>Template Sophrologie</h3>
                  <p>Design zen et apaisant pour les sophrologues</p>
                </div>
                <div className="template-card">
                  <div className="template-preview">
                    <div className="template-mockup psychologie">
                      <div className="mockup-header"></div>
                      <div className="mockup-content">
                        <div className="mockup-title">Psychologie</div>
                        <div className="mockup-text"></div>
                        <div className="mockup-button"></div>
                      </div>
                    </div>
                  </div>
                  <h3>Template Psychologue</h3>
                  <p>Professionnel et rassurant pour les psychologues</p>
                </div>
                <div className="template-card">
                  <div className="template-preview">
                    <div className="template-mockup coaching">
                      <div className="mockup-header"></div>
                      <div className="mockup-content">
                        <div className="mockup-title">Coaching</div>
                        <div className="mockup-text"></div>
                        <div className="mockup-button"></div>
                      </div>
                    </div>
                  </div>
                  <h3>Template Coach</h3>
                  <p>Dynamique et motivant pour les coachs de vie</p>
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

          {/* Footer */}
          <footer className="footer">
            <div className="container">
              <p>
                &copy; 2025 TherapyBuilder. Créé avec ❤️ pour les thérapeutes et praticiens du
                bien-être.
              </p>
            </div>
          </footer>
        </div>
      </>
    );
  }
}
