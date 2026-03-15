-- Add scoring weight columns to event table
USE hackathon_grading;

-- Add student_weight and panelist_weight if they don't exist
SET @column_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'hackathon_grading' 
    AND TABLE_NAME = 'event' 
    AND COLUMN_NAME = 'student_weight'
);

SET @sql := IF(@column_exists = 0, 
    'ALTER TABLE event ADD COLUMN student_weight INT DEFAULT 50 AFTER is_tournament',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'hackathon_grading' 
    AND TABLE_NAME = 'event' 
    AND COLUMN_NAME = 'panelist_weight'
);

SET @sql := IF(@column_exists = 0, 
    'ALTER TABLE event ADD COLUMN panelist_weight INT DEFAULT 50 AFTER student_weight',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
