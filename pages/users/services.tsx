import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { db } from '../../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import Slider from 'react-slick';
import UserLink from '../../components/UserLinks';

const settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: false,
  autoplay: true,
  autoplaySpeed: 4000,
};

const DEFAULT_IMAGE =
  'https://res.cloudinary.com/dwadzodje/image/upload/v1750498096/assets/image_defaut.png';

export default function Services({ locale = 'fr' }: { locale?: string }) {
  const router = useRouter();
  const [data, setData] = useState<{
    titre: string;
    liste: any[];
    image: string;
    bouton: string;
  } | null>(null);

  const uid = router.query.uid as string;
  const isDev = router.query.frdev === '1';

  const applyThemeToDOM = (theme: any) => {
    const root = document.documentElement;
    if (theme?.background) root.style.setProperty('--color-bg', theme.background);
    if (theme?.primary) root.style.setProperty('--color-primary', theme.primary);
    if (theme?.accent) root.style.setProperty('--color-accent', theme.accent);
    if (theme?.texte) root.style.setProperty('--color-texte', theme.texte);
    if (theme?.textButton) root.style.setProperty('--color-text-button', theme.textButton);
    if (theme?.titreH1) root.style.setProperty('--color-titreH1', theme.titreH1);
    if (theme?.titreH2) root.style.setProperty('--color-titreH2', theme.titreH2);
    if (theme?.titreH3) root.style.setProperty('--color-titreH3', theme.titreH3);
    console.log('[Live] 🎨 Thème appliqué', theme);
  };

  useEffect(() => {
    const fetchData = async () => {
      const docId = isDev ? 'fr' : uid || locale;
      const ref = doc(db, 'content', docId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const raw = snap.data();
        const services = raw.services || { titre: '', liste: [], image: '', bouton: '' };
        services.liste = services.liste.map((s: any) =>
          typeof s === 'string' ? { text: s, image: '' } : s
        );
        setData(services);
        applyThemeToDOM(raw.theme);
      }
    };

    fetchData();

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_FORMDATA' && e.data.payload?.services) {
        const updated = e.data.payload;
        const services = updated.services || { titre: '', liste: [], image: '' };
        services.liste = services.liste.map((s: any) =>
          typeof s === 'string' ? { text: s, image: '' } : s
        );
        setData(services);
        console.log('image recue===', services.image);

        applyThemeToDOM(updated.theme);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [locale, isDev, uid]);

  if (!data) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-prune border-opacity-50" />
      </div>
    );
  }

  return (
    <section
      id="services"
      className="mb-16 bg-white p-8 rounded-xl  max-w-7xl mx-auto text-center gap-8"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <h1
        className="text-3xl font-semibold mb-5 text-center"
        style={{ color: 'var(--color-titreH1)' }}
      >
        {data.titre || ''}
      </h1>

      {data.liste?.length ? (
        <Slider {...settings} className="mb-12">
          {data.liste.map((item, i) => (
            <div key={i} className="text-center text-lg p-6">
              <p className="italic mb-4" style={{ color: 'var(--color-texte)' }}>
                « {item.text} »
              </p>
              <img
                src={item.image?.trim() || DEFAULT_IMAGE}
                alt={`Service ${i + 1}`}
                className="mx-auto rounded-xl shadow-xl w-full max-w-[90%] sm:max-w-[600px] h-auto aspect-video object-cover object-[75%_15%]"
              />
            </div>
          ))}
        </Slider>
      ) : (
        <p className="text-center text-gray-500 italic">Aucun service défini pour le moment.</p>
      )}

      <UserLink
        href="/users/contact"
        uid={uid}
        isDev={isDev}
        className="flex-1 text-white py-3 px-6 rounded-full text-lg font-semibold shadow transition duration-300 hover:brightness-90"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-button)',
        }}
      >
        {data.bouton || ''}
      </UserLink>
    </section>
  );
}
