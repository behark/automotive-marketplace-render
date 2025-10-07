import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { MFAService } from './security/mfa-service'
// Graceful import for build compatibility
let geoip: any
try {
  geoip = require('geoip-lite')
} catch (error) {
  console.warn('GeoIP lookup not available:', error)
  geoip = { lookup: () => null }
}
import UAParser from 'ua-parser-js'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        mfaToken: { label: 'MFA Token', type: 'text' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { verification: true }
          })

          if (!user) {
            await logSecurityEvent(null, 'login_failed', 'User not found', req)
            return null
          }

          // Check if user is blocked
          if (user.isBlocked) {
            await logSecurityEvent(user.id, 'login_blocked', user.blockReason || 'Account blocked', req)
            return null
          }

          // Verify password
          if (!user.password) {
            await logSecurityEvent(user.id, 'login_failed', 'No password set', req)
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            await logSecurityEvent(user.id, 'login_failed', 'Invalid password', req)
            return null
          }

          // Check if MFA is required
          if (user.twoFactorEnabled) {
            if (!credentials.mfaToken) {
              await logSecurityEvent(user.id, 'mfa_required', 'MFA token required', req)
              throw new Error('MFA_REQUIRED')
            }

            const mfaResult = await MFAService.verifyMFAToken(user.id, credentials.mfaToken)
            if (!mfaResult.success) {
              await logSecurityEvent(user.id, 'mfa_failed', 'Invalid MFA token', req)
              return null
            }
          }

          // Risk assessment
          const riskLevel = await assessLoginRisk(user, req)
          if (riskLevel === 'high') {
            await logSecurityEvent(user.id, 'high_risk_login', 'High risk login detected', req)
            // In production, you might require additional verification
          }

          // Update last active
          await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() }
          })

          await logSecurityEvent(user.id, 'login_success', 'Successful login', req)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            trustScore: user.trustScore,
            verificationLevel: user.verificationLevel
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'MFA_REQUIRED') {
            throw error
          }
          console.error('Auth error:', error)
          return null
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        await logSecurityEvent(token.sub, 'logout', 'User logged out', null)
      }
    }
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.trustScore = user.trustScore
        token.verificationLevel = user.verificationLevel
      }

      // Check if user is still valid on each token refresh
      if (token.id) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isBlocked: true, role: true, trustScore: true, verificationLevel: true }
        })

        if (currentUser?.isBlocked) {
          // Force logout by returning empty token
          return {}
        }

        // Update token with latest user data
        if (currentUser) {
          token.role = currentUser.role
          token.trustScore = currentUser.trustScore
          token.verificationLevel = currentUser.verificationLevel
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.trustScore = token.trustScore as number
        session.user.verificationLevel = token.verificationLevel as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Additional sign-in validation
      if (account?.provider === 'google') {
        // For Google OAuth, ensure email is verified
        if (!profile?.email_verified) {
          return false
        }

        // Create user verification record for OAuth users
        if (user.id) {
          await prisma.userVerification.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {}
          })
        }
      }

      return true
    }
  }
}

/**
 * Log security events for audit trail
 */
async function logSecurityEvent(
  userId: string | null,
  eventType: string,
  description: string,
  req: any
): Promise<void> {
  try {
    // Extract request information
    const ipAddress = getClientIP(req)
    const userAgent = req?.headers?.['user-agent'] || ''
    const location = ipAddress ? geoip.lookup(ipAddress) : null
    const ua = new UAParser(userAgent)

    // Assess risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    const riskFactors: string[] = []

    if (eventType.includes('failed')) {
      riskLevel = 'medium'
      riskFactors.push('authentication_failure')
    }

    if (location && location.country !== 'AL' && location.country !== 'XK' && location.country !== 'MK') {
      riskLevel = 'high'
      riskFactors.push('foreign_country_login')
    }

    if (eventType === 'high_risk_login') {
      riskLevel = 'critical'
    }

    await prisma.securityLog.create({
      data: {
        userId,
        eventType,
        eventDescription: description,
        ipAddress,
        userAgent,
        location: location ? `${location.city}, ${location.country}` : null,
        riskLevel,
        riskFactors,
        metadata: {
          browser: ua.getBrowser(),
          os: ua.getOS(),
          device: ua.getDevice()
        }
      }
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Assess login risk based on various factors
 */
async function assessLoginRisk(user: any, req: any): Promise<'low' | 'medium' | 'high'> {
  const ipAddress = getClientIP(req)
  const userAgent = req?.headers?.['user-agent'] || ''

  let riskScore = 0

  // Check for unusual location
  const location = ipAddress ? geoip.lookup(ipAddress) : null
  if (location && location.country !== 'AL' && location.country !== 'XK' && location.country !== 'MK') {
    riskScore += 30
  }

  // Check for recent failed login attempts
  const recentFailures = await prisma.securityLog.count({
    where: {
      userId: user.id,
      eventType: 'login_failed',
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  })

  if (recentFailures > 3) {
    riskScore += 40
  } else if (recentFailures > 1) {
    riskScore += 20
  }

  // Check for suspicious user agent patterns
  if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler')) {
    riskScore += 50
  }

  // Check user's trust score
  if (user.trustScore < 30) {
    riskScore += 20
  }

  // Determine risk level
  if (riskScore >= 70) return 'high'
  if (riskScore >= 40) return 'medium'
  return 'low'
}

/**
 * Extract client IP address from request
 */
function getClientIP(req: any): string | null {
  if (!req) return null

  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null
  )
}