# Project Setup Checklist & Troubleshooting

## Pre-Installation Checklist

- [ ] Node.js v14+ installed (`node -v`)
- [ ] npm installed (`npm -v`)
- [ ] MySQL v5.7+ installed (`mysql --version`)
- [ ] MySQL service is running
- [ ] Port 5000 is available
- [ ] Port 3306 is available (MySQL)
- [ ] Text editor or IDE (VS Code recommended)
- [ ] Git installed (optional, for version control)

---

## Installation Checklist

### Step 1: Database Setup
- [ ] MySQL service started
- [ ] Database `hackathon_grading` created
- [ ] Schema imported from `database/schema.sql`
- [ ] Verified tables exist: `SHOW TABLES;`

### Step 2: Backend Setup
- [ ] Navigated to `backend/` folder
- [ ] Ran `npm install`
- [ ] Created `.env` file with correct database credentials
- [ ] `.env` DB_HOST correct (localhost or IP)
- [ ] `.env` DB_USER correct (default: root)
- [ ] `.env` DB_PASSWORD correct
- [ ] `.env` JWT_SECRET set to a random string

### Step 3: Admin Account Creation
- [ ] Created admin account (via seed script or direct insert)
- [ ] Admin username set up
- [ ] Admin password hashed
- [ ] Test login attempted

### Step 4: Server Startup
- [ ] Backend server started: `npm start`
- [ ] Console shows: "Server running on http://localhost:5000"
- [ ] Health check passed: `http://localhost:5000/api/health`

### Step 5: Frontend Access
- [ ] Admin login page loads: `http://localhost:5000/admin`
- [ ] Panelist login page loads: `http://localhost:5000/panelist`
- [ ] CSS loads correctly (see green/pink colors)
- [ ] JavaScript console has no errors (F12)

---

## Verification Tests

### Test 1: Database Connection
```bash
# Run from backend folder
node -e "const pool = require('./config/database'); pool.getConnection().then(conn => { conn.query('SELECT 1'); conn.release(); console.log('✓ Database connected'); }).catch(err => console.error('✗ Error:', err.message))"
```

### Test 2: API Health Check
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"Server is running"}
```

### Test 3: Admin Login API
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Expected: success: true, token provided
```

### Test 4: Create Event via API
```bash
# First get token from login test above, then:
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "event_name":"Test Event",
    "criteria":[{"criteria_name":"Test","percentage":100,"max_score":100}]
  }'
# Expected: success: true, event_id provided
```

### Test 5: Frontend Functionality
1. Login as admin
2. Create an event
3. Create a panelist
4. Assign panelist to event
5. Add participant
6. Logout
7. Login as panelist
8. View event
9. Submit grades

---

## Common Issues & Solutions

### Issue 1: "Cannot GET /admin"
**Symptoms:** 
- Blank page or 404 error when visiting http://localhost:5000/admin

**Solutions:**
1. Verify backend server is running: `npm start` in backend folder
2. Check if running on correct port: Change URL to `http://localhost:5000/admin/index.html`
3. Ensure `frontend/public/` folder exists with HTML files

**Debug:**
```bash
# Test API is responding
curl http://localhost:5000/api/health
```

---

### Issue 2: "Cannot connect to MySQL"
**Symptoms:**
- Error: "connect ECONNREFUSED 127.0.0.1:3306"
- Error: "Access denied for user 'root'@'localhost'"

**Solutions:**
1. Start MySQL service:
   ```bash
   # macOS
   mysql.server start
   
   # Windows (Command Prompt as Admin)
   net start MySQL80
   
   # Linux
   sudo systemctl start mysql
   ```

2. Verify credentials in `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   ```

3. Test MySQL connection directly:
   ```bash
   mysql -u root -p -h localhost
   # Type your password and verify it works
   ```

4. Verify database exists:
   ```sql
   SHOW DATABASES;
   USE hackathon_grading;
   SHOW TABLES;
   ```

---

### Issue 3: "Port 5000 already in use"
**Symptoms:**
- Error: "listen EADDRINUSE :::5000"

**Solutions:**
1. Change port in `.env`:
   ```
   PORT=5001
   # Then access at http://localhost:5001
   ```

2. Or kill process using port 5000:
   ```bash
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   
   # Windows (Command Prompt as Admin)
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

---

### Issue 4: CORS errors in browser console
**Symptoms:**
- Console error: "Access to XMLHttpRequest at 'http://localhost:5000...' from origin has been blocked"

**Solutions:**
1. Verify backend server is running
2. Check API endpoint URLs in frontend files match your server:
   ```javascript
   // In frontend/public/admin/js/api.js
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

3. Enable CORS: Server already has CORS enabled, but verify `server.js` has:
   ```javascript
   const cors = require('cors');
   app.use(cors());
   ```

---

### Issue 5: "Invalid token" or "Unauthorized" after login
**Symptoms:**
- Login works, but dashboard shows "Unauthorized" error
- All API calls fail with 401 status

**Solutions:**
1. Clear browser storage and re-login:
   - Open DevTools (F12)
   - Application → LocalStorage → Clear All
   - Re-login

2. Check JWT_SECRET is consistent:
   - Backend `.env` has `JWT_SECRET=your_secret`
   - Change both hash and token verification will fail

3. Verify token is being sent in requests:
   - Open Network tab in DevTools
   - Check request headers include: `Authorization: Bearer {token}`

4. Check token expiration (24 hours):
   - If used old token, re-login for new one

---

### Issue 6: "Module not found" errors
**Symptoms:**
- Error: "Cannot find module 'express'"
- Error: "Cannot find module 'mysql2'"

**Solutions:**
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Verify you're in correct directory:
   ```bash
   pwd  # Should show path ending in /backend
   ```

---

### Issue 7: Database fields not created
**Symptoms:**
- Table exists but missing columns
- Table names wrong or missing

**Solutions:**
1. Verify schema was imported:
   ```sql
   USE hackathon_grading;
   SHOW TABLES;
   DESCRIBE admin;
   ```

2. Re-import schema:
   ```bash
   mysql -u root -p hackathon_grading < database/schema.sql
   ```

3. Or manually recreate:
   ```sql
   DROP DATABASE hackathon_grading;
   SOURCE database/schema.sql;  -- or mysql < database/schema.sql
   ```

---

### Issue 8: Admin login fails but credentials look correct
**Symptoms:**
- Error: "Invalid username or password"
- But sure password is correct

**Solutions:**
1. Verify admin account exists:
   ```sql
   SELECT * FROM admin WHERE username='admin';
   ```

2. If not exists, create new:
   ```bash
   # Run seed-admin.js if you created it
   # Or manually insert with hashed password
   ```

3. Verify password hash format:
   - Password must be bcryptjs hash (starts with $2a$, $2b$, etc.)
   - Not plain text password

4. Check case sensitivity:
   - Database is case-sensitive for username
   - Try exact case you entered

---

### Issue 9: Grades not saving / "Error submitting grade"
**Symptoms:**
- Grade submission fails
- Grades disappear after refresh

**Solutions:**
1. Verify panelist is assigned to event:
   ```sql
   SELECT * FROM panelist_event_assignment 
   WHERE panelist_id=1 AND event_id=1;
   ```

2. Verify participant exists in event:
   ```sql
   SELECT * FROM participant 
   WHERE id=1 AND event_id=1;
   ```

3. Check browser console for actual error message
4. Verify token hasn't expired (re-login if needed)
5. Check database connection is working

---

### Issue 10: Can't see events created
**Symptoms:**
- Created event doesn't appear in list
- "No events yet" message persists

**Solutions:**
1. Hard refresh browser: Ctrl+Shift+R or Cmd+Shift+R
2. Clear browser cache and localStorage
3. Verify database has event:
   ```sql
   SELECT * FROM event WHERE event_name='Your Event Name';
   ```

4. Check frontend is calling correct API:
   - Open Network tab
   - Look for GET /events request
   - Verify response has `success: true`

5. Check console for JavaScript errors (F12)

---

## Performance Tuning

### For Small Deployments (< 100 users):
- Current setup is sufficient
- Default MySQL configuration works
- No optimization needed

### For Medium Deployments (100-1000 users):
1. Add indexes:
   ```sql
   CREATE INDEX idx_grade_updated ON grade(updated_at);
   CREATE INDEX idx_participant_event ON participant(event_id, id);
   ```

2. Set appropriate MySQL buffer pool:
   ```ini
   [mysqld]
   innodb_buffer_pool_size=1G
   ```

3. Add pagination to API responses

### For Large Deployments (1000+ users):
1. Implement database read replicas
2. Add Redis caching layer
3. Implement API rate limiting
4. Use CDN for static files
5. Consider database sharding

---

## Database Maintenance

### Regular Backups
```bash
# Daily backup
mysqldump -u root -p hackathon_grading > backup_$(date +%Y%m%d).sql

# Automated backup (Linux cron)
0 2 * * * mysqldump -u root -pYOURPASS hackathon_grading > /backups/hack_$(date +\%Y\%m\%d).sql
```

### Clean Old Data
```sql
-- Delete events older than 1 year
DELETE FROM event WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- This cascades and deletes related records automatically
```

### Monitor Database Size
```sql
-- Check database size
SELECT 
    TABLE_NAME, 
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size in MB'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'hackathon_grading';
```

---

## Logging & Debugging

### Enable Console Logging
Add to `backend/server.js`:
```javascript
const morgan = require('morgan');
app.use(morgan('dev'));  // Install: npm install morgan
```

### View MySQL Queries
```sql
-- In MySQL session
SET GLOBAL general_log = 'ON';
-- Watch queries in application log
SHOW VARIABLES LIKE 'log_output';
```

### Browser DevTools
1. **Console**: See JavaScript errors
2. **Network**: See API requests/responses
3. **Storage**: View localStorage tokens
4. **Sources**: Debug JavaScript

---

## Quick Health Check Script

```bash
#!/bin/bash
# Save as: health-check.sh

echo "=== Health Check ==="

# Check MySQL
echo -n "MySQL: "
mysql -u root -p'password' -e "SELECT 1" > /dev/null 2>&1 && echo "✓" || echo "✗"

# Check Node.js
echo -n "Node.js: "
node -v > /dev/null 2>&1 && echo "✓" || echo "✗"

# Check Backend
echo -n "Backend API: "
curl -s http://localhost:5000/api/health > /dev/null && echo "✓" || echo "✗"

# Check Frontend
echo -n "Frontend: "
curl -s http://localhost:5000/admin/index.html > /dev/null && echo "✓" || echo "✗"

echo "=== Done ==="
```

---

## When All Else Fails

### Reset Everything
```bash
# 1. Stop the server (Ctrl+C in terminal)

# 2. Delete and recreate database
mysql -u root -p
DROP DATABASE hackathon_grading;
SOURCE /path/to/database/schema.sql;
EXIT;

# 3. Clear all frontend data
# Open browser DevTools → Application → Clear All

# 4. Restart server
cd backend
npm start

# 5. Re-login and test
```

### Get Help
1. Check browser console for JavaScript errors (F12)
2. Check backend server output for API errors
3. Check MySQL error log: `/var/log/mysql/error.log`
4. Verify all credentials match in `.env`
5. Review this troubleshooting guide again
6. Check README.md for additional context

