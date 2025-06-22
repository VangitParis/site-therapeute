import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../lib/firebaseClient';
import { updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import AdminSidebar from '../../components/AdminSidebar';
import SitePreview from '../../components/SitePreview';
import LiveWrapper from '../../components/LiveWrapper';
import { ImageUploadRef } from '../../components/ImageUploadField';

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

export default function Live() {
  const router = useRouter();
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [userLoaded, setUserLoaded] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);

  const imageFieldRef = useRef<ImageUploadRef>(null);
  const imageFieldAProposRef = useRef<ImageUploadRef>(null);
  const imageFieldTestimonialsRef = useRef<ImageUploadRef>(null);
  const imageFieldBgRef = useRef<ImageUploadRef>(null);
  const imageFieldServicesRef = useRef<ImageUploadRef>(null);

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
    const unsub = onAuthStateChanged(auth, () => {
      setUserLoaded(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let unsubAuth: () => void;

    const init = async () => {
      unsubAuth = onAuthStateChanged(auth, async (user) => {
        setUserLoaded(true);

        const isDev = router.query.frdev === '1';
        const uidFromQuery = router.query.uid as string | undefined;

        let resolvedDocId = 'fr';

        if (isDev) {
          resolvedDocId = 'fr';
        } else if (uidFromQuery) {
          resolvedDocId = uidFromQuery;
        } else if (user) {
          resolvedDocId = user.uid;
        } else {
          console.warn('❌ Aucun utilisateur connecté.');
          return;
        }

        setDocId(resolvedDocId);

        try {
          const snap = await getDoc(doc(db, 'content', resolvedDocId));
          if (snap.exists()) {
            const raw = snap.data();
            const services = raw.services || { titre: '', liste: [], image: '', bouton: '' };
            services.liste = services.liste.map((s: any) =>
              typeof s === 'string' ? { text: s, image: '' } : s
            );

            setFormData({
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
            });
          }
        } catch (e) {
          console.error('❌ Erreur de chargement :', e);
        }
      });
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleRouteChangeStart = (url: string) => {
      if (
        unsavedChanges &&
        !window.confirm(
          '⚠️ Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter cette page ?'
        )
      ) {
        throw 'Changement de route annulé pour éviter la perte de données.';
      }
    };

    init();
    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      if (unsubAuth) unsubAuth();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [unsavedChanges, router.query]);

  useEffect(() => {
    if (formData?.theme) {
      applyThemeToDOM(formData.theme);
    }
  }, [formData?.theme]);

  const handleSave = async () => {
    const uidParam = typeof router.query.uid === 'string' ? router.query.uid : null;
    const isAdminDev = router.query.frdev === '1';

    let docId = 'fr';

    if (isAdminDev && !uidParam) {
      docId = 'fr';
    } else if (!isAdminDev && uidParam) {
      docId = uidParam;
    } else if (!isAdminDev && !uidParam) {
      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
          if (user) docId = user.uid;
          unsub();
          resolve();
        });
      });
    }

    const ref = doc(db, 'content', docId);
    await updateDoc(ref, { ...formData, adminToken: 'admin' });
    setMessage('✅ Modifications enregistrées.');
  };

  const wrappedSetFormData = (fn: (prev: any) => any) => {
    setUnsavedChanges(true);
    setFormData(fn);
  };

  if (!formData) return <p className="text-center p-6">Chargement…</p>;

  return (
    <LiveWrapper>
      <div className="flex h-screen">
        {sidebarVisible && (
          <div className="w-[30%] min-w-[320px] border-r overflow-y-scroll relative">
            <AdminSidebar
              formData={formData}
              setFormData={wrappedSetFormData}
              imageFieldRef={imageFieldRef}
              imageFieldAProposRef={imageFieldAProposRef}
              imageFieldTestimonialsRef={imageFieldTestimonialsRef}
              imageFieldServicesRef={imageFieldServicesRef}
              imageFieldBgRef={imageFieldBgRef}
              handleSave={handleSave}
              message={message}
              onClose={() => setSidebarVisible(false)}
            />
          </div>
        )}
        <div className="flex-1 relative">
          {!sidebarVisible && (
            <button
              onClick={() => setSidebarVisible(true)}
              className="absolute top-8 left-4 z-10 bg-white border rounded px-3 py-1 text-sm shadow"
            >
              📂 Ouvrir l’administration
            </button>
          )}
          <div className="relative">
            <div className="absolute top-0 left-0 w-full bg-yellow-100 text-yellow-800 text-center text-sm py-1 z-20">
              ✏️ Mode édition en direct activé.
            </div>
            <div className="pt-6">
              <SitePreview formData={formData} uid={docId} />
            </div>
          </div>
        </div>
      </div>
    </LiveWrapper>
  );
}
