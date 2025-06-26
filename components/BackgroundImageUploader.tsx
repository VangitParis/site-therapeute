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
        <label className="block font-semibold mb-1">🌄 Image de fond</label>
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
