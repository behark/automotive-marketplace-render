import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '../../../../lib/simple-auth'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Nuk jeni të identifikuar', message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify JWT
    const user = verifyJWT(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Token i pavlefshëm', message: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json(
      { error: 'Gabim në marrjen e profilit', message: 'Profile fetch failed' },
      { status: 500 }
    )
  }
}