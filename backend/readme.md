//sendEmail.js
// import nodemailer from 'nodemailer';

// const sendEmail = async (options) => {
//  const transporter = nodemailer.createTransport({
//   host: 'smtp-relay.brevo.com',
//   port: 465,
//   secure: true, // since port 465 uses SSL
//   auth: {
//     user: '98760a001@smtp-brevo.com',
//     pass: 'xsmtpsib-ba5167a6a86aab0a05709f08bf6cb0263209f82a23960544543903419de703d8-0RIPUf1SN6B5hFbJ',
//   },
// });

//   const message = {
//     from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   await transporter.sendMail(message);
// };










//emmail.js
// import nodemailer from 'nodemailer';

// const createTransporter = () => {
//   console.log('[EMAIL] Creating transporter...');

//   const transporter = nodemailer.createTransport({
//     host: 'smtp-relay.brevo.com',
//     port: 465,
//     secure: true, // SMTPS (SSL)
//     auth: {
//       user: '98760a001@smtp-brevo.com',
//       pass: 'xsmtpsib-ba5167a6a86aab0a05709f08bf6cb0263209f82a23960544543903419de703d8-0RIPUf1SN6B5hFbJ',
//     },
//     logger: true,
//     debug: true,
//     // tls: { rejectUnauthorized: false }, // uncomment if TLS issues
//   });

//   console.log('[EMAIL] Transporter created successfully');
//   return transporter;
// };

// export const sendEmail = async ({ email, subject, message, html }) => {
//   const transporter = createTransporter();

//   const mailOptions = {
//     from: 'ParkFinder <slogsolutions.it@gmail.com>',
//     to: email,
//     subject,
//     text: html ? undefined : message,
//     html: html || undefined,
//   };

//   console.log(`[EMAIL] Sending email to ${email} with subject "${subject}"...`);
//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log(`[EMAIL] Email sent: ${info.messageId}`);
//   } catch (error) {
//     console.error('[EMAIL] Error sending email:', error);
//     throw error;
//   }
// };

// export const sendVerificationEmail = async (email, verificationToken) => {
//   const verificationUrl = `https://your-frontend-url.com/verify-email/${verificationToken}`; // Replace with your actual frontend URL
//   const html = `
//     <h1>Welcome to ParkFinder!</h1>
//     <p>Please click the link below to verify your email address:</p>
//     <a href="${verificationUrl}">${verificationUrl}</a>
//     <p>This link will expire in 24 hours.</p>
//   `;

//   console.log(`[EMAIL] Preparing verification email for ${email}`);
//   await sendEmail({ email, subject: 'Verify Your Email Address', html });
//   console.log('[EMAIL] Verification email sent.');
// };

// export const sendPasswordResetEmail = async (email, resetToken) => {
//   const resetUrl = `https://your-frontend-url.com/reset-password/${resetToken}`; // Replace with your actual frontend URL
//   const html = `
//     <h1>Password Reset Request</h1>
//     <p>You requested to reset your password. Click the link below to set a new password:</p>
//     <a href="${resetUrl}">${resetUrl}</a>
//     <p>This link will expire in 10 minutes.</p>
//     <p>If you didn't request this, please ignore this email.</p>
//   `;

//   console.log(`[EMAIL] Preparing password reset email for ${email}`);
//   await sendEmail({ email, subject: 'Password Reset Request', html });
//   console.log('[EMAIL] Password reset email sent.');
// };

// export const sendNotification = async (recipientEmail, subject, message) => {
//   console.log(`[EMAIL] Preparing notification email for ${recipientEmail}`);
//   await sendEmail({ email: recipientEmail, subject, message });
//   console.log('[EMAIL] Notification email sent.');
// };
