import { Resend } from 'npm:resend';
import nodemailer from 'npm:nodemailer';

// Detect local environment safely. Supabase local often has `kong` in the URL for edge functions.
const isLocal =
  Deno.env.get('SUPABASE_URL')?.includes('kong') ||
  Deno.env.get('SUPABASE_URL')?.includes('localhost') ||
  !Deno.env.get('RESEND_API_KEY');

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

async function sendLocalEmail(options: EmailOptions) {
  console.log('Sending email locally to Supabase Inbucket (Mailpit)...');
  const transporter = nodemailer.createTransport({
    host: 'inbucket',
    port: 1025,
    ignoreTLS: true,
  });

  try {
    const info = await transporter.sendMail({
      from: '"PICSA Local" <local@picsa.app>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log('Successfully routed to local Inbucket:', info.messageId);
    return info;
  } catch (err) {
    console.error('Mailer error. Is Inbucket running?', err);
    throw err;
  }
}

async function sendResendEmail(options: EmailOptions, apiKey: string) {
  const resend = new Resend(apiKey);
  const from = 'PICSA Dashboard <support@picsa.app>';

  const { data, error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw error;
  }

  return data;
}

export function sendEmail(options: EmailOptions) {
  const resendKey = Deno.env.get('RESEND_API_KEY');

  // Fallback to local Mailpit/Inbucket SMTP server running inside the Supabase Docker network
  if (isLocal || !resendKey) {
    return sendLocalEmail(options);
  }

  // Production via Resend
  return sendResendEmail(options, resendKey);
}
