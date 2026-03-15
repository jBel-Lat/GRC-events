# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication Endpoints

### Admin Login
```
POST /auth/admin/login
Content-Type: application/json

Request Body:
{
  "username": "admin",
  "password": "admin123"
}

Response (Success - 200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "System Admin",
    "email": "admin@example.com"
  }
}

Response (Error - 401):
{
  "success": false,
  "message": "Invalid username or password"
}
```

### Panelist Login
```
POST /auth/panelist/login
Content-Type: application/json

Request Body:
{
  "username": "panelist1",
  "password": "panelist123"
}

Response: Same as admin login
```

---

## Event Endpoints (Admin Only)

All event endpoints require authentication header:
```
Authorization: Bearer {token}
```

### Get All Events
```
GET /events

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_name": "Hackathon 2026",
      "description": "Annual company-wide hackathon",
      "start_date": "2026-03-15T09:00:00.000Z",
      "end_date": "2026-03-16T18:00:00.000Z",
      "status": "ongoing",
      "created_at": "2026-03-04T10:30:00.000Z"
    }
  ]
}
```

### Get Event Details with Criteria
```
GET /events/:id

Response (200):
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "event_name": "Hackathon 2026",
      "description": "Annual company-wide hackathon",
      "start_date": "2026-03-15T09:00:00.000Z",
      "end_date": "2026-03-16T18:00:00.000Z",
      "status": "ongoing",
      "created_by": 1,
      "created_at": "2026-03-04T10:30:00.000Z"
    },
    "criteria": [
      {
        "id": 1,
        "criteria_name": "Innovation",
        "percentage": 30,
        "max_score": 100
      },
      {
        "id": 2,
        "criteria_name": "Technical Implementation",
        "percentage": 25,
        "max_score": 100
      }
    ]
  }
}
```

### Create Event
```
POST /events
Content-Type: application/json

Request Body:
{
  "event_name": "Hackathon 2026",
  "description": "Annual company-wide hackathon",
  "start_date": "2026-03-15T09:00:00",
  "end_date": "2026-03-16T18:00:00",
  "criteria": [
    {
      "criteria_name": "Innovation",
      "percentage": 30,
      "max_score": 100
    },
    {
      "criteria_name": "Technical Implementation",
      "percentage": 25,
      "max_score": 100
    }
  ]
}

Response (201):
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "event_id": 1
  }
}
```

### Update Event
```
PUT /events/:id
Content-Type: application/json

Request Body:
{
  "event_name": "Hackathon 2026",
  "description": "Updated description",
  "start_date": "2026-03-15T09:00:00",
  "end_date": "2026-03-16T18:00:00",
  "status": "completed"
}

Response (200):
{
  "success": true,
  "message": "Updated successfully"
}
```

### Add Criteria to Event
```
POST /events/criteria/add
Content-Type: application/json

Request Body:
{
  "event_id": 1,
  "criteria_name": "Presentation",
  "percentage": 20,
  "max_score": 100
}

Response (201):
{
  "success": true,
  "message": "Created successfully"
}
```

### Delete Criteria
```
DELETE /events/criteria/:id

Response (200):
{
  "success": true,
  "message": "Deleted successfully"
}
```

---

## Participant Endpoints

### Get Event Participants (Admin)
```
GET /participants/admin/event/:event_id
Authorization: Bearer {admin_token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "participant_name": "Team Alpha",
      "email": "team@example.com",
      "team_name": "Team Alpha",
      "registration_number": "REG001",
      "average_score": 85.5
    }
  ]
}
```

### Get Participant Details with Grade Breakdown (Admin)
```
GET /participants/admin/:event_id/:participant_id
Authorization: Bearer {admin_token}

Response (200):
{
  "success": true,
  "data": {
    "participant": {
      "id": 1,
      "event_id": 1,
      "participant_name": "Team Alpha",
      "email": "team@example.com",
      "team_name": "Team Alpha",
      "registration_number": "REG001"
    },
    "criteria": [
      {
        "id": 1,
        "criteria_name": "Innovation",
        "percentage": 30,
        "max_score": 100,
        "grades": [
          {
            "panelist_name": "John Evaluator",
            "score": 85
          },
          {
            "panelist_name": "Jane Assessor",
            "score": 88
          }
        ]
      }
    ]
  }
}
```

### Add Participant (Admin)
```
POST /participants/admin/add
Authorization: Bearer {admin_token}
Content-Type: application/json

Request Body:
{
  "event_id": 1,
  "participant_name": "Team Alpha",
  "email": "team@example.com",
  "team_name": "Team Alpha",
  "registration_number": "REG001"
}

Response (201):
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "participant_id": 1
  }
}
```

### Update Participant (Admin)
```
PUT /participants/admin/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

Request Body:
{
  "participant_name": "Team Alpha",
  "email": "team@example.com",
  "team_name": "Team Alpha",
  "registration_number": "REG001"
}

Response (200):
{
  "success": true,
  "message": "Updated successfully"
}
```

### Delete Participant (Admin)
```
DELETE /participants/admin/:id
Authorization: Bearer {admin_token}

Response (200):
{
  "success": true,
  "message": "Deleted successfully"
}
```

### Get Participant Grades for Panelist
```
GET /participants/panelist/:event_id/:participant_id
Authorization: Bearer {panelist_token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "criteria_name": "Innovation",
      "percentage": 30,
      "max_score": 100,
      "score": 0
    },
    {
      "id": 2,
      "criteria_name": "Technical Implementation",
      "percentage": 25,
      "max_score": 100,
      "score": 0
    }
  ]
}
```

### Submit Grade (Panelist)
```
POST /participants/grade/submit
Authorization: Bearer {panelist_token}
Content-Type: application/json

Request Body:
{
  "participant_id": 1,
  "criteria_id": 1,
  "score": 85.5
}

Response (200):
{
  "success": true,
  "message": "Updated successfully"
}
```

---

## Student Endpoints
These routes are analogous to panelist routes but tailored for students who log in with their name and student ID.

### Student Login
```
POST /auth/student/login
Content-Type: application/json

Request Body:
{
  "name": "Alice Learner",
  "student_number": "STU1001"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Alice Learner",
    "student_number": "STU1001"
  }
}
```

### Get Assigned Events (Student)
```
GET /students/assigned-events
Authorization: Bearer {student_token}

Response (200):
{
  "success": true,
  "data": [ {"id":1, "event_name":"Hackathon 2026", ...} ]
}
```

### Get Event Participants (Student)
```
GET /participants/student/event/:event_id
Authorization: Bearer {student_token}

Response (200):
{
  "success": true,
  "data": [ {"id":1, "participant_name":"Team Alpha", ...} ]
}
```

### Get Participant Grades (Student)
```
GET /participants/student/:event_id/:participant_id
Authorization: Bearer {student_token}

Response (200):
{
  "success": true,
  "data": [ {"id":1, "criteria_name":"Innovation", "percentage":30, "max_score":100, "score":0}, ... ]
}
```

### Submit Grade (Student)
```
POST /participants/grade/submit/student
Authorization: Bearer {student_token}
Content-Type: application/json

Request Body:
{
  "participant_id": 1,
  "criteria_id": 1,
  "score": 75
}

Response (200):
{
  "success": true,
  "message": "Updated successfully"
}
```

---

## Panelist Endpoints (Admin Only)

All panelist endpoints require admin authentication.

### Get All Panelists
```
GET /panelists
Authorization: Bearer {admin_token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "panelist1",
      "full_name": "John Evaluator",
      "email": "panelist1@example.com",
      "status": "active",
      "created_at": "2026-03-04T10:30:00.000Z"
    }
  ]
}
```

### Create Panelist
```
POST /panelists
Authorization: Bearer {admin_token}
Content-Type: application/json

Request Body:
{
  "username": "panelist1",
  "password": "secure_password",
  "email": "panelist1@example.com",
  "full_name": "John Evaluator"
}

Response (201):
{
  "success": true,
  "message": "Panelist created successfully"
}
```

### Update Panelist
```
PUT /panelists/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

Request Body:
{
  "username": "panelist1",
  "email": "panelist1@example.com",
  "full_name": "John Evaluator",
  "status": "active"
}

Response (200):
{
  "success": true,
  "message": "Updated successfully"
}
```

### Delete Panelist
```
DELETE /panelists/:id
Authorization: Bearer {admin_token}

Response (200):
{
  "success": true,
  "message": "Deleted successfully"
}
```

### Assign Panelist to Event
```
POST /panelists/assign-event
Authorization: Bearer {admin_token}
Content-Type: application/json

Request Body:
{
  "panelist_id": 1,
  "event_id": 1
}

Response (201):
{
  "success": true,
  "message": "Panelist assigned to event successfully"
}
```

### Remove Panelist from Event
```
DELETE /panelists/:panelist_id/event/:event_id
Authorization: Bearer {admin_token}

Response (200):
{
  "success": true,
  "message": "Deleted successfully"
}
```

### Get Panelist's Assigned Events
```
GET /panelists/assigned-events
Authorization: Bearer {panelist_token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_name": "Hackathon 2026",
      "description": "Annual company-wide hackathon",
      "start_date": "2026-03-15T09:00:00.000Z",
      "end_date": "2026-03-16T18:00:00.000Z",
      "status": "ongoing"
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

- **200**: OK - Request successful
- **201**: Created - Resource created successfully
- **400**: Bad Request - Missing or invalid parameters
- **401**: Unauthorized - Missing or invalid token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **500**: Internal Server Error - Server error

---

## Authentication Notes

- All tokens expire in 24 hours
- Include token in Authorization header: `Authorization: Bearer {token}`
- Tokens are stored in browser localStorage automatically by the frontend
- Admin and Panelist tokens are separate
- Token is required for all endpoints except `/auth/*` endpoints
