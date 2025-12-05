import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Next.js 16 requires proxy function instead of middleware
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

// Alternative default export
export default function(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
