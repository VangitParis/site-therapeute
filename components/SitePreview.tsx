import { useEffect, useRef } from 'react';

type Props = {
  formData: any;
  uid: string;
};

export default function SitePreview({ formData, uid }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!formData || !iframeRef.current) return;

    iframeRef.current.contentWindow?.postMessage(
      { type: 'UPDATE_FORMDATA', payload: formData },
      '*'
    );
  }, [formData]);

  const iframeSrc = `/?admin=true&uid=${uid}` || `/?admin=true`;

  return (
    <div className="relative w-full h-full">
      <div
        className="top-0 left-0 right-0 z-50 bg-yellow-100 text-yellow-800 text-sm text-center py-2 shadow"
        style={{ height: '40px' }}
      >
        ⚠️ Ceci est un aperçu en direct du site. Les modifications non sauvegardées peuvent être
        perdues.
      </div>

      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="w-full border-0"
        style={{ height: '100vh' }}
      />
    </div>
  );
}
