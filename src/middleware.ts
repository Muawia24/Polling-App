import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from "@supabase/ssr";

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
    
    
   
    if (!user && !request.nextUrl.pathname.startsWith("/auth")) {
      console.log('No auth cookie found');
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
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