# Quick Start Guide

## 1. Initial Setup (First Time Only)

### Install Dependencies
```bash
cd backend
npm install
```

### Setup Database
```bash
# Using MySQL command line
mysql -u root -p < ../database/schema.sql

# OR manually:
# 1. Open MySQL Workbench or CLI
# 2. Execute: CREATE DATABASE IF NOT EXISTS hackathon_grading;
# 3. Execute: USE hackathon_grading;
# 4. Copy and paste all content from database/schema.sql
```

### Configure Environment
Edit `backend/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hackathon_grading
```

### Create Admin Account
Option A - Using seed script:
```bash
# Create and run backend/seed-admin.js as shown in README
```

Option B - Direct MySQL insert:
```sql
USE hackathon_grading;
-- Password: admin123 (hashed)
INSERT INTO admin (username, password, email, full_name) 
VALUES ('admin', '$2a$10$YourHashedPasswordHere', 'admin@example.com', 'Admin');
```

## 2. Running the Application

### Start Backend Server
```bash
cd backend
npm start
```

Expected output:
```
Server running on http://localhost:5000
Admin login: http://localhost:5000/admin
Panelist login: http://localhost:5000/panelist
```

### Open in Browser
- **Admin**: Visit `http://localhost:5000/admin`
- **Panelist**: Visit `http://localhost:5000/panelist`

## 3. First-Time Admin Usage

### Login
- Username: `admin`
- Password: `admin123`

### Create Your First Event
1. Click "Events" in sidebar
2. Click "+ Add Event" button
3. Fill in event details:
   - Event Name: e.g., "Hackathon 2026"
   - Description: Optional
   - Start/End dates: Optional
   - Click "+ Add Criteria Field" for each grading criterion
     - Criteria Name: e.g., "Innovation"
     - Percentage: e.g., "30"
     - Max Score: e.g., "100"
4. Click "Create Event"

### Create Panelists
1. Click "Manage Panelists" in sidebar
2. Click "+ Add Panelist" button
3. Fill in panelist details:
   - Username: e.g., "panelist1"
   - Password: Strong password
   - Email: panelist@example.com
   - Full Name: Panelist Name
4. Click "Create Panelist"

### Assign Panelists to Events
1. In Panelist list, find the panelist
2. Click "Assign Events" button
3. Check boxes for events to assign
4. Click "Assign Events"

### Add Participants
1. Click on an event from Events list
2. Click "+ Add Participant" button
3. Fill in participant info:
   - Participant Name: Team/Participant name
   - Team Name: Optional
   - Email: Optional
   - Registration Number: Optional
4. Click "Add Participant"

## 4. Panelist Workflow

### Login as Panelist
- Go to `http://localhost:5000/panelist`
- Use panelist credentials created by admin

### Grade Participants
1. Click on assigned event
2. Click on a participant name
3. Enter scores for each criteria
4. Click "Submit Grades"

## 5. Admin - View Results

### Check Participant Grades
1. Click on Event
2. Click on a Participant
3. See breakdown of grades from all panelists
4. View average scores if multiple panelists have graded

## Common Tasks

### Change Admin Password
Currently requires direct database modification:
```sql
UPDATE admin SET password = '[new_hashed_password]' WHERE id = 1;
```

### Reset from Scratch
```bash
# Delete and recreate database
mysql -u root -p
DROP DATABASE hackathon_grading;
SOURCE database/schema.sql;

# Recreate admin account (see setup admin section)
```

### View Database
```bash
mysql -u root -p hackathon_grading
SHOW TABLES;
SELECT * FROM event;
SELECT * FROM panelist;
```

## FAQ

**Q: How do I add more grading criteria?**
A: Click event → Click "+ Add Criteria" → Fill details → Click "Add Criteria"

**Q: Can panelists see other panelists' grades?**
A: No, only admin sees the breakdown

**Q: What if I forget the admin password?**
A: Reset admin account via database with new hashed password

**Q: Can I modify event details after creation?**
A: Yes, event name, description, dates, and status can be updated

**Q: What happens when a panelist is deleted?**
A: All their grades are deleted automatically (cascading delete)

## Error Solutions

**"Cannot GET /admin"**
- Ensure backend server is running on port 5000
- Check `http://localhost:5000/api/health`

**"Cannot connect to MySQL"**
- Start MySQL service
- Verify credentials in `.env`
- Check if database exists

**"Invalid token" error**
- Clear browser localStorage: Open DevTools → Application → LocalStorage → Clear All
- Re-login

**Grades not saving**
- Check browser console for errors
- Verify panelist is assigned to the event
- Check network tab for failed requests

---

For more details, see README.md
