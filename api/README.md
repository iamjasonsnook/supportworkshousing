# Connection Nights API

This directory contains serverless functions for the Connection Nights volunteer scheduling system.

## Endpoints

### POST /api/connection-nights

Creates a new Connection Night request.

**Request Body:**
```json
{
  "location": {
    "id": "clay-house",
    "name": "New Clay House",
    "address": "707 N Harrison St, Richmond, VA 23220"
  },
  "timeSlot": {
    "id": "tue-6pm",
    "day": "Tuesday",
    "time": "6:00 PM - 8:00 PM"
  },
  "alternateDateTime": "Optional alternative time preference",
  "group": {
    "isIndividual": false,
    "name": "Church Youth Group",
    "size": 15
  },
  "contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567"
  },
  "event": {
    "foodPlan": "bring",
    "foodDetails": "Pizza and salad",
    "activityPlan": "board-games",
    "activityDetails": null,
    "propertyNotes": "Need access to kitchen"
  },
  "recipients": {
    "missionAdvancement": "jsnook@supportworkshousing.org",
    "propertyManager": "manager@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "id": "uuid-here",
  "message": "Connection Night request submitted successfully"
}
```

**What it does:**
1. Inserts the request into the Supabase database
2. Sends a receipt email to the volunteer
3. Sends a notification email to Mission Advancement with approve/deny links

---

### GET /api/approve-connection-night?token=xxx

Approves a Connection Night request.

**Query Parameters:**
- `token` (required) - The confirmation token from the email

**Response:** HTML page showing approval confirmation

**What it does:**
1. Validates the token and finds the request
2. Updates the status to "approved"
3. Sends approval email to volunteer (CC: jsnook@supportworkshousing.org)
4. Sends notification email to property manager

---

### GET /api/deny-connection-night?token=xxx

Shows a form to deny a Connection Night request.

**Query Parameters:**
- `token` (required) - The confirmation token from the email

**Response:** HTML form to enter denial reason

---

### POST /api/deny-connection-night?token=xxx

Processes the denial of a Connection Night request.

**Query Parameters:**
- `token` (required) - The confirmation token from the email

**Request Body:**
```
reason=Optional+reason+for+denial
```

**Response:** HTML page showing denial confirmation

**What it does:**
1. Validates the token and finds the request
2. Updates the status to "denied"
3. Sends denial email to volunteer (CC: jsnook@supportworkshousing.org)

---

## Environment Variables

Required environment variables for these functions:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (keep secret!)
- `RESEND_API_KEY` - Your Resend API key for sending emails
- `APP_URL` - Your application URL (for constructing approve/deny links)

## Email Templates

All email templates are embedded in the functions. Each email includes:

1. **Volunteer Receipt Email**
   - Sent immediately after form submission
   - Contains all request details
   - Explains next steps

2. **Mission Advancement Notification Email**
   - Sent to jsnook@supportworkshousing.org
   - Contains all request details
   - Includes approve/deny buttons

3. **Approval Email**
   - Sent to volunteer when approved
   - CC'd to jsnook@supportworkshousing.org
   - Contains confirmed event details and instructions

4. **Property Manager Notification Email**
   - Sent when request is approved
   - CC'd to jsnook@supportworkshousing.org
   - Contains event details and volunteer contact info

5. **Denial Email**
   - Sent to volunteer when denied
   - CC'd to jsnook@supportworkshousing.org
   - Includes optional reason and encouragement to try again

## Database Schema

The functions interact with the `connection_nights` table in Supabase:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| location_id | TEXT | Location identifier |
| location_name | TEXT | Location name |
| location_address | TEXT | Location address |
| time_slot_id | TEXT | Time slot identifier |
| time_slot_day | TEXT | Day of week |
| time_slot_time | TEXT | Time range |
| alternate_date_time | TEXT | Optional alternate time |
| is_individual | BOOLEAN | Individual or group |
| group_name | TEXT | Group/organization name |
| group_size | INTEGER | Number of people |
| contact_name | TEXT | Primary contact name |
| contact_email | TEXT | Primary contact email |
| contact_phone | TEXT | Primary contact phone |
| food_plan | TEXT | Food plan (bring/cater/guidance) |
| food_details | TEXT | Food details |
| activity_plan | TEXT | Activity type |
| activity_details | TEXT | Activity details |
| property_notes | TEXT | Notes for property staff |
| mission_advancement_email | TEXT | Mission Advancement email |
| property_manager_email | TEXT | Property manager email |
| status | TEXT | pending/approved/denied/completed/cancelled |
| confirmation_token | TEXT | Unique token for approve/deny |
| approved_by | TEXT | Email of person who approved/denied |
| approved_at | TIMESTAMP | When approved/denied |
| denial_reason | TEXT | Reason for denial |
| created_at | TIMESTAMP | When created |
| updated_at | TIMESTAMP | When last updated |

## Testing

### Local Testing

To test the API locally:

1. Set up environment variables in `.env.local`
2. Run `vercel dev` (not `npm run dev`)
3. Access endpoints at `http://localhost:3000/api/...`

### Test the Form Submission

```bash
curl -X POST http://localhost:3000/api/connection-nights \
  -H "Content-Type: application/json" \
  -d @test-request.json
```

### Test Approval Link

After submitting a request, check the database for the `confirmation_token` and visit:
```
http://localhost:3000/api/approve-connection-night?token=YOUR_TOKEN
```

## Deployment

These functions are designed to work with:
- **Vercel** (recommended) - Just deploy with `vercel --prod`
- **Netlify** - Use `netlify deploy --prod` with `netlify.toml` config

The functions will automatically be deployed as serverless functions.

## Security

- Tokens are randomly generated UUIDs stored in the database
- Service role key is only used in backend functions (never exposed to client)
- CORS is enabled for the main API endpoint
- Row Level Security is enabled on the Supabase table
- Email addresses are validated before sending

## Future Enhancements

- Add rate limiting to prevent spam
- Implement reminder emails 3 days before events
- Add webhook support for calendar integration
- Create admin dashboard API endpoints
- Add event feedback collection
