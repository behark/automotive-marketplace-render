import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Rate limiting storage (in-memory for now, use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
const RATE_LIMITS = {
  '/api/auth/register': { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  '/api/listings': { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  '/api/upload': { requests: 20, windowMs: 60 * 1000 }, // 20 uploads per minute
  '/api/messages': { requests: 50, windowMs: 15 * 60 * 1000 }, // 50 messages per 15 minutes
  '/api/favorites': { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 favorite actions per 15 minutes
}

function checkRateLimit(ip: string, path: string): boolean {
  const limit = RATE_LIMITS[path as keyof typeof RATE_LIMITS]
  if (!limit) return true // No rate limit for this path

  const key = `${ip}:${path}`
  const now = Date.now()
  const record = rateLimit.get(key)

  if (!record || now > record.resetTime) {
    // Reset the rate limit window
    rateLimit.set(key, {
      count: 1,
      resetTime: now + limit.windowMs
    })
    return true
  }

  if (record.count >= limit.requests) {
    return false // Rate limit exceeded
  }

  // Increment the count
  record.count++
  return true
}

export async function middleware(request: NextRequest) {
  // Get client IP
  const ip = request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'anonymous'

  // Security headers
  const response = NextResponse.next()

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self';"
  )

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=*')

  // API route protection
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Rate limiting
    const path = request.nextUrl.pathname
    if (!checkRateLimit(ip, path)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900' // 15 minutes
          }
        }
      )
    }

    // Validate Content-Type for POST requests
    if (request.method === 'POST' && !request.nextUrl.pathname.includes('/upload')) {
      const contentType = request.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return new Response(
          JSON.stringify({ error: 'Content-Type must be application/json' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  }

  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ req: request })

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Check if user is admin (you might need to fetch user role from database)
    // For now, we'll allow access and check permissions in the API routes
  }

  // Protected routes
  const protectedPaths = ['/dashboard', '/messages', '/favorites', '/sell']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath) {
    const token = await getToken({ req: request })

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded files)
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
}