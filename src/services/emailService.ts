import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525'),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmailOTP = async (email: string, otp: string) => {
  const mailOptions = {
    from: '"SecondBrain Support" <support@secondbrain.ai>',
    to: email,
    subject: 'Your Email Verification Code',
    text: `Your OTP for email verification is ${otp}. It will expire in 10 minutes.`,
    html: `<b>Your OTP for email verification is ${otp}. It will expire in 10 minutes.</b>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
