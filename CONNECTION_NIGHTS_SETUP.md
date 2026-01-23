# Connection Nights Setup Guide

This guide will walk you through setting up the Connection Nights volunteer request system, which includes a form, database storage, and automated email notifications.

## Overview

The Connection Nights feature includes:
- **Volunteer Form**: A user-friendly form for submitting volunteer requests
- **Database**: Supabase for storing and managing requests
- **Email System**: EmailJS for automated email notifications
- **Admin Approval**: Email links for approving/denying requests
- **Status Updates**: Automated confirmation emails to volunteers

## Prerequisites

- Node.js installed (v16 or higher)
- A Supabase account (free tier is sufficient)
- An EmailJS account (free tier is sufficient)
- Access to the SupportWorks Housing Gmail account (for sending emails)

---

## Step 1: Set Up Supabase Database

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account
2. Click "New Project"
3. Fill in the project details:
   - **Name**: SupportWorks Housing
   - **Database Password**: (create a strong password and save it securely)
   - **Region**: Choose the closest to Virginia (e.g., East US)
4. Click "Create new project" and wait for it to initialize (takes ~2 minutes)

### 1.2 Create the Database Table

1. Once your project is ready, go to the **SQL Editor** in the left sidebar
2. Click "New Query"
3. Copy and paste this SQL code:

```sql
-- Create the volunteer_requests table
CREATE TABLE volunteer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  group_size INTEGER NOT NULL,
  organization TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE volunteer_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for form submissions)
CREATE POLICY "Allow public inserts" ON volunteer_requests
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow public reads (needed for confirmation page)
CREATE POLICY "Allow public reads" ON volunteer_requests
  FOR SELECT TO anon
  USING (true);

-- Allow public updates (for status changes from confirmation links)
CREATE POLICY "Allow public updates" ON volunteer_requests
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_volunteer_requests_email ON volunteer_requests(email);
CREATE INDEX idx_volunteer_requests_status ON volunteer_requests(status);
CREATE INDEX idx_volunteer_requests_created_at ON volunteer_requests(created_at DESC);
```

4. Click "Run" to execute the SQL
5. You should see "Success. No rows returned" - this means the table was created successfully

### 1.3 Get Your Supabase Credentials

1. Go to **Project Settings** (gear icon in the left sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public key**: Copy this (long string starting with `eyJ...`)
4. Save these values - you'll need them in Step 3

---

## Step 2: Set Up EmailJS

### 2.1 Create an EmailJS Account

1. Go to [https://www.emailjs.com](https://www.emailjs.com)
2. Click "Sign Up" and create a free account
3. Verify your email address

### 2.2 Connect Your Email Service

1. After logging in, go to **Email Services** in the left sidebar
2. Click "Add New Service"
3. Choose **Gmail** (recommended for SupportWorks Housing)
4. Click "Connect Account" and sign in with the SupportWorks Housing Gmail account
5. Give your service a name (e.g., "SupportWorks Gmail")
6. Click "Create Service"
7. **Copy the Service ID** (you'll need this later)

### 2.3 Create Email Templates

You need to create 3 email templates. For each template:

#### Template 1: Volunteer Confirmation Email

1. Go to **Email Templates** in the left sidebar
2. Click "Create New Template"
3. **Template Name**: Volunteer Confirmation
4. **Subject**: `Connection Nights Request Received - SupportWorks Housing`
5. **Content**: Copy this HTML:

```html
<p>Hi {{volunteer_name}},</p>

<p>Thank you for your interest in hosting a Connection Night with SupportWorks Housing!</p>

<p><strong>We've received your request with the following details:</strong></p>

<h3>Contact Information:</h3>
<ul>
  <li><strong>Name:</strong> {{volunteer_name}}</li>
  <li><strong>Email:</strong> {{volunteer_email}}</li>
  <li><strong>Phone:</strong> {{phone}}</li>
  <li><strong>Organization:</strong> {{organization}}</li>
</ul>

<h3>Event Details:</h3>
<ul>
  <li><strong>Preferred Date:</strong> {{preferred_date}}</li>
  <li><strong>Group Size:</strong> {{group_size}} people</li>
  <li><strong>Additional Notes:</strong> {{notes}}</li>
</ul>

<h3>What's Next?</h3>
<p>Someone from SupportWorks Housing will review your request and be in touch soon to confirm the details and coordinate your Connection Night experience.</p>

<p>If you have any immediate questions, please don't hesitate to reach out to us at <a href="mailto:jsnook@supportworkshousing.org">jsnook@supportworkshousing.org</a>.</p>

<p>Thank you for your commitment to making a difference in our community!</p>

<p>Warmly,<br>
The SupportWorks Housing Team</p>
```

6. In the **Settings** tab:
   - **To Email**: `{{volunteer_email}}`
   - **From Name**: `SupportWorks Housing`
   - **Reply To**: `jsnook@supportworkshousing.org`
7. Click "Save"
8. **Copy the Template ID** (you'll need this later)

#### Template 2: Admin Notification Email

1. Create a new template
2. **Template Name**: Admin Notification
3. **Subject**: `New Connection Nights Request - Action Required`
4. **Content**: Copy this HTML:

```html
<h2>New Connection Nights Request</h2>

<p>A new Connection Nights volunteer request has been submitted and requires your review.</p>

<h3>Volunteer Information:</h3>
<ul>
  <li><strong>Name:</strong> {{volunteer_name}}</li>
  <li><strong>Email:</strong> {{volunteer_email}}</li>
  <li><strong>Phone:</strong> {{phone}}</li>
  <li><strong>Organization:</strong> {{organization}}</li>
</ul>

<h3>Event Details:</h3>
<ul>
  <li><strong>Preferred Date:</strong> {{preferred_date}}</li>
  <li><strong>Group Size:</strong> {{group_size}} people</li>
  <li><strong>Additional Notes:</strong> {{notes}}</li>
</ul>

<h3>Action Required:</h3>
<p>Please review this request and take action:</p>

<p>
  <a href="{{approve_link}}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
    ✓ APPROVE REQUEST
  </a>
  <a href="{{deny_link}}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
    ✗ DENY REQUEST
  </a>
</p>

<p><small>The volunteer will automatically receive a confirmation email based on your decision.</small></p>

<hr>
<p><small>SupportWorks Housing - Connection Nights Management</small></p>
```

5. In the **Settings** tab:
   - **To Email**: `{{admin_email}}`
   - **From Name**: `SupportWorks Housing - Connection Nights`
   - **Reply To**: `noreply@supportworkshousing.org`
6. Click "Save"
7. **Copy the Template ID**

#### Template 3: Status Update Email

1. Create a new template
2. **Template Name**: Status Update
3. **Subject**: `Connection Nights Request {{status}} - SupportWorks Housing`
4. **Content**: Copy this HTML:

```html
<p>Hi {{volunteer_name}},</p>

<p><strong>{{status_message}}</strong></p>

<h3>Your Request Details:</h3>
<ul>
  <li><strong>Preferred Date:</strong> {{preferred_date}}</li>
  <li><strong>Group Size:</strong> {{group_size}} people</li>
  <li><strong>Organization:</strong> {{organization}}</li>
  <li><strong>Phone:</strong> {{phone}}</li>
</ul>

<p>{{next_steps}}</p>

<p>Thank you for your interest in supporting our mission!</p>

<p>Best regards,<br>
The SupportWorks Housing Team</p>

<hr>
<p><small>This email was sent to {{volunteer_email}}<br>
A copy has been sent to {{admin_email}}</small></p>
```

5. In the **Settings** tab:
   - **To Email**: `{{volunteer_email}}`
   - **CC Email**: `{{admin_email}}`
   - **From Name**: `SupportWorks Housing`
   - **Reply To**: `jsnook@supportworkshousing.org`
6. Click "Save"
7. **Copy the Template ID**

### 2.4 Get Your EmailJS Public Key

1. Go to **Account** (top right corner)
2. Click on **General** tab
3. Find your **Public Key** (looks like a random string)
4. **Copy the Public Key**

---

## Step 3: Configure Environment Variables

1. In your project root directory, create a file named `.env`
2. Copy the content from `.env.example`:

```bash
cp .env.example .env
```

3. Open `.env` and fill in your credentials:

```env
# Supabase (from Step 1.3)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-key-here

# EmailJS (from Step 2)
VITE_EMAILJS_PUBLIC_KEY=your-public-key-here
VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_VOLUNTEER_TEMPLATE_ID=template_volunteer_id
VITE_EMAILJS_ADMIN_TEMPLATE_ID=template_admin_id
VITE_EMAILJS_STATUS_TEMPLATE_ID=template_status_id
```

4. Save the file
5. **Important**: Make sure `.env` is in your `.gitignore` file (it should be by default)

---

## Step 4: Install Dependencies and Test

1. Install the new dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`
4. Scroll down to the "Connection Nights" section
5. Fill out and submit the form to test

### What Should Happen:

1. ✅ Form submits successfully
2. ✅ Success message appears
3. ✅ Volunteer receives a confirmation email
4. ✅ Admin (jsnook@supportworkshousing.org) receives a notification with Approve/Deny buttons
5. ✅ Clicking Approve or Deny updates the database
6. ✅ Volunteer receives a status update email (with admin CC'd)

---

## Step 5: Deploy to Production

### 5.1 Update Environment Variables in GitHub

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Add each environment variable as a repository secret:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_EMAILJS_PUBLIC_KEY`
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_VOLUNTEER_TEMPLATE_ID`
   - `VITE_EMAILJS_ADMIN_TEMPLATE_ID`
   - `VITE_EMAILJS_STATUS_TEMPLATE_ID`

### 5.2 Update Build Configuration

If deploying to GitHub Pages, Netlify, or Vercel, make sure your build process includes the environment variables.

**For GitHub Pages**: Update your GitHub Actions workflow to include the secrets.

**For Netlify/Vercel**: Add the environment variables in your project settings.

---

## Troubleshooting

### Emails Not Sending

1. Check that all EmailJS credentials are correct in `.env`
2. Verify that your Gmail account is connected in EmailJS
3. Check the browser console for errors
4. Make sure you're not exceeding EmailJS's free tier limits (200 emails/month)

### Database Errors

1. Verify Supabase credentials in `.env`
2. Check that the table was created correctly (see Step 1.2)
3. Verify Row Level Security policies are set up
4. Check the Supabase dashboard for error logs

### Form Not Submitting

1. Open browser developer tools (F12)
2. Check the Console tab for JavaScript errors
3. Check the Network tab to see if API requests are failing
4. Verify that you've run `npm install` after updating dependencies

### Approval Links Not Working

1. Make sure the `/confirm` route is working (try visiting `/confirm` manually)
2. Check that the URL in the email matches your deployed site URL
3. Verify that the request ID in the URL is valid

---

## Admin Dashboard (Future Enhancement)

Currently, admins manage requests via email links. For future enhancement, consider building an admin dashboard where admins can:

- View all volunteer requests
- Filter by status (pending, approved, denied)
- Search by date, organization, or volunteer name
- Bulk approve/deny requests
- Export data to CSV

This would require authentication (Supabase Auth) and a separate admin interface.

---

## Support

For technical issues or questions, contact:
- **Email**: jsnook@supportworkshousing.org
- **Repository**: https://github.com/iamjasonsnook/supportworkshousing

---

## Security Notes

- Never commit `.env` file to version control
- Keep your Supabase and EmailJS credentials secure
- Row Level Security (RLS) is enabled to protect data
- Consider adding rate limiting for form submissions in production
- Monitor Supabase and EmailJS usage to stay within free tier limits
