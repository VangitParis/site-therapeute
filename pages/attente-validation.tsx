// pages/attente-validation.tsx
import React from 'react';

export default function AttenteValidation() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 ">
      {/* Sablier animé */}
      <div className="mb-8">
        <svg
          className="w-20 h-20 animate-spin-alternate text-gray-700"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 2h12M6 22h12M6 2l6 7-6 7M18 2l-6 7 6 7"
          />
        </svg>
      </div>

      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">⏳ En attente de validation</h1>

      <p className="text-gray-700 max-w-lg mb-4 text-center">
        Merci d’avoir créé votre compte. Un administrateur doit maintenant valider votre accès.
      </p>

      <p className="text-gray-700 max-w-lg mb-6 text-center">
        La validation est effectuée sous <strong>24 heures</strong>. Vous recevrez un email ou une
        notification dès que votre site sera activé.
      </p>

      <style jsx>{`
        @keyframes spin-alternate {
          0% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(180deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        .animate-spin-alternate {
          animation: spin-alternate 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
