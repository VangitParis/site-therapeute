import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function Home({ locale = 'fr' }) {
  const DEFAULT_IMAGE = "https://res.cloudinary.com/dwadzodje/image/upload/v1749122784/ChatGPT_Image_5_juin_2025_13_25_10_qhgpa1.png";
  const [data, setData] = useState(null);
  const router = useRouter();
  const isPreview = router.query.admin === 'true';

  const applyThemeToDOM = (theme: any) => {
  const root = document.documentElement;
  if (theme?.background) root.style.setProperty('--color-bg', theme.background);
  if (theme?.primary) root.style.setProperty('--color-primary', theme.primary);
  if (theme?.accent) root.style.setProperty('--color-accent', theme.accent);
  if (theme?.texte) root.style.setProperty('--color-texte', theme.texte);
  if (theme?.texteButton) root.style.setProperty('--color-text-button', theme.texte);
  if (theme?.titreH1) root.style.setProperty('--color-titreH1', theme.titreH1);
  if (theme?.titreH2) root.style.setProperty('--color-titreH2', theme.titreH2);
  if (theme?.titreH3) root.style.setProperty('--color-titreH3', theme.titreH3);
  };
  
  useEffect(() => {
  const fetchData = async () => {
    const ref = doc(db, 'content', locale);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      setData(d);
      applyThemeToDOM(d.theme);
    }
  };

  fetchData();

  const handler = (e: MessageEvent) => {
    if (isPreview && e.data?.type === 'UPDATE_FORMDATA') {
      const updated = e.data.payload;
      setData({ ...updated }); // ⚠️ Clonage nécessaire pour forcer le re-render
      applyThemeToDOM(updated.theme);
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, [locale, isPreview]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-lavande">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 border-opacity-50"></div>
      </div>
    );
  }
 

const bgImageStyle = data?.theme?.bgImage
  ? {
      backgroundImage: `url(${data.theme.bgImage})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '0 12%',
      backgroundSize: 'cover',
    }
  : {};
  return (
  
<>
      {/* Section Accueil (inchangée) */}
      <section
  className="relative overflow-hidden py-24 px-6 md:px-24 mb-16"
  style={{
    ...bgImageStyle,
    height: '700px',
  }}
>

<div className='flex flex-col m-8 gap-15 max-w-2xl'>
        <h1 className="text-6xl font-bold text-prune tracking-tight leading-tight" style={{ color: 'var(--color-titreH1)' }}>
          {data.accueil.titre || "Prendre soin de soi, un pas à la fois"}
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl" style={{ color: 'var(--color-texte)' }}>
          {data.accueil.texte || "Découvrez des solutions naturelles pour retrouver calme, énergie et équilibre intérieur."}
        </p>
        <Link href={data.calendly} target="_blank" className="inline-block text-white py-3 px-6 rounded-full text-lg font-semibold shadow bg-color-primary hover:bg-purple-700 transition-colors duration-300 w-50"
         style={{ backgroundColor: 'var(--color-primary)' , color: 'var(--color-text-button)'}}>
          {data.accueil.bouton || 'Réserver une séance gratuite'}
        </Link>
</div>
      </section>
<div className='flex items-center flex-col'>
      {/* Section À propos (CTA) */}
      <section className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl">
        <h2 className="text-3xl font-semibold text-prune mb-5" style={{ color: 'var(--color-titreH2)' }}>{data.accueil.SectionAProposTitre || "Mieux comprendre mon approche"}</h2>
         <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line" style={{ color: 'var(--color-texte)' }}>
    {data.accueil.SectionAProposDescription || `La sophrologie, comme bien d’autres disciplines du bien-être, repose sur une alliance subtile entre le corps, l'esprit et la respiration. Elle permet à chacun de réapprendre à vivre le moment présent, à écouter ses besoins réels et à accueillir ses émotions sans jugement.

Que vous soyez dans une période de stress, de transition de vie, ou simplement à la recherche d’un ancrage quotidien, nos accompagnements vous permettent de vous recentrer.

Grâce à des outils concrets (exercices de respiration, visualisation, détente corporelle...), vous découvrirez comment retrouver une harmonie durable dans votre quotidien. Nos séances sont construites sur mesure, dans le respect de vos valeurs, de vos rythmes, et surtout de votre unicité.

Vous souhaitez mieux comprendre ma méthode, ma posture d’écoute ou ma philosophie ?`}
    <br /><br />
          <Link href="/about" className=" underline font-medium">
          <button className=' py-3 px-6 rounded-full text-lg shadow' style={{ backgroundColor: 'var(--color-primary)' , color: 'var(--color-text-button)'}}>{data.accueil.SectionAProposCTA || '➤ Découvrez mon approche en détail'}</button>
          </Link>
        </p>
        <img src={data.accueil.image || DEFAULT_IMAGE} alt="Illustration bien-être" className="mx-auto rounded-xl shadow-xl max-w-[300px]" />
      </section>

      {/* Section Services */}
      <section id="services" className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl">
  <h2 className="text-3xl font-semibold text-prune mb-5" style={{ color: 'var(--color-titreH2)' }}>Mes accompagnements</h2>
  <p className="text-gray-700 text-lg leading-relaxed space-y-4 mb-6"
    style={{ color: 'var(--color-texte)' }}>
    Prendre soin de soi est un acte essentiel, mais souvent négligé. Dans un quotidien rythmé par le stress, les exigences professionnelles et la charge mentale, il devient crucial de se reconnecter à son corps, à son souffle et à ses besoins profonds. C’est précisément ce que je vous propose à travers mes services d’accompagnement. Que vous souffriez d’anxiété, de troubles du sommeil, de fatigue chronique ou que vous traversiez une période de transition personnelle, je vous offre un espace d’écoute, de bienveillance et de transformation.
    <br /><br />
    Les techniques que j’utilise s’inspirent de la sophrologie, de la relaxation guidée, de la respiration consciente, de la visualisation positive et parfois même de l’auto-massage. Chaque séance est unique car elle est adaptée à vos besoins du moment. Il ne s’agit pas d’appliquer une méthode standard, mais de co-construire avec vous un accompagnement qui vous ressemble, à votre rythme.
    <br /><br />
    Parmi les thématiques fréquemment abordées dans mes accompagnements : gestion du stress, confiance en soi, accompagnement du burn-out, préparation mentale à un événement (prise de parole, examen, accouchement), équilibre émotionnel ou encore soutien dans les périodes de deuil ou de changement de vie.
    <br /><br />
    Je vous accueille en ligne ou en présentiel, dans un cadre calme, apaisant et confidentiel. Chaque séance dure entre 45 minutes et 1 heure, et peut être ponctuelle ou faire partie d’un suivi plus régulier. Vous restez totalement acteur ou actrice de votre démarche : je suis là pour vous guider, jamais pour vous imposer.
    <br /><br />
    Vous pouvez réserver un premier rendez-vous gratuit pour découvrir ma méthode, poser vos questions et ressentir si le cadre vous convient. Ce premier échange est sans engagement. Mon objectif est de créer une relation de confiance, dans laquelle vous vous sentirez libre d’exprimer ce que vous vivez, sans jugement.
    <br /><br />
    N’attendez pas que la douleur physique ou mentale prenne toute la place dans votre vie. Il existe des outils simples, efficaces et respectueux pour retrouver un équilibre durable. Ensemble, faisons le premier pas vers votre mieux-être.
  </p>


  <div className="text-center mt-6">
    <a
      href="/services"
      className="inline-block bg-prune text-white py-3 px-6 rounded-full text-lg font-semibold shadow hover:bg-purple-700 transition"
      style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
    >
      ➤ Découvrir tous les accompagnements
    </a>
  </div>
</section>


      {/* Section Témoignages (CTA) */}
      <section className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl">
        <h2 className="text-3xl font-semibold text-prune mb-5" style={{ color: 'var(--color-titreH2)' }}>Ils ont choisi de prendre soin d’eux</h2>
        <p className="text-gray-700 leading-relaxed text-lg" style={{ color: 'var(--color-texte)' }}>
          Rien n’est plus authentique que le vécu de ceux qui ont franchi le pas. Derrière chaque témoignage, il y a un parcours, une rencontre, un changement. Les personnes accompagnées évoquent souvent un apaisement durable, une meilleure gestion du stress, un regain d’énergie ou encore une reconnection profonde à leur corps et leurs ressentis. <br /><br />
          Ces récits sont précieux, car ils éclairent les bienfaits concrets que nos séances peuvent apporter. Vous y trouverez peut-être des échos à votre propre vécu, ou simplement l’élan nécessaire pour franchir la première étape. <br /><br />
          <Link href="/testimonials" className="text-prune underline font-medium" style={{ backgroundColor: 'var(--color-primary)' , color: 'var(--color-text-button)'}}>➤ Lire leurs expériences</Link>
        </p>
      </section>

      {/* Section Contact (CTA) */}
      <section className="mb-16 bg-white p-8 rounded-xl shadow text-center max-w-7xl">
        <h2 className="text-3xl font-semibold text-prune mb-5" style={{ color: 'var(--color-titreH2)' }}>Et si c’était le bon moment ?</h2>
        <p className="text-gray-700 leading-relaxed text-lg max-w-3xl mx-auto" style={{ color: 'var(--color-texte)' }}>
          Prendre rendez-vous, ce n’est pas s’engager à tout changer, mais simplement se donner la possibilité d’explorer une autre voie. Que ce soit pour une première séance de découverte ou pour un accompagnement plus approfondi, vous êtes libre d’avancer à votre rythme. <br /><br />
          Parce que le bien-être n’attend pas, nous vous offrons la possibilité de réserver directement en ligne. 
        </p>
        <Link href="/contact" className="inline-block mt-6 bg-prune text-white py-3 px-6 rounded-full text-lg font-semibold shadow hover:bg-purple-700 transition" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
    
            ➤ Prendre rendez-vous maintenant

        </Link>
      </section>
      </div>
</>
  );
}
