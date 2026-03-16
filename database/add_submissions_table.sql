-- Create submissions table for imported Google Sheet links
CREATE TABLE IF NOT EXISTS submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_name VARCHAR(255) NOT NULL,
    team_leader VARCHAR(255) NOT NULL,
    team_members TEXT NULL,
    problem_name VARCHAR(255) NULL,
    pdf_link TEXT NULL,
    video_link TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_submission (team_name, problem_name)
);
