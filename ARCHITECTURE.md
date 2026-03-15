# System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONT-END LAYER                          │
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────┐    │
│  │  ADMIN PORTAL        │         │  PANELIST PORTAL     │    │
│  │                      │         │                      │    │
│  │  ├── Login Page      │         │  ├── Login Page      │    │
│  │  ├── Dashboard       │         │  ├── Dashboard       │    │
│  │  ├── Events Mgmt     │         │  ├── My Events       │    │
│  │  │  ├── Create      │         │  ├── Participants    │    │
│  │  │  ├── Update      │         │  └── Grading Form    │    │
│  │  │  └── Criteria    │         │                      │    │
│  │  ├── Panelists      │         │                      │    │
│  │  │  ├── Create      │         │                      │    │
│  │  │  ├── Delete      │         │                      │    │
│  │  │  └── Assign      │         │                      │    │
│  │  └── Participants   │         │                      │    │
│  │     └── View Grades │         │                      │    │
│  └──────────────────────┘         └──────────────────────┘    │
│           HTML5, CSS3, Vanilla JS  (no frameworks)            │
└──────────────────┬──────────────────────┬─────────────────────┘
                   │                      │
            (REST API Calls)       (REST API Calls)
                   │                      │
        ┌──────────▼──────────────────────▼──────────┐
        │                                             │
        │      JSON Requests/Responses via HTTP      │
        │                                             │
        └──────────┬──────────────────────┬──────────┘
                   │                      │
                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / CORS LAYER                    │
│                                                                 │
│  Express Middleware (CORS, Body Parser, JSON)                  │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACK-END API LAYER                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Express.js Server (Node.js)                │   │
│  │                                                         │   │
│  │  ┌────────────────────┐  ┌────────────────────────┐   │   │
│  │  │   AUTH ROUTES      │  │  EVENT ROUTES          │   │   │
│  │  │ /auth/admin/login  │  │ GET/POST/PUT /events   │   │   │
│  │  │ /auth/panelist/login│ │ ADD/DELETE criteria    │   │   │
│  │  └────────────────────┘  └────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌────────────────────┐  ┌────────────────────────┐   │   │
│  │  │ PARTICIPANT ROUTES │  │ PANELIST ROUTES        │   │   │
│  │  │ GET participants   │  │ GET/POST panelists     │   │   │
│  │  │ ADD/DELETE partic. │  │ Assign to events       │   │   │
│  │  │ SUBMIT grades      │  │ GET assigned events    │   │   │
│  │  └────────────────────┘  └────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │        MIDDLEWARE LAYER                          │  │   │
│  │  │  JWT Auth Verification                           │  │   │
│  │  │  Role-based Access Control (Admin/Panelist)      │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │        CONTROLLER LAYER                          │  │   │
│  │  │  authController.js      (Login logic)            │  │   │
│  │  │  eventController.js     (Event CRUD)             │  │   │
│  │  │  participantController.js (Grades submission)    │  │   │
│  │  │  panelistController.js  (Panelist management)    │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (MySQL)                             │
│                                                                 │
│  Connection Pool: mysql2/promise                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TABLES:                                                │   │
│  │  ├── admin              (Admin accounts)                │   │
│  │  ├── panelist           (Panelist accounts)             │   │
│  │  ├── event              (Events)                        │   │
│  │  ├── criteria           (Grading criteria)              │   │
│  │  ├── panelist_event_... (Panelist-Event mapping)        │   │
│  │  ├── participant        (Participants/Teams)            │   │
│  │  └── grade              (Submitted grades)              │   │
│  │                                                         │   │
│  │  FEATURES:                                              │   │
│  │  ├── Indexes for fast queries                           │   │
│  │  ├── Foreign key relationships                          │   │
│  │  ├── Cascading deletes                                  │   │
│  │  └── Unique constraints                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow Example

### Admin Creating an Event
```
1. Admin fills form and clicks "Create Event"
   ↓
2. Frontend JavaScript captures form data
   ↓
3. Sends POST /api/events with JWT token
   ↓
4. Express receives request
   ↓
5. Auth middleware verifies JWT token
   ↓
6. Checks role is 'admin'
   ↓
7. eventController.createEvent processes request
   ↓
8. Query builder inserts event + criteria into MySQL
   ↓
9. MySQL returns inserted IDs
   ↓
10. Controller returns success response with event ID
    ↓
11. Frontend receives response and refreshes event list
    ↓
12. New event appears in admin dashboard
```

### Panelist Submitting a Grade
```
1. Panelist views participant and enters scores
   ↓
2. Clicks "Submit Grades"
   ↓
3. Frontend loops through all criteria
   ↓
4. For each score, sends POST /api/participants/grade/submit
   ↓
5. Express receives request with JWT token
   ↓
6. Auth middleware verifies token and checks role='panelist'
   ↓
7. participantController.submitGrade processes each grade
   ↓
8. Checks if grade already exists:
   - If YES: UPDATE existing grade
   - If NO: INSERT new grade
   ↓
9. MySQL executes query
   ↓
10. Controller returns success/error for each grade
    ↓
11. Frontend shows confirmation message
```

---

## Security Architecture

```
┌─────────────────────────────────────────┐
│         CLIENT REQUEST                  │
│  (From Admin/Panelist Portal)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    CORS MIDDLEWARE                      │
│  (Allow requests from frontend)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    JWT TOKEN VERIFICATION               │
│  (Extract & Verify token)               │
│  - Check signature                      │
│  - Check expiration (24h)                │
│  - Extract user ID & role               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    ROLE-BASED ACCESS CONTROL            │
│  Check if user has permission:          │
│  - Admin routes require role='admin'    │
│  - Panelist routes require              │
│    role='panelist'                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    PARAMETERIZED QUERIES                │
│  (Prevent SQL Injection)                │
│  - mysql2 prepared statements           │
│  - User input safely escaped            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    PASSWORD HASHING                     │
│  (bcryptjs with salt rounds)            │
│  - Never stored in plain text           │
│  - Verified during login                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    SECURE RESPONSE                      │
│  (Return appropriate data only)         │
│  - No sensitive info leaked             │
│  - User can only see own data           │
└─────────────────────────────────────────┘
```

---

## Component Responsibilities

### Frontend Components

| Component | Responsibility |
|-----------|-----------------|
| `admin/index.html` | Admin login screen |
| `admin/dashboard.html` | Admin main interface with sidebar |
| `admin/js/api.js` | Admin API communication |
| `admin/js/admin.js` | Core admin logic & navigation |
| `admin/js/events.js` | Event management functionality |
| `admin/js/panelists.js` | Panelist management functionality |
| `panelist/index.html` | Panelist login screen |
| `panelist/dashboard.html` | Panelist main interface |
| `panelist/js/api.js` | Panelist API communication |
| `panelist/js/panelist.js` | Panelist workflow logic |
| `css/shared.css` | Common styles |
| `css/admin.css` | Admin-specific styles |
| `css/panelist.css` | Panelist-specific styles |

### Backend Components

| Component | Responsibility |
|-----------|-----------------|
| `server.js` | Express app setup & routing |
| `config/database.js` | MySQL connection pool |
| `config/constants.js` | App-wide constants |
| `middleware/auth.js` | JWT verification & RBAC |
| `controllers/authController.js` | Login endpoints |
| `controllers/eventController.js` | Event CRUD |
| `controllers/participantController.js` | Participant & grade management |
| `controllers/panelistController.js` | Panelist management & assignment |
| `routes/*.js` | API endpoint definitions |

---

## Data Flow: Creating an Event with Criteria

```
┌─────────────────────────────────────────────────────────────┐
│ Admin fills form:                                           │
│ - Event name: "Hackathon 2026"                             │
│ - Criteria 1: Innovation (30%)                             │
│ - Criteria 2: Technical (25%)                              │
│ - Criteria 3: Presentation (20%)                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend (events.js) collectsData:                          │
│ {                                                           │
│   event_name: "Hackathon 2026",                            │
│   criteria: [                                               │
│     {criteria_name: "Innovation", percentage: 30},         │
│     {criteria_name: "Technical", percentage: 25},          │
│     {criteria_name: "Presentation", percentage: 20}        │
│   ]                                                         │
│ }                                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ API Call: POST /api/events                                  │
│ Headers: {Authorization: "Bearer {token}"}                 │
│ Body: {event data + criteria}                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Express routes to: eventController.createEvent             │
│                                                             │
│ Controller logic:                                           │
│ 1. Validate input (event name, criteria required)          │
│ 2. Get admin ID from req.user.id                           │
│ 3. Start database transaction                              │
│ 4. INSERT into event table (get event_id)                  │
│ 5. For each criteria:                                       │
│    INSERT into criteria table (link to event_id)           │
│ 6. Commit transaction                                       │
│ 7. Return success + event_id                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ MySQL Execution:                                            │
│                                                             │
│ INSERT INTO event (event_name, ...) VALUES (...)           │
│ ├─ Returns: event_id = 5                                   │
│                                                             │
│ INSERT INTO criteria (event_id, criteria_name, %)          │
│ ├─ VALUES (5, 'Innovation', 30)                            │
│ ├─ VALUES (5, 'Technical', 25)                             │
│ └─ VALUES (5, 'Presentation', 20)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Response to Frontend:                                       │
│ {                                                           │
│   success: true,                                            │
│   message: "Created successfully",                          │
│   data: { event_id: 5 }                                     │
│ }                                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend displays success message                           │
│ Refreshes event list with new event                        │
│ User can now:                                               │
│ - Add participants to this event                           │
│ - Assign panelists to grade this event                     │
│ - View/modify event details                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Current Design Handles:
- ✅ 1000+ events
- ✅ 100+ panelists
- ✅ 10,000+ participants
- ✅ 100,000+ grade records

### To Scale Further:

1. **Database Level**
   - Implement database replication
   - Use read replicas for analytics
   - Archive old events/grades

2. **API Level**
   - Add caching (Redis)
   - Implement rate limiting
   - Load balancing with multiple servers

3. **Frontend Level**
   - Implement pagination for large lists
   - Lazy load data
   - Use JavaScript compression

4. **Monitoring**
   - Add logging (Winston/Morgan)
   - Performance monitoring
   - Error tracking

---

## Technology Justification

| Technology | Why Chosen |
|-----------|-----------|
| Node.js | JavaScript full-stack, easy to learn & deploy |
| Express | Lightweight, flexible, perfect for REST APIs |
| MySQL | Reliable, ACID compliance, perfect relational structure |
| Vanilla JS | No dependencies, teaches fundamentals, fast load |
| JWT | Stateless auth, scales well, industry standard |
| bcryptjs | Secure password hashing, no native dependency |

