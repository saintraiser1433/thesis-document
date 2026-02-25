import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isRootPage = req.nextUrl.pathname === '/'

    // Allow auth pages without authentication
    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return null
    }

    // Handle root page redirect
    if (isRootPage) {
      if (isAuth) {
        const role = token?.role
        if (['STUDENT', 'TEACHER'].includes(role as string)) {
          return NextResponse.redirect(new URL('/thesis/browse', req.url))
        }
        if (role === 'PEER_REVIEWER') {
          return NextResponse.redirect(new URL('/peer-reviewer/dashboard', req.url))
        }
        return NextResponse.redirect(new URL('/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/auth', req.url))
      }
    }

    // Protect other routes
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }

    // Role-based access control
    const role = token?.role
    const pathname = req.nextUrl.pathname

    // Dashboard access - ADMIN and PROGRAM_HEAD (PEER_REVIEWER has own dashboard)
    if (pathname.startsWith('/dashboard') && !['ADMIN', 'PROGRAM_HEAD'].includes(role as string)) {
      if (role === 'PEER_REVIEWER') {
        return NextResponse.redirect(new URL('/peer-reviewer/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/thesis/browse', req.url))
    }

    // Peer reviewer routes
    if (pathname.startsWith('/peer-reviewer') && !['PEER_REVIEWER', 'ADMIN'].includes(role as string)) {
      return NextResponse.redirect(new URL('/thesis/browse', req.url))
    }

    // Notifications - all authenticated roles
    if (pathname.startsWith('/notifications')) {
      return null
    }

    // Admin routes
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      if (['STUDENT', 'TEACHER'].includes(role as string)) {
        return NextResponse.redirect(new URL('/thesis/browse', req.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Program head routes
    if (pathname.startsWith('/program-head') && role !== 'PROGRAM_HEAD') {
      if (['STUDENT', 'TEACHER'].includes(role as string)) {
        return NextResponse.redirect(new URL('/thesis/browse', req.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Student/Teacher routes (browse, search, routing)
    if (pathname.startsWith('/thesis') && !['STUDENT', 'TEACHER', 'ADMIN'].includes(role as string)) {
      if (role === 'PEER_REVIEWER') {
        return NextResponse.redirect(new URL('/peer-reviewer/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow auth pages and root page without token
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
        const isRootPage = req.nextUrl.pathname === '/'
        
        if (isAuthPage || isRootPage) {
          return true
        }
        
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/admin/:path*',
    '/program-head/:path*',
    '/peer-reviewer/:path*',
    '/thesis/:path*',
    '/notifications/:path*',
    '/auth/:path*'
  ]
}
