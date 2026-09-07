import { useEffect, useRef, useState, useCallback } from 'react';
import { buildSitePreviewUrl } from '../lib/sitePreviewUrl';

type Props = {
  formData: Record<string, any> | null;
  uid?: string;
  isAdminDev?: boolean;
  hasUnsavedChanges?: boolean;
  onSave?: () => void;
};

export default function SitePreview({ formData, uid, isAdminDev, hasUnsavedChanges, onSave }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleIframeLoad = useCallback(() => {
    setIsIframeLoaded(true);

    // Injecter le script de protection de navigation
    try {
      const iframeDoc = iframeRef.current?.contentDocument;
      const iframeWindow = iframeRef.current?.contentWindow;

      if (iframeDoc && iframeWindow) {
        // Vérifier si le script n'est pas déjà injecté
        if (!iframeDoc.getElementById('admin-navigation-guard')) {
          const script = iframeDoc.createElement('script');
          script.id = 'admin-navigation-guard';
          script.textContent = `
            (function() {
              let navigationBlocked = false;
              console.log('🛡️ Admin navigation guard injecté sur:', window.location.href);
              
              // Intercepter tous les clics sur les liens
              document.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && link.href && !link.href.startsWith('#') && link.href !== window.location.href) {
                  console.log('🔗 Clic intercepté:', link.href);
                  e.preventDefault();
                  e.stopPropagation();
                  
                  try {
                    window.parent.postMessage({
                      type: 'NAVIGATION_ATTEMPT',
                      url: link.href,
                      currentPage: window.location.href
                    }, '*');
                    console.log('📤 Message envoyé au parent');
                  } catch (error) {
                    console.error('❌ Erreur:', error);
                  }
                }
              }, true);
              
              // Intercepter les formulaires GET
              document.addEventListener('submit', (e) => {
                const form = e.target;
                if (form.method.toLowerCase() === 'get') {
                  e.preventDefault();
                  const formData = new FormData(form);
                  const params = new URLSearchParams();
                  for (let [key, value] of formData.entries()) {
                    params.append(key, value);
                  }
                  const targetUrl = form.action + '?' + params.toString();
                  
                  try {
                    window.parent.postMessage({
                      type: 'NAVIGATION_ATTEMPT',
                      url: targetUrl,
                      currentPage: window.location.href
                    }, '*');
                  } catch (error) {
                    console.error('❌ Erreur:', error);
                  }
                }
              });
              
              // Écouter les messages du parent
              window.addEventListener('message', (event) => {
                if (event.data.type === 'UPDATE_FORMDATA') {
                  console.log('📝 Données reçues:', event.data.payload);
                  // Appliquer les changements visuels
                  applyFormDataToPage(event.data.payload);
                }
                
                if (event.data.type === 'PREVENT_NAVIGATION') {
                  navigationBlocked = true;
                  console.log('🚫 Navigation bloquée');
                }
                
                if (event.data.type === 'ALLOW_NAVIGATION') {
                  navigationBlocked = false;
                  console.log('✅ Navigation autorisée vers:', event.data.url);
                  if (event.data.url) {
                    window.location.href = event.data.url;
                  }
                }
              });
              
              // Fonction pour appliquer les changements visuels
              function applyFormDataToPage(data) {
                if (!data) return;
                
                Object.keys(data).forEach(key => {
                  // Chercher par data-field
                  const element = document.querySelector('[data-field="' + key + '"]');
                  if (element) {
                    if (element.tagName === 'IMG') {
                      element.src = data[key];
                    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                      element.value = data[key];
                    } else {
                      element.textContent = data[key];
                    }
                  }
                  
                  // Chercher par ID
                  const elementById = document.getElementById(key);
                  if (elementById) {
                    if (elementById.tagName === 'IMG') {
                      elementById.src = data[key];
                    } else if (elementById.tagName === 'INPUT' || elementById.tagName === 'TEXTAREA') {
                      elementById.value = data[key];
                    } else {
                      elementById.textContent = data[key];
                    }
                  }
                });
              }
              
              // Signaler que l'iframe est prête
              try {
                window.parent.postMessage({
                  type: 'IFRAME_READY',
                  page: window.location.href
                }, '*');
              } catch (error) {
                console.error('❌ Erreur:', error);
              }
            })();
          `;

          iframeDoc.head.appendChild(script);
          console.log("✅ Script injecté dans l'iframe");
        }
      }
    } catch (error) {
      console.log("❌ Impossible d'injecter le script (cross-origin):", error);
    }
  }, []);

  const iframeSrc = buildSitePreviewUrl({ uid, isAdminDev });

  // Envoi des données de formulaire à l'iframe
  useEffect(() => {
    if (formData && iframeRef.current && isIframeLoaded) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          { type: 'UPDATE_FORMDATA', payload: formData },
          '*'
        );
      } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
      }
    }
  }, [formData, isIframeLoaded]);

  // Gestion des messages de l'iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('🔄 Message reçu du parent:', event.data);

      // Vérification de l'origine pour plus de sécurité (optionnel)
      // if (event.origin !== window.location.origin) return;

      if (event.data.type === 'NAVIGATION_ATTEMPT') {
        console.log('🚨 Tentative de navigation détectée:', event.data.url);
        console.log('📝 Modifications non sauvegardées:', hasUnsavedChanges);

        if (hasUnsavedChanges) {
          setPendingNavigation(event.data.url);
          setShowSaveAlert(true);
          // Empêcher la navigation
          iframeRef.current?.contentWindow?.postMessage({ type: 'PREVENT_NAVIGATION' }, '*');
          console.log('🚫 Navigation bloquée');
        } else {
          // Autoriser la navigation immédiatement
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'ALLOW_NAVIGATION', url: event.data.url },
            '*'
          );
          console.log('✅ Navigation autorisée');
        }
      }

      // Autres types de messages possibles
      if (event.data.type === 'IFRAME_READY') {
        console.log('✅ Iframe prête:', event.data.page);
      }

      if (event.data.type === 'PAGE_UNLOADING') {
        console.log('📤 Page en cours de déchargement:', event.data.currentPage);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hasUnsavedChanges]);

  // Sauvegarder et continuer la navigation
  const handleSaveAndContinue = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave();

      // Autoriser la navigation vers l'URL en attente
      if (pendingNavigation) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'ALLOW_NAVIGATION', url: pendingNavigation },
          '*'
        );
      }

      // Fermer l'alerte
      setShowSaveAlert(false);
      setPendingNavigation(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // Optionnel : afficher une erreur à l'utilisateur
    } finally {
      setIsSaving(false);
    }
  }, [onSave, pendingNavigation]);

  // Continuer sans sauvegarder
  const handleContinueWithoutSaving = useCallback(() => {
    if (pendingNavigation) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'ALLOW_NAVIGATION', url: pendingNavigation },
        '*'
      );
    }

    setShowSaveAlert(false);
    setPendingNavigation(null);
  }, [pendingNavigation]);

  // Annuler la navigation
  const handleCancelNavigation = useCallback(() => {
    setShowSaveAlert(false);
    setPendingNavigation(null);
  }, []);

  // Gestion du raccourci clavier pour sauvegarder (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (hasUnsavedChanges && onSave) {
          onSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, onSave]);

  return (
    <div className="relative w-full h-full">
      {/* Alerte de sauvegarde */}
      {showSaveAlert && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              ⚠️ Modifications non sauvegardées
            </h3>
            <p className="mb-6 text-gray-600">
              Vous avez des modifications non sauvegardées qui seront perdues si vous changez de
              page. Que souhaitez-vous faire ?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSaveAndContinue}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '💾 Sauvegarde en cours...' : '💾 Sauvegarder et continuer'}
              </button>
              <button
                onClick={handleContinueWithoutSaving}
                disabled={isSaving}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                ⚠️ Continuer sans sauvegarder
              </button>
              <button
                onClick={handleCancelNavigation}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                ❌ Annuler
              </button>
            </div>
            {pendingNavigation && (
              <p className="mt-4 text-sm text-gray-500 break-all">
                <strong>Destination :</strong> {pendingNavigation}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Banner avec indicateur de modifications */}
      <div className="top-0 left-0 right-0 z-40 bg-yellow-100 text-yellow-800 text-sm text-center py-2 shadow flex items-center justify-center gap-2">
        ⚠️ Aperçu en direct du site
        {hasUnsavedChanges && (
          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
            🔸 Modifications non sauvegardées
          </span>
        )}
      </div>

      {/* Overlay de chargement */}
      {!isIframeLoaded && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center z-30"
          style={{ top: '40px' }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Chargement de l'aperçu...</p>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        onLoad={handleIframeLoad}
        className="w-full border-0"
        style={{ height: 'calc(100vh - 40px)' }}
        title="Aperçu du site"
        // Améliorer les performances et la sécurité
        loading="lazy"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      />
    </div>
  );
}
