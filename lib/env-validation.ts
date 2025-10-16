/**
 * Environment Variable Validation for Production
 * Ensures all critical variables are present at startup
 */

interface EnvConfig {
  required: string[]
  optional: string[]
  production: string[]
}

const envConfig: EnvConfig = {
  // Always required
  required: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ],

  // Optional but recommended
  optional: [
    'SENDGRID_API_KEY',
    'RESEND_API_KEY',
    'OPENAI_API_KEY',
    'HUGGINGFACE_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ],

  // Required only in production
  production: [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY'
  ]
}

export function validateEnvironment(): {
  isValid: boolean
  missing: string[]
  warnings: string[]
} {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required variables
  envConfig.required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  })

  // Check production variables in production
  if (process.env.NODE_ENV === 'production') {
    envConfig.production.forEach(varName => {
      if (!process.env[varName]) {
        missing.push(varName)
      }
    })
  }

  // Check optional variables (warnings only)
  envConfig.optional.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`Optional variable ${varName} not set`)
    }
  })

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  }
}

export function logEnvironmentStatus(): void {
  const validation = validateEnvironment()

  if (!validation.isValid) {
    console.error('❌ Environment validation failed!')
    console.error('Missing required variables:', validation.missing)

    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${validation.missing.join(', ')}`)
    }
  } else {
    console.log('✅ Environment validation passed')
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:')
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
}

// Auto-validate in production
if (process.env.NODE_ENV === 'production' && process.env.SKIP_ENV_VALIDATION !== 'true') {
  logEnvironmentStatus()
}