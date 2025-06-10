import { useEffect, useRef, useState } from 'react';
import { ImageUploadRef } from '../../components/ImageUploadField';
import { db } from '../../lib/firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AdminSidebar from '../../components/AdminSidebar';
import AdminAuth from '../../components/AdminAuth'
import SitePreview from '../../components/SitePreview';

const DEFAULT_THEME = {
  background: '#f4f0fa',
  primary: '#7f5a83',
  accent: '#e6f0ff',
  bgImage: '',
  titreH1 : '',
  titreH2 : '',
  titreH3 : '',
  texte : '',
  textButton : ''
};

export default function Live() {
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const defaultName = 'Marie Dupont';
  const imageFieldRef = useRef<ImageUploadRef>(null);
  const imageFieldAProposRef = useRef<ImageUploadRef>(null);
  const imageFieldBgRef = useRef<ImageUploadRef>(null);
  const imageFieldServicesRef = useRef<ImageUploadRef>(null);

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDoc(doc(db, 'content', 'fr'));
      if (snap.exists()) {
        const raw = snap.data();

         // 🔁 Migration live
  const services = raw.services || { titre: '', liste: [], image: '' };
  services.liste = services.liste.map((s: any) =>
    typeof s === 'string' ? { text: s, image: '' } : s
  );
        setFormData({
          layout: raw.layout || { nom: '', titre: '', footer: '', liens: [] },
          theme: raw.theme || DEFAULT_THEME,
          accueil: raw.accueil || { titre: '', texte: '', bouton: '', image: '', SectionAProposTitre : '', SectionAProposDescription : '', SectionAProposCTA : '' },
          aPropos: raw.aPropos || { titre: '', texte: '', image: ''},
          services: services,
          testimonials: raw.testimonials || [],
          calendly: raw.calendly || ''
        });
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const warnIfUnsaved = (e: BeforeUnloadEvent) => {
      if (!unsavedChanges) return;
      e.preventDefault();
      e.returnValue = 'Vous avez des modifications non sauvegardées.';
    };
    window.addEventListener('beforeunload', warnIfUnsaved);
    return () => window.removeEventListener('beforeunload', warnIfUnsaved);
  }, [unsavedChanges]);



  const handleSave = async () => {
    let updatedFormData = { ...formData };
 const currentName = formData.layout?.nom?.trim().toLowerCase() || '';

if (currentName === defaultName) {
  alert("Merci de personnaliser le nom de votre site avant de sauvegarder.");
  return;
}

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
   

    if (imageFieldBgRef.current?.hasPendingUpload()) {
      const uploaded = await imageFieldBgRef.current.upload();
      if (uploaded) {
        updatedFormData.theme.bgImage = uploaded;
      }
    }
    updatedFormData.services.liste = updatedFormData.services.liste.map((s: any) =>
    typeof s === 'string' ? { text: s, image: '' } : s
  );
  
    await setDoc(doc(db, 'content', 'fr'), updatedFormData);
    setMessage('✅ Sauvegarde réussie');
    setUnsavedChanges(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (!formData) return <p className="p-6 text-center">Chargement…</p>;

  const wrappedSetFormData = (fn: (prev: any) => any) => {
    setUnsavedChanges(true);
    setFormData(fn);
  };
  return (
    <AdminAuth>
    <div className="flex h-screen">
      {sidebarVisible && (
        <div className="w-[30%] min-w-[320px] border-r overflow-y-scroll relative">
          <AdminSidebar
            formData={formData}
            setFormData={wrappedSetFormData}
            imageFieldRef={imageFieldRef}
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
    </AdminAuth>
  );
}
