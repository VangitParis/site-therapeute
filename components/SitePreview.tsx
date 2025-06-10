import { useEffect, useRef } from 'react';

type Props = {
  formData: any;
};

export default function SitePreview({ formData }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!formData || !iframeRef.current) return;

    iframeRef.current.contentWindow?.postMessage(
      { type: 'UPDATE_FORMDATA', payload: formData },
      '*'
    );
  }, [formData]);

  return (
    <div className="relative w-full h-full">
      {/* Bandeau jaune fixe */}
      <div
        className="top-0 left-0 right-0 z-50 bg-yellow-100 text-yellow-800  text-sm text-center py-2 shadow"
        style={{ height: '40px' }}
      >
        ⚠️ Ceci est un aperçu en direct du site. Les modifications non sauvegardées peuvent être perdues.
      </div>

      {/* Iframe avec espace réservé */}
      <iframe
        ref={iframeRef}
        src="/?admin=true"
         className="w-full border-0"
        style={{ height: '100vh' }}
      />
    </div>
  );
}