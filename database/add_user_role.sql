-- Required migration (as requested)
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'student';
UPDATE users SET role = 'admin' WHERE username = 'admin';

-- If your app uses the existing admin table for login, run these too:
ALTER TABLE admin ADD COLUMN role VARCHAR(20) DEFAULT 'admin';
UPDATE admin SET role = 'admin' WHERE LOWER(TRIM(username)) = 'admin';
