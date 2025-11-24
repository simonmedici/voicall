# SendGrid Email Setup Guide

## 1. SendGrid Account erstellen

1. Gehe zu [SendGrid](https://sendgrid.com/)
2. Erstelle einen kostenlosen Account (100 Emails/Tag kostenlos)
3. Verifiziere deine Email-Adresse

## 2. API Key erstellen

1. Login zu SendGrid Dashboard
2. Settings → API Keys
3. "Create API Key" klicken
4. Name: `Voicall Production`
5. Permissions: **Full Access** wählen
6. API Key kopieren und sicher speichern!

## 3. Sender Identity verifizieren

### Option A: Single Sender Verification (Schnell)

1. Settings → Sender Authentication
2. Single Sender Verification
3. Email eingeben (z.B. `noreply@voicall.ch`)
4. Verification Email bestätigen

### Option B: Domain Authentication (Empfohlen für Production)

1. Settings → Sender Authentication
2. Domain Authentication
3. DNS Records hinzufügen zu deiner Domain
4. Warte auf Verification (24-48h)

## 4. Environment Variables setzen

Füge zu `.env.local` hinzu:

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@voicall.ch
```

## 5. Email Templates testen

Die folgenden Email-Templates sind implementiert:

### 1. Welcome Email

- **Trigger**: Nach Registrierung
- **Endpoint**: `/api/welcome-email`
- **Template**: `createWelcomeEmail()`

### 2. New Call Alert

- **Trigger**: Nach jedem ElevenLabs Call
- **Webhook**: `/api/elevenlabs/webhook`
- **Template**: `createNewCallAlertEmail()`

### 3. Subscription Confirmation

- **Trigger**: Nach Stripe Checkout
- **Webhook**: `/api/stripe/webhook` (checkout.session.completed)
- **Template**: `createSubscriptionConfirmationEmail()`

### 4. Usage Warning (80%)

- **Trigger**: Bei 80% Minutenverbrauch
- **Webhook**: `/api/elevenlabs/webhook`
- **Template**: `createUsageWarningEmail()`

## 6. Testing

### Test Welcome Email

```bash
# Nach Registration einen User erstellen
curl -X POST http://localhost:3000/api/welcome-email \
  -H "Cookie: your-session-cookie"
```

### Test in Development

Alle Emails werden in der Konsole geloggt:

```
✓ Email sent to user@example.com: Willkommen bei Voicall 🇨🇭
```

## 7. Production Checklist

- [ ] SendGrid API Key erstellt
- [ ] Domain Authentication aktiviert
- [ ] SENDGRID_API_KEY in Production ENV gesetzt
- [ ] SENDGRID_FROM_EMAIL konfiguriert
- [ ] Test-Emails verschickt und empfangen
- [ ] Spam-Filter Check (wichtig!)
- [ ] Unsubscribe Link hinzufügen (DSGVO)

## 8. Troubleshooting

### Emails kommen nicht an

- Check Spam-Ordner
- Verify Sender Identity ist aktiv
- API Key hat Full Access Permissions
- Rate Limits nicht überschritten (100/Tag Free Plan)

### Error: Missing API Key

```bash
# .env.local checken
cat .env.local | grep SENDGRID
```

### Error: Unauthorized

- API Key falsch kopiert
- API Key wurde gelöscht oder rotated
- Permissions nicht ausreichend

## 9. Rate Limits

**Free Plan**: 100 Emails/Tag
**Essentials Plan**: 40.000 Emails/Monat ($15)
**Pro Plan**: 120.000 Emails/Monat ($60)

## 10. DSGVO Compliance

Für Production unbedingt hinzufügen:

- Unsubscribe Link in jedem Email
- Privacy Policy Link
- Impressum
- Email-Präferenzen im User Dashboard

## Code Locations

- **Email Library**: `/lib/sendgrid.ts`
- **Welcome Email**: `/app/api/welcome-email/route.ts`
- **Stripe Webhook**: `/app/api/stripe/webhook/route.ts`
- **ElevenLabs Webhook**: `/app/api/elevenlabs/webhook/route.ts`
