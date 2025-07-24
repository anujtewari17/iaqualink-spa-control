import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

class NotificationService {
  constructor() {
    this.email = process.env.NOTIFY_EMAIL;
    this.phone = process.env.NOTIFY_PHONE;

    if (this.email) {
      this.mailTransport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });
    }

    if (this.phone) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      if (sid && token) {
        this.twilioClient = twilio(sid, token);
        this.twilioFrom = process.env.TWILIO_FROM_NUMBER;
      }
    }
  }

  async notify(message) {
    if (this.email && this.mailTransport) {
      try {
        await this.mailTransport.sendMail({
          from: process.env.SMTP_FROM || this.email,
          to: this.email,
          subject: 'Spa Notification',
          text: message,
        });
        console.log('Notification email sent');
      } catch (err) {
        console.error('Failed to send notification email:', err.message);
      }
    }
    if (this.phone && this.twilioClient && this.twilioFrom) {
      try {
        await this.twilioClient.messages.create({
          body: message,
          from: this.twilioFrom,
          to: this.phone,
        });
        console.log('Notification SMS sent');
      } catch (err) {
        console.error('Failed to send SMS:', err.message);
      }
    }
  }
}

export default new NotificationService();
