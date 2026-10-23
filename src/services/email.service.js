import dotenv from "dotenv";

dotenv.config();

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Retrieves a fresh Google OAuth access token using the refresh token,
 * caching it until near its expiration time.
 */
async function getGoogleAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token"
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`Failed to refresh Google OAuth token: ${JSON.stringify(tokenData)}`);
  }

  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = now + (tokenData.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

/**
 * Constructs an RFC 2822 MIME-compliant email string formatted as base64url
 * for the Gmail REST API.
 */
function buildMimeMessage({ from, to, subject, text, html }) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const boundary = `__boundary_${Date.now()}__`;

  let body = "";
  if (html && text) {
    body = [
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      text,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      html,
      "",
      `--${boundary}--`
    ].join("\r\n");
  } else if (html) {
    body = [
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      html
    ].join("\r\n");
  } else {
    body = [
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      text || ""
    ].join("\r\n");
  }

  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    body
  ];

  return Buffer.from(emailLines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Sends an email via Gmail REST API over HTTPS (Port 443).
 * Never blocked by cloud providers (Render, Vercel, Railway) like standard SMTP.
 */
async function sendViaGmailApi(to, subject, text, html) {
  const accessToken = await getGoogleAccessToken();
  const from = `"HappySoul" <${process.env.GOOGLE_USER_ID}>`;
  const raw = buildMimeMessage({ from, to, subject, text, html });

  const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw })
  });

  const sendData = await sendRes.json();
  if (!sendRes.ok) {
    throw new Error(`Gmail API send failed: ${JSON.stringify(sendData)}`);
  }

  return { messageId: sendData.id, ...sendData };
}

/**
 * Sends an email via Brevo REST API over HTTPS (Port 443).
 * Does not require a custom domain and can deliver to any recipient.
 */
async function sendViaBrevo(to, subject, text, html) {
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.GOOGLE_USER_ID;
  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is not set in environment variables.");
  }

  const payload = {
    sender: {
      name: "HappySoul",
      email: senderEmail,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html || `<p>${text || ""}</p>`,
    textContent: text || "",
  };

  const sendRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const sendData = await sendRes.json();
  if (!sendRes.ok) {
    throw new Error(`Brevo API failed: ${JSON.stringify(sendData)}`);
  }

  return { messageId: sendData.messageId, ...sendData };
}

/**
 * Optional fallback: Resend API over HTTPS (Port 443)
 */
async function sendViaResend(to, subject, text, html) {
  const sendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "HappySoul <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
      html
    })
  });

  const sendData = await sendRes.json();
  if (!sendRes.ok) {
    throw new Error(`Resend API failed: ${JSON.stringify(sendData)}`);
  }

  return { messageId: sendData.id, ...sendData };
}

/**
 * Main email sender function used across the application.
 */
export const sendEmail = async (to, subject, text, html) => {
  try {
    console.log(`[Email Service] Attempting to send "${subject}" to ${to}...`);

    let info;
    if (process.env.BREVO_API_KEY) {
      info = await sendViaBrevo(to, subject, text, html);
    } else if (process.env.RESEND_API_KEY) {
      info = await sendViaResend(to, subject, text, html);
    } else if (
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_USER_ID
    ) {
      info = await sendViaGmailApi(to, subject, text, html);
    } else {
      throw new Error(
        "No email service configured. Please provide BREVO_API_KEY & BREVO_SENDER_EMAIL, Google OAuth credentials, or RESEND_API_KEY."
      );
    }

    console.log("[Email Service] Message sent successfully. ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("[Email Service] Error in sending mail:", error);
    throw error;
  }
};
