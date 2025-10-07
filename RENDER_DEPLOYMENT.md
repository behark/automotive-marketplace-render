# Render Deployment Guide

## Prerequisites

1. A [Render account](https://render.com)
2. This repository pushed to GitHub
3. Generated secrets (see below)

## Step 1: Generate Required Secrets

Before deploying, generate your `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Save this value - you'll need it in Step 3.

## Step 2: Create Services on Render

### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and create both services:
   - `automotive-marketplace` (Web Service)
   - `automotive-db` (PostgreSQL Database)

### Option B: Manual Setup

If you prefer manual setup:

1. **Create PostgreSQL Database:**
   - New + → PostgreSQL
   - Name: `automotive-db`
   - Database: `automotive`
   - User: `automotive_user`
   - Plan: Free

2. **Create Web Service:**
   - New + → Web Service
   - Connect your repository
   - Name: `automotive-marketplace`
   - Build Command: `npm ci && npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start Command: `npm start`

## Step 3: Configure Environment Variables

In the Render Dashboard for your web service, add these environment variables:

### Required Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Auto-set by Render |
| `DATABASE_URL` | *from database service* | Auto-linked if using Blueprint |
| `NEXTAUTH_SECRET` | *generated in Step 1* | **CRITICAL** - paste the value you generated |
| `NEXTAUTH_URL` | *your Render URL* | Auto-set by Render or use your custom domain |

### Optional Variables (for advanced features)

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_REDIS` | `false` | Enable Redis caching when traffic increases |
| `USE_ELASTICSEARCH` | `false` | Enable when you have 500+ listings |
| `USE_S3` | `false` | Enable AWS S3 for image storage |
| `MAX_IMAGES_PER_LISTING` | `5` | Limit images per listing |

### AI Features (Optional)

If using AI features, add:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
HUGGINGFACE_API_KEY=hf_...
```

### Payment Features (Optional)

If using Stripe payments:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Email Features (Optional)

If using email notifications:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

## Step 4: Deploy

1. **Automatic Deploy:**
   - Push to your `main` branch
   - Render will automatically build and deploy
   - Watch the build logs in the Render Dashboard

2. **Manual Deploy:**
   - Go to your web service in Render Dashboard
   - Click **"Manual Deploy"** → **"Deploy latest commit"**

## Step 5: Verify Deployment

Once deployed, check:

1. **Build Logs:** Look for any errors in the build process
2. **Database Connection:** Check that Prisma migrations ran successfully
3. **Application Health:** Visit your app URL and test:
   - Homepage loads
   - Sign up/Sign in works
   - Database queries work
   - Images load correctly

## Troubleshooting

### Build Fails with "Prisma Client not found"

**Solution:** Make sure your build command includes:
```bash
npx prisma generate && npx prisma migrate deploy
```

### "NEXTAUTH_SECRET is not defined" Error

**Solution:**
1. Generate a secret: `openssl rand -base64 32`
2. Add it to Environment Variables in Render Dashboard
3. Trigger a new deploy

### Database Connection Errors

**Solution:**
1. Verify `DATABASE_URL` is set (should auto-populate from database service)
2. Check database service is running
3. Ensure Prisma migrations completed successfully in build logs

### Images Not Loading

**Solution:**
1. Update `next.config.js` with your actual Render domain
2. Check that your domain matches in the `remotePatterns` section

### GeoIP Warnings (Non-critical)

You may see warnings about `geoip-country.dat` - these are non-critical and already handled with fallbacks in the code.

## Production Checklist

Before going live:

- [ ] All environment variables are set
- [ ] Database migrations completed successfully
- [ ] NEXTAUTH_SECRET is a strong random value
- [ ] Custom domain configured (optional)
- [ ] SSL certificate is active (automatic on Render)
- [ ] Email sending tested (if using email features)
- [ ] Payment processing tested (if using Stripe)
- [ ] AI features tested (if enabled)
- [ ] Monitoring enabled (Render provides basic monitoring)
- [ ] Backup strategy in place for database

## Scaling Up

When you're ready to scale:

1. **Add Redis:**
   - Create Redis service on Render
   - Set `USE_REDIS=true`
   - Add `REDIS_URL` from Redis service

2. **Upgrade Database:**
   - Switch to Starter ($7/month) or higher plan
   - More storage and connections

3. **Enable S3 Storage:**
   - Create AWS S3 bucket
   - Set `USE_S3=true`
   - Add AWS credentials

4. **Custom Domain:**
   - Add your domain in Render Dashboard
   - Update DNS settings
   - Update `NEXTAUTH_URL` to your domain

## Support

- **Render Issues:** [Render Support](https://render.com/docs)
- **Application Issues:** Check build logs and application logs in Render Dashboard
- **Database Issues:** Use Render's built-in PostgreSQL management tools

---

## Quick Reference: Environment Variables

Copy this template for easy setup:

```bash
# Required
NODE_ENV=production
DATABASE_URL=postgresql://...  # Auto-populated
NEXTAUTH_SECRET=  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=https://your-app.onrender.com  # Auto-populated

# Optional Features
USE_REDIS=false
USE_ELASTICSEARCH=false
USE_S3=false
MAX_IMAGES_PER_LISTING=5

# AI (Optional)
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# HUGGINGFACE_API_KEY=

# Payments (Optional)
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email (Optional)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASSWORD=
# SMTP_FROM=
```
