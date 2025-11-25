import sgMail from "@sendgrid/mail";

const sendgridApiKey = process.env.SENDGRID_API_KEY;

if (!sendgridApiKey) {
  console.warn("⚠️ SENDGRID_API_KEY is not set - Email features will be disabled");
} else {
  sgMail.setApiKey(sendgridApiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@voicall.ch";

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export function createWelcomeEmail(
  userEmail: string,
  userName?: string
): EmailTemplate {
  const name = userName || "dort";

  return {
    to: userEmail,
    subject: "Willkommen bei Voicall 🇨🇭",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #dc2626, #ef4444); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Voicall</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">🇨🇭 Der erste KI-Assistent, der Schweizerdeutsch versteht</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Willkommen, ${name}!</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Vielen Dank, dass Sie sich für Voicall entschieden haben. Wir freuen uns, Sie dabei zu unterstützen, 
              Ihre Telefonie zu automatisieren und mehr Zeit für Ihre Patienten zu haben.
            </p>
            
            <div style="background: white; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #1f2937;">Nächste Schritte:</h3>
              <ol style="color: #4b5563; margin: 10px 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Wählen Sie einen Abonnement-Plan</li>
                <li style="margin-bottom: 10px;">Konfigurieren Sie Ihren KI-Assistenten (Begrüssung, Stimme)</li>
                <li style="margin-bottom: 10px;">Verbinden Sie Ihren Kalender für automatische Terminbuchung</li>
                <li>Starten Sie mit Ihrem ersten Anruf!</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Zum Dashboard
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Bei Fragen stehen wir Ihnen gerne zur Verfügung: 
              <a href="mailto:hello@voicall.ch" style="color: #dc2626;">hello@voicall.ch</a>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Voicall. Entwickelt in Zürich 🇨🇭</p>
          </div>
        </body>
      </html>
    `,
    text: `Willkommen bei Voicall, ${name}!\n\nVielen Dank, dass Sie sich für Voicall entschieden haben.\n\nNächste Schritte:\n1. Wählen Sie einen Abonnement-Plan\n2. Konfigurieren Sie Ihren KI-Assistenten\n3. Verbinden Sie Ihren Kalender\n4. Starten Sie mit Ihrem ersten Anruf!\n\nZum Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nBei Fragen: hello@voicall.ch`,
  };
}

export function createNewCallAlertEmail(
  userEmail: string,
  callData: {
    conversationId: string;
    duration: number;
    status: string;
    transcript?: string;
    createdAt: Date;
  }
): EmailTemplate {
  const durationMinutes = Math.ceil(callData.duration / 60);
  const transcriptPreview = callData.transcript
    ? callData.transcript.substring(0, 200) +
      (callData.transcript.length > 200 ? "..." : "")
    : "Kein Transkript verfügbar";

  return {
    to: userEmail,
    subject: `Neuer Anruf: ${callData.status === "completed" ? "Erfolgreich" : "Beendet"}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f9fafb; padding: 30px; border-radius: 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">📞 Neuer Anruf</h2>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Status:</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: 600; color: ${callData.status === "completed" ? "#059669" : "#6b7280"};">
                    ${callData.status === "completed" ? "✓ Erfolgreich" : callData.status}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Dauer:</td>
                  <td style="padding: 10px 0; text-align: right; border-top: 1px solid #e5e7eb;">${durationMinutes} Min</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Zeitpunkt:</td>
                  <td style="padding: 10px 0; text-align: right; border-top: 1px solid #e5e7eb;">${callData.createdAt.toLocaleString("de-CH")}</td>
                </tr>
              </table>
            </div>
            
            ${
              callData.transcript
                ? `
              <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #4b5563; font-size: 14px; font-style: italic;">
                  "${transcriptPreview}"
                </p>
              </div>
            `
                : ""
            }
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calls/${callData.conversationId}" 
                 style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Vollständiges Transkript ansehen
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Neuer Anruf\n\nStatus: ${callData.status}\nDauer: ${durationMinutes} Min\nZeitpunkt: ${callData.createdAt.toLocaleString("de-CH")}\n\n${transcriptPreview}\n\nDetails: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calls/${callData.conversationId}`,
  };
}

export function createSubscriptionConfirmationEmail(
  userEmail: string,
  subscriptionData: {
    plan: string;
    amount: number;
    minutesIncluded: number;
  }
): EmailTemplate {
  const planNames: Record<string, string> = {
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return {
    to: userEmail,
    subject: `Abonnement bestätigt: ${planNames[subscriptionData.plan]} Plan`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f9fafb; padding: 30px; border-radius: 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">✓ Abonnement bestätigt</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Vielen Dank! Ihr ${planNames[subscriptionData.plan]} Plan ist jetzt aktiv.
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 6px; margin: 20px 0; border: 2px solid #dc2626;">
              <h3 style="margin-top: 0; color: #1f2937; text-align: center; font-size: 24px;">
                ${planNames[subscriptionData.plan]} Plan
              </h3>
              <p style="text-align: center; color: #6b7280; margin: 10px 0;">
                CHF ${subscriptionData.amount} / Monat
              </p>
              <p style="text-align: center; color: #059669; font-weight: 600; font-size: 18px; margin: 15px 0;">
                ${subscriptionData.minutesIncluded === -1 ? "Unbegrenzte" : subscriptionData.minutesIncluded} Minuten
              </p>
            </div>
            
            <div style="background: #dcfce7; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #166534; font-weight: 600;">
                ✓ Ihr KI-Assistent ist einsatzbereit
              </p>
              <p style="margin: 10px 0 0 0; color: #166534; font-size: 14px;">
                Sie können jetzt Anrufe empfangen und Termine automatisch buchen lassen.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin-right: 10px;">
                Zum Dashboard
              </a>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" 
                 style="background: white; color: #dc2626; border: 2px solid #dc2626; padding: 10px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Konfigurieren
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
              Ihre Rechnung finden Sie jederzeit in Ihrem 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription" style="color: #dc2626;">Abo-Bereich</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Abonnement bestätigt\n\nIhr ${planNames[subscriptionData.plan]} Plan ist jetzt aktiv.\n\nPreis: CHF ${subscriptionData.amount} / Monat\nMinuten: ${subscriptionData.minutesIncluded === -1 ? "Unbegrenzt" : subscriptionData.minutesIncluded}\n\nIhr KI-Assistent ist einsatzbereit!\n\nZum Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  };
}

export function createUsageWarningEmail(
  userEmail: string,
  usageData: {
    minutesUsed: number;
    minutesIncluded: number;
    percentageUsed: number;
  }
): EmailTemplate {
  return {
    to: userEmail,
    subject: "⚠️ 80% Ihrer Minuten verbraucht",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-w-600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 30px; border-radius: 8px;">
            <h2 style="color: #92400e; margin-top: 0;">⚠️ Minutenkontingent fast aufgebraucht</h2>
            
            <p style="color: #78350f; font-size: 16px;">
              Sie haben bereits ${Math.round(usageData.percentageUsed)}% Ihrer monatlichen Minuten verbraucht.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <span style="color: #6b7280; font-size: 14px;">Verbrauch</span>
                <span style="float: right; font-weight: 600;">${usageData.minutesUsed} / ${usageData.minutesIncluded} Min</span>
              </div>
              <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(to right, #f59e0b, #dc2626); height: 100%; width: ${usageData.percentageUsed}%;"></div>
              </div>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #78350f; font-size: 14px;">
                <strong>Was passiert bei 100%?</strong><br>
                Ihr KI-Assistent wird automatisch deaktiviert, bis Sie upgraden oder der neue Monat beginnt.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription" 
                 style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Jetzt upgraden
              </a>
            </div>
            
            <p style="color: #78350f; font-size: 14px; text-align: center; margin-top: 20px;">
              Sie können Ihren Plan jederzeit im Dashboard ändern.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `⚠️ Minutenkontingent fast aufgebraucht\n\nSie haben bereits ${Math.round(usageData.percentageUsed)}% Ihrer monatlichen Minuten verbraucht.\n\nVerbrauch: ${usageData.minutesUsed} / ${usageData.minutesIncluded} Min\n\nBei 100% wird Ihr KI-Assistent automatisch deaktiviert.\n\nJetzt upgraden: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
  };
}

// ============================================
// SEND EMAIL FUNCTION
// ============================================

export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  if (!sendgridApiKey) {
    console.warn(`⚠️ Skipping email to ${template.to} - SENDGRID_API_KEY not set`);
    return false;
  }

  try {
    await sgMail.send({
      from: FROM_EMAIL,
      to: template.to,
      subject: template.subject,
      html: template.html,
      text: template.text || template.subject,
    });

    console.log(`✓ Email sent to ${template.to}: ${template.subject}`);
    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    return false;
  }
}
