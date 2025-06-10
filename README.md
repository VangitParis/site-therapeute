# Site Thérapeute - Installation

## 🔧 Prérequis

- Node.js v20 (utilisez NVM : https://github.com/nvm-sh/nvm)
- npm (installé avec Node)
- Vercel CLI (facultatif, pour déploiement)

## ⚙️ Installation

```bash
nvm use
npm install
npm run dev
```

Accédez à `http://localhost:3000`

## 🔐 Interface admin

- URL : http://localhost:3000/admin?auth=admin123
- Vous pouvez modifier le contenu dynamique (textes, image, lien Calendly)
- Le contenu est stocké dans `content.json`

## 🌐 Multilingue

- Français (par défaut) et Anglais activé
- Contenu dans `content.json` (clé `fr` et `en`)

## 📦 Déploiement

- Hébergeable gratuitement sur https://vercel.com# site-therapeute
