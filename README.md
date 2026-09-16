# digital.HEROES — Level 1 PRD implementation

Next.js (App Router) + Supabase + Stripe subscription platform for golf scores, charity giving, and monthly prize draws.

## Setup

1. Create a **new Supabase project** and run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor.
2. Copy [`.env.example`](./.env.example) to `.env.local` and fill in keys.
3. In Supabase Auth, enable Email provider.
4. Create Stripe products/prices for monthly and yearly plans; add price IDs to env.
5. For Stripe webhooks locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test accounts

After signup, promote an admin in Supabase SQL:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Without Stripe configured, the subscribe page uses **demo activation** (development only) via `/api/dev/activate-subscription`.

## Deploy (PRD)

- New **Vercel** project pointing at `web/`
- Same Supabase project env vars in Vercel
- Stripe webhook URL: `https://your-domain/api/stripe/webhook`

## Assumptions

See [ASSUMPTIONS.md](./ASSUMPTIONS.md) for draw mechanics and pool math.

## Structure

- `src/app` — routes (public, dashboard, admin)
- `src/app/actions` — server actions
- `src/lib` — draw engine, prize pool, auth helpers
- `supabase/schema.sql` — database + RLS
