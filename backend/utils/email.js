import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

export const sendVerificationEmail = async (email, verificationToken) => {
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

  await transporter.sendMail(message);
};

export const sendPasswordResetEmail = async (email, resetToken) => {
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

  await transporter.sendMail(message);
};

export const sendNotification = async (recipientEmail, subject, message) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: 'parking@slogsolutions.com',
      to: recipientEmail,
      subject: subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};