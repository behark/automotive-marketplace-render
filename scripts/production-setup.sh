#!/bin/bash

# Production Setup Script for Render Deployment
# Run this after deploying to Render to initialize the database

echo "🚀 Starting production setup..."

# Check if we're in production
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: NODE_ENV is not set to 'production'"
fi

# Check critical environment variables
echo "🔍 Checking environment variables..."

REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
)

missing_vars=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf ' - %s\n' "${missing_vars[@]}"
    exit 1
fi

echo "✅ All required environment variables are set"

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Check database connection
echo "🔌 Testing database connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.\$disconnect());
"

echo "🎉 Production setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Test your app: $NEXTAUTH_URL"
echo "2. Check health endpoint: $NEXTAUTH_URL/api/health"
echo "3. Monitor logs in Render dashboard"
echo ""
echo "🔒 Security reminder:"
echo "- All environment variables should be set in Render dashboard"
echo "- Never commit .env files with real credentials"
echo "- Regularly rotate API keys and secrets"