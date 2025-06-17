import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../lib/firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

  const imageFieldRef = useRef<ImageUploadRef>(null);
  const imageFieldAProposRef = useRef<ImageUploadRef>(null);
  const imageFieldTestimonialsRef = useRef<ImageUploadRef>(null);
  const imageFieldBgRef = useRef<ImageUploadRef>(null);
  const imageFieldServicesRef = useRef<ImageUploadRef>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      setUserLoaded(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userLoaded) return;

    const fetchData = async () => {
      const isAdmin = router.query.frdev === '1';
      let docId = 'fr';
      console.log('docId====', docId);
      if (!isAdmin) {
        const user = auth.currentUser;

        if (!user) {
          console.warn('❌ Aucun utilisateur connecté.');
          return;
        }
        docId = user.uid;
        console.log('docId====', docId);
      }

      try {
        const snap = await getDoc(doc(db, 'content', docId));
        console.log(snap);

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
      } catch (e) {
        console.error('❌ Erreur de chargement :', e);
      }
    };

    fetchData();
  }, [userLoaded, router.query]);

  const handleSave = async () => {
    if (!formData) return;
    const updatedFormData = { ...formData };

    const isDev = sessionStorage.getItem('admin_auth') === 'true' && router.query.frdev === '1';
    const currentUser = auth.currentUser;
    const docId = isDev ? currentUser?.uid : 'fr';
    console.log('docId====', docId);

    if (!docId) {
      console.error("❌ Impossible de déterminer l'UID.");
      return;
    }

    await setDoc(doc(db, 'content', docId), updatedFormData);
    setMessage('✅ Sauvegarde réussie');
    setUnsavedChanges(false);
    setTimeout(() => setMessage(''), 3000);
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
              <SitePreview formData={formData} />
            </div>
          </div>
        </div>
      </div>
    </LiveWrapper>
  );
}
