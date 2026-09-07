import nodemailer from 'nodemailer';
import { checkRateLimit, getClientIp } from '../../lib/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 5 envois / 10 minutes / IP : limite le spam via les identifiants SMTP du site.
  if (!checkRateLimit(`sendmail:${getClientIp(req)}`, 5, 10 * 60_000)) {
    return res.status(429).json({ error: 'Trop de messages envoyés, réessaie plus tard.' });
  }

  const { prenom, email, message } = req.body;

  if (!prenom || !email || !message) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  try {
    // Configure ton transporteur SMTP ici (exemple Gmail)
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER, // mettre dans .env.local
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Site Sophrologie" <${process.env.SMTP_USER}>`,
      to: 'contact@masophro.fr', // destination
      subject: `Nouveau message de ${prenom}`,
      text: `Prénom: ${prenom}\nEmail: ${email}\n\nMessage:\n${message}`,
      replyTo: email,
    });

    res.status(200).json({ message: 'Email envoyé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de l'envoi du mail" });
  }
}
