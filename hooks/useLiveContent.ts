import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';

const applyThemeToDOM = (theme: any) => {
  const root = document.documentElement;

  const set = (key: string, value?: string) => {
    if (value) root.style.setProperty(`--color-${key}`, value);
  };

  set('bg', theme?.background);
  set('primary', theme?.primary);
  set('accent', theme?.accent);
  set('texte', theme?.texte);
  set('text-button', theme?.textButton);
  set('titreH1', theme?.titreH1);
  set('titreH2', theme?.titreH2);
  set('titreH3', theme?.titreH3);
};

export default function useLiveContent(locale = 'fr') {
  const router = useRouter();
  const [content, setContent] = useState<any>(null);
  const hasReceivedMessage = useRef(false);
  const isPreview = router.query.admin === 'true';
  const uidParam = typeof router.query.uid === 'string' ? router.query.uid : null;

  useEffect(() => {
    let docId = 'fr';
    const unsubFns: (() => void)[] = [];

    const messageHandler = (e: MessageEvent) => {
      if (isPreview && e.data?.type === 'UPDATE_FORMDATA') {
        hasReceivedMessage.current = true;

        const payload = e.data.payload;
        const merged = { ...content, ...payload };

        setContent(merged);

        if (payload.theme) {
          applyThemeToDOM(payload.theme);
        }
      }
    };

    const init = async () => {
      if (uidParam) {
        docId = uidParam;
      } else if (isPreview) {
        await new Promise<void>((resolve) => {
          const unsub = onAuthStateChanged(auth, (user) => {
            if (user) docId = user.uid;
            unsub();
            resolve();
          });
        });
      } else {
        docId = locale;
      }

      const ref = doc(db, 'content', docId);
      const unsub = onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        if (!isPreview || !hasReceivedMessage.current) {
          setContent(data);
          if (data.theme) applyThemeToDOM(data.theme);
        }
      });

      unsubFns.push(unsub);
      window.addEventListener('message', messageHandler);
      unsubFns.push(() => window.removeEventListener('message', messageHandler));
    };

    init();
    return () => unsubFns.forEach((fn) => fn());
  }, [router.query]);

  return content;
}
