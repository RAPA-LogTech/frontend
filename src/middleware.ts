import { NextRequest, NextResponse } from 'next/server'

function base64UrlDecode(str: string) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

export function middleware(req: NextRequest) {
  const idToken = req.cookies.get('id_token')?.value

  if (!idToken || isTokenExpired(idToken)) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!login|api/auth/cognito|_next/static|_next/image|favicon.ico|logo|images).*)'],
}
