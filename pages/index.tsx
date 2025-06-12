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
  const cleaned = data?.accueil?.SectionAProposDescription?.replace(/<br\s*\/?>/gi, '').trim();


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

<div className='flex flex-col m-8 sm:m-4 gap-15 max-w-2xl'>
        <h1 className="text-2xl lg:text-6xl font-bold text-prune tracking-tight leading-tight" style={{ color: 'var(--color-titreH1)' }}>
          {/* Titre H1 optimisé pour la sophrologie */}
          {data.accueil.titre || "Sophrologie : Retrouvez votre sérénité intérieure et votre équilibre"}
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl" style={{ color: 'var(--color-texte)' }}>
          {/* Texte d'accroche sophrologie */}
          {data.accueil.texte || "Découvrez la sophrologie, une méthode pour mieux gérer le stress, l'anxiété et les émotions, et renforcer votre bien-être au quotidien."}
        </p>
        <Link href={data.calendly} target="_blank" className="inline-block text-white py-3 px-6 rounded-full text-lg font-semibold shadow bg-color-primary hover:bg-purple-700 transition-colors duration-300 w-50"
         style={{ backgroundColor: 'var(--color-primary)' , color: 'var(--color-text-button)'}}>
          {data.accueil.bouton || 'Réserver une séance découverte'}
        </Link>
</div>
      </section>
<div className='flex items-center flex-col'>
      {/* Section À propos (CTA) */}
      <section className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl gap-4">
        {/* Titre H2 sophrologie */}
        <h2 className="text-3xl font-semibold text-prune mb-5" style={{ color: 'var(--color-titreH2)' }}>{data.accueil.SectionAProposTitre || "Mon approche en tant que sophrologue"}</h2>
         <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line mb-6" style={{ color: 'var(--color-texte)' }}
     dangerouslySetInnerHTML={{
  __html: cleaned
    ? data.accueil.SectionAProposDescription
    : `  <p>En tant que <strong>sophrologue certifié(e)</strong>, ma mission est de vous accompagner vers une meilleure connaissance de vous-même et un bien-être durable grâce à la <strong>sophrologie</strong>. Cette discipline psychocorporelle est une alliée précieuse pour naviguer les défis du quotidien, qu'ils soient liés au <strong>stress</strong>, à l'<strong>anxiété</strong>, aux <strong>troubles du sommeil</strong> ou à la <strong>gestion des émotions</strong>.</p>
         
         <p>La sophrologie combine des exercices de <strong>respiration contrôlée</strong>, de <strong>détente musculaire</strong> et de <strong>visualisation positive</strong>. Elle vise à harmoniser le corps et l'esprit, vous permettant de retrouver un <strong>équilibre intérieur</strong> et de mobiliser vos propres ressources. Mon approche est <strong>personnalisée</strong> et respecte votre rythme, vos besoins et votre histoire unique.</p>
         
         <p>Je vous propose un cheminement pour :
           <ul>
             <li>Mieux <strong>gérer le stress</strong> et ses manifestations.</li>
             <li>Apprivoiser l'<strong>anxiété</strong> et les crises de panique.</li>
             <li>Améliorer la <strong>qualité de votre sommeil</strong>.</li>
             <li>Renforcer la <strong>confiance en soi</strong> et l'estime de soi.</li>
             <li>Préparer sereinement des événements importants (examens, accouchement, prise de parole en public).</li>
             <li>Mieux vivre les périodes de <strong>changement</strong> ou de transition (deuil, séparation, reconversion).</li>
             <li>Développer une <strong>pensée positive</strong> et une meilleure concentration.</li>
           </ul>
         </p>
         
         <p>Chaque séance est un moment privilégié pour vous recentrer et vous reconnecter à vos sensations. Les techniques sont simples, accessibles à tous et peuvent être facilement intégrées à votre quotidien.</p>
       `
     }}
/>

<Link
  href="/about"
  className="inline-block mt-6 bg-prune text-white py-3 px-6 rounded-full text-lg font-semibold shadow hover:bg-purple-700 transition"
  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-button)' }}
>
  {data.accueil.SectionAProposCTA || '➤ En savoir plus sur la sophrologie'}
</Link>

        <img src={data.accueil.image || DEFAULT_IMAGE} alt="Illustration sophrologie, bien-être et relaxation" className="mx-auto rounded-xl shadow-xl w-80 h-[350px] object-fill" />
      </section>

      {/* Section Services */}
      <section id="services" className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl">
  {/* Titre H2 sophrologie */}
  <h2 className="text-3xl font-semibold text-prune mb-5" style={{ color: 'var(--color-titreH2)' }}>Mes accompagnements en sophrologie</h2>
  <p className="text-gray-700 text-lg leading-relaxed space-y-4 mb-6"
    style={{ color: 'var(--color-texte)' }}>
    Prendre soin de soi est un acte essentiel, mais souvent négligé. Dans un quotidien rythmé par le stress, les exigences professionnelles et la charge mentale, il devient crucial de se reconnecter à son corps, à son souffle et à ses besoins profonds. C’est précisément ce que je vous propose à travers mes **séances de sophrologie**. Que vous souffriez d’**anxiété**, de **troubles du sommeil**, de **fatigue chronique** ou que vous traversiez une période de transition personnelle, je vous offre un espace d’écoute, de bienveillance et de transformation par la **sophrologie**.
    <br /><br />
    Mes **programmes de sophrologie** sont conçus sur mesure pour répondre à vos objectifs personnels. Chaque séance combine des exercices de **relaxation dynamique** (mouvements doux associés à la respiration) et des techniques de **sophronisation** (visualisations guidées en état de conscience modifié). Vous apprendrez à :
    -   **Relâcher les tensions physiques et mentales**.
    -   **Gérer vos émotions** (colère, tristesse, peur) de manière constructive.
    -   Développer une meilleure **conscience corporelle**.
    -   Activer vos **capacités personnelles** (concentration, mémoire, créativité).
    -   Retrouver un **sommeil réparateur** et une meilleure énergie.
    -   **Prendre du recul** face aux situations difficiles.
    <br /><br />
    Parmi les thématiques fréquemment abordées dans mes accompagnements en sophrologie : la **préparation aux examens** ou entretiens, l'**accompagnement de la grossesse et de l'accouchement**, la **gestion de la douleur**, la **prévention du burn-out**, l'**amélioration de la performance sportive** ou artistique, et le soutien lors de **phases de deuil**.
    <br /><br />
    Je vous accueille en ligne ou en présentiel, dans un cadre calme, apaisant et confidentiel. Chaque séance dure entre 45 minutes et 1 heure, et peut être ponctuelle ou faire partie d’un suivi plus régulier, selon vos besoins. Vous restez totalement acteur ou actrice de votre démarche : je suis là pour vous guider, jamais pour vous imposer.
    <br /><br />
    Vous pouvez réserver un premier rendez-vous gratuit pour découvrir la sophrologie, poser vos questions et ressentir si le cadre vous convient. Ce premier échange est sans engagement. Mon objectif est de créer une relation de confiance, dans laquelle vous vous sentirez libre d’exprimer ce que vous vivez, sans jugement.
    <br /><br />
    N’attendez pas que le stress ou l'anxiété prennent toute la place dans votre vie. La **sophrologie** offre des outils simples, efficaces et respectueux pour retrouver un équilibre durable. Ensemble, faisons le premier pas vers votre **mieux-être global**.
  </p>


  <div className="text-center mt-6">
    <a
      href="/services"
      className="inline-block bg-prune text-white py-3 px-6 rounded-full text-lg font-semibold shadow hover:bg-purple-700 transition"
      style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
    >
      {/* CTA Services sophrologie */}
      ➤ Découvrir mes programmes de sophrologie
    </a>
  </div>
</section>


      {/* Section Témoignages (CTA) */}
      <section className="mb-16 bg-white p-8 rounded-xl shadow max-w-7xl">
        {/* Titre H2 témoignages sophrologie */}
        <h2 className="text-3xl font-semibold text-prune mb-5" style={{ color: 'var(--color-titreH2)' }}>Ils ont retrouvé la sérénité grâce à la sophrologie</h2>
        <p className="text-gray-700 leading-relaxed text-lg" style={{ color: 'var(--color-texte)' }}>
          Rien n’est plus authentique que le vécu de ceux qui ont franchi le pas. Derrière chaque témoignage, il y a un parcours, une rencontre avec un **sophrologue**, un changement significatif. Les personnes accompagnées évoquent souvent un apaisement durable, une meilleure **gestion du stress**, un regain d’énergie ou encore une reconnexion profonde à leur corps et leurs ressentis grâce aux **séances de sophrologie**.<br /><br />
          Ces récits sont précieux, car ils éclairent les bienfaits concrets que la **sophrologie** peut apporter. Vous y trouverez peut-être des échos à votre propre vécu, ou simplement l’élan nécessaire pour franchir la première étape de votre **cheminement sophrologique**.<br /><br />
          <Link href="/testimonials" className="text-prune underline font-medium" style={{ backgroundColor: 'var(--color-primary)' , color: 'var(--color-text-button)'}}>➤ Lire les témoignages sur la sophrologie</Link>
        </p>
      </section>

      {/* Section Contact (CTA) */}
      <section className="mb-16 bg-white p-8 rounded-xl shadow text-center max-w-7xl">
        {/* Titre H2 contact sophrologie */}
        <h2 className="text-3xl font-semibold text-prune mb-5" style={{ color: 'var(--color-titreH2)' }}>Prêt(e) à découvrir les bienfaits de la sophrologie ?</h2>
        <p className="text-gray-700 leading-relaxed text-lg max-w-3xl mx-auto" style={{ color: 'var(--color-texte)' }}>
          Prendre rendez-vous, ce n’est pas s’engager à tout changer, mais simplement se donner la possibilité d’explorer une autre voie. Que ce soit pour une **première séance de découverte en sophrologie** ou pour un **accompagnement sophrologique** plus approfondi avec votre **sophrologue**, vous êtes libre d’avancer à votre rythme.<br /><br />
          Parce que le bien-être n’attend pas, je vous offre la possibilité de réserver directement en ligne votre **séance de sophrologie**. 
        </p>
        <Link href="/contact" className="inline-block mt-6 bg-prune text-white py-3 px-6 rounded-full text-lg font-semibold shadow hover:bg-purple-700 transition" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
            {/* CTA contact sophrologie */}
            ➤ Réserver ma séance de sophrologie maintenant
        </Link>
      </section>
      </div>
</>
  );
}