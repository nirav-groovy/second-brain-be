import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const sendSMSOTP = async (phone: string, otp: string) => {
  if (!client || !fromPhone) {
    console.warn('Twilio not configured, skipping SMS. OTP:', otp);
    return true; // Mocking success if not configured
  }

  try {
    const message = await client.messages.create({
      body: `Your SecondBrain verification code is ${otp}. Expires in 10 minutes.`,
      from: fromPhone,
      to: phone,
    });
    console.log('SMS sent: %s', message.sid);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};
