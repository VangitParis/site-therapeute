import { forwardRef } from 'react';
import ImageUploadField, { ImageUploadRef } from './ImageUploadField';

type Props = {
  formData: any;
  setFormData: (fn: (prev: any) => any) => void;
};

const BackgroundImageUploader = forwardRef<ImageUploadRef, Props>(
  ({ formData, setFormData }, ref) => {
    const safeFolderName = (formData.layout?.nom || 'default').replace(/\s+/g, '_').toLowerCase();
    const handleUpload = (url: string) => {
      setFormData((prev) => ({
        ...prev,
        theme: { ...prev.theme, bgImage: url },
      }));
    };

    return (
      <div className="mt-6">
        <label className="block text-lg font-semibold text-gray-800 mb-2">🌄 Image de fond</label>

        <div className="text-sm text-gray-600 mb-4 flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">ℹ️</span>
          <p>
            Choisissez une image de fond qui vous représente ou qui illustre votre passion. Préférez
            une image <strong>sobre et épurée</strong> pour assurer la lisibilité du titre.
          </p>
        </div>

        <ImageUploadField
          ref={ref}
          label="Uploader une image"
          value={formData.theme?.bgImage}
          folderName={safeFolderName}
          sectionName="background"
          onUpload={handleUpload}
        />
      </div>
    );
  }
);

export default BackgroundImageUploader;
