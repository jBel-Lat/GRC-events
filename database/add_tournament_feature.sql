-- Add Tournament Feature to Database
-- Run this migration to add the is_tournament column to the event table

USE hackathon_grading;

-- Check if column exists and add it if it doesn't
ALTER TABLE event ADD COLUMN is_tournament BOOLEAN DEFAULT FALSE AFTER is_elimination;

-- Create index for better performance
CREATE INDEX idx_event_is_tournament ON event(is_tournament);

-- Display success message
SELECT 'Tournament feature added successfully!' AS status;
