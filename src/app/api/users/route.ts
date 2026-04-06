import { NextRequest, NextResponse } from 'next/server'
import { CognitoIdentityProviderClient, ListUsersCommand, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider'

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION ?? 'ap-northeast-2' })
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!

export async function GET() {
  try {
    const { Users = [] } = await cognito.send(new ListUsersCommand({ UserPoolId: USER_POOL_ID }))
    const users = Users.map(u => ({
      username: u.Username,
      email: u.Attributes?.find(a => a.Name === 'email')?.Value ?? '',
      status: u.UserStatus,
      enabled: u.Enabled,
      createdAt: u.UserCreateDate,
    }))
    return NextResponse.json({ users })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '유저 목록 조회에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, tempPassword } = await req.json()
    if (!email || !tempPassword) {
      return NextResponse.json({ error: '이메일과 임시 비밀번호는 필수입니다.' }, { status: 400 })
    }
    await cognito.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      TemporaryPassword: tempPassword,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
    }))
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '유저 생성에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
