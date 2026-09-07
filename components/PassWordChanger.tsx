// components/PassWordChanger.tsx
//
// Désactivé intentionnellement (non rendu dans AdminSidebar.tsx) : l'ancienne
// version lisait config/admin et comparait bcrypt directement dans le
// navigateur, et écrivait le nouveau hash via le SDK client. Les règles
// Firestore interdisent déjà cette écriture (`config/{docId}: allow write:
// if false`), mais on retire aussi le code côté app pour ne plus jamais
// tenter un getDoc/bcrypt.compare côté client sur ce document.
//
// À réactiver uniquement une fois réécrit pour passer par une route serveur
// (ex. /api/admin-change-password) qui vérifie la session admin via le
// cookie httpOnly puis met à jour le hash avec firebase-admin.
function PasswordChanger() {
  return (
    <div className="mt-6 border-t pt-6 text-sm text-gray-500">
      🔧 Le changement de mot de passe admin est en cours de refonte (il passera
      bientôt par une route serveur sécurisée) — indisponible pour le moment.
    </div>
  );
}

export default PasswordChanger;
