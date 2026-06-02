require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');

async function getMailTransporter() {
  if (process.env.EMAIL_PROVIDER === 'unione' && process.env.EMAIL_API_KEY) {
    const unioneUrl = process.env.EMAIL_API_URL || '';
    return {
      transporter: {
        sendMail: async (mailOptions) => {
          const payload = {
            sender: mailOptions.from,
            recipients: mailOptions.to,
            subject: mailOptions.subject,
            content: [
              { type: 'text/plain', value: mailOptions.text },
              { type: 'text/html', value: mailOptions.html }
            ]
          };
          const resp = await axios.post(unioneUrl, payload, {
            headers: { Authorization: `Bearer ${process.env.EMAIL_API_KEY}` }
          });
          return { apiResponse: resp.data };
        }
      },
      mode: 'unione'
    };
  }

  if (process.env.EMAIL_API_URL && process.env.EMAIL_API_KEY) {
    return {
      transporter: {
        sendMail: async (mailOptions) => {
          const payload = {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            text: mailOptions.text,
            html: mailOptions.html
          };
          const resp = await axios.post(process.env.EMAIL_API_URL, payload, {
            headers: { Authorization: `Bearer ${process.env.EMAIL_API_KEY}` }
          });
          return { apiResponse: resp.data };
        }
      },
      mode: 'api'
    };
  }

  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (smtpConfigured) {
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      }),
      mode: 'smtp'
    };
  }

  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    }),
    mode: 'ethereal'
  };
}

async function sendTestOtp({ to, name = 'Test User', otp = '123456' }) {
  const { transporter, mode } = await getMailTransporter();
  const from = process.env.EMAIL_FROM || 'no-reply@nyoderaheights.com';
  const subject = process.env.EMAIL_SUBJECT_OTP || 'Nyodera Heights Email Verification';
  const text = `Hello ${name},\n\nYour verification code is: ${otp}`;
  const html = `<p>Hello ${name},</p><p>Your verification code is: <strong>${otp}</strong></p>`;

  const info = await transporter.sendMail({ from, to, subject, text, html, envelope: { from: process.env.EMAIL_ENVELOPE_FROM || from, to } });
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  return { info, previewUrl, mode };
}

(async function main() {
  try {
    const to = process.env.CONFIRMED_SENDING_ADDRESS || process.argv[2] || 'recipient@example.com';
    console.log('Sending test OTP to', to);
    const r = await sendTestOtp({ to, name: 'Nyodera Test', otp: Math.floor(100000 + Math.random() * 900000).toString() });
    console.log('Transport mode:', r.mode);
    if (r.previewUrl) console.log('Preview URL:', r.previewUrl);
    else console.log('Send response:', r.info);
  } catch (err) {
    console.error('Email test failed:', err.response?.data || err.message || err);
    process.exit(1);
  }
})();
