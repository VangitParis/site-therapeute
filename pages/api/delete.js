import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { public_id } = req.body;

  if (!public_id) {
    return res.status(400).json({ error: 'public_id manquant' });
  }

  try {
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== 'ok') {
      return res.status(400).json({ error: '❌ Échec Cloudinary', details: result });
    }

    // 🔁 Lecture du fichier JSON
    const filePath = path.join(process.cwd(), 'content.json');
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // 🔍 Extraction du public_id actuel depuis content.fr.accueil.image
    const currentUrl = content?.fr?.accueil?.image || '';
    const match = currentUrl.match(/upload\/(?:v\d+\/)?(.+)\.(webp|jpg|jpeg|png|gif)/i);
    const currentPublicId = match?.[1];

    if (currentPublicId === public_id) {
      content.fr.accueil.image = '';
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    }

    return res.status(200).json({ message: '✅ Supprimé Cloudinary + content.json' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '❌ Erreur serveur', details: error });
  }
}
