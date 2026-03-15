# Hackathon Event Grading System

A comprehensive web-based system for managing hackathon events, assigning panelists, and collecting grades for participants.

## Project Structure

```
EventProgram/
├── backend/                          # Node.js + Express backend
│   ├── config/
│   │   ├── database.js              # MySQL connection pool
│   │   └── constants.js             # App constants
│   ├── controllers/
│   │   ├── authController.js        # Login/authentication
│   │   ├── eventController.js       # Event management
│   │   ├── participantController.js # Participant & grading
│   │   └── panelistController.js    # Panelist management
│   ├── models/                      # Database models
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── participantRoutes.js
│   │   └── panelistRoutes.js
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication
│   ├── server.js                    # Express server entry point
│   ├── package.json
│   └── .env                         # Environment variables
├── frontend/
│   ├── public/
│   │   ├── admin/
│   │   │   ├── index.html           # Admin login page
│   │   │   ├── dashboard.html       # Admin dashboard
│   │   │   └── js/
│   │   │       ├── api.js           # Admin API client
│   │   │       ├── admin.js         # Main admin script
│   │   │       ├── events.js        # Events management
│   │   │       └── panelists.js     # Panelists management
│   │   ├── panelist/
│   │   │   ├── index.html           # Panelist login page
│   │   │   ├── dashboard.html       # Panelist dashboard
│   │   │   └── js/
│   │   │       ├── api.js           # Panelist API client
│   │   │       └── panelist.js      # Main panelist script
│   │   └── css/
│   │       ├── shared.css           # Common styles
│   │       ├── admin.css            # Admin styles
│   │       └── panelist.css         # Panelist styles
└── database/
    ├── schema.sql                   # Database schema
    └── seeding-data.sql            # Sample data (optional)
```

## Features

### Admin Features
- **Login System**: Secure admin-only login (no registration)
- **Event Management**: 
  - Create, update, and view events
  - Add custom grading criteria with percentage weights
  - Manage event status (upcoming, ongoing, completed)
- **Participant Management**:
  - Add participants to events
  - View participant list with average grades
  - View detailed grade breakdown from all panelists
- **Panelist Management**:
  - Create and manage panelist accounts
  - Assign panelists to specific events
  - Delete inactive panelists
  - Track panelist account status

### Panelist Features
- **Login System**: Secure panelist-only login (no registration)
- **Event Visibility**: See only events assigned by admin
- **Participant Grading**:
  - View all participants in an assigned event
  - Grade each participant based on defined criteria
  - View criteria percentages and max scores
  - Submit grades for each criteria

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Step 1: Clone/Download the Project
```bash
cd EventProgram
```

### Step 2: Set up the Database

1. Open MySQL command line or MySQL Workbench
2. Run the schema file:
```sql
source database/schema.sql;
```

Or manually create the database:
1. Create database: `hackathon_grading`
2. Execute all SQL commands from `database/schema.sql`

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 4: Configure Environment Variables

Edit `backend/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hackathon_grading
DB_PORT=3306

JWT_SECRET=your_secret_key_change_this_in_production

PORT=5000
NODE_ENV=development
```

### Step 5: Create Initial Admin Account

Create a file `backend/seed-admin.js`:

```javascript
const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const connection = await pool.getConnection();
    
    try {
        await connection.query(
            'INSERT INTO admin (username, password, email, full_name) VALUES (?, ?, ?, ?)',
            ['admin', hashedPassword, 'admin@example.com', 'System Administrator']
        );
        console.log('Admin account created successfully');
        console.log('Username: admin');
        console.log('Password: admin123');
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

seedAdmin();
```

Run it once:
```bash
node seed-admin.js
```

Then delete the file.

### Step 6: Start the Backend Server

```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The server should run on `http://localhost:5000`

### Step 7: Open the Application

In your browser, navigate to:
- **Admin Login**: `http://localhost:5000/admin`
- **Panelist Login**: `http://localhost:5000/panelist`

## Default Credentials

**Admin Account** (after running seed script):
- Username: `admin`
- Password: `admin123`

> ⚠️ Change these credentials in production!

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/panelist/login` - Panelist login

### Events (Admin Only)
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event details with criteria
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `POST /api/events/criteria/add` - Add criteria to event
- `DELETE /api/events/criteria/:id` - Delete criteria

### Participants
- `GET /api/participants/admin/event/:event_id` - Get event participants (Admin)
- `GET /api/participants/admin/:event_id/:participant_id` - Get participant details (Admin)
- `POST /api/participants/admin/add` - Add participant (Admin)
- `PUT /api/participants/admin/:id` - Update participant (Admin)
- `DELETE /api/participants/admin/:id` - Delete participant (Admin)
- `GET /api/participants/panelist/:event_id/:participant_id` - Get grades for panelist
- `POST /api/participants/grade/submit` - Submit grade (Panelist)

### Panelists (Admin Only)
- `GET /api/panelists` - Get all panelists
- `POST /api/panelists` - Create panelist
- `PUT /api/panelists/:id` - Update panelist
- `DELETE /api/panelists/:id` - Delete panelist
- `POST /api/panelists/assign-event` - Assign event to panelist
- `DELETE /api/panelists/:panelist_id/event/:event_id` - Remove event assignment
- `GET /api/panelists/assigned-events` - Get panelist's assigned events

## Database Schema

### Tables

1. **admin** - Administrator accounts
2. **panelist** - Panelist accounts (created by admin)
3. **event** - Hackathon events
4. **criteria** - Grading criteria for events
5. **panelist_event_assignment** - Maps panelists to events
6. **participant** - Event participants/teams
7. **grade** - Scores submitted by panelists

## Workflow

### For Admin Users:

1. Login with admin credentials
2. Go to "Events" section
3. Create a new event with custom criteria
4. Add participants to the event
5. Go to "Manage Panelists"
6. Create panelist accounts
7. Assign panelists to events
8. View participant grades submitted by panelists

### For Panelist Users:

1. Login with panelist credentials
2. View assigned events
3. Click on an event to see participants
4. Click on a participant to see grading criteria
5. Enter grades for each criteria
6. Submit grades

## Grading Calculation

- Each criteria has a percentage weight
- Panelists submit scores (0-max_score)
- Admin can view average score across all panelists
- Admin can view breakdown of grades per panelist

## Security Features

- JWT-based authentication with 24-hour expiration
- Password hashing with bcryptjs
- Role-based access control (Admin vs Panelist)
- SQL injection protection via prepared statements
- CORS enabled for frontend-backend communication

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check DB credentials in `.env`
- Ensure database `hackathon_grading` exists

### "Cannot find module" errors
- Run `npm install` in backend directory
- Delete `node_modules` folder and reinstall

### Port 5000 already in use
- Change PORT in `.env` file
- Or kill the process using port 5000

### CORS errors in browser console
- Ensure backend server is running
- Check API_BASE_URL in `frontend/public/*/js/api.js` matches your backend URL

## Production Deployment

Before deploying to production:

1. Change `JWT_SECRET` to a strong random string
2. Change database credentials
3. Set `NODE_ENV=production`
4. Enable HTTPS
5. Use environment-specific `.env` files
6. Set up proper backup for MySQL database
7. Configure firewall rules
8. Use reverse proxy (nginx) for better performance

## License

This project is open source and available for use.

## Support

For issues or questions, please verify:
1. All dependencies are installed
2. Database is properly configured
3. Backend server is running
4. Correct URLs are being used in frontend
