// /pages/contact.js
'use client';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';
import { useState, ChangeEvent, FormEvent } from 'react';


export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    recaptcha: '',
  });

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    console.error(
      "La clé reCAPTCHA est manquante dans les variables d'environnement."
    );
  }

  const [statusMessage, setStatusMessage] = useState('');
  const [statusClass, setStatusClass] = useState('');
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRecaptchaChange = (value: string | null) => {
    setFormData({ ...formData, recaptcha: value || '' });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Vérifier si reCAPTCHA est rempli
    if (!formData.recaptcha) {
      setStatusMessage('Veuillez vérifier que vous êtes un humain.');
      setStatusClass('error');
      return;
    }

    // Validation du nom et du téléphone
    const nameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^[0-9\s\-\+\(\)]+$/;

    if (!nameRegex.test(formData.name)) {
      setStatusMessage(
        'Le nom ne doit contenir que des lettres et des espaces.'
      );
      setStatusClass('error');
      return;
    }

    if (!phoneRegex.test(formData.phone)) {
      setStatusMessage(
        'Le numéro de téléphone ne doit contenir que des chiffres et des symboles autorisés.'
      );
      setStatusClass('error');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage('Message envoyé avec succès');
        setStatusClass('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          recaptcha: '',
        });
      } else {
        setStatusMessage(result.message || "Erreur lors de l'envoi du message");
        setStatusClass('error');
      }
    } catch (error) {
      setStatusMessage("Erreur lors de l'envoi du message");
      setStatusClass('error');
    }
  };

  return (
    <>
      <Head>
        <title>Contact - SiteBuilder</title>
      </Head>
      
      <div className="form-container">
        <h4 className="xl:text-4xl lg:text-3xl text-2xl text-white">
          Envoyez-nous un e-mail
        </h4>
        <div className="grid lg:grid-cols-1">
          <form className="form" onSubmit={handleSubmit}>
            <div className="formGroup">
              <label htmlFor="name">Nom</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="email">Adresse e-mail</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="phone">Numéro de téléphone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="subject">Titre du projet</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="message">Détails du projet</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <div className="formGroup">
              {recaptchaSiteKey ? (
                <ReCAPTCHA
                  sitekey={recaptchaSiteKey}
                  onChange={handleRecaptchaChange}
                />
              ) : (
                <p>
                  Erreur : Clé reCAPTCHA manquante. Veuillez contacter
                  l'administrateur du site.
                </p>
              )}
            </div>
            <button type="submit" className="submitButton ">
              SOUMETTRE
            </button>
            <div className={`statusMessage text-xl ${statusClass}`}>
              {statusMessage && <p>{statusMessage}</p>}
            </div>
          </form>

          <div className="mx-auto text-white">
            <h4 className="xl:text-xl lg:text-lg text-md py-2">
              Informations de contact de l'Agence DevFashion
            </h4>
            <h6 className="xl:text-xl lg:text-lg text-md py-2">E-MAIL</h6>
            <Link href="mailto:vangitparis@gmail.com">
              contact@devfashion.fr
            </Link>
            {/* <h4 className="xl:text-xl lg:text-lg text-md">Téléphone</h4>
            <p>+33 6 09 15 61 15</p> */}
            <h6 className="xl:text-xl lg:text-lg text-md py-2">ADRESSE</h6>
            <p>Coubron, France</p>
          </div>
        </div>
      </div>
    </>
  );
}
