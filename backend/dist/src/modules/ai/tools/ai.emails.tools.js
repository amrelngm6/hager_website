"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTools = void 0;
const email_sender_1 = require("../../../helper/email-sender");
// ── Domains ──────────────────────────────────────────────────────────────
exports.emailTools = [
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
            const { to, subject, text, html } = args;
            (0, email_sender_1.sendEmail)(to, subject, text, html).catch(console.error);
        },
    }
];
//# sourceMappingURL=ai.emails.tools.js.map