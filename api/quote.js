// Serverless function (Vercel) — receives a quote request, then:
//   1) emails the booking details to the business inbox
//   2) sends the client an instant, branded confirmation
// Both are sent through the real info@fullcyclecare.ca Zoho mailbox via SMTP,
// so they come FROM your domain and land in the inbox (proper DKIM/SPF via Zoho).
//
// Required Vercel environment variables:
//   ZOHO_USER       — info@fullcyclecare.ca
//   ZOHO_PASS       — a Zoho app-specific password (NOT your login password)
//   ZOHO_SMTP_HOST  — (optional) defaults to smtp.zoho.com

const nodemailer = require('nodemailer');

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

function clientConfirmationHtml(name) {
  const firstName = (name || '').trim().split(/\s+/)[0] || 'there';
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a2520">
    <div style="background:#2d7a4f;padding:24px 28px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;color:#fff;font-size:1.5rem">Full Cycle Care</h1>
    </div>
    <div style="border:1px solid #e3ebe5;border-top:none;border-radius:0 0 12px 12px;padding:28px">
      <p style="font-size:1.05rem;margin:0 0 14px">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 14px">Thank you for choosing <strong>Full Cycle Property Care</strong>! We've received your request and confirmed it. A member of our team will reach out <strong>within two hours</strong> to set up your visit.</p>
      <p style="margin:0 0 20px">If you have any questions, don't hesitate to reply to this email or call us at <a href="tel:4373182562" style="color:#2d7a4f">437-318-2562</a>.</p>
      <p style="margin:0;color:#4a5853">Warm regards,<br><strong>The Full Cycle Property Care Team</strong><br>
        <a href="https://fullcyclecare.ca" style="color:#2d7a4f">fullcyclecare.ca</a> &middot;
        <a href="mailto:info@fullcyclecare.ca" style="color:#2d7a4f">info@fullcyclecare.ca</a>
      </p>
    </div>
  </div>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const body = (req.body && typeof req.body === 'object') ? req.body : {};

  // Honeypot: real users leave this empty; bots fill it. Silently accept and drop.
  if (body._honey) {
    res.status(200).json({ success: true });
    return;
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  if (!name || !email) {
    res.status(400).json({ success: false, error: 'Name and email are required.' });
    return;
  }

  const owner = process.env.ZOHO_USER;
  if (!owner || !process.env.ZOHO_PASS) {
    res.status(500).json({ success: false, error: 'Email service is not configured yet.' });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zohocloud.ca',
    port: 465,
    secure: true,
    auth: { user: owner, pass: process.env.ZOHO_PASS }
  });

  // Build the business-notification table from whatever fields were filled.
  const rows = [
    ['Customer name', name],
    ['Email', email],
    ['Phone', body.phone],
    ['Property address', body.address],
    ['Service requested', body.service],
    ['Yard size', body.yard],
    ['Driveway size', body.driveway],
    ['Plan', body.plan],
    ['Estimated price', body.price],
    ['Notes from customer', body.notes],
    ['Calculator', body.calculator]
  ].filter(([, v]) => v && String(v).trim());

  const detailHtml = rows.map(([k, v]) =>
    `<tr>
       <td style="padding:8px 12px;border:1px solid #e3ebe5;background:#f7faf6;font-weight:600">${k}</td>
       <td style="padding:8px 12px;border:1px solid #e3ebe5">${escapeHtml(v)}</td>
     </tr>`
  ).join('');

  try {
    // 1) Business notification — reply-to is the client so you can answer directly.
    await transporter.sendMail({
      from: `"FullCycle Website" <${owner}>`,
      to: owner,
      replyTo: email,
      subject: 'New quote request — FullCycle Property Care',
      html: `<div style="font-family:Arial,sans-serif">
               <h2 style="color:#2d7a4f">New quote request</h2>
               <table style="border-collapse:collapse;font-size:14px">${detailHtml}</table>
             </div>`
    });

    // 2) Instant branded confirmation to the client.
    await transporter.sendMail({
      from: `"Full Cycle Care" <${owner}>`,
      to: email,
      replyTo: owner,
      subject: 'We got your request — Full Cycle Care',
      html: clientConfirmationHtml(name)
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Quote email failed:', err && err.message);
    res.status(500).json({ success: false, error: 'Could not send email. Please call 437-318-2562.' });
  }
};
