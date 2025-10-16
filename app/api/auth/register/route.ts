import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateJWT } from '../../../../lib/simple-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password } = body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        {
          error: 'Të gjitha fushat janë të detyrueshme',
          message: 'All fields are required'
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: 'Fjalëkalimi duhet të jetë të paktën 8 karaktere',
          message: 'Password must be at least 8 characters'
        },
        { status: 400 }
      )
    }

    // Password strength validation
    const hasLetter = /[A-Za-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasLetter || !hasNumber || !hasSymbol) {
      return NextResponse.json(
        {
          error: 'Fjalëkalimi duhet të përmbajë shkronja, numra dhe simbole',
          message: 'Password must contain letters, numbers and symbols'
        },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password
    })

    // Generate JWT token
    const token = generateJWT(user)

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Llogaria u krijua me sukses!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 })

    // Set JWT as HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof Error && error.message === 'User already exists') {
      return NextResponse.json(
        {
          error: 'Një llogari me këtë email tashmë ekziston',
          message: 'User already exists'
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'Gabim në krijimin e llogarisë',
        message: 'Registration failed'
      },
      { status: 500 }
    )
  }
}