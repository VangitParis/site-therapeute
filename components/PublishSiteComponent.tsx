import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebaseClient';
import { claimSlug } from '../lib/claimSlugClient';
import { slugify } from '../lib/slugify';

type DomainStatus = 'pending' | 'connected' | 'error' | null;

const REGISTRAR_HELP_LINKS = [
  {
    name: 'OVH',
    url: 'https://docs.ovhcloud.com/fr/guides/web-cloud/domains/dns-zone-edit',
  },
  {
    name: 'Gandi',
    url: 'https://docs.gandi.net/fr/noms_domaine/operations_courantes/enregistrements_dns.html',
  },
];

const PublishSiteComponent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  // Lien par défaut (site-therapeute.vercel.app/marie-dupont) — toujours
  // disponible, sans configuration de sa part. Modifiable (bouton "Modifier")
  // pour un nom de marque différent du nom personnel.
  const [slug, setSlug] = useState<string>('');
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugDraft, setSlugDraft] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState('');

  // Domaine personnalisé
  const [customDomain, setCustomDomain] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [domainStatus, setDomainStatus] = useState<DomainStatus>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) loadPublishStatus(currentUser.uid);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  const loadPublishStatus = async (uid: string): Promise<void> => {
    try {
      const userDoc = await getDoc(doc(db, 'clients', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsPublished(userData.isPublished || false);
        setCurrentDomain(userData.customDomain || '');
        setCustomDomain(userData.customDomain || '');
        setSlug(userData.slug || '');
      }
    } catch (err) {
      console.error('Erreur chargement statut:', err);
    }
  };

  const shareUrl = slug && typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : '';

  const handleGenerateSlug = async () => {
    if (!user) return;
    setGeneratingSlug(true);
    setError('');
    try {
      const displayName = user.displayName || user.email?.split('@')[0] || 'therapeute';
      const result = await claimSlug(user, { displayName });
      if (result.slug) {
        setSlug(result.slug);
      } else {
        setError(result.error || 'Impossible de créer le lien pour le moment, réessaie dans un instant.');
      }
    } finally {
      setGeneratingSlug(false);
    }
  };

  const handleStartEditSlug = () => {
    setSlugDraft(slug);
    setSlugError('');
    setEditingSlug(true);
  };

  const handleCancelEditSlug = () => {
    setEditingSlug(false);
    setSlugError('');
  };

  const handleSaveSlug = async () => {
    if (!user) return;
    const candidate = slugify(slugDraft);
    if (candidate === slug) {
      setEditingSlug(false);
      return;
    }
    setSavingSlug(true);
    setSlugError('');
    try {
      const result = await claimSlug(user, { customSlug: candidate });
      if (result.slug) {
        setSlug(result.slug);
        setEditingSlug(false);
      } else {
        setSlugError(result.error || 'Impossible de mettre à jour le lien.');
      }
    } finally {
      setSavingSlug(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Impossible de copier automatiquement — sélectionne et copie le lien à la main.');
    }
  };

  const validateDomain = (domain: string): boolean => {
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    return domainRegex.test(domain);
  };

  const addDomainToVercel = async (domain: string): Promise<any> => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/vercel/add-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du domaine à Vercel");
      }

      return await response.json();
    } catch (error: any) {
      // Ne pas remonter error.message (peut contenir une réponse brute de
      // l'API Vercel) — un message générique suffit, le détail reste en
      // console via le catch de handlePublishSite.
      throw new Error("Erreur lors de l'ajout du domaine à Vercel");
    }
  };

  const sendDNSInstructions = async (email: string, domain: string): Promise<void> => {
    try {
      await fetch('/api/vercel/send-dns-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domain, uid: user?.uid }),
      });
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }
  };

  const checkDomainStatus = useCallback(
    async (domain: string, { silent = false }: { silent?: boolean } = {}) => {
      if (!user || !domain) return;
      if (!silent) setCheckingStatus(true);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/vercel/domain-status?domain=${encodeURIComponent(domain)}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDomainStatus(data.status);
        }
      } catch (err) {
        console.error('Erreur vérification statut domaine:', err);
      } finally {
        if (!silent) setCheckingStatus(false);
      }
    },
    [user]
  );

  // Vérifie automatiquement toutes les 15s tant que ce n'est pas connecté —
  // la cliente n'a jamais besoin de nous demander "est-ce que j'ai bien fait ?".
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (isPublished && currentDomain && domainStatus !== 'connected') {
      checkDomainStatus(currentDomain, { silent: true });
      pollRef.current = setInterval(() => {
        checkDomainStatus(currentDomain, { silent: true });
      }, 15000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublished, currentDomain, domainStatus === 'connected']);

  const handlePublishSite = async (): Promise<void> => {
    if (!customDomain.trim()) {
      setError('Indique le nom de domaine que tu as acheté (ex : marie-dupont.fr)');
      return;
    }
    if (!validateDomain(customDomain)) {
      setError('Ce format ne ressemble pas à un nom de domaine valide (ex : mon-site.fr)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addDomainToVercel(customDomain);
      await updateDoc(doc(db, 'clients', user!.uid), {
        customDomain: customDomain.toLowerCase(),
        isPublished: true,
        publishedAt: new Date(),
        lastUpdated: new Date(),
      });

      if (user?.email) {
        await sendDNSInstructions(user.email, customDomain);
      }

      setIsPublished(true);
      setCurrentDomain(customDomain.toLowerCase());
      setDomainStatus('pending');
    } catch (error: any) {
      console.error('Erreur publication:', error);
      setError('Erreur lors de la connexion du domaine. Réessaie dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async (): Promise<void> => {
    if (!confirm('Retirer ce nom de domaine ? Ton site restera accessible via ton lien par défaut.'))
      return;

    setLoading(true);
    setError('');

    try {
      const idToken = await user?.getIdToken();
      await fetch('/api/vercel/remove-domain', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ domain: currentDomain }),
      });

      await updateDoc(doc(db, 'clients', user!.uid), {
        customDomain: '',
        isPublished: false,
        unpublishedAt: new Date(),
      });

      setIsPublished(false);
      setCurrentDomain('');
      setCustomDomain('');
      setDomainStatus(null);
    } catch (error) {
      console.error('Erreur dépublication:', error);
      setError('Erreur lors du retrait du domaine');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = () => {
    if (domainStatus === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          🟢 Connecté avec succès
        </span>
      );
    }
    if (domainStatus === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          🔴 Problème détecté
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
        🟡 En attente de connexion
      </span>
    );
  };

  if (loadingUser) {
    return (
      <div className="publish-section border border-gray-200 rounded-lg p-6 bg-white">
        <p className="text-center text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="publish-section space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* --- Lien par défaut, toujours disponible --- */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">🔗 Le lien de votre site</h3>
        <p className="text-sm text-gray-500 mb-4">
          C'est l'adresse à partager dès maintenant — par SMS, sur les réseaux, dans un e-mail. Elle
          fonctionne tout de suite, sans rien à configurer.
        </p>

        {slugError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-3">
            ⚠️ {slugError}
          </div>
        )}

        {shareUrl && !editingSlug && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 font-medium"
            />
            <button
              onClick={handleCopyLink}
              className="px-5 py-3 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
            >
              {copied ? '✅ Copié !' : '📋 Copier le lien'}
            </button>
            <button
              onClick={handleStartEditSlug}
              className="px-5 py-3 rounded-lg font-medium text-purple-700 border border-purple-300 hover:bg-purple-50 whitespace-nowrap"
            >
              ✏️ Modifier
            </button>
          </div>
        )}

        {shareUrl && editingSlug && (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                <span className="pl-4 pr-1 py-3 text-gray-500 text-sm whitespace-nowrap">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/
                </span>
                <input
                  type="text"
                  value={slugDraft}
                  onChange={(e) => setSlugDraft(e.target.value)}
                  autoFocus
                  className="flex-1 min-w-0 py-3 pr-3 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSaveSlug}
                disabled={savingSlug || !slugDraft.trim()}
                className="px-5 py-3 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
              >
                {savingSlug ? 'Enregistrement...' : '✅ Valider'}
              </button>
              <button
                onClick={handleCancelEditSlug}
                disabled={savingSlug}
                className="px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 whitespace-nowrap"
              >
                Annuler
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Lettres, chiffres et tirets uniquement. Modifiable au maximum une fois toutes les 24h,
              pour qu'un lien déjà partagé (carte de visite, etc.) ne change pas sans que tu le
              saches.
            </p>
          </div>
        )}

        {!shareUrl && (
          <button
            onClick={handleGenerateSlug}
            disabled={generatingSlug}
            className="px-5 py-3 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {generatingSlug ? 'Création du lien...' : '✨ Créer mon lien'}
          </button>
        )}
      </div>

      {/* --- Domaine personnalisé --- */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">🌐 Utiliser mon propre nom de domaine</h3>
        <p className="text-sm text-gray-500 mb-4">
          Vous avez déjà acheté un nom de domaine (chez OVH, Gandi, ou ailleurs) et voulez que votre
          site soit accessible depuis <strong>www.votre-nom.fr</strong> plutôt que le lien ci-dessus ?
          C'est optionnel — le lien par défaut fonctionne très bien sans ça.
        </p>

        {!isPublished ? (
          <div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                Votre nom de domaine
              </label>
              <input
                type="text"
                placeholder="mon-domaine.fr"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              />
            </div>

            <button
              onClick={handlePublishSite}
              disabled={loading || !customDomain.trim()}
              className="px-5 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
              {loading ? '⏳ Connexion...' : '🔌 Connecter mon domaine'}
            </button>

            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-medium mb-2">📝 Comment ça se passe :</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Achetez d'abord un nom de domaine chez un registraire (OVH, Gandi, etc.)</li>
                <li>Indiquez-le ci-dessus et cliquez sur "Connecter mon domaine"</li>
                <li>On vous donnera deux réglages précis à recopier chez votre registraire</li>
                <li>On vérifie automatiquement quand c'est bon — pas besoin de nous le demander</li>
              </ol>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <a
                href={`https://${currentDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-700 underline"
              >
                {currentDomain}
              </a>
              {statusBadge()}
              <button
                onClick={() => checkDomainStatus(currentDomain)}
                disabled={checkingStatus}
                className="text-sm text-gray-600 underline hover:text-gray-800 disabled:opacity-50"
              >
                {checkingStatus ? 'Vérification...' : '🔄 Vérifier maintenant'}
              </button>
            </div>

            {domainStatus !== 'connected' && (
              <div className="bg-gray-50 rounded-lg p-5 mb-4">
                <h4 className="font-medium text-gray-800 mb-3">
                  📋 Chez votre registraire, ajoutez ces deux réglages :
                </h4>

                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="font-mono text-sm mb-2">
                      Type <strong>A</strong> · Nom <strong>@</strong> · Valeur{' '}
                      <strong>76.76.19.61</strong>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ce réglage dit à Internet "quand quelqu'un tape{' '}
                      <strong>{currentDomain}</strong>, envoie-le vers notre hébergeur". C'est le
                      réglage pour l'adresse sans "www" devant.
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="font-mono text-sm mb-2">
                      Type <strong>CNAME</strong> · Nom <strong>www</strong> · Valeur{' '}
                      <strong>cname.vercel-dns.com</strong>
                    </div>
                    <p className="text-sm text-gray-600">
                      Un <strong>CNAME</strong> fait la même chose, mais pour l'adresse avec "www."
                      devant (<strong>www.{currentDomain}</strong>). Les deux réglages sont
                      nécessaires pour que les deux fonctionnent.
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-4">
                  ⏱️ Une fois ajoutés, ça peut prendre de quelques minutes à 24h pour être pris en
                  compte partout — le badge ci-dessus passera automatiquement sur "Connecté avec
                  succès" dès que ce sera bon, pas besoin de nous prévenir.
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="text-gray-500">Comment faire :</span>
                  {REGISTRAR_HELP_LINKS.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      chez {link.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleUnpublish}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? '⏳...' : '🗑️ Retirer ce domaine'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishSiteComponent;
