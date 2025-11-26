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
1. **Admin-Managed Agent Workflow**: Admins create agents in ElevenLabs and assign them to customers
2. **Customer Agent Customization**: Customers can only edit Voice and First Message (greeting)
3. **ElevenLabs Integration**: Full API integration for conversational AI
4. **Call History**: View transcripts and call details from webhook data
5. **Subscription Tiers**: Starter (500 min), Pro (1500 min), Enterprise (unlimited)
6. **Usage Tracking**: Minutes used per billing cycle with alerts at 80%
7. **Zero PII-Retention**: No patient data stored - GDPR/DSG compliant
8. **Swiss German Support**: AI understands all Swiss dialects

## Agent Workflow
1. **Admin creates agent** in ElevenLabs dashboard (external)
2. **Admin assigns agent** to customer via Admin Panel (select user, select agent, assign)
3. **Customer edits** only Voice and First Message under "Meine Agents"
4. **Customer tests** agent via widget embed

**API Security:**
- `/api/agents/create` - Admin only
- `/api/agent/delete` - Admin only
- `/api/agents/[id]` PATCH - Non-admins restricted to voiceId + firstMessage only

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
- **Real-time Usage from ElevenLabs**: Dashboard and Settings pages now fetch usage data directly from ElevenLabs API when database has no call records
- **Improved Admin Panel**: Each agent displayed in a card with Name, Status Badge, Activate/Deactivate button, and Remove button on same row
- **Agent Unassign Feature**: Admins can now remove agents from users via trash icon button
- **ElevenLabs Data Sync**: Agent edit page syncs Voice, First Message, Name from ElevenLabs before displaying
- **Plan Display**: Dashboard header shows current plan with color-coded badge (Starter=blue, Pro=purple, Enterprise=gold)
- **Admin-Managed Agent Workflow**: Admins create agents in ElevenLabs, assign to users via Admin Panel
- **Simplified User Experience**: Customers can only edit Voice and First Message (greeting)
- **Backend Security**: Create/delete endpoints are admin-only, PATCH validates allowed fields
- Dashboard UI Restructure: Admin at top (admin-only), renamed Abo to Einstellungen with gear icon, user dropdown at bottom-left
- Voice Selection Enhanced: Shows language, use case, and description labels from ElevenLabs API
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
