import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { ImageUploadRef } from '../../components/ImageUploadField';
import { db, auth } from '../../lib/firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AdminSidebar from '../../components/AdminSidebar';
import AdminAuth from '../../components/AdminAuth';
import { onAuthStateChanged } from 'firebase/auth'; // en haut
import SitePreview from '../../components/SitePreview';
import LiveWrapper from '../../components/LiveWrapper';

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

  const imageFieldRef = useRef<ImageUploadRef>(null);
  const imageFieldAProposRef = useRef<ImageUploadRef>(null);
  const imageFieldTestimonialsRef = useRef<ImageUploadRef>(null);
  const imageFieldBgRef = useRef<ImageUploadRef>(null);
  const imageFieldServicesRef = useRef<ImageUploadRef>(null);

  const getDocId = () => {
    if (typeof window === 'undefined') return null;
    const uid = new URLSearchParams(window.location.search).get('uid');
    const frdev = new URLSearchParams(window.location.search).get('frdev');
    if (frdev === '1') return 'fr';
    if (uid) return uid;
    return null;
  };

  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setUserLoaded(true));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userLoaded) return;

    const fetchData = async () => {
      const isAdminSession =
        sessionStorage.getItem('admin_auth') === 'true' && router.query.frdev === '1';
      let docId = 'fr';

      if (!isAdminSession) {
        const user = auth.currentUser;
        if (!user) {
          console.warn('❌ Aucun utilisateur connecté pour fetchData');
          return;
        }
        docId = user.uid;
      }

      try {
        const ref = doc(db, 'content', docId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const raw = snap.data();
          const services = raw.services || { titre: '', liste: [], image: '' };
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
            },
            aPropos: raw.aPropos || { titre: '', texte: '', image: '' },
            services,
            testimonials: raw.testimonials || [],
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
      } catch (err) {
        console.error('❌ Erreur lors du chargement de content :', err);
      }
    };

    fetchData();
  }, [userLoaded, router.query]);

  const handleSave = async () => {
    if (!formData) return;

    const updatedFormData = { ...formData };
    const nom = updatedFormData.layout?.nom?.trim().toLowerCase();
    if (nom === 'marie dupont') {
      alert('Merci de personnaliser le nom avant de sauvegarder.');
      return;
    }

    // Upload images si nécessaire
    if (imageFieldRef.current?.hasPendingUpload()) {
      const uploaded = await imageFieldRef.current.upload();
      if (uploaded) updatedFormData.accueil.image = uploaded;
    }
    if (imageFieldAProposRef.current?.hasPendingUpload()) {
      const uploaded = await imageFieldAProposRef.current.upload();
      if (uploaded) updatedFormData.aPropos.image = uploaded;
    }
    if (imageFieldServicesRef.current?.hasPendingUpload()) {
      const uploaded = await imageFieldServicesRef.current.upload();
      if (uploaded) updatedFormData.services.image = uploaded;
    }
    if (imageFieldTestimonialsRef.current?.hasPendingUpload()) {
      const uploaded = await imageFieldTestimonialsRef.current.upload();
      if (uploaded) updatedFormData.testimonials.avatar = uploaded;
    }
    if (imageFieldBgRef.current?.hasPendingUpload()) {
      const uploaded = await imageFieldBgRef.current.upload();
      if (uploaded) updatedFormData.theme.bgImage = uploaded;
    }

    updatedFormData.services.liste = updatedFormData.services.liste.map((s: any) =>
      typeof s === 'string' ? { text: s, image: '' } : s
    );

    // Détermine docId cible : admin (content/fr) ou client (content/{uid})
    let docId = 'fr';
    const isDev = sessionStorage.getItem('admin_auth') === 'true' && router.query.frdev === '1';
    const currentUser = auth.currentUser;

    if (!isDev && currentUser?.uid) {
      docId = currentUser.uid;
    } else if (!isDev) {
      console.error("❌ Pas d'utilisateur connecté pour sauvegarde.");
      return;
    }

    try {
      await setDoc(doc(db, 'content', docId), updatedFormData);
      setMessage('✅ Sauvegarde réussie');
      setUnsavedChanges(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('❌ Erreur lors de la sauvegarde :', err);
      setMessage('❌ Erreur lors de la sauvegarde');
    }
  };

  const wrappedSetFormData = (fn: (prev: any) => any) => {
    setUnsavedChanges(true);
    setFormData(fn);
  };

  if (!formData) return <p className="p-6 text-center">Chargement…</p>;

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
              <SitePreview formData={formData} />
            </div>
          </div>
        </div>
      </div>
    </LiveWrapper>
  );
}
