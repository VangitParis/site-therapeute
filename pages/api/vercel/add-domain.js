// pages/api/vercel/add-domain.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain, uid } = req.body;

  if (!domain || !uid) {
    return res.status(400).json({ error: 'Domain and UID required' });
  }

  try {
    // Variables d'environnement à ajouter dans Vercel
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

    if (!VERCEL_TOKEN || !PROJECT_ID) {
      throw new Error('Variables d\'environnement Vercel manquantes');
    }

    // 1. Vérifier si le domaine existe déjà
    const checkResponse = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains`,
      {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
        },
      }
    );

    if (checkResponse.ok) {
      const existingDomains = await checkResponse.json();
      const domainExists = existingDomains.domains?.some(d => d.name === domain);
      
      if (domainExists) {
        return res.status(400).json({ 
          error: 'Ce domaine est déjà utilisé' 
        });
      }
    }

    // 2. Ajouter le domaine à Vercel
    const addResponse = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: domain.toLowerCase(),
          // Optionnel: Ajouter des métadonnées
          gitBranch: null
        }),
      }
    );

    if (!addResponse.ok) {
      const error = await addResponse.json();
      throw new Error(error.error?.message || 'Erreur lors de l\'ajout du domaine');
    }

    const result = await addResponse.json();

    // 3. Log pour debugging (optionnel)
    console.log(`Domaine ${domain} ajouté pour UID: ${uid}`);

    return res.status(200).json({
      success: true,
      domain: domain,
      uid: uid,
      vercelResponse: result
    });

  } catch (error) {
    console.error('Erreur API add-domain:', error);
    return res.status(500).json({
      error: error.message || 'Erreur interne du serveur'
    });
  }
}

// pages/api/vercel/remove-domain.js
export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain, uid } = req.body;

  if (!domain || !uid) {
    return res.status(400).json({ error: 'Domain and UID required' });
  }

  try {
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

    if (!VERCEL_TOKEN || !PROJECT_ID) {
      throw new Error('Variables d\'environnement Vercel manquantes');
    }

    // Supprimer le domaine de Vercel
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erreur lors de la suppression');
    }

    console.log(`Domaine ${domain} supprimé pour UID: ${uid}`);

    return res.status(200).json({
      success: true,
      domain: domain,
      uid: uid
    });

  } catch (error) {
    console.error('Erreur API remove-domain:', error);
    return res.status(500).json({
      error: error.message || 'Erreur interne du serveur'
    });
  }
}

// pages/api/send-dns-instructions.js
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
    // Configuration email (ajustez selon votre provider)
    const transporter = nodemailer.createTransporter({
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
        
        <p>Votre site pour le domaine <strong>${domain}</strong> a été configuré avec succès sur notre plateforme.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>📋 Configuration DNS requise</h3>
          <p>Connectez-vous à votre registraire de domaine et ajoutez ces enregistrements :</p>
          
          <div style="background: #fff; padding: 15px; border-radius: 4px; font-family: monospace;">
            <div><strong>Type:</strong> A &nbsp;&nbsp;&nbsp; <strong>Nom:</strong> @ &nbsp;&nbsp;&nbsp; <strong>Valeur:</strong> 76.76.19.61</div>
            <div><strong>Type:</strong> CNAME &nbsp;&nbsp;&nbsp; <strong>Nom:</strong> www &nbsp;&nbsp;&nbsp; <strong>Valeur:</strong> cname.vercel-dns.com</div>
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
        
        <p>Bonne continuation !<br>
        L'équipe Support</p>
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

// .env.local (variables d'environnement à ajouter)
/*
VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_ID=your_project_id_here
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yoursite.com
*/