import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateJWT } from '../../../../lib/simple-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'Email dhe fjalëkalimi janë të detyrueshme',
          message: 'Email and password are required'
        },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await authenticateUser(email.toLowerCase(), password)

    if (!user) {
      return NextResponse.json(
        {
          error: 'Email ose fjalëkalim të gabuar',
          message: 'Invalid email or password'
        },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateJWT(user)

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Identifikimi i suksesshëm!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

    // Set JWT as HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      {
        error: 'Gabim në identifikim',
        message: 'Login failed'
      },
      { status: 500 }
    )
  }
}