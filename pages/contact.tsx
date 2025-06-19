import { useEffect, useState } from 'react';
import { resolveDocId } from '../lib/resolveDocId';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { db } from '../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import TarifsCards from '../components/TarifsCards';

export default function Contact({ locale = 'fr' }) {
  const router = useRouter();
  const docId = resolveDocId(router, locale);
  const [data, setData] = useState({
    titre: '',
    texte: '',
    bouton: '',
    lien: '',
    image: '',
    titreH2: '',
    titreTarifs: '',
  });

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
    const isDev = router.query.frdev === '1';
    const uidParam = router.query.uid as string | undefined;
    const fetchData = async () => {
      const docId = isDev ? 'fr' : uidParam || locale;
      if (!docId) return;

      const ref = doc(db, 'content', docId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const raw = snap.data();
        const contact = raw.contact || {};
        setData({
          titre: contact.titre || 'Contact',
          texte: contact.texte || '',
          bouton: contact.bouton || 'Réserver une séance découverte',
          lien: contact.lien || 'https://calendly.com',
          image: contact.image || '',
          titreH2: contact.titreH2 || '',
          titreTarifs: contact.titreTarifs || '',
        });
        applyThemeToDOM(raw.theme);
      }
    };

    fetchData();

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_FORMDATA') {
        const updated = e.data.payload;
        setData({ ...updated.contact }); // ⚠️ Clonage nécessaire pour forcer le re-render
        applyThemeToDOM(updated.theme);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [locale, router.query]);

  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h1
          className="text-4xl font-bold text-center mb-6 text-prune"
          style={{ color: 'var(--color-titreH1)' }}
        >
          {data.titre}
        </h1>
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2
            className="text-3xl font-semibold mb-8 text-center"
            style={{ color: 'var(--color-titreH2)' }}
          >
            {data.titreTarifs || ''}
          </h2>
          <TarifsCards />
        </section>
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2
            className="text-3xl font-semibold mb-8 text-center"
            style={{ color: 'var(--color-titreH2)' }}
          >
            {data.titreH2 || ''}
          </h2>
          <div
            className="text-lg leading-relaxed text-center text-gray-700"
            style={{ color: 'var(--color-texte)' }}
            dangerouslySetInnerHTML={{
              __html: (data.texte || '').trim()
                ? data.texte
                : `
              <p>Vous souhaitez me contacter pour en savoir plus sur mes séances de sophrologie ?</p>
              <p>📧 Email : <a href="mailto:contact@masophro.fr" class="text-prune underline">contact@masophro.fr</a></p>
              <p>📞 Téléphone : <a href="tel:+33612345678" class="text-prune underline">06 12 34 56 78</a></p>
              <p>🗓️ Vous pouvez également réserver votre séance via le bouton ci-dessous.</p>
            `,
            }}
          />
          {data.lien && (
            <div className="text-center mt-8">
              <Link
                href={data.lien}
                target="_blank"
                className="inline-block bg-prune text-white py-3 px-6 rounded-full font-semibold shadow hover:bg-purple-700 transition"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-text-button)',
                }}
              >
                {data.bouton}
              </Link>
            </div>
          )}

          {data.image && (
            <img
              src={data.image}
              alt="Contact illustration"
              className="mx-auto mt-8 max-w-xs rounded shadow"
            />
          )}
          <label>Laissez-moi un message </label>
          <form
            className="max-w-xl mx-auto grid gap-4 text-left"
            style={{ color: 'var(--color-texte)' }}
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              alert('✅ Formulaire soumis (à connecter à un service réel)');
              form.reset();
            }}
          >
            <div>
              <label htmlFor="prenom" className="block font-semibold mb-1">
                Prénom *
              </label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                required
                pattern="^[A-Za-zÀ-ÿ' -]{2,30}$"
                title="Veuillez entrer un prénom valide (lettres uniquement)"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label htmlFor="email" className="block font-semibold mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label htmlFor="message" className="block font-semibold mb-1">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                minLength={10}
                maxLength={1000}
                className="w-full p-2 border rounded h-32"
              />
            </div>

            <button
              type="submit"
              className="bg-prune text-white py-2 px-6 rounded font-semibold hover:opacity-90 transition"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-button)',
              }}
            >
              Envoyer
            </button>
          </form>
        </section>
      </section>
    </div>
  );
}
