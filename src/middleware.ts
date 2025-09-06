import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js middleware for authentication and access control on /polls routes.
 *
 * Ensures only authenticated users can access private poll routes, while allowing public polls to be viewed by anyone. Redirects unauthenticated users to login and prevents logged-in users from accessing login/register pages.
 * Supabase is configured with public and private polls; user authentication is managed via Supabase cookies. Polls may be public or private.
 * Handles missing cookies, invalid poll IDs, and public poll access. Ensures correct redirects for both authenticated and unauthenticated users.
 * Runs before all /polls routes, protecting pages rendered by PollList, PollCard, PollForm, and related components. Integrates with Supabase SSR client for server-side auth checks.
 */
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/polls")) {
    let response = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // 👈 use anon key here
      {
        cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    const url = request.nextUrl;
    
    // Check if this is a specific poll page that might be public
    const pollIdMatch = url.pathname.match(/\/polls\/([\w-]+)$/);
    
    if (pollIdMatch) {
      // This is a specific poll page, check if it's public
      const pollId = pollIdMatch[1];
      const { data: poll } = await supabase
        .from('polls')
        .select('is_public')
        .eq('id', pollId)
        .single();
      
      // If the poll exists and is public, allow access without authentication
      if (poll && poll.is_public) {
        return response;
      }
    }
   
    // For all other poll routes, require authentication
    if (!user && !url.pathname.startsWith("/auth")) {
      console.log('No auth cookie found, redirecting to login');
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if ((url.pathname === "/auth/login" || url.pathname === "/auth/register") && user) {
      return NextResponse.redirect(new URL("/polls", request.url));
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run only on /polls routes
export const config = {
  matcher: [
    '/polls',
    '/polls/:path*',
    '/polls/:id',
    '/polls/:id/:action'
  ],
};