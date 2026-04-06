import { NextRequest, NextResponse } from 'next/server'

async function makeSecretHash(username: string) {
  const clientId = process.env.COGNITO_CLIENT_ID!
  const clientSecret = process.env.COGNITO_CLIENT_SECRET!
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(clientSecret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(username + clientId))
  return Buffer.from(sig).toString('base64')
}

const cognitoUrl = `https://cognito-idp.${process.env.AWS_REGION ?? 'ap-northeast-2'}.amazonaws.com/`

export async function POST(req: NextRequest) {
  const body = await req.json()

  // 임시 비밀번호 변경 (NEW_PASSWORD_REQUIRED challenge 응답)
  if (body.session) {
    const { username, newPassword, session } = body
    const res = await fetch(cognitoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
      },
      body: JSON.stringify({
        ClientId: process.env.COGNITO_CLIENT_ID!,
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: session,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword,
          SECRET_HASH: await makeSecretHash(username),
        },
      }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message ?? '비밀번호 변경에 실패했습니다.' }, { status: 400 })
    return setTokenCookies(NextResponse.json({ ok: true }), data.AuthenticationResult)
  }

  // 일반 로그인
  const { username, password } = body
  const res = await fetch(cognitoUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: await makeSecretHash(username),
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.message ?? '로그인에 실패했습니다.' }, { status: 401 })

  // 임시 비밀번호 변경 필요
  if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return NextResponse.json({ challenge: 'NEW_PASSWORD_REQUIRED', session: data.Session, username })
  }

  return setTokenCookies(NextResponse.json({ ok: true }), data.AuthenticationResult)
}

function setTokenCookies(response: NextResponse, auth: { IdToken: string; AccessToken: string; RefreshToken: string; ExpiresIn: number }) {
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' }
  response.cookies.set('id_token', auth.IdToken, { ...opts, maxAge: auth.ExpiresIn })
  response.cookies.set('access_token', auth.AccessToken, { ...opts, maxAge: auth.ExpiresIn })
  response.cookies.set('refresh_token', auth.RefreshToken, { ...opts, maxAge: 60 * 60 * 24 * 30 })
  return response
}
