import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load .env from server/.env
dotenv.config();

console.log('Loaded SMTP env variables:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL);
console.log('FROM_EMAIL:', process.env.FROM_EMAIL);

async function testEmail() {
  console.log('[EMAIL] Creating transporter...');

  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true only if port 465
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  console.log('[EMAIL] Transporter created');

  let info = await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: "lakshrajkumar.791.lrk@gmail.com",  // send test email to yourself
    subject: 'Test email from Brevo SMTP',
    text: 'Hello! This is a test email sent using Brevo SMTP.',
  });

  console.log('Message sent:', info.messageId,info.response);
}

testEmail()
  .then(() => console.log('[EMAIL] Test email sent successfully'))
  .catch(err => {
    console.error('[EMAIL] Failed to send test email:', err);
  });
