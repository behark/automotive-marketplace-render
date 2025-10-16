#!/bin/bash

# Script to baseline production database on Render
# This marks existing migrations as already applied

echo "🔧 Baselining Production Database..."
echo ""
echo "⚠️  Make sure you've set DATABASE_URL to your Render production database!"
echo ""
echo "Your DATABASE_URL should look like:"
echo "postgresql://auto_ani_database_user:PASSWORD@dpg-d3i0pn33fgac73a64kog-a:5432/auto_ani_database"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set!"
    echo ""
    echo "Set it with:"
    echo "export DATABASE_URL='your-render-database-url'"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Show current migration status
echo "📊 Checking current migration status..."
npx prisma migrate status

echo ""
echo "🎯 Marking migrations as applied..."

# Mark first migration as applied
echo "Resolving: 20251006170121_init"
npx prisma migrate resolve --applied 20251006170121_init

# Mark second migration as applied
echo "Resolving: 20251006180340_production_features"
npx prisma migrate resolve --applied 20251006180340_production_features

echo ""
echo "📊 Checking migration status again..."
npx prisma migrate status

echo ""
echo "✅ Done! Your database is now baselined."
echo ""
echo "Next steps:"
echo "1. Go back to Render dashboard"
echo "2. Trigger a manual deploy"
echo "3. Migrations should now work!"
