import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const isConfigured = 
    process.env.SMTP_HOST && 
    process.env.SMTP_PORT && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS;

  if (!isConfigured) {
    console.log('--- MAIL SIMULATION (Credentials Not Configured) ---');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message || 'HTML Content Attached'}`);
    if (options.html) console.log(`HTML: ${options.html.substring(0, 300)}...`);
    console.log('----------------------------------------------------');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `${process.env.SMTP_FROM || 'service@nounoutelecom.com'}`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
