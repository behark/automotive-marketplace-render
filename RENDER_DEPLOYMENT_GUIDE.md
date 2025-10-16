# 🚀 Render Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables Setup
Copy the variables from `.env.production` to your Render service:

**In Render Dashboard:**
1. Go to your service → Environment tab
2. Click "Add Environment Variable"
3. Copy each variable from `.env.production`

**Critical Variables (MUST be set):**
- `DATABASE_URL` - Your Render PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your app URL (e.g., `https://your-app.onrender.com`)
- `STRIPE_SECRET_KEY` - Your Stripe live secret key
- `SENDGRID_API_KEY` or `RESEND_API_KEY` - For emails
- `OPENAI_API_KEY` - For AI features

### 2. Database Setup

**Create PostgreSQL Database:**
1. In Render Dashboard → New → PostgreSQL
2. Name: `automotive-marketplace-db`
3. Copy the connection string to `DATABASE_URL`

**Run Migrations:**
```bash
npm run db:migrate
```

### 3. Domain Configuration

**Custom Domain (Optional):**
1. In Render Dashboard → Settings → Custom Domains
2. Add your domain: `automarket.al`
3. Update `NEXTAUTH_URL` to your custom domain

### 4. Build Settings

**Render Build Configuration:**
- Build Command: `npm run build:production`
- Start Command: `npm start`
- Node Version: `18`

## Deployment Steps

### 1. Connect Repository
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select branch: `master` or `main`

### 2. Configure Service
```
Name: automotive-marketplace
Environment: Node
Region: Frankfurt (closest to Albania)
Build Command: npm run build:production
Start Command: npm start
```

### 3. Environment Variables
Set all variables from `.env.production` file

### 4. Deploy
Click "Create Web Service" - Render will automatically deploy

## Post-Deployment Verification

### 1. Health Checks
- [ ] Site loads: `https://your-app.onrender.com`
- [ ] Database connection works
- [ ] Authentication works
- [ ] Payment system works (test mode first)
- [ ] Email notifications work
- [ ] AI features work

### 2. Performance Testing
```bash
# Test production build locally first
npm run build:production
npm start
```

### 3. Security Verification
- [ ] HTTPS is enabled (automatic on Render)
- [ ] Environment variables are not exposed
- [ ] Database is protected
- [ ] API keys are secure

## Scaling Configuration

### Start Small (Free/Basic Tier)
```
RAM: 512MB
CPU: 0.1 CPU
Instances: 1
```

### Scale Up When Needed
```
RAM: 2GB
CPU: 1 CPU
Instances: 2+
Auto-Deploy: On
```

## Monitoring & Maintenance

### 1. Log Monitoring
- Check Render logs for errors
- Set up error alerts

### 2. Database Maintenance
- Regular backups (automatic on Render)
- Monitor connection pool
- Optimize queries as needed

### 3. Performance Monitoring
- Monitor response times
- Check memory usage
- Scale resources as traffic grows

## Troubleshooting

### Common Issues:

**Build Fails:**
```bash
# Check locally first
npm run build:production
```

**Database Connection Issues:**
- Verify `DATABASE_URL` format
- Check database is running
- Ensure migrations ran

**Environment Variables:**
- Double-check all required vars are set
- No spaces in variable names
- Sensitive data in quotes if needed

### Support Contacts:
- Render Support: https://render.com/docs/support
- Developer: Check GitHub issues

## Production Monitoring URLs
- **App**: https://your-app.onrender.com
- **Admin**: https://your-app.onrender.com/admin
- **API Health**: https://your-app.onrender.com/api/health
- **Database**: Render Dashboard → PostgreSQL service