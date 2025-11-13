# Main Doc – Access Request System
Date: 2025-11-11
Time: 11:00 PM EST

## TL;DR

Waitlist/access control system that allows users to request access via email. Admins can approve or reject requests from an admin dashboard. Approved emails are stored in a fast lookup table for login validation.

---

## Overview

The Access Request System provides a gated entry to the application. Users submit their email and optional information to request access. Admins review requests and approve/reject them. Only approved users can access protected routes.

## Architecture

### 1. Database Schema

**Tables:**

**`access_requests`** - Stores all access requests
```sql
Columns:
- id (UUID, primary key)
- email (TEXT, unique, required)
- name (TEXT, optional)
- company (TEXT, optional)
- role (TEXT, optional)
- message (TEXT, optional)
- status (TEXT: 'pending' | 'approved' | 'rejected')
- requested_at (TIMESTAMPTZ, auto)
- approved_at (TIMESTAMPTZ, nullable)
- approved_by (UUID, references auth.users)
- notes (TEXT, for admin use)
- source (TEXT, default 'landing_page')
```

**`approved_emails`** - Fast lookup for approved access
```sql
Columns:
- email (TEXT, primary key)
- approved_at (TIMESTAMPTZ, auto)
- access_request_id (UUID, references access_requests)
```

**Row-Level Security:**
- Anyone can INSERT to `access_requests`
- Users can SELECT their own requests
- Authenticated users can view/manage all requests (admin access)
- Anyone can SELECT from `approved_emails` (for login validation)

### 2. Database Functions

**`approve_access_request(request_id UUID, approver_id UUID)`**
- Updates request status to 'approved'
- Sets approved_at timestamp
- Records who approved the request
- Adds email to `approved_emails` table

**`reject_access_request(request_id UUID, rejection_note TEXT)`**
- Updates request status to 'rejected'
- Optionally adds rejection note

### 3. API Routes

**`/api/access-request`**

**POST** - Submit access request
```typescript
Body: {
  email: string (required)
  name?: string
  company?: string
  role?: string
  message?: string
}

Response: {
  message: string
  status: 'pending' | 'approved' | 'rejected'
  data?: AccessRequest
}
```

**GET** - Check if email is approved
```
Query params: ?email=user@example.com

Response: {
  approved: boolean
  email?: string
  approved_at?: string
}
```

**`/api/access-request/admin`**

**GET** - List all access requests (authenticated only)
```
Query params: ?status=pending|approved|rejected

Response: {
  requests: AccessRequest[]
}
```

**PATCH** - Approve or reject request (authenticated only)
```typescript
Body: {
  requestId: string (UUID)
  action: 'approve' | 'reject'
  notes?: string
}

Response: {
  message: string
  action: 'approved' | 'rejected'
}
```

### 4. Request Access Page

**File:** `/src/app/request-access/page.tsx`
**URL:** `/request-access`

**Features:**
- Glassmorphism design matching brand guide
- Email field (required)
- Optional fields: name, company, role, message
- Success state with confirmation message
- Link to login for approved users
- Dark mode toggle
- Responsive design

**User Flow:**
1. User visits landing page
2. Clicks "Request Access" button
3. Fills out form with email (+ optional details)
4. Submits form
5. Sees confirmation message
6. Receives approval email (manual process)
7. Can then sign in

### 5. Landing Page Integration

**Changes:**
- Primary CTA changed from "Login" to "Request Access"
- Secondary button is now "Sign In"
- Links to `/request-access` page

## Usage

### For End Users

1. Visit landing page at `/`
2. Click "Request Access"
3. Enter email and optional information
4. Submit request
5. Wait for admin approval
6. Check email for approval notification
7. Return to site and click "Sign In"

### For Administrators

**Option 1: Database Direct Access**
```sql
-- View pending requests
SELECT * FROM access_requests WHERE status = 'pending' ORDER BY requested_at DESC;

-- Approve a request
SELECT approve_access_request('request-id-uuid', 'your-user-id-uuid');

-- Reject a request
SELECT reject_access_request('request-id-uuid', 'Reason for rejection');
```

**Option 2: API Calls**
```bash
# List pending requests
curl -X GET 'http://localhost:3002/api/access-request/admin?status=pending' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Approve request
curl -X PATCH 'http://localhost:3002/api/access-request/admin' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "requestId": "uuid-here",
    "action": "approve"
  }'

# Reject request
curl -X PATCH 'http://localhost:3002/api/access-request/admin' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "requestId": "uuid-here",
    "action": "reject",
    "notes": "Not a good fit at this time"
  }'
```

**Option 3: Admin Dashboard (Future Enhancement)**
- Create `/admin/access-requests` page
- Table view of all requests
- Filter by status (pending, approved, rejected)
- Approve/reject buttons
- Bulk actions
- Email notifications

## Integration with Authentication

### Login Flow Enhancement (Future)

To fully integrate with authentication:

1. **Update login page** to check if email is approved before allowing signin
2. **Add pre-signup check** to verify email is in approved list
3. **Create invite flow** where approved users receive magic link or temporary password

**Example Pre-Login Check:**
```typescript
// In login form submission
const checkResponse = await fetch(`/api/access-request?email=${email}`);
const { approved } = await checkResponse.json();

if (!approved) {
  setError('This email does not have access. Please request access first.');
  return;
}

// Proceed with normal login
```

## Email Notifications (Future Enhancement)

**Recommended Flow:**
1. User submits request → Send confirmation email
2. Admin approves request → Send approval email with login link
3. Admin rejects request → Send polite rejection email

**Email Templates:**

**Request Confirmation:**
```
Subject: Access Request Received - Workstation by Mirror Factory

Hi [Name],

Thanks for your interest in Workstation! We've received your access request and will review it shortly.

We'll email you once your request has been processed.

Best regards,
The Mirror Factory Team
```

**Approval Email:**
```
Subject: Welcome to Workstation - Access Approved!

Hi [Name],

Great news! Your access request for Workstation has been approved.

You can now sign in at: [LOGIN_URL]

Ready to multiply your expertise across every project?

Best regards,
The Mirror Factory Team
```

**Rejection Email:**
```
Subject: Update on Your Workstation Access Request

Hi [Name],

Thank you for your interest in Workstation. After reviewing your request, we're unable to provide access at this time.

[Optional: Custom rejection reason]

We'll keep your email on file for future opportunities.

Best regards,
The Mirror Factory Team
```

## Security Considerations

1. **Email Validation:**
   - Enforced at database level with CHECK constraint
   - Validated in API before insertion
   - Prevents SQL injection via parameterized queries

2. **Rate Limiting (Recommended):**
   - Limit requests per IP address
   - Limit requests per email address
   - Prevent spam and abuse

3. **Admin Authentication:**
   - Admin endpoints require authentication
   - TODO: Add role-based access control (admin role)
   - Currently any authenticated user can manage requests

4. **Data Privacy:**
   - Store only necessary information
   - Implement data retention policy
   - Allow users to delete their request data (GDPR compliance)

## Migration Instructions

**Apply the migration:**
```bash
supabase migration up
```

Or if using hosted Supabase:
```bash
supabase db push
```

**Verify tables created:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('access_requests', 'approved_emails');

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('access_requests', 'approved_emails');
```

## Testing

**Manual Testing Steps:**

1. **Submit Request:**
   - Go to `/request-access`
   - Fill in form with test email
   - Submit and verify success message

2. **Check Database:**
   ```sql
   SELECT * FROM access_requests ORDER BY requested_at DESC LIMIT 1;
   ```

3. **Approve Request:**
   ```sql
   SELECT approve_access_request('[request-id]', '[admin-user-id]');
   ```

4. **Verify Approved Email:**
   ```sql
   SELECT * FROM approved_emails WHERE email = 'test@example.com';
   ```

5. **Check Access API:**
   ```
   GET /api/access-request?email=test@example.com
   ```

## Future Enhancements

- [ ] Admin dashboard UI for managing requests
- [ ] Email notification system (SendGrid, Resend, etc.)
- [ ] Bulk approve/reject functionality
- [ ] Export requests to CSV
- [ ] Analytics dashboard (requests over time, approval rate, etc.)
- [ ] Referral tracking (track where requests came from)
- [ ] Automated approval rules (e.g., approve all @company.com emails)
- [ ] Waitlist position indicator
- [ ] Public waitlist stats page (X people in line, Y approved)
- [ ] Integration with CRM (HubSpot, Salesforce)

## Changelog

---
Created: 2025-11-11 11:00 PM EST
Author: Claude Code
Changes: Initial access request system with waitlist, admin approval workflow, and database schema
---
