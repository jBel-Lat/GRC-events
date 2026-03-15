# Complete Project File Listing

## Project Root
```
EventProgram/
├── README.md                   # Main documentation & setup guide
├── QUICKSTART.md               # Quick reference for first-time setup
├── API.md                      # Detailed API endpoint documentation
├── DATABASE.md                 # Database schema and relationships
├── ARCHITECTURE.md             # System design and data flow
├── TROUBLESHOOTING.md          # Common issues and solutions
├── .gitignore                  # Git configuration
│
├── backend/                    # Node.js + Express backend
│   ├── package.json           # Node.js dependencies
│   ├── .env                   # Environment variables (GITIGNORED)
│   ├── server.js              # Express app entry point
│   │
│   ├── config/
│   │   ├── database.js        # MySQL connection pool setup
│   │   └── constants.js       # App constants & messages
│   │
│   ├── middleware/
│   │   └── auth.js            # JWT verification & role checks
│   │
│   ├── controllers/
│   │   ├── authController.js  # Login endpoints (admin/panelist)
│   │   ├── eventController.js # Event CRUD operations
│   │   ├── participantController.js # Participant & grades
│   │   └── panelistController.js    # Panelist management
│   │
│   ├── routes/
│   │   ├── authRoutes.js      # POST /auth/admin/login, etc.
│   │   ├── eventRoutes.js     # GET/POST /events, etc.
│   │   ├── participantRoutes.js # Participant grade routes
│   │   └── panelistRoutes.js  # Panelist management routes
│   │
│   └── models/                # (Database models - future use)
│
├── frontend/                   # Frontend files (Static HTML/CSS/JS)
│   ├── package.json           # Frontend dependencies (optional)
│   │
│   └── public/                # Served as-is to browser
│       ├── admin/             # Admin-only pages
│       │   ├── index.html     # Admin login page
│       │   ├── dashboard.html # Admin main interface
│       │   │
│       │   └── js/
│       │       ├── api.js     # Admin API client methods
│       │       ├── admin.js   # Admin main logic & navigation
│       │       ├── events.js  # Event management functions
│       │       └── panelists.js # Panelist management functions
│       │
│       ├── panelist/          # Panelist-only pages
│       │   ├── index.html     # Panelist login page
│       │   ├── dashboard.html # Panelist main interface
│       │   │
│       │   └── js/
│       │       ├── api.js     # Panelist API client methods
│       │       └── panelist.js # Panelist main logic
│       │
│       └── css/               # Shared styles
│           ├── shared.css     # Common styles (buttons, forms, etc.)
│           ├── admin.css      # Admin-specific styles
│           └── panelist.css   # Panelist-specific styles
│
└── database/                   # Database files
    ├── schema.sql             # Database tables & structure
    └── seeding-data.sql       # Sample test data (optional)
```

---

## File Descriptions

### Documentation Files
| File | Purpose |
|------|---------|
| README.md | Complete setup instructions and project overview |
| QUICKSTART.md | Fast reference for first-time users |
| API.md | Complete REST API endpoint documentation |
| DATABASE.md | Database schema, relationships, and queries |
| ARCHITECTURE.md | System architecture and data flow diagrams |
| TROUBLESHOOTING.md | Common problems and solutions |

### Backend Files

#### Entry Point
| File | Purpose | Key Responsibilities |
|------|---------|--|
| server.js | Express server startup | Initialize routes, middleware, start listening on port |

#### Configuration
| File | Purpose | Key Responsibilities |
|------|---------|--|
| .env | Environment variables | Database credentials, JWT secret, port configuration |
| package.json | Dependencies | Node.js packages (express, mysql2, cors, etc.) |
| config/database.js | MySQL connection | Create connection pool for database access |
| config/constants.js | Constants | Error messages, status enums, user roles |

#### Middleware
| File | Purpose | Key Responsibilities |
|------|---------|--|
| middleware/auth.js | Authentication | JWT verification, role-based access control |

#### Controllers
| File | Purpose | Key Responsibilities |
|------|---------|--|
| authController.js | Authentication logic | Admin/Panelist login, password verification |
| eventController.js | Event management | Create/read/update events, manage criteria |
| participantController.js | Grade management | Participant CRUD, grade submission, result viewing |
| panelistController.js | Panelist management | Create/manage panelists, assign to events |

#### Routes
| File | Purpose | Endpoints |
|------|---------|-----------|
| authRoutes.js | Login routes | POST /auth/admin/login, POST /auth/panelist/login |
| eventRoutes.js | Event routes | GET/POST /events, add/delete criteria |
| participantRoutes.js | Participant routes | Get/add/update participants, submit grades |
| panelistRoutes.js | Panelist routes | CRUD panelists, assign events |

### Frontend Files

#### Admin Pages
| File | Purpose |
|------|---------|
| admin/index.html | Login form for administrators |
| admin/dashboard.html | Main admin interface with all features |
| admin/js/api.js | API communication for admin endpoints |
| admin/js/admin.js | Navigation, modals, page switcher |
| admin/js/events.js | Event creation/management code |
| admin/js/panelists.js | Panelist management code |

#### Panelist Pages
| File | Purpose |
|------|---------|
| panelist/index.html | Login form for panelists |
| panelist/dashboard.html | Main panelist interface |
| panelist/js/api.js | API communication for panelist endpoints |
| panelist/js/panelist.js | Event viewing, grading interface |

#### Styles
| File | Purpose |
|------|---------|
| css/shared.css | Common styles (buttons, forms, modals) |
| css/admin.css | Admin dashboard specific styles (sidebar, cards) |
| css/panelist.css | Panelist dashboard specific styles |

### Database Files
| File | Purpose |
|------|---------|
| database/schema.sql | CREATE TABLE statements for all tables |
| database/seeding-data.sql | INSERT statements for test data |

---

## Code Organization Principles

### Backend Organization
- **Routes**: Define API endpoints
- **Controllers**: Business logic for each endpoint
- **Middleware**: Cross-cutting concerns (auth, logging)
- **Config**: Settings and utilities
- **Models**: (Future) Database model definitions

### Frontend Organization
- **HTML**: Page structure and forms
- **CSS**: Styling and layout
- **JS (api.js)**: API communication (fetch, token management)
- **JS (main.js)**: Page logic and user interactions

### Database Organization
- **admin**: User accounts with admin privileges
- **panelist**: User accounts with grading privileges
- **event**: Hackathon events
- **criteria**: Grading criteria with weights per event
- **panelist_event_assignment**: Maps panelists to events
- **participant**: Teams/individuals being graded
- **grade**: Individual scores submitted by panelists

---

## File Dependencies

### Frontend → Backend
```
admin/dashboard.html
  ├── admin/js/admin.js (page logic)
  │   ├── admin/js/api.js (HTTP requests)
  │   │   └── /api/* endpoints (backend)
  │   ├── admin/js/events.js
  │   │   └── admin/js/api.js
  │   └── admin/js/panelists.js
  │       └── admin/js/api.js
  └── css/admin.css (styling)
```

### Backend → Database
```
server.js (Express)
  ├── routes/*.js
  │   └── controllers/*.js
  │       └── config/database.js (MySQL)
  └── middleware/auth.js
      └── config/constants.js
```

---

## Configuration Files

### Required Configuration
- **backend/.env** - MUST be created with:
  - DB credentials (user, password, host, database)
  - JWT secret (random string)
  - Server port

### Optional Configuration
- **package.json** scripts - Can add custom scripts
- **.gitignore** - Already configured to ignore .env and node_modules

---

## Code Size Reference

| Component | Lines of Code | Purpose |
|-----------|--------------|---------|
| server.js | 50 | Express setup |
| Controllers (4 files) | 500 | All business logic |
| Routes (4 files) | 100 | API endpoint definitions |
| Middleware/Config | 100 | Auth & constants |
| Frontend JS (6 files) | 600 | Client-side logic |
| HTML/CSS (8 files) | 1000 | Interface & styling |
| Database Schema | 150 | Table definitions |
| **Total Backend** | **800 lines** | |
| **Total Frontend** | **1600 lines** | |
| **Total** | **~2400 lines** | Complete working system |

---

## Where to Add New Features

### Add New API Endpoint
1. Create controller method in `controllers/newFeatureController.js`
2. Create route in `routes/newFeatureRoutes.js`
3. Add route import in `server.js`

### Add New Admin Feature
1. Add HTML in `admin/dashboard.html`
2. Add JavaScript in new file `admin/js/newFeature.js`
3. Add API methods in `admin/js/api.js`

### Add New Panelist Feature
1. Add HTML in `panelist/dashboard.html`
2. Add JavaScript in `panelist/js/panelist.js`
3. Add API methods in `panelist/js/api.js`

### Modify Database
1. Update `database/schema.sql`
2. Drop and recreate database
3. Update controllers to use new columns
4. Update frontend to display/input new fields

---

## File Access Patterns

### Who Accesses What

**Admin Users Can Access:**
- All admin/* files
- All admin/js files
- All admin/css files
- Backend /api/events/* (all endpoints)
- Backend /api/panelists/* (all endpoints)
- Backend /api/participants/admin/* (only the /admin ones)

**Panelist Users Can Access:**
- All panelist/* files
- All panelist/js files
- All admin/css files (shared)
- Backend /api/panelists/assigned-events
- Backend /api/participants/panelist/* (only their assigned events)
- Backend /api/participants/grade/submit

**Public Access:**
- Login pages (before authentication)

---

## Deployment Checklist

Before deploying to production:

- [ ] Update JWT_SECRET in .env (random 32+ character string)
- [ ] Update database credentials in .env
- [ ] Change admin default password
- [ ] Set NODE_ENV=production in .env
- [ ] Remove seed data or regenerate
- [ ] Test all API endpoints
- [ ] Test CORS configuration for your domain
- [ ] Set up database backups
- [ ] Enable HTTPS
- [ ] Set up error logging
- [ ] Configure firewall rules
- [ ] Test in production-like environment

