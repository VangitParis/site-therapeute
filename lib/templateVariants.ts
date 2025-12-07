export type TemplateVariant = {
  layout?: Record<string, any>;
  theme?: Record<string, any>;
  accueil?: Record<string, any>;
  aPropos?: Record<string, any>;
  services?: Record<string, any>;
  testimonials?: Array<Record<string, any>>;
  testimonialsButton?: string;
  contact?: Record<string, any>;
  extras?: Record<string, any>;
};

export const TEMPLATE_VARIANTS: Record<string, TemplateVariant> = {
  psychologie: {
    layout: {
      nom: 'Cabinet Espace Psy',
      titre: 'Psychologue clinicienne',
      footer: '© 2025 Cabinet Espace Psy. Tous droits réservés.',
      liens: [
        { href: '/#about', label: 'Approche' },
        { href: '/#services', label: 'Accompagnements' },
        { href: '/#testimonials', label: 'Avis patients' },
        { href: '/#contact', label: 'Prendre RDV' },
      ],
    },
    theme: {
      background: '#f4f7fb',
      primary: '#2563eb',
      accent: '#dbeafe',
      texte: '#0f172a',
      textButton: '#ffffff',
      titreH1: '#0f172a',
      titreH2: '#1e3a8a',
      titreH3: '#1d4ed8',
    },
    accueil: {
      titre: 'Un cadre rassurant pour avancer sereinement',
      texte:
        'Je vous accueille avec bienveillance pour vous aider à comprendre vos émotions, dépasser vos blocages et retrouver un quotidien apaisé.',
      bouton: 'Planifier une consultation',
      image:
        'https://res.cloudinary.com/dwadzodje/image/upload/v1750155581/therapeutes/psychologie/psychology-office.webp',
      SectionAProposTitre: 'Approche psychologique humaniste & intégrative',
      SectionAProposDescription:
        '<p>Chaque accompagnement commence par une écoute active et la co-construction d’un cadre sécurisant. Nous explorons vos ressources, votre histoire et vos objectifs afin de vous proposer des outils adaptés : TCC, analyse des schémas, psychoéducation, exercices de respiration.</p>',
      SectionAProposCTA: 'Découvrir mon approche thérapeutique',
      SectionServicesTitre: 'Accompagnements proposés',
      SectionServicesDescription:
        '<p>Adultes, adolescents, couples et familles : je vous aide à traverser les étapes de vie sensibles (burn-out, anxiété, transitions, parentalité…). Les séances peuvent se dérouler au cabinet ou en visio sécurisée.</p>',
      SectionServicesCTA: 'Explorer les suivis psychologiques',
      SectionTestimonialsTitre: 'Ils ont retrouvé confiance',
      SectionTestimonialsDescription:
        '<p>Des parcours uniques, des avancées concrètes : apaisement, relations fluides, énergie retrouvée. Découvrez leurs témoignages.</p>',
      SectionTestimonialsCTA: 'Lire les témoignages patients',
      SectionContactTitre: 'Prenons rendez-vous',
      SectionContactDescription:
        '<p>Consultations sur rendez-vous au cabinet (Paris 11) ou en téléconsultation. Réponse sous 24h.</p>',
      SectionContactCTA: 'Planifier une première rencontre',
    },
    aPropos: {
      titre: 'Un accompagnement psychologique sur-mesure',
      texte:
        '<p>Psychologue clinicienne diplômée (Master II) et formée à différentes approches (TCC, ACT, psychologie positive), j’accompagne les adultes et adolescents en quête de clarté, de sérénité et d’outils concrets pour avancer.</p><p>Mon approche privilégie la compréhension globale de la personne : rythme de vie, émotions, mécanismes de pensées. Nous mettons en place des stratégies concrètes pour réduire l’anxiété, renforcer la confiance en soi et retrouver un équilibre durable.</p>',
    },
    services: {
      titre: 'Accompagnements proposés',
      liste: [
        '🧠 Consultations individuelles : gestion du stress, anxiété, hypersensibilité',
        '👥 Thérapie de couple et familiale : communication, soutien, médiation',
        '🎓 Psychoéducation : outils pratiques pour mieux comprendre son fonctionnement',
      ],
      image:
        'https://res.cloudinary.com/dwadzodje/image/upload/v1750155921/therapeutes/psychologie/psychology-session.webp',
    },
    testimonials: [
      {
        texte:
          'Approche très professionnelle et rassurante, j’ai avancé à mon rythme en me sentant écoutée.',
        auteur: '— Claire P.',
        stars: 5,
      },
      {
        texte: 'Des outils concrets et efficaces pour sortir du burn-out.',
        auteur: '— Julien M.',
        stars: 5,
      },
    ],
    testimonialsButton: 'Prendre un premier rendez-vous',
    contact: {
      titre: 'Cabinet Paris 11e & Téléconsultation',
      texte:
        'Consultations en présentiel ou en visio sécurisée. Rendez-vous du lundi au samedi.',
      bouton: 'Réserver une séance',
      image:
        'https://res.cloudinary.com/dwadzodje/image/upload/v1750156031/therapeutes/psychologie/psychologist-desk.webp',
      lien: 'mailto:contact@espace-psy.fr',
    },
  },
  coaching: {
    layout: {
      nom: 'Studio Impact Coaching',
      titre: 'Coach mindset & business',
      footer: '© 2025 Impact Coaching. Tous droits réservés.',
      liens: [
        { href: '/#about', label: 'Vision' },
        { href: '/#services', label: 'Programmes' },
        { href: '/#testimonials', label: 'Résultats' },
        { href: '/#contact', label: 'Appel découverte' },
      ],
    },
    theme: {
      background: '#fff9f5',
      primary: '#ef4444',
      accent: '#fee2e2',
      texte: '#111827',
      textButton: '#ffffff',
      titreH1: '#b91c1c',
      titreH2: '#dc2626',
      titreH3: '#ef4444',
    },
    accueil: {
      titre: 'Passez du doute à l’action',
      texte:
        'Programmes de coaching pour entrepreneurs, thérapeutes et coachs qui veulent clarifier leur vision, poser un plan concret et passer à l’action.',
      bouton: 'Réserver un appel découverte',
      image:
        'https://res.cloudinary.com/dwadzodje/image/upload/v1750156214/therapeutes/coaching/coaching-session.webp',
      SectionAProposTitre: 'Coaching mindset et stratégie',
      SectionAProposDescription:
        '<p>Diagnostic business, travail identitaire, routines de performance : nous activons les leviers mentaux et opérationnels qui te manquaient pour scaler. Chaque session se termine avec un plan d’action concret.</p>',
      SectionAProposCTA: 'Comprendre la méthodologie',
      SectionServicesTitre: 'Programmes signatures',
      SectionServicesDescription:
        '<p>Des parcours intensifs (1:1 et groupes) pour structurer ton offre, sécuriser tes revenus récurrents et communiquer avec assurance. Tous les outils sont inclus : templates sales, scripts, routines mindset.</p>',
      SectionServicesCTA: 'Consulter les offres de coaching',
      SectionTestimonialsTitre: 'Des résultats mesurables',
      SectionTestimonialsDescription:
        '<p>+45% de CA, repositionnements réussis, confiance retrouvée. Ces coachs et thérapeutes partagent leurs transformations.</p>',
      SectionTestimonialsCTA: 'Voir les études de cas',
      SectionContactTitre: 'Prêt(e) pour le prochain palier ?',
      SectionContactDescription:
        '<p>L’appel de 30 minutes permet d’identifier tes leviers de progression et de vérifier si l’un de mes programmes correspond à ta phase de croissance.</p>',
      SectionContactCTA: 'Réserver mon appel diagnostic',
    },
    aPropos: {
      titre: 'Une coach engagée pour vos résultats',
      texte:
        '<p>Ancienne directrice commerciale et coach certifiée, j’aide les entrepreneurs et praticiens à clarifier leur proposition de valeur, structurer leurs offres et communiquer avec confiance. J’allie mindset, stratégie business et routines de performance pour obtenir des résultats visibles.</p>',
    },
    services: {
      titre: 'Programmes signatures',
      liste: [
        '🚀 Booster ton offre : clarifier, structurer, positionner ton offre premium',
        '📈 Alignement & mindset : dépasser le perfectionnisme, gagner en assurance',
        '💼 Coaching business : stratégies de lancement, création de contenu, tunnel de vente',
      ],
      image:
        'https://res.cloudinary.com/dwadzodje/image/upload/v1750156310/therapeutes/coaching/coaching-working.webp',
    },
    testimonials: [
      {
        texte: 'En 3 mois, j’ai doublé mon CA et posé un plan clair pour mes offres.',
        auteur: '— Lila B.',
        stars: 5,
      },
      {
        texte: 'J’ai retrouvé de la clarté et du plaisir à communiquer sur mon activité.',
        auteur: '— Marco A.',
        stars: 5,
      },
    ],
    testimonialsButton: 'Demander le plan d’action',
    contact: {
      titre: 'Appel diagnostic offert',
      texte:
        '30 minutes pour auditer ton offre, identifier ce qui bloque et construire un plan précis.',
      bouton: 'Réserver un appel',
      image:
        'https://res.cloudinary.com/dwadzodje/image/upload/v1750156416/therapeutes/coaching/coach-call.webp',
      lien: 'https://calendly.com/impact-coaching/appel',
    },
  },
};

export function applyTemplateVariant(baseData: any, templateId?: string) {
  if (!templateId) return baseData;
  const variant = TEMPLATE_VARIANTS[templateId];
  if (!variant) return baseData;

  const clone = JSON.parse(JSON.stringify(baseData));

  const deepMerge = (target: any, source: any) => {
    if (!source) return target;
    Object.keys(source).forEach((key) => {
      const value = source[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        target[key] = deepMerge(target[key] ? { ...target[key] } : {}, value);
      } else {
        target[key] = value;
      }
    });
    return target;
  };

  return deepMerge(clone, { ...variant, templateId });
}
