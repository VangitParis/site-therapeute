import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const filePath = path.join(process.cwd(), 'content.json');

  try {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Cas spécial : suppression d’image d’accueil
    if (req.body.deleteImage) {
      existing.fr.accueil.image = '';
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
      return res.status(200).json({ ok: true, message: 'Image supprimée du JSON' });
    }

    const updated = {
      ...existing,
      fr: {
        ...existing.fr,
        ...req.body.fr,
        accueil: {
          ...existing.fr.accueil,
          ...req.body.fr?.accueil
        },
        aPropos: {
          ...existing.fr.aPropos,
          ...req.body.fr?.aPropos
        },
        services: {
          ...existing.fr.services,
          ...req.body.fr?.services
        },
        layout: {
          ...existing.fr.layout,
          ...req.body.fr?.layout
        },
        // Ajoute d’autres sections si besoin
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur écriture JSON' });
  }
}
