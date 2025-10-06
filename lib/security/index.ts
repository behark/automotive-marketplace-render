/**
 * Comprehensive Trust, Safety & Verification System
 * for Albanian Automotive Marketplace
 *
 * This security suite implements:
 * - Albanian-specific user verification (phone, ID, bank, business)
 * - Multi-factor authentication with TOTP support
 * - Review and reputation system with Albanian language analysis
 * - Transaction security with escrow services for high-value sales
 * - Privacy protection and GDPR compliance
 * - Fraud prevention and stolen vehicle database integration
 * - Content moderation with Albanian language AI
 * - Legal compliance for Albanian, Kosovo, and Macedonia markets
 * - Safety features and meeting location recommendations
 */

// Core Services
export { AlbanianPhoneVerificationService } from './phone-verification'
export { AlbanianIdVerificationService } from './id-verification'
export { MFAService } from './mfa-service'
export { AlbanianBankVerificationService } from './bank-verification'

// Trust & Reputation
export { AlbanianReviewSystem } from './review-system'

// Transaction Security
export { EscrowService } from './escrow-service'

// Privacy & Protection
export { PrivacyProtectionService } from './privacy-protection'

// Fraud Prevention
export { FraudPreventionService } from './fraud-prevention'

// Content Safety
export { ContentModerationService } from './content-moderation'

// Legal Compliance
export { LegalComplianceService } from './legal-compliance'

// Safety Features
export { SafetyFeaturesService } from './safety-features'

/**
 * Security Configuration for Albanian Market
 */
export const SECURITY_CONFIG = {
  // Albanian market settings
  DEFAULT_COUNTRY: 'AL',
  SUPPORTED_COUNTRIES: ['AL', 'XK', 'MK'],
  DEFAULT_LANGUAGE: 'sq',
  DEFAULT_CURRENCY: 'EUR',

  // Verification thresholds
  MIN_ESCROW_AMOUNT: 15000 * 100, // €15,000 in cents
  HIGH_VALUE_THRESHOLD: 50000 * 100, // €50,000 in cents
  TRUST_SCORE_THRESHOLDS: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    EXCELLENT: 90
  },

  // Security limits
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
  MFA_TOKEN_WINDOW: 2, // TOTP time window

  // Content moderation
  AUTO_APPROVE_THRESHOLD: 0.2,
  AUTO_REJECT_THRESHOLD: 0.8,
  MANUAL_REVIEW_THRESHOLD: 0.5,

  // Albanian carriers
  PHONE_CARRIERS: {
    VODAFONE: 'vodafone_al',
    TELEKOM: 'telekom_al',
    ONE: 'one_al'
  },

  // Emergency contacts
  EMERGENCY_NUMBERS: {
    POLICE: '129',
    EMERGENCY: '112',
    HELPLINE: '127'
  }
} as const

/**
 * Security Event Types for Audit Logging
 */
export const SECURITY_EVENTS = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGIN_BLOCKED: 'login_blocked',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',

  // MFA
  MFA_SETUP: 'mfa_setup',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  MFA_REQUIRED: 'mfa_required',
  MFA_SUCCESS: 'mfa_success',
  MFA_FAILED: 'mfa_failed',

  // Verification
  PHONE_VERIFICATION_STARTED: 'phone_verification_started',
  PHONE_VERIFICATION_SUCCESS: 'phone_verification_success',
  ID_VERIFICATION_SUBMITTED: 'id_verification_submitted',
  ID_VERIFICATION_APPROVED: 'id_verification_approved',
  BANK_VERIFICATION_STARTED: 'bank_verification_started',
  BANK_VERIFICATION_SUCCESS: 'bank_verification_success',

  // Security alerts
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  HIGH_RISK_LOGIN: 'high_risk_login',
  FRAUD_ALERT: 'fraud_alert',
  ACCOUNT_COMPROMISED: 'account_compromised',

  // Privacy
  GDPR_REQUEST: 'gdpr_request',
  DATA_EXPORT: 'data_export',
  DATA_DELETION: 'data_deletion',
  PRIVACY_SETTINGS_UPDATED: 'privacy_settings_updated'
} as const

/**
 * Trust Score Calculation Utilities
 */
export class TrustScoreCalculator {
  static calculateBaseTrustScore(user: any): number {
    let score = 50 // Base score

    // Verification bonuses
    if (user.verification?.phoneVerified) score += 10
    if (user.verification?.idVerified) score += 15
    if (user.verification?.bankVerified) score += 10
    if (user.verification?.businessVerified) score += 10
    if (user.verification?.addressVerified) score += 5

    // Account age bonus
    const accountAge = Date.now() - new Date(user.createdAt).getTime()
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24)
    if (daysSinceCreation > 365) score += 5
    if (daysSinceCreation > 180) score += 3
    if (daysSinceCreation > 30) score += 2

    return Math.min(score, 100)
  }

  static adjustTrustScoreForActivity(baseScore: number, user: any): number {
    let adjustedScore = baseScore

    // Positive activities
    if (user.plan !== 'free') adjustedScore += 5
    if (user.twoFactorEnabled) adjustedScore += 5

    // Negative activities
    if (user.isBlocked) adjustedScore = 0
    if (user.trustScore < 20) adjustedScore = Math.max(adjustedScore - 20, 0)

    return Math.min(adjustedScore, 100)
  }
}

/**
 * Security Validation Utilities
 */
export class SecurityValidators {
  static isValidAlbanianPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\s+/g, '')
    return /^(\+355|355|0)?6[6-9]\d{7}$/.test(cleanPhone)
  }

  static isValidAlbanianID(idNumber: string): boolean {
    return /^[I][0-9]{8}[A-Z]$/.test(idNumber)
  }

  static isValidAlbanianPassport(passport: string): boolean {
    return /^AL[0-9]{7}$/.test(passport)
  }

  static isStrongPassword(password: string): boolean {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    )
  }

  static isValidVIN(vin: string): boolean {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin)
  }
}

/**
 * Security Risk Assessment
 */
export class RiskAssessment {
  static assessUserRisk(user: any): 'low' | 'medium' | 'high' | 'critical' {
    if (user.isBlocked) return 'critical'
    if (user.trustScore < 20) return 'high'
    if (user.trustScore < 40) return 'medium'
    return 'low'
  }

  static assessTransactionRisk(amount: number, buyer: any, seller: any): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0

    // Amount-based risk
    if (amount > 100000 * 100) riskScore += 30 // €100k+
    else if (amount > 50000 * 100) riskScore += 20 // €50k+
    else if (amount > 15000 * 100) riskScore += 10 // €15k+

    // User trust scores
    if (buyer.trustScore < 30) riskScore += 25
    if (seller.trustScore < 30) riskScore += 25

    // Verification levels
    if (buyer.verificationLevel === 'none') riskScore += 15
    if (seller.verificationLevel === 'none') riskScore += 15

    // Account age
    const buyerAge = Date.now() - new Date(buyer.createdAt).getTime()
    const sellerAge = Date.now() - new Date(seller.createdAt).getTime()
    if (buyerAge < 7 * 24 * 60 * 60 * 1000) riskScore += 10 // < 1 week
    if (sellerAge < 7 * 24 * 60 * 60 * 1000) riskScore += 10 // < 1 week

    // Determine risk level
    if (riskScore >= 80) return 'critical'
    if (riskScore >= 60) return 'high'
    if (riskScore >= 30) return 'medium'
    return 'low'
  }
}

/**
 * Compliance Helpers
 */
export class ComplianceHelpers {
  static getDataRetentionPeriod(dataType: string): number {
    // Days to retain data
    const periods = {
      user_data: 2555, // 7 years (legal requirement)
      transaction_data: 2555, // 7 years
      communication_data: 365, // 1 year
      verification_data: 1825, // 5 years
      security_logs: 1095, // 3 years
      content_moderation: 730 // 2 years
    }
    return periods[dataType as keyof typeof periods] || 365
  }

  static getGDPRRequestDeadline(requestType: string): number {
    // Days to process GDPR request
    const deadlines = {
      access: 30,
      rectification: 30,
      erasure: 30,
      portability: 30,
      restriction: 30
    }
    return deadlines[requestType as keyof typeof deadlines] || 30
  }
}

/**
 * Export all security services as a unified interface
 */
export class SecuritySuite {
  // Verification services
  static phone = AlbanianPhoneVerificationService
  static id = AlbanianIdVerificationService
  static mfa = MFAService
  static bank = AlbanianBankVerificationService

  // Trust & reputation
  static reviews = AlbanianReviewSystem

  // Transaction security
  static escrow = EscrowService

  // Privacy & protection
  static privacy = PrivacyProtectionService

  // Fraud prevention
  static fraud = FraudPreventionService

  // Content moderation
  static moderation = ContentModerationService

  // Legal compliance
  static legal = LegalComplianceService

  // Safety features
  static safety = SafetyFeaturesService

  // Utilities
  static trustScore = TrustScoreCalculator
  static validators = SecurityValidators
  static risk = RiskAssessment
  static compliance = ComplianceHelpers
  static config = SECURITY_CONFIG
  static events = SECURITY_EVENTS
}

export default SecuritySuite