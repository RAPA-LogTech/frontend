import { NextRequest, NextResponse } from 'next/server'

export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', req.url))
  for (const name of ['id_token', 'access_token', 'refresh_token']) {
    res.cookies.set(name, '', { maxAge: 0, path: '/' })
  }
  return res
}
