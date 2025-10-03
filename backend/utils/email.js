import nodemailer from 'nodemailer';

/**
 * Creates a Nodemailer transporter with appropriate secure settings
 */
const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT);
  const isSecure = port === 465; // secure = true only for port 465

  if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('[EMAIL] Missing SMTP environment variables');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Sends email verification with a clickable link
 */
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const transporter = createTransporter();
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <h1>Welcome to ParkFinder!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    console.log(`[EMAIL] Sending verification to ${email}...`);
    await transporter.sendMail(message);
    console.log('[EMAIL] Verification email sent.');
  } catch (error) {
    console.error('[EMAIL] Failed to send verification email:', error);
    throw new Error('Email sending failed');
  }
};

/**
 * Sends password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    console.log(`[EMAIL] Sending password reset to ${email}...`);
    await transporter.sendMail(message);
    console.log('[EMAIL] Password reset email sent.');
  } catch (error) {
    console.error('[EMAIL] Failed to send password reset email:', error);
    throw new Error('Password reset email sending failed');
  }
};

/**
 * Generic notification email
 */
export const sendNotification = async (recipientEmail, subject, message) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: recipientEmail,
      subject: subject,
      text: message,
    };

    console.log(`[EMAIL] Sending notification to ${recipientEmail}...`);
    await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Notification email sent.');
  } catch (error) {
    console.error('[EMAIL] Failed to send notification:', error);
  }
};
