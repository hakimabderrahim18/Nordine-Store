import sendEmail from '../utils/sendEmail.js';

// @desc    Submit contact form and send email to admin
// @route   POST /api/contact
// @access  Public
export const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400);
      throw new Error('Veuillez remplir tous les champs obligatoires');
    }

    const cleanSubject = subject === 'support' ? 'Support Technique' : subject === 'sales' ? 'Service Commercial' : 'Demande générale';

    // Construct the email text & html template
    const emailSubject = `[Nouveau Message NordineStore] ${cleanSubject} - de ${name}`;
    const emailText = `Vous avez reçu un nouveau message depuis le formulaire de contact de NordineStore :\n\n` +
      `Nom complet : ${name}\n` +
      `Adresse e-mail : ${email}\n` +
      `Sujet : ${cleanSubject}\n\n` +
      `Message :\n${message}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #f8fafc;">
        <h2 style="color: #d97706; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; text-transform: uppercase;">Nouveau Message Reçu</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 150px;">Nom Complet :</td>
            <td style="padding: 8px 0; color: #1e293b;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Adresse E-mail :</td>
            <td style="padding: 8px 0; color: #1e293b;"><a href="mailto:${email}" style="color: #d97706;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Sujet :</td>
            <td style="padding: 8px 0; color: #1e293b;">${cleanSubject}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 15px; background-color: #ffffff; border-left: 4px solid #d97706; border-radius: 4px;">
          <h4 style="margin-top: 0; color: #475569;">Message :</h4>
          <p style="color: #334155; line-height: 1.6; margin-bottom: 0; white-space: pre-wrap;">${message}</p>
        </div>
        <p style="margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          Cet e-mail a été envoyé automatiquement depuis le système de contact de NordineStore.
        </p>
      </div>
    `;

    // Send the e-mail
    await sendEmail({
      email: 'service@nounoutelecom.com',
      subject: emailSubject,
      message: emailText,
      html: emailHtml
    });

    res.json({
      success: true,
      message: 'Votre message a été envoyé avec succès ! Notre équipe vous répondra sous 24h.'
    });
  } catch (error) {
    next(error);
  }
};
