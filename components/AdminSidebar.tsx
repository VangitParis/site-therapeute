import { useState } from 'react';
import ThemePanel from './ThemePanel';
import BackgroundImageUploader from './BackgroundImageUploader';
import HomeContentEditor from './HomeContentEditor';
import AboutContentEditor from './AboutContentEditor';
import ServicesEditor from './ServicesEditor';
import TestimonialsEditor from './TestimonialsEditor';
import { ImageUploadRef } from './ImageUploadField';
import LayoutEditor from './LayoutEditor';
import AccordionSection from './AccordionSection';
import PasswordChanger from './PassWordChanger';
import ContactEditor from './ContactEditor';
import MentionsAdminEditor from './MentionsAdminEditor';
import AdminTarifsEditor from './AdminTarifsEditor';
import PublishSiteComponent from './PublishSiteComponent';

type Props = {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  isAdminDev?: boolean;
  imageFieldRef: React.RefObject<ImageUploadRef>;
  imageFieldAProposRef: React.RefObject<ImageUploadRef>;
  imageFieldTestimonialsRef: React.RefObject<ImageUploadRef>;
  imageFieldServicesRef: React.RefObject<ImageUploadRef>;
  imageFieldBgRef: React.RefObject<ImageUploadRef>;
  handleSave: () => void;
  message: string;
  onClose: () => void;
};

export default function AdminSidebar({
  formData,
  setFormData,
  isAdminDev,
  imageFieldRef,
  imageFieldAProposRef,
  imageFieldTestimonialsRef,
  imageFieldServicesRef,
  imageFieldBgRef,
  handleSave,
  message,
  onClose,
}: Props) {
  function InfoPreviewNote({ page }: { page: string }) {
    return (
      <p className="text-xs text-gray-600 mb-2">
        🔄 Pour voir l’aperçu de la page <strong>{page}</strong>, cliquez sur le lien correspondant
        dans la prévisualisation du site à droite.
      </p>
    );
  }

  return (
    <div className="p-4 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-xl text-gray-500 hover:text-black"
        >
          ✖
        </button>
      )}

      <p className="mb-4 text-sm text-orange-600">
        ⚠️ N'oubliez pas de sauvegarder vos modifications.
      </p>

      <h2 className="text-xl font-bold text-indigo-700 text-center">⚙️ Administration</h2>

      {/* Bien visible, jamais caché dans un accordéon replié : c'est ce
          qu'une cliente vient chercher en premier. N'a pas de sens pour le
          template admin (?frdev=1), qui n'est pas un vrai compte cliente. */}
      {!isAdminDev && (
        <div className="mb-4">
          <PublishSiteComponent />
        </div>
      )}

      <AccordionSection title="🧩 En-tête et navigation">
        <LayoutEditor formData={formData} setFormData={setFormData} />
        <MentionsAdminEditor formData={formData} setFormData={setFormData} />
      </AccordionSection>

      <AccordionSection title="🎨 Personnalisation visuelle">
        <ThemePanel formData={formData} setFormData={setFormData} />
        <BackgroundImageUploader
          formData={formData}
          setFormData={setFormData}
          ref={imageFieldBgRef}
        />
      </AccordionSection>

      <AccordionSection title="🏠 Page d’accueil">
        <HomeContentEditor
          formData={formData}
          setFormData={setFormData}
          imageFieldRef={imageFieldRef}
        />
      </AccordionSection>

      <AccordionSection title="🏠 Page à Propos">
        <InfoPreviewNote page="À propos" />
        <AboutContentEditor
          formData={formData}
          setFormData={setFormData}
          imageFieldAProposRef={imageFieldAProposRef}
        />
      </AccordionSection>

      <AccordionSection title="🧘 Page Services">
        <InfoPreviewNote page="Services" />
        <ServicesEditor
          formData={formData}
          setFormData={setFormData}
          imageFieldServicesRef={imageFieldServicesRef}
        />
      </AccordionSection>

      <AccordionSection title="💬 Page Témoignages">
        <InfoPreviewNote page="Témoignages" />
        <TestimonialsEditor
          formData={formData}
          setFormData={setFormData}
          imageFieldTestimonialsRef={imageFieldTestimonialsRef}
        />
      </AccordionSection>

      <AccordionSection title="💬 Page Contact & Tarifs">
        <InfoPreviewNote page="Contact" />
        <ContactEditor formData={formData} setFormData={setFormData} />
        <AdminTarifsEditor />
      </AccordionSection>

      <div className="pt-4">
        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white py-3 rounded hover:bg-indigo-700"
        >
          💾 Sauvegarder
        </button>
        {message && <p className="text-center text-green-600 mt-2 text-sm">{message}</p>}
      </div>
      {/* <PasswordChanger /> */}
    </div>
  );
}
