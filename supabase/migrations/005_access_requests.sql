-- Migration: Access Requests / Waitlist
-- Created: 2025-11-11
-- Purpose: Allow users to request access to the application via email submission

-- Create access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  source TEXT DEFAULT 'landing_page',

  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);

-- Create index on requested_at for sorting
CREATE INDEX IF NOT EXISTS idx_access_requests_requested_at ON access_requests(requested_at DESC);

-- Enable Row Level Security
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit a request (INSERT only)
CREATE POLICY "Anyone can submit access request"
  ON access_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON access_requests
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Policy: Authenticated users can view all requests (for admin dashboard)
-- Note: In production, you'd want to restrict this to admin users only
CREATE POLICY "Authenticated users can view all requests"
  ON access_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update requests (for approval workflow)
-- Note: In production, restrict to admin users only
CREATE POLICY "Authenticated users can update requests"
  ON access_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create approved_emails table for quick access checks
CREATE TABLE IF NOT EXISTS approved_emails (
  email TEXT PRIMARY KEY,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_request_id UUID REFERENCES access_requests(id),

  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS on approved_emails
ALTER TABLE approved_emails ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can check if an email is approved (for login validation)
CREATE POLICY "Anyone can check approved emails"
  ON approved_emails
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can manage approved emails
CREATE POLICY "Authenticated users can manage approved emails"
  ON approved_emails
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to approve an access request
CREATE OR REPLACE FUNCTION approve_access_request(request_id UUID, approver_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_email TEXT;
BEGIN
  -- Get the email from the request
  SELECT email INTO request_email
  FROM access_requests
  WHERE id = request_id;

  IF request_email IS NULL THEN
    RAISE EXCEPTION 'Access request not found';
  END IF;

  -- Update the access request
  UPDATE access_requests
  SET
    status = 'approved',
    approved_at = NOW(),
    approved_by = approver_id
  WHERE id = request_id;

  -- Add to approved_emails
  INSERT INTO approved_emails (email, access_request_id)
  VALUES (request_email, request_id)
  ON CONFLICT (email) DO NOTHING;
END;
$$;

-- Function to reject an access request
CREATE OR REPLACE FUNCTION reject_access_request(request_id UUID, rejection_note TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE access_requests
  SET
    status = 'rejected',
    notes = COALESCE(rejection_note, notes)
  WHERE id = request_id;
END;
$$;

-- Insert some example approved emails for testing (remove in production)
-- INSERT INTO approved_emails (email) VALUES
--   ('admin@mirrorfactory.com'),
--   ('test@example.com')
-- ON CONFLICT (email) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE access_requests IS 'Stores user requests for application access (waitlist)';
COMMENT ON TABLE approved_emails IS 'Fast lookup table for emails with approved access';
COMMENT ON COLUMN access_requests.status IS 'Request status: pending, approved, or rejected';
COMMENT ON COLUMN access_requests.source IS 'Where the request came from: landing_page, referral, etc.';
COMMENT ON FUNCTION approve_access_request IS 'Approves an access request and adds email to approved list';
COMMENT ON FUNCTION reject_access_request IS 'Rejects an access request with optional note';
