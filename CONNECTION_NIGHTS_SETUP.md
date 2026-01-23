# Connection Nights Setup Guide

This guide will help you set up the Connection Nights volunteer scheduling system with Supabase (database) and Resend (email service).

## Overview

The Connection Nights system includes:
- A multi-step wizard for volunteers to request hosting opportunities
- Automatic email notifications to volunteers and staff
- Approval/denial workflow via email links
- Database storage for all requests

## Prerequisites

- Node.js 18+ installed
- A GitHub account (for deployment)
- Vercel or Netlify account (for serverless functions)

## Step 1: Set Up Supabase (Free Database)

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in the details:
   - **Name**: SupportWorks Housing
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free
4. Click "Create new project" and wait 2-3 minutes for setup

### Set Up the Database

1. In your Supabase dashboard, click on the **SQL Editor** in the left sidebar
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` from this repository
4. Paste it into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this means the tables were created successfully

### Get Your Supabase Credentials

1. In the Supabase dashboard, click on the **Settings** icon (gear) in the left sidebar
2. Click on **API** under Project Settings
3. You'll see two important values:
   - **Project URL** - Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public** key - Copy this
   - **service_role** key - Click "Reveal" and copy this (keep it secret!)

Save these values - you'll need them in the next step.

## Step 2: Set Up Resend (Free Email Service)

### Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address
3. Go to the [API Keys page](https://resend.com/api-keys)
4. Click "Create API Key"
5. Name it "SupportWorks Housing"
6. Copy the API key (you can only see it once!)

### Configure Your Domain (Optional but Recommended)

For production, you should use your own domain:

1. In Resend, go to **Domains**
2. Click "Add Domain"
3. Enter your domain (e.g., `supportworkshousing.org`)
4. Follow the DNS verification steps
5. Update the email templates in the API files to use your domain:
   - Change `noreply@supportworkshousing.org` to `noreply@yourdomain.com`

**For testing**, you can use Resend's test domain without verification, but emails will only be sent to your verified email address.

## Step 3: Deploy to Vercel (Recommended)

### Install Vercel CLI

```bash
npm install -g vercel
```

### Configure Your Project

1. Create a `vercel.json` file in your project root:

```json
{
  "functions": {
    "api/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

2. Create a `.env.local` file in your project root (for local development):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Resend Configuration
RESEND_API_KEY=your-resend-api-key-here

# App Configuration
VITE_APP_URL=http://localhost:5173
APP_URL=https://yourdomain.com
```

Replace the values with your actual credentials from Steps 1 and 2.

### Deploy to Vercel

1. Login to Vercel:
```bash
vercel login
```

2. Deploy your project:
```bash
vercel
```

3. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Choose your account
   - Link to existing project? **No**
   - Project name? **supportworkshousing**
   - Directory? **./`** (current directory)
   - Override settings? **No**

4. Add environment variables to Vercel:
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add RESEND_API_KEY
vercel env add APP_URL
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

For each variable, paste the value when prompted and select "Production, Preview, and Development".

5. Deploy to production:
```bash
vercel --prod
```

Your site will be live at `https://supportworkshousing.vercel.app` (or your custom domain).

## Step 4: Update Environment Variables

Once deployed, update the `APP_URL` environment variable in Vercel:

1. Go to your [Vercel dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `APP_URL` and update it to your actual production URL (e.g., `https://supportworkshousing.vercel.app`)
5. Click "Save"
6. Redeploy: `vercel --prod`

## Step 5: Test the System

### Test the Form Submission

1. Go to your deployed website
2. Scroll to the "Host a Connection Night" section
3. Fill out the form with test data
4. Submit the form
5. Check that you receive:
   - A receipt email (sent to the volunteer's email)
   - A notification email (sent to jsnook@supportworkshousing.org) with approve/deny links

### Test the Approval Workflow

1. Open the notification email sent to jsnook@supportworkshousing.org
2. Click the "Approve Request" button
3. Verify that:
   - The status updates in Supabase (check the `connection_nights` table)
   - The volunteer receives an approval email
   - jsnook@supportworkshousing.org is CC'd
   - The property manager receives a notification email

### Test the Denial Workflow

1. Submit another test request
2. Click the "Deny Request" button in the notification email
3. Enter an optional reason
4. Verify that:
   - The status updates in Supabase
   - The volunteer receives a denial email with the reason
   - jsnook@supportworkshousing.org is CC'd

## Alternative: Deploy to Netlify

If you prefer Netlify:

1. Create a `netlify.toml` file:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "api"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

2. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

3. Deploy:
```bash
netlify deploy --prod
```

4. Add environment variables in the Netlify dashboard under Site Settings → Environment Variables.

## Troubleshooting

### Emails Not Sending

1. Check that your Resend API key is correct
2. Verify your domain in Resend (for production)
3. Check the Resend dashboard for email logs
4. Make sure the `from` email address matches your verified domain

### Database Errors

1. Verify your Supabase credentials are correct
2. Check that the SQL schema was run successfully
3. Look at the Supabase logs in the dashboard
4. Ensure Row Level Security policies are enabled

### Approval Links Not Working

1. Make sure `APP_URL` environment variable is set correctly
2. Check that the serverless functions are deployed
3. Verify the token in the URL matches a record in the database

### Local Development

To run the system locally:

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file with your credentials (see Step 3)

3. Start the dev server:
```bash
npm run dev
```

4. For serverless functions to work locally, use:
```bash
vercel dev
```

This will run your site at `http://localhost:3000` with working API endpoints.

## Security Notes

- Never commit `.env.local` or any file with credentials to Git
- Keep your `SUPABASE_SERVICE_KEY` secret - it has full database access
- The `confirmation_token` ensures only people with the email link can approve/deny
- Consider adding rate limiting to prevent spam submissions
- For production, you may want to add CAPTCHA to the form

## Support

If you encounter issues:

1. Check the Vercel/Netlify function logs
2. Check the Supabase logs in the dashboard
3. Check the Resend email logs
4. Review the browser console for frontend errors

## Next Steps

- Add more locations and time slots in the ConnectionNights component
- Set up automated reminder emails 3 days before events
- Create an admin dashboard to view all requests
- Add calendar integration
- Implement event feedback collection

---

**Need help?** Contact jsnook@supportworkshousing.org
