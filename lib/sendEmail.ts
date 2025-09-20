import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

// Configure SendGrid if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Configure Nodemailer transporter
const nodemailerTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const emailOptions: EmailOptions = { to, subject, text, html };
  
  try {
    // Try SendGrid first if configured
    if (process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM) {
      await sendWithSendGrid(emailOptions);
      console.log(`✅ Email sent via SendGrid to ${to}`);
      return;
    }
    
    // Fallback to Nodemailer
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendWithNodemailer(emailOptions);
      console.log(`✅ Email sent via SMTP to ${to}`);
      return;
    }
    
    throw new Error('No email service configured');
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}

async function sendWithSendGrid(options: EmailOptions) {
  await sgMail.send({
    to: options.to,
    from: process.env.EMAIL_FROM!,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

async function sendWithNodemailer(options: EmailOptions) {
  await nodemailerTransporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

// Email template for quiet hour notifications
export function createQuietHourEmailTemplate(userName: string, blockTitle: string, startTime: Date) {
  const formattedTime = startTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const text = `Hi ${userName},

This is a friendly reminder that your quiet study block "${blockTitle}" starts in 10 minutes.

Start Time: ${formattedTime}

Please prepare your study space and get ready for a productive quiet study session!

Best regards,
Quiet Hours Scheduler`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">🔔 Quiet Study Reminder</h2>
      
      <p style="font-size: 16px; line-height: 1.5; color: #374151;">
        Hi <strong>${userName}</strong>,
      </p>
      
      <p style="font-size: 16px; line-height: 1.5; color: #374151;">
        This is a friendly reminder that your quiet study block <strong>"${blockTitle}"</strong> starts in <span style="color: #dc2626; font-weight: bold;">10 minutes</span>.
      </p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Start Time:</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #111827;">${formattedTime}</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.5; color: #374151;">
        Please prepare your study space and get ready for a productive quiet study session! 📚
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #6b7280; margin: 0;">
        Best regards,<br>
        <strong>Quiet Hours Scheduler</strong>
      </p>
    </div>
  `;

  return { text, html };
}
