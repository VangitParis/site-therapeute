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

  console.log('[DOM] couleurs appliquées', theme);
};

export default function useLiveLayout() {
  const router = useRouter();
  const [layout, setLayout] = useState<any>(null);
  const [theme, setTheme] = useState<any>({});
  const hasReceivedMessage = useRef(false);
  const isPreview = router.query.admin === 'true';
  const uidParam = typeof router.query.uid === 'string' ? router.query.uid : null;

  useEffect(() => {
    let docId = 'fr';
    const unsubFns: (() => void)[] = [];

    const messageHandler = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_FORMDATA') {
        hasReceivedMessage.current = true;
        if (e.data.payload.layout) setLayout(e.data.payload.layout);
        if (e.data.payload.theme) {
          setTheme(e.data.payload.theme);
          applyThemeToDOM(e.data.payload.theme);
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
      }

      const ref = doc(db, 'content', docId);
      const unsub = onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        if (!hasReceivedMessage.current) {
          setTheme(data.theme || {});
          setLayout(data.layout || {});
          applyThemeToDOM(data.theme || {});
          console.log('📥 Firestore appliqué');
        } else {
          console.log('⏸ Firestore ignoré (mode admin)');
        }
      });

      unsubFns.push(unsub);
      window.addEventListener('message', messageHandler);
      unsubFns.push(() => window.removeEventListener('message', messageHandler));
    };

    init();
    return () => unsubFns.forEach((fn) => fn());
  }, [router.query]);

  return { layout, theme };
}
