-- Creates the audit table used by admin grade overrides
-- Run this in your MySQL instance (e.g., mysql -u user -p hackathon_grading < backend/db/grade_edit_log.sql)

CREATE TABLE IF NOT EXISTS grade_edit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    criteria_id INT NOT NULL,
    target_type ENUM('panelist','student') NOT NULL,
    target_id INT NOT NULL,
    old_score DECIMAL(10,2) NULL,
    new_score DECIMAL(10,2) NOT NULL,
    admin_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_participant (participant_id),
    INDEX idx_criteria (criteria_id),
    INDEX idx_target (target_type, target_id),
    INDEX idx_admin (admin_id)
);

-- Optional: basic FK wiring (comment out if your MySQL user lacks ALTER privileges)
-- ALTER TABLE grade_edit_log
--   ADD CONSTRAINT fk_gel_participant FOREIGN KEY (participant_id) REFERENCES participant(id) ON DELETE CASCADE,
--   ADD CONSTRAINT fk_gel_criteria FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE,
--   ADD CONSTRAINT fk_gel_admin FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE SET NULL;
