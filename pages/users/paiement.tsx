// pages/paiement.tsx

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PaiementPage() {
  const router = useRouter();
  const isPromo = router.query.promo === '1';

  const standardLink = 'https://py.pl/1nWRFX'; // 1250 € http://localhost:3000/paiement
  const promoLink = 'https://py.pl/2CYNA6q3Y98'; // 150 € http://localhost:3000/paiement?promo=1?

  return (
    <>
      <Head>
        <title>Commande – Site vitrine clé en main</title>
        <meta
          name="description"
          content="Commande de site vitrine clé en main pour thérapeutes. Paiement sécurisé via PayPal."
        />
      </Head>

      <main className="min-h-screen bg-primary-50 px-4 py-12 flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">🔒 Commande de votre site vitrine</h1>

        <p className="mb-6 max-w-2xl text-gray-700">
          Obtenez un site professionnel, élégant et prêt à l’emploi, livré sous 48h. Design épuré,
          contenu optimisé pour thérapeutes, formulaire de contact, et zéro technique à gérer.
        </p>

        <div className="bg-white p-6 rounded shadow max-w-md w-full mb-8">
          <h2 className="text-xl font-semibold mb-4">Site vitrine clé en main</h2>
          <p className="text-gray-700 mb-2">✅ Livraison sous 48h</p>
          <p className="text-gray-700 mb-2">✅ Personnalisation incluse</p>
          <p className="text-gray-700 mb-4">✅ Zéro abonnement, 100% à vous</p>

          <p className="text-lg font-bold mb-6">
            Prix : {isPromo ? '🎉 150 € (promo -88%)' : '1250 €'}
          </p>

          <a
            href={isPromo ? promoLink : standardLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-indigo-600 text-white py-3 rounded hover:bg-indigo-700 transition"
          >
            💳 Payer avec PayPal
          </a>
        </div>

        <p className="text-sm text-gray-500">
          Après paiement, un formulaire vous sera envoyé pour personnaliser votre site.
        </p>

        <Link href="/" className="mt-6 text-indigo-600 hover:underline text-sm">
          ⬅ Retour à l’accueil
        </Link>
      </main>
    </>
  );
}
