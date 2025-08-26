# Polling App

A Next.js 15 (App Router) application with Supabase authentication and shadcn/ui components. The homepage shows a login form when unauthenticated and the default content when signed in.

## Tech stack
- Next.js 15 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui (button, input, label, card)
- Supabase Auth (@supabase/supabase-js)

## Getting started

1) Install dependencies
```bash
npm install
```

2) Create environment file
- Copy `.env.example` to `.env.local` and fill in your values:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```
Notes:
- Use your Supabase project's URL (no trailing slash) and anon key from Dashboard → Project Settings → API.
- Restart the dev server after changing env vars.

3) Run the dev server
```bash
npm run dev
```
Open http://localhost:3000

## Authentication
- Auth context: `src/context/AuthContext.tsx` provides `useAuth()` with `{ user, session, loading, signOut }`.
- Supabase client: `src/lib/supabaseClient.ts` exposes a lazy `getSupabaseClient()` that returns `null` if env vars are missing (prevents build-time failures).
- Login form: `src/components/LoginForm.tsx` uses shadcn/ui and Supabase `signInWithPassword`.
- Homepage gating: `src/app/page.tsx` renders `LoginForm` if `user` is null; otherwise shows the default content.

Example usage in client components:
```tsx
"use client";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Not signed in</p>;
  return (
    <div>
      <p>{user.email}</p>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}
```

## Project structure
```
src/
  app/
    auth/
      login/page.tsx     # Login page (renders LoginForm)
      register/page.tsx  # Register placeholder
    layout.tsx           # Wrapped with AuthProvider
    page.tsx             # Home, gated by auth
  components/
    LoginForm.tsx        # shadcn/ui + Supabase login
    ui/                  # shadcn/ui components
  context/
    AuthContext.tsx      # AuthProvider + useAuth
  lib/
    supabaseClient.ts    # Lazy supabase client
    utils.ts             # shadcn/ui util (cn)
```

## Available scripts
- `npm run dev`: Start Next.js dev server with Turbopack
- `npm run build`: Build production bundle
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Adding UI components (shadcn/ui)
You can add more components with the CLI:
```bash
npx shadcn@latest add badge textarea select dialog
```

## Common issues
- Supabase not configured: Ensure `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Restart the dev server after editing.
- Env not picked up in prod: Re-run `npm run build` so Next.js inlines `NEXT_PUBLIC_*` variables.

## Deployment
- Any platform that supports Next.js. For Vercel, set the same env vars in project settings.

## License
MIT
