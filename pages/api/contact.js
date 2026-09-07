import nodemailer from 'nodemailer';
import xss from 'xss';
import { checkRateLimit, getClientIp } from '../../lib/rateLimit';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    // 5 envois / 10 minutes / IP : limite le spam, en plus du reCAPTCHA.
    if (!checkRateLimit(`contact:${getClientIp(req)}`, 5, 10 * 60_000)) {
      return res.status(429).json({ message: 'Trop de messages envoyés, réessaie plus tard.' });
    }

    let { name, email, phone, subject, message, recaptcha } = req.body;

    // Même compte Gmail que /api/sendmail — inutile de dupliquer les
    // identifiants dans deux variables d'environnement différentes
    // (EMAIL_USER/EMAIL_PASS n'ont jamais été configurées).
    const emailUser = process.env.SMTP_USER;
    const emailPass = process.env.SMTP_PASS;

    if (!emailUser || !emailPass) {
      return res.status(500).json({ message: 'Erreur de configuration du serveur.' });
    }

    if (!name || !email || !phone || !subject || !message || !recaptcha) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    if (!process.env.RECAPTCHA_SECRET_KEY) {
      console.error('contact.js: RECAPTCHA_SECRET_KEY manquant');
      return res.status(500).json({ message: 'Erreur de configuration du serveur.' });
    }

    try {
      const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptcha,
        }),
      });
      const recaptchaData = await recaptchaResponse.json();

      if (!recaptchaData.success) {
        return res.status(400).json({ message: 'Échec de la vérification reCAPTCHA.' });
      }
    } catch (err) {
      console.error('contact.js: erreur de vérification reCAPTCHA', err);
      return res.status(400).json({ message: 'Échec de la vérification reCAPTCHA.' });
    }

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
