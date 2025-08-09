import nodemailer from 'nodemailer';
import xss from 'xss';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    let { name, email, phone, subject, message } = req.body;

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return res
        .status(500)
        .json({ message: 'Erreur de configuration du serveur.' });
    }

    if (!name || !email || !phone || !subject || !message || !recaptcha) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    // const recaptchaResponse = await fetch(
    //   `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptcha}`,
    //   { method: 'POST' }
    // );
    // const recaptchaData = await recaptchaResponse.json();

    // if (!recaptchaData.success) {
    //   return res
    //     .status(400)
    //     .json({ message: 'Échec de la vérification reCAPTCHA.' });
    // }

    name = xss(name);
    email = xss(email);
    phone = xss(phone);
    subject = xss(subject);
    message = xss(message);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
    const nameRegex = /^[a-zA-Z\s]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Adresse e-mail invalide.' });
    }
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Numéro de téléphone invalide.' });
    }
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        message: 'Le nom ne doit contenir que des lettres et des espaces.',
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Email destiné à vous-même
    const adminMailOptions = {
      from: email,
      to: 'vangitparis@gmail.com',
      subject: subject || 'Contact Form Submission',
      text: `Nom: ${name}\nE-mail: ${email}\nTéléphone: ${phone}\n\nMessage:\n${message}`,
    };

    // Email destiné à l'utilisateur
    const userMailOptions = {
      from: emailUser, // Votre adresse mail professionnelle
      to: email,
      subject: 'Confirmation de votre demande',
      text: `Bonjour ${name},\n\nNous avons bien reçu votre demande avec les détails suivants :\n\nNom : ${name}\nE-mail : ${email}\nTéléphone : ${phone}\nSujet : ${subject}\n\nMessage :\n${message}\n\nNotre équipe vous contactera dans les plus brefs délais.\n\nCordialement,\nL'équipe DevFashion`,
    };

    try {
      // Envoyer l'email à vous-même
      await transporter.sendMail(adminMailOptions);

      // Envoyer l'email à l'utilisateur
      await transporter.sendMail(userMailOptions);

      res.status(200).json({ message: 'Message envoyé avec succès.' });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email :", error);
      res.status(500).json({ message: "Erreur lors de l'envoi du message." });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
