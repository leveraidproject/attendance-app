# Attendance app (time in / time out)

Built with Next.js, Tailwind CSS and Supabase.

## Settings you must add (Vercel > Settings > Environment Variables)

| Name | Where to find the value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Connect (or Data API) > Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase > Project Settings > API Keys > Publishable key |

Never use the secret key in this app.

## Change the company name
Open `lib/config.js` and edit `COMPANY_NAME`.

## Make someone an admin
In Supabase > SQL Editor, run (use the person's email):

    update public.profiles set role = 'admin' where email = 'their-email@example.com';

## Run on your own computer (optional)
1. Install Node.js (LTS).
2. Copy `.env.example` to `.env.local` and fill in the two values.
3. Run `npm install` then `npm run dev`, and open http://localhost:3000
