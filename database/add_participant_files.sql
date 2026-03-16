-- Add file attachment columns for participant submissions (PDF and PPT/PPTX)
ALTER TABLE participant
    ADD COLUMN IF NOT EXISTS pdf_file_path VARCHAR(500) NULL AFTER registration_number,
    ADD COLUMN IF NOT EXISTS ppt_file_path VARCHAR(500) NULL AFTER pdf_file_path;
