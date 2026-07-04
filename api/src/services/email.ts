/**
 * Email service — Resend transactional email wrapper.
 * Falls back to console.log in dev.
 */
export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Nurovia AI <[email protected]>";

  if (!apiKey) {
    console.log(`[email] To: ${params.to} | Subject: ${params.subject}`);
    console.log(`[email] Body: ${params.text || params.html.replace(/<[^>]+>/g, "")}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${errText}`);
  }
}

export function passwordResetEmail(link: string): { subject: string; html: string; text: string } {
  return {
    subject: "Reset your Nurovia AI password",
    text: `Click this link to reset your Nurovia AI password: ${link}\n\nThis link expires in 15 minutes.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px;">Reset your password</h1>
        <p style="font-size: 14px; line-height: 22px; color: #4a4a4a; margin: 0 0 24px;">
          Click the button below to reset your Nurovia AI password. This link expires in 15 minutes.
        </p>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #d4af37; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">Reset password</a>
        <p style="font-size: 12px; line-height: 18px; color: #8a8a8a; margin: 24px 0 0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };
}

export function verificationEmail(link: string): { subject: string; html: string; text: string } {
  return {
    subject: "Verify your Nurovia AI email",
    text: `Click this link to verify your Nurovia AI email: ${link}\n\nThis link expires in 24 hours.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px;">Verify your email</h1>
        <p style="font-size: 14px; line-height: 22px; color: #4a4a4a; margin: 0 0 24px;">
          Welcome to Nurovia AI. Click the button below to verify your email address.
        </p>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #d4af37; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">Verify email</a>
        <p style="font-size: 12px; line-height: 18px; color: #8a8a8a; margin: 24px 0 0;">This link expires in 24 hours.</p>
      </div>
    `,
  };
}