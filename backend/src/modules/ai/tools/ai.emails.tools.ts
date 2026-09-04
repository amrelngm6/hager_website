import { ActionDefinition } from '../ai.types';
import { sendEmail } from '../../../helper/email-sender';


// ── Domains ──────────────────────────────────────────────────────────────
export const emailTools: ActionDefinition[] = [
  {
    name: 'send_email',
    description: 'Send an email to a specified recipient.',
    category: 'email',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject' },
        text: { type: 'string', description: 'Plain text content of the email' },
        html: { type: 'string', description: 'HTML content of the email' },
      },
      required: ['to', 'subject', 'text'],
    },
    execute: async (args, { user }) => {
      const { to, subject, text, html } = args as {
        to: string;
        subject: string;
        text: string;
        html: string;
      };
      sendEmail(to, subject, text, html).catch(console.error);
    },
  }
];