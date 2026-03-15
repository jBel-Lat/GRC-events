-- Audit log for admin grade edits
CREATE TABLE IF NOT EXISTS grade_edit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    criteria_id INT NOT NULL,
    target_type ENUM('panelist', 'student') NOT NULL,
    target_id INT NOT NULL,
    old_score DECIMAL(10,2),
    new_score DECIMAL(10,2) NOT NULL,
    admin_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_grade_edit_log_participant (participant_id),
    INDEX idx_grade_edit_log_target (target_type, target_id),
    INDEX idx_grade_edit_log_criteria (criteria_id),
    CONSTRAINT fk_grade_edit_log_admin FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
);

