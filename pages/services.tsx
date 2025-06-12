import { useEffect, useState } from 'react';
import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Slider from 'react-slick';

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

const DEFAULT_IMAGE = "https://res.cloudinary.com/dwadzodje/image/upload/v1749122784/ChatGPT_Image_5_juin_2025_13_25_10_qhgpa1.png";

export default function Services({ locale = 'fr' }) {
  const [data, setData] = useState({
    titre: 'Mes accompagnements',
    liste: [
      {
        text: "Relaxation profonde et recentrage émotionnel",
        image: "https://res.cloudinary.com/.../relaxation.webp"
      },
      {
        text: "Gestion du stress et des émotions",
        image: "https://res.cloudinary.com/.../stress.webp"
      },
      {
        text: "Amélioration du sommeil",
        image: ""
      }
    ],
    image: ''
  });

  const router = useRouter();
  const isPreview = router.query.admin === 'true';

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'content', locale);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const raw = snap.data();
        const services = raw.services || { titre: '', liste: [], image: '' };
        services.liste = services.liste.map((s: any) =>
          typeof s === 'string' ? { text: s, image: '' } : s
        );
        setData({ ...services });
      }
    };

    fetchData();

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_FORMDATA' && e.data.payload?.services) {
        const updated = e.data.payload.services;
        updated.liste = updated.liste.map((s: any) =>
          typeof s === 'string' ? { text: s, image: '' } : s
        );
        setData({ ...updated });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [locale]);

  if (!data) return <p>Chargement...</p>;

  return (
    <section
      id="services"
      className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl mx-auto"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <h2
        className="text-3xl font-semibold mb-5"
        style={{ color: 'var(--color-titreH2)' }}
      >
        {data.titre}
      </h2>

      <Slider {...settings}>
        {data.liste?.map((item, i) => (
          <div key={i} className="text-center text-lg p-6">
            <p className="italic mb-4" style={{ color: 'var(--color-texte)' }}>
              « {item.text} »
            </p>
            <img
              src={item.image || data.image || DEFAULT_IMAGE}
              alt={`Service ${i + 1}`}
              className="mx-auto rounded-xl shadow-xl w-100 max-w-[700px] h-[500px] object-cover"
            />
          </div>
        ))}
      </Slider>
    </section>
  );
}
