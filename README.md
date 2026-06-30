# Bollywood Riddle

Production-ready Bollywood movie guessing game built with Next.js 15, TypeScript, Tailwind CSS, ShadCN UI, Supabase, PostgreSQL, and Vercel.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in Supabase values.

3. Apply the Supabase migration:

```bash
supabase db push
```

4. Seed movies:

```bash
npm run seed
```

5. Run locally:

```bash
npm run dev
```

## Supabase Auth

Enable Google in Supabase Auth Providers and set the callback URL:

```text
https://your-domain.com/api/auth/callback
```

For local development:

```text
http://localhost:3000/api/auth/callback
```

## Vercel

Set these environment variables in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
ADMIN_PASSWORD
```

Deploy with:

```bash
vercel --prod
```
