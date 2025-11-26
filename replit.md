# Voicall - AI Phone Assistant for Swiss Medical Practices

## Overview
Voicall is a Next.js application that provides AI-powered phone assistants for Swiss medical practices using ElevenLabs Conversational AI. The app allows practices to create custom AI agents that can handle phone calls 24/7, schedule appointments, and understand Swiss German.

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **Authentication**: Better Auth with email/password
- **Payments**: Stripe for subscriptions
- **AI Voice**: ElevenLabs Conversational AI
- **Email**: SendGrid for transactional emails
- **Styling**: Tailwind CSS with Radix UI components

## Project Structure
```
app/
├── (auth)/           # Login/register pages
├── (dashboard)/      # Protected dashboard pages
│   └── dashboard/
│       ├── agents/   # Agent CRUD (create, edit, test, list)
│       ├── calls/    # Call history and details
│       ├── settings/ # User settings
│       └── subscription/ # Billing management
├── api/              # API routes
│   ├── agent/        # Agent management
│   ├── agents/       # Agent creation
│   ├── calls/        # Call data
│   ├── elevenlabs/   # Webhook handler
│   ├── stripe/       # Payment webhooks
│   └── voices/       # Voice listing
components/
├── dashboard/        # Dashboard components
├── landing/          # Landing page sections
└── ui/               # Radix UI components
lib/
├── db/               # Database schema and connection
├── auth.ts           # Better Auth configuration
├── auth-client.ts    # Client-side auth
├── elevenlabs.ts     # ElevenLabs API functions
├── sendgrid.ts       # Email functions
├── stripe.ts         # Stripe configuration
└── utils.ts          # Utility functions
```

## Key Features
1. **Agent Management**: Create, edit, delete, and test AI phone agents
2. **ElevenLabs Integration**: Full API integration for conversational AI
3. **Call History**: View transcripts and call details from webhook data
4. **Subscription Tiers**: Starter (500 min), Pro (1500 min), Enterprise (unlimited)
5. **Usage Tracking**: Minutes used per billing cycle with alerts at 80%
6. **Zero PII-Retention**: No patient data stored - GDPR/DSG compliant
7. **Swiss German Support**: AI understands all Swiss dialects

## Unique Selling Points (USPs)
- **Zero PII-Retention Mode**: Patient data is never stored on servers - real-time processing only
- **Swiss German Understanding**: First AI assistant that understands Züritüütsch, Bärndütsch and all Swiss dialects
- **DSG/DSGVO Compliant**: Built for Swiss healthcare data protection requirements
- **Privacy-First Templates**: Pre-built compliant agent greetings for medical practices

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `ELEVENLABS_WEBHOOK_SECRET` - Webhook verification secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `SENDGRID_API_KEY` - SendGrid API key
- `NEXT_PUBLIC_APP_URL` - Application URL for redirects

## Development
```bash
npm run dev          # Start dev server on port 5000
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## Recent Changes
- Dashboard UI Restructure: Admin at top (admin-only), renamed Abo to Einstellungen with gear icon, user dropdown at bottom-left
- Voice Selection Enhanced: Shows language, use case, and description labels from ElevenLabs API
- Removed Settings Page: Consolidated under "Meine Agents"
- Simplified Admin Panel: Removed manual Agent ID assignment (now automatic via API)
- Added Compliance USPs: Hero trust badges (Zero PII-Retention + Schweizerdeutsch), dedicated Compliance section on landing page
- Added Dashboard Compliance Badge: Green status card showing active privacy protection
- Added Privacy Notice Template: One-click DSG/DSGVO-compliant greeting for agent creation
- Added Conversation Management: List and detail view for all ElevenLabs conversations including tests
- Added Dashboard Statistics: Shows personalized stats (total calls, calls today, minutes used, success rate) for each user's agents
- Fixed ElevenLabs Widget: Configured CSP headers and using @elevenlabs/convai-widget-embed package for agent testing
- Configured Next.js for Replit environment (port 5000, allowed origins)
- Set up PostgreSQL database with Drizzle ORM

## User Preferences
- Language: German (Swiss market)
- Currency: CHF
