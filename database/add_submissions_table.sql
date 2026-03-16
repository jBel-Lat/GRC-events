-- Create submissions table for imported Google Sheet links
CREATE TABLE IF NOT EXISTS submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NULL,
    team_leader_name VARCHAR(255) NOT NULL,
    team_members_name TEXT NULL,
    problem_name VARCHAR(255) NULL,
    pdf_url TEXT NULL,
    video_url TEXT NULL,
    source_sheet_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_submission (team_leader_name, problem_name)
);
