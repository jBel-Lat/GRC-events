-- Add participant problem selection field
ALTER TABLE participant
ADD COLUMN IF NOT EXISTS problem_name VARCHAR(100) NULL AFTER team_name;
