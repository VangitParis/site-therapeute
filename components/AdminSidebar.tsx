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

type Props = {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
  imageFieldRef: React.RefObject<ImageUploadRef>;
  imageFieldAProposRef: React.RefObject<ImageUploadRef>;
  imageFieldServicesRef: React.RefObject<ImageUploadRef>;
  imageFieldBgRef: React.RefObject<ImageUploadRef>;
  handleSave: () => void;
  message: string;
  onClose: () => void;
};

export default function AdminSidebar({
  formData,
  setFormData,
  imageFieldRef,
  imageFieldAProposRef,
  imageFieldServicesRef,
  imageFieldBgRef,
  handleSave,
  message,
  onClose
}: Props) {


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

      <p className="mb-4 text-sm text-orange-600">⚠️ N'oubliez pas de sauvegarder vos modifications.</p>

      <h2 className="text-xl font-bold text-indigo-700 text-center">⚙️ Administration</h2>

      <AccordionSection title="🎨 Personnalisation visuelle">
        <ThemePanel formData={formData} setFormData={setFormData} />
        <BackgroundImageUploader
          formData={formData}
          setFormData={setFormData}
          ref={imageFieldBgRef}
        />
      </AccordionSection>
      <AccordionSection title="🧩 En-tête et navigation">
  <LayoutEditor formData={formData} setFormData={setFormData} />
</AccordionSection>

      <AccordionSection title="🏠 Page d’accueil">
        <HomeContentEditor formData={formData} setFormData={setFormData} imageFieldRef={imageFieldRef} />
      </AccordionSection>

      <AccordionSection title="🏠 Page à Propos">
        <AboutContentEditor formData={formData} setFormData={setFormData} imageFieldAProposRef={imageFieldAProposRef}/>
      </AccordionSection>

      <AccordionSection title="🧘 Page Services">
        <ServicesEditor
  formData={formData}
  setFormData={setFormData} 
  imageFieldRef={imageFieldServicesRef}
/>

      </AccordionSection>

      <AccordionSection title="💬 Page Témoignages">
        <TestimonialsEditor formData={formData} setFormData={setFormData} />
      </AccordionSection>

      {/* <AccordionSection title="💬 Page Contact">
        <ContactEditor formData={formData} setFormData={setFormData} />
      </AccordionSection> */}

      <div className="pt-4">
        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white py-3 rounded hover:bg-indigo-700"
        >
          💾 Sauvegarder
        </button>
        {message && <p className="text-center text-green-600 mt-2 text-sm">{message}</p>}
      </div>
      <PasswordChanger />
    </div>
    

  );
}
