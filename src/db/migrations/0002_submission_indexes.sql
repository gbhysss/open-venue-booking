BEGIN;
CREATE INDEX IF NOT EXISTS reservations_created_at_idx ON reservations(created_at);
CREATE INDEX IF NOT EXISTS reservations_email_created_at_idx ON reservations(applicant_email,created_at);
COMMIT;
