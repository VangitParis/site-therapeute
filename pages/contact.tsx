'use client';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';
import { useState, ChangeEvent, FormEvent } from 'react';

export default function Contact() {
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
    console.error("La clé reCAPTCHA est manquante dans les variables d'environnement.");
  }

  const [statusMessage, setStatusMessage] = useState('');
  const [statusClass, setStatusClass] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecaptchaChange = (value: string | null) => {
    setFormData((prev) => ({ ...prev, recaptcha: value || '' }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.recaptcha) {
      setStatusMessage('Veuillez vérifier que vous êtes un humain.');
      setStatusClass('text-red-600');
      return;
    }

    const nameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^[0-9\s\-\+\(\)]+$/;

    if (!nameRegex.test(formData.name)) {
      setStatusMessage('Le nom ne doit contenir que des lettres et des espaces.');
      setStatusClass('text-red-600');
      return;
    }

    if (!phoneRegex.test(formData.phone)) {
      setStatusMessage(
        'Le numéro de téléphone ne doit contenir que des chiffres et des symboles autorisés.'
      );
      setStatusClass('text-red-600');
      return;
    }

    try {
      const response = await fetch('/pages/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage('Message envoyé avec succès');
        setStatusClass('text-green-600');
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
        setStatusClass('text-red-600');
      }
    } catch {
      setStatusMessage("Erreur lors de l'envoi du message");
      setStatusClass('text-red-600');
    }
  };

  return (
    <>
      <Head>
        <title>Contact - SiteBuilder Team</title>
      </Head>
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center gap-8">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg">
            <div className="mb-6">
              <label htmlFor="name" className="block mb-2 font-medium text-gray-700">
                Nom
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block mb-2 font-medium text-gray-700">
                Adresse e-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="phone" className="block mb-2 font-medium text-gray-700">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="subject" className="block mb-2 font-medium text-gray-700">
                Titre du projet
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block mb-2 font-medium text-gray-700">
                Détails du projet
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
            </div>

            {/* <div className="mb-6">
              {recaptchaSiteKey ? (
                <ReCAPTCHA sitekey={recaptchaSiteKey} onChange={handleRecaptchaChange} />
              ) : (
                <p className="text-red-600">
                  Erreur : Clé reCAPTCHA manquante. Veuillez contacter l'administrateur du site.
                </p>
              )}
            </div> */}

            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-md transition-colors duration-300"
            >
              SOUMETTRE
            </button>

            {statusMessage && (
              <p className={`mt-4 text-center text-lg ${statusClass}`}>{statusMessage}</p>
            )}
          </form>
        </div>
      </main>
    </>
  );
}
