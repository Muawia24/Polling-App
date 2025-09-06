# Polling App

Welcome to the Polling App! This project is a modern web application built with Next.js 15 (App Router), Supabase authentication, and shadcn/ui components. The app lets users register, create polls, and share them via unique links and QR codes for others to vote on. The homepage shows a login form when unauthenticated and the default content when signed in.

## Project Overview & Purpose

The Polling App enables easy creation and sharing of polls. Users can:
- Register and log in securely (Supabase Auth)
- Create polls and share them via links or QR codes
- Vote on polls and view results in real time

This project is ideal for classrooms, events, or any scenario where quick, interactive polling is needed.

## Tech Stack & Dependencies

- **Next.js 15** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** (button, input, label, card)
- **Supabase Auth** (`@supabase/supabase-js`)
- **Jest** & **React Testing Library** (for tests)

See [package.json](package.json) for full dependency versions.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Muawia24/polling-app.git
cd polling-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

- Copy `.env.example` to `.env.local` and fill in your Supabase project values:

```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```
Get these from your Supabase dashboard (Project Settings → API).  
**Note:** Restart the dev server after changing env vars.

### 4. Run the development server

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting Started & Example Usage

After starting the dev server, you’ll see the login form.  
Example usage in a client component:

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

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` – Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Your Supabase anon key

See [.env.example](.env.example) for the template.

## Project Structure

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

## Scripts

- `npm run dev` – Start Next.js dev server with Turbopack
- `npm run build` – Build production bundle
- `npm run start` – Start production server
- `npm run lint` – Run ESLint

## Running Tests

This project uses **Jest** and **React Testing Library**.

To run all tests:

```bash
npm test
```

Test files are located in:
- `src/lib/__tests__/` – Utility and server action tests
- `src/app/__tests__/` – Integration tests
- `src/components/__tests__/` – Component tests

See [TESTING.md](TESTING.md) for more details.

## Adding UI Components (shadcn/ui)

You can add more components with the CLI:

```bash
npx shadcn@latest add badge textarea select dialog
```

## Common Issues

- **Supabase not configured:** Ensure `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Restart the dev server after editing.
- **Env not picked up in prod:** Re-run `npm run build` so Next.js inlines `NEXT_PUBLIC_*` variables.

## Deployment

You can deploy to any platform that supports Next.js.  
For Vercel, set the same env vars in project settings.

## Contributing

We welcome contributions!  
- Please check [issues](https://github.com/Muawia24/polling-app/issues) for bugs and feature requests.
- See [TESTING.md](TESTING.md) for testing guidelines.
- Roadmap and docs coming soon.

Feel free to open a PR or start a discussion if you have ideas or questions.
