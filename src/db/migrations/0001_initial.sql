BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false, image text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "session" (
  id text PRIMARY KEY, expires_at timestamptz NOT NULL, token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text, user_agent text, user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS session_user_idx ON "session"(user_id);
CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token text, refresh_token text, id_token text,
  access_token_expires_at timestamptz, refresh_token_expires_at timestamptz,
  scope text, password text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_user_idx ON account(user_id);
CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admins (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK(role IN ('admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
  description text NOT NULL DEFAULT '', location text NOT NULL DEFAULT '',
  capacity integer NOT NULL CHECK (capacity > 0), enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), venue_id uuid NOT NULL REFERENCES venues(id),
  booking_date date NOT NULL, starts_at time NOT NULL, ends_at time NOT NULL,
  applicant_name text NOT NULL, applicant_email text NOT NULL, purpose text NOT NULL,
  attendees integer NOT NULL CHECK (attendees > 0),
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  tracking_token_hash text NOT NULL UNIQUE, decision_note text,
  decided_by text REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz,
  CONSTRAINT reservation_valid_time CHECK (starts_at < ends_at),
  CONSTRAINT no_double_booked_approved EXCLUDE USING gist (
    venue_id WITH =,
    tsrange((booking_date + starts_at), (booking_date + ends_at), '[)') WITH &&
  ) WHERE (status = 'approved')
);
CREATE INDEX IF NOT EXISTS reservations_venue_day_idx ON reservations(venue_id,booking_date);
CREATE TABLE IF NOT EXISTS reservation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  action text NOT NULL, actor_id text REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
