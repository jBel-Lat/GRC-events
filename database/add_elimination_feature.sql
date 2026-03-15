-- Add elimination features to the database
USE hackathon_grading;

-- Add is_elimination column to event table
SET @column_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'hackathon_grading' 
    AND TABLE_NAME = 'event' 
    AND COLUMN_NAME = 'is_elimination'
);

SET @sql := IF(@column_exists = 0, 
    'ALTER TABLE event ADD COLUMN is_elimination BOOLEAN DEFAULT FALSE AFTER status',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_tournament column to event table
SET @column_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'hackathon_grading' 
    AND TABLE_NAME = 'event' 
    AND COLUMN_NAME = 'is_tournament'
);

SET @sql := IF(@column_exists = 0, 
    'ALTER TABLE event ADD COLUMN is_tournament BOOLEAN DEFAULT FALSE AFTER is_elimination',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add scoring weights to event table (for student vs panelist grades)
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

-- Add is_eliminated and elimination_round columns to participant table
SET @column_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'hackathon_grading' 
    AND TABLE_NAME = 'participant' 
    AND COLUMN_NAME = 'is_eliminated'
);

SET @sql := IF(@column_exists = 0, 
    'ALTER TABLE participant ADD COLUMN is_eliminated BOOLEAN DEFAULT FALSE AFTER registration_number',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'hackathon_grading' 
    AND TABLE_NAME = 'participant' 
    AND COLUMN_NAME = 'elimination_round'
);

SET @sql := IF(@column_exists = 0, 
    'ALTER TABLE participant ADD COLUMN elimination_round VARCHAR(100) DEFAULT NULL AFTER is_eliminated',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
