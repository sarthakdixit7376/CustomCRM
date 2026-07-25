import resend from '../config/resend.js';

export async function sendInvitationEmail(to: string, name: string, inviteLink: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM_ADDRESS as string,
    to,
    subject: "You're invited to join the CRM",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>You're invited to join the CRM</h2>
        <p>Hi ${name},</p>
        <p>An administrator has invited you to create an account. Click the button below to set up your password and get started.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteLink}" style="background: #4f46e5; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Accept invitation
          </a>
        </p>
        <p>This link will expire soon, so please accept it at your earliest convenience.</p>
        <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}
