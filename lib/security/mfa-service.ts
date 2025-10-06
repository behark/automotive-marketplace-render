import { PrismaClient } from '@prisma/client'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * Multi-Factor Authentication Service for Albanian Users
 * Supports TOTP (Google Authenticator, Authy) with Albanian language support
 */
export class MFAService {
  private static readonly APP_NAME = 'AutoMjetet.al'
  private static readonly ISSUER = 'AutoMjetet.al'

  /**
   * Generate MFA secret for new user
   */
  static generateMFASecret(userEmail: string): {
    secret: string
    qrCodeUrl: string
    manualEntryKey: string
  } {
    const secret = speakeasy.generateSecret({
      name: `${this.APP_NAME} (${userEmail})`,
      issuer: this.ISSUER,
      length: 32
    })

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!,
      manualEntryKey: secret.base32
    }
  }

  /**
   * Setup MFA for user
   */
  static async setupMFA(userId: string): Promise<{
    success: boolean
    qrCodeDataUrl?: string
    manualEntryKey?: string
    backupCodes?: string[]
    error?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      })

      if (!user?.email) {
        return { success: false, error: 'Përdoruesi nuk u gjet' }
      }

      // Generate MFA secret
      const mfaData = this.generateMFASecret(user.email)

      // Generate backup codes
      const backupCodes = this.generateBackupCodes()

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(mfaData.qrCodeUrl)

      // Store encrypted secret and backup codes
      await prisma.userVerification.upsert({
        where: { userId },
        create: {
          userId,
          mfaSecret: this.encryptSecret(mfaData.secret),
          mfaBackupCodes: backupCodes
        },
        update: {
          mfaSecret: this.encryptSecret(mfaData.secret),
          mfaBackupCodes: backupCodes,
          mfaEnabled: false // Will be enabled after verification
        }
      })

      return {
        success: true,
        qrCodeDataUrl,
        manualEntryKey: mfaData.manualEntryKey,
        backupCodes
      }
    } catch (error) {
      console.error('MFA setup failed:', error)
      return { success: false, error: 'Konfigurimi i MFA dështoi' }
    }
  }

  /**
   * Verify MFA setup with initial code
   */
  static async verifyMFASetup(
    userId: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const verification = await prisma.userVerification.findUnique({
        where: { userId }
      })

      if (!verification?.mfaSecret) {
        return { success: false, error: 'MFA nuk është konfiguruar' }
      }

      const secret = this.decryptSecret(verification.mfaSecret)

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2 // Allow some time drift
      })

      if (!verified) {
        return { success: false, error: 'Kodi i verifikimit është i gabuar' }
      }

      // Enable MFA
      await prisma.userVerification.update({
        where: { userId },
        data: {
          mfaEnabled: true,
          mfaSetupAt: new Date()
        }
      })

      // Update user MFA status
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true
        }
      })

      return { success: true }
    } catch (error) {
      console.error('MFA verification failed:', error)
      return { success: false, error: 'Verifikimi i MFA dështoi' }
    }
  }

  /**
   * Verify MFA token during login
   */
  static async verifyMFAToken(
    userId: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const verification = await prisma.userVerification.findUnique({
        where: { userId }
      })

      if (!verification?.mfaSecret || !verification.mfaEnabled) {
        return { success: false, error: 'MFA nuk është aktivizuar' }
      }

      // Check if it's a backup code
      if (token.length === 8 && /^[A-Z0-9]{8}$/.test(token)) {
        return this.verifyBackupCode(userId, token, verification.mfaBackupCodes as string[])
      }

      // Verify TOTP token
      const secret = this.decryptSecret(verification.mfaSecret)

      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2
      })

      if (!verified) {
        return { success: false, error: 'Kodi i verifikimit është i gabuar ose ka skaduar' }
      }

      return { success: true }
    } catch (error) {
      console.error('MFA token verification failed:', error)
      return { success: false, error: 'Verifikimi i MFA dështoi' }
    }
  }

  /**
   * Verify backup code
   */
  private static async verifyBackupCode(
    userId: string,
    code: string,
    backupCodes: string[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!backupCodes.includes(code)) {
      return { success: false, error: 'Kodi i rezervës është i gabuar' }
    }

    // Remove used backup code
    const updatedCodes = backupCodes.filter(c => c !== code)

    await prisma.userVerification.update({
      where: { userId },
      data: {
        mfaBackupCodes: updatedCodes
      }
    })

    // Warn user if running low on backup codes
    if (updatedCodes.length <= 2) {
      // In production, send notification about low backup codes
      console.log(`User ${userId} has ${updatedCodes.length} backup codes remaining`)
    }

    return { success: true }
  }

  /**
   * Disable MFA for user
   */
  static async disableMFA(
    userId: string,
    currentToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify current token before disabling
      const verification = await this.verifyMFAToken(userId, currentToken)
      if (!verification.success) {
        return { success: false, error: 'Kodi i verifikimit është i gabuar' }
      }

      // Disable MFA
      await prisma.userVerification.update({
        where: { userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: null,
          mfaSetupAt: null
        }
      })

      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false
        }
      })

      return { success: true }
    } catch (error) {
      console.error('MFA disable failed:', error)
      return { success: false, error: 'Çaktivizimi i MFA dështoi' }
    }
  }

  /**
   * Generate new backup codes
   */
  static async generateNewBackupCodes(
    userId: string,
    currentToken: string
  ): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
    try {
      // Verify current token
      const verification = await this.verifyMFAToken(userId, currentToken)
      if (!verification.success) {
        return { success: false, error: 'Kodi i verifikimit është i gabuar' }
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes()

      await prisma.userVerification.update({
        where: { userId },
        data: {
          mfaBackupCodes: backupCodes
        }
      })

      return { success: true, backupCodes }
    } catch (error) {
      console.error('Backup codes generation failed:', error)
      return { success: false, error: 'Gjenerimi i kodeve të rezervës dështoi' }
    }
  }

  /**
   * Generate backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
    }
    return codes
  }

  /**
   * Encrypt MFA secret
   */
  private static encryptSecret(secret: string): string {
    const key = process.env.MFA_ENCRYPTION_KEY || 'fallback-mfa-key'
    const cipher = crypto.createCipher('aes-256-cbc', key)
    let encrypted = cipher.update(secret, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }

  /**
   * Decrypt MFA secret
   */
  private static decryptSecret(encryptedSecret: string): string {
    const key = process.env.MFA_ENCRYPTION_KEY || 'fallback-mfa-key'
    const decipher = crypto.createDecipher('aes-256-cbc', key)
    let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  /**
   * Check if user has MFA enabled
   */
  static async isMFAEnabled(userId: string): Promise<boolean> {
    const verification = await prisma.userVerification.findUnique({
      where: { userId },
      select: { mfaEnabled: true }
    })

    return verification?.mfaEnabled || false
  }

  /**
   * Get MFA status for user
   */
  static async getMFAStatus(userId: string): Promise<{
    enabled: boolean
    setupAt?: Date
    backupCodesRemaining?: number
  }> {
    const verification = await prisma.userVerification.findUnique({
      where: { userId },
      select: {
        mfaEnabled: true,
        mfaSetupAt: true,
        mfaBackupCodes: true
      }
    })

    return {
      enabled: verification?.mfaEnabled || false,
      setupAt: verification?.mfaSetupAt || undefined,
      backupCodesRemaining: verification?.mfaBackupCodes
        ? (verification.mfaBackupCodes as string[]).length
        : 0
    }
  }
}