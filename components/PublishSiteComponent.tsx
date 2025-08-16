import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebaseClient';

const PublishSiteComponent: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [customDomain, setCustomDomain] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  // Gérer l'état de l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadPublishStatus(currentUser.uid);
      }
      setLoadingUser(false);
      //   à mettre ne place plus tard
      //   router.push('/paiement');
    });

    return () => unsubscribe();
  }, []);

  // Charger l'état actuel au montage du composant
  const loadPublishStatus = async (uid: string): Promise<void> => {
    try {
      const userDoc = await getDoc(doc(db, 'clients', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsPublished(userData.isPublished || false);
        setCurrentDomain(userData.customDomain || '');
        setCustomDomain(userData.customDomain || '');
      }
    } catch (error) {
      console.error('Erreur chargement statut:', error);
    }
  };

  const validateDomain = (domain: string): boolean => {
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    return domainRegex.test(domain);
  };

  const addDomainToVercel = async (domain: string): Promise<any> => {
    try {
      const response = await fetch(`/api/vercel/add-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, uid: user?.uid }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du domaine à Vercel");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Erreur Vercel: ${error.message}`);
    }
  };

  const sendDNSInstructions = async (email: string, domain: string): Promise<void> => {
    try {
      await fetch('/api/send-dns-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domain, uid: user?.uid }),
      });
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }
  };

  const handlePublishSite = async (): Promise<void> => {
    if (!customDomain.trim()) {
      setError('Veuillez entrer un nom de domaine');
      return;
    }
    if (!validateDomain(customDomain)) {
      setError('Format de domaine invalide (ex: mon-site.com)');
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
      setCurrentDomain(customDomain);
      alert(`🎉 Site publié avec succès ! Configurez maintenant le DNS de ${customDomain}`);
    } catch (error: any) {
      console.error('Erreur publication:', error);
      setError(error.message || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async (): Promise<void> => {
    if (!confirm('Êtes-vous sûr de vouloir dépublier votre site ?')) return;

    setLoading(true);
    setError('');

    try {
      await fetch('/api/vercel/remove-domain', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: currentDomain, uid: user?.uid }),
      });

      await updateDoc(doc(db, 'clients', user!.uid), {
        customDomain: '',
        isPublished: false,
        unpublishedAt: new Date(),
      });

      setIsPublished(false);
      setCurrentDomain('');
      setCustomDomain('');

      alert('Site dépublié avec succès');
    } catch (error) {
      console.error('Erreur dépublication:', error);
      setError('Erreur lors de la dépublication');
    } finally {
      setLoading(false);
    }
  };

  const getDNSInstructions = () => (
    <div
      className="dns-instructions"
      style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginTop: '15px' }}
    >
      <h4>📋 Instructions DNS pour {currentDomain}</h4>
      <p>
        <strong>Chez votre registraire de domaine, ajoutez :</strong>
      </p>
      <div
        style={{
          fontFamily: 'monospace',
          background: '#fff',
          padding: '10px',
          borderRadius: '4px',
        }}
      >
        <div>
          Type: <strong>A</strong> | Nom: <strong>@</strong> | Valeur: <strong>76.76.19.61</strong>
        </div>
        <div>
          Type: <strong>CNAME</strong> | Nom: <strong>www</strong> | Valeur:{' '}
          <strong>cname.vercel-dns.com</strong>
        </div>
      </div>
      <p>
        <small>⏱️ La propagation DNS peut prendre jusqu'à 24h</small>
      </p>
    </div>
  );

  // ✅ Rendu conditionnel pour le chargement utilisateur
  if (loadingUser) {
    return (
      <div
        className="publish-section"
        style={{
          border: '1px solid #e1e5e9',
          borderRadius: '8px',
          padding: '24px',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px',
            }}
          ></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="publish-section"
      style={{
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#ffffff',
      }}
    >
      <h3 style={{ marginBottom: '20px', color: '#2d3748' }}>🌐 Publier mon site</h3>

      {error && (
        <div
          style={{
            color: '#e53e3e',
            background: '#fed7d7',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {!isPublished ? (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nom de domaine :
            </label>
            <input
              type="text"
              placeholder="mon-domaine.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
              }}
            />
          </div>

          <button
            onClick={handlePublishSite}
            disabled={loading || !customDomain.trim()}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
            }}
          >
            {loading ? '⏳ Publication...' : '🚀 Publier mon site'}
          </button>

          <div
            style={{
              background: '#eff6ff',
              padding: '16px',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <p>
              <strong>📝 Instructions :</strong>
            </p>
            <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Achetez d'abord votre domaine chez un registraire</li>
              <li>Entrez le nom de domaine ci-dessus</li>
              <li>Cliquez sur "Publier mon site"</li>
              <li>Configurez le DNS selon les instructions</li>
            </ol>
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              background: '#d1fae5',
              padding: '16px',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            <p style={{ margin: 0, color: '#065f46' }}>
              ✅ <strong>Site publié :</strong>
              <a
                href={`https://${currentDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#059669', marginLeft: '8px' }}
              >
                {currentDomain}
              </a>
            </p>
          </div>

          {getDNSInstructions()}

          <button
            onClick={handleUnpublish}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#ef4444',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '16px',
            }}
          >
            {loading ? '⏳ Dépublication...' : '🗑️ Dépublier'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PublishSiteComponent;
