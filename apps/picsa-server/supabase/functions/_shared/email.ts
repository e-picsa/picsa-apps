import { Resend } from 'npm:resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  // Use a fallback sender or verify one in Resend dashboard
  const from = 'PICSA Dashboard <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw error;
  }

  return data;
}
