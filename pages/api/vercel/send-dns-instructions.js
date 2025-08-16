import nodemailer from 'nodemailer'; // npm install nodemailer

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, domain, uid } = req.body;

  if (!email || !domain) {
    return res.status(400).json({ error: 'Email and domain required' });
  }

  try {
    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Votre site est prêt à être publié !</h2>
        <p>Bonjour,</p>
        <p>Votre site pour le domaine <strong>${domain}</strong> a été configuré avec succès.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>📋 Configuration DNS requise</h3>
          <p>Connectez-vous à votre registraire de domaine et ajoutez ces enregistrements :</p>
          <div style="background: #fff; padding: 15px; border-radius: 4px; font-family: monospace;">
            <div><strong>Type:</strong> A &nbsp;&nbsp; <strong>Nom:</strong> @ &nbsp;&nbsp; <strong>Valeur:</strong> 76.76.19.61</div>
            <div><strong>Type:</strong> CNAME &nbsp;&nbsp; <strong>Nom:</strong> www &nbsp;&nbsp; <strong>Valeur:</strong> cname.vercel-dns.com</div>
          </div>
        </div>
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px;">
          <p><strong>⏱️ Important :</strong></p>
          <ul>
            <li>La propagation DNS peut prendre jusqu'à 24 heures</li>
            <li>Votre site sera accessible à l'adresse : <a href="https://${domain}">${domain}</a></li>
            <li>Un certificat SSL sera automatiquement généré</li>
          </ul>
        </div>
        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        <p>Bonne continuation !<br>L'équipe Support</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@votresite.com',
      to: email,
      subject: `Instructions DNS pour ${domain}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Instructions DNS envoyées à ${email} pour ${domain}`);

    return res.status(200).json({
      success: true,
      message: 'Instructions envoyées par email'
    });

  } catch (error) {
    console.error('Erreur envoi email:', error);
    // Non bloquant - on retourne succès même si email échoue
    return res.status(200).json({
      success: true,
      message: 'Email non envoyé mais domain configuré'
    });
  }
}
