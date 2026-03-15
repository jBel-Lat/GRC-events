# Database Schema Documentation

## Overview

The hackathon grading system uses MySQL with 7 main tables organized with proper relationships and indexes for optimal performance.

## Tables

### 1. admin
Stores administrator account information.

```
Column          Type           Description
id              INT PK         User ID
username        VARCHAR(255)   Unique username
password        VARCHAR(255)   Hashed password (bcryptjs)
-- email column removed
full_name       VARCHAR(255)   Full name of admin
created_at      TIMESTAMP      Account creation time
updated_at      TIMESTAMP      Last update time
```

**Constraints:**
- Primary Key: `id`
- Unique: `username`, `email`

---

### 2. panelist
Stores panelist/evaluator account information.

```
Column          Type                      Description
id              INT PK                    User ID
username        VARCHAR(255)              Unique username
password        VARCHAR(255)              Hashed password
email           VARCHAR(255)              Unique email address
full_name       VARCHAR(255)              Full name of panelist
status          ENUM('active', 'inactive') Account status
created_by      INT FK → admin(id)        Admin who created account
created_at      TIMESTAMP                 Account creation time
updated_at      TIMESTAMP                 Last update time
```

**Constraints:**
- Primary Key: `id`
- Unique: `username`, `email`
- Foreign Key: `created_by` → `admin.id` (ON DELETE RESTRICT)
- Indexes: `idx_panelist_created_by`

---

### 3. event
Stores hackathon event information.

```
Column          Type                                    Description
id              INT PK                                  Event ID
event_name      VARCHAR(255)                           Event name
description     TEXT                                   Event description
start_date      DATETIME                               Event start date
end_date        DATETIME                               Event end date
status          ENUM('upcoming', 'ongoing', 'completed') Current status
created_by      INT FK → admin(id)                     Admin who created event
created_at      TIMESTAMP                              Event creation time
updated_at      TIMESTAMP                              Last update time
```

**Constraints:**
- Primary Key: `id`
- Foreign Key: `created_by` → `admin.id` (ON DELETE RESTRICT)
- Indexes: `idx_event_created_by`

---

### 4. criteria
Stores grading criteria for each event.

```
Column          Type           Description
id              INT PK         Criteria ID
event_id        INT FK         Event this criteria belongs to
criteria_name   VARCHAR(255)   Name of criteria (e.g., "Innovation")
percentage      DECIMAL(5,2)   Weight percentage (e.g., 30.00)
max_score       INT            Maximum score for this criteria (default: 100)
created_at      TIMESTAMP      Creation time
updated_at      TIMESTAMP      Last update time
```

**Constraints:**
- Primary Key: `id`
- Foreign Key: `event_id` → `event.id` (ON DELETE CASCADE)
- Unique: `(event_id, criteria_name)` - One criteria name per event
- Indexes: `idx_criteria_event_id`

**Example:**
```
Event: Hackathon 2026
├── Innovation (30%)
├── Technical Implementation (25%)
├── Presentation (20%)
├── Teamwork (15%)
└── Execution (10%)
```

---

### 5. panelist_event_assignment
Maps panelists to events (many-to-many relationship).

```
Column          Type           Description
id              INT PK         Assignment ID
panelist_id     INT FK         Panelist being assigned
event_id        INT FK         Event to assign to
assigned_by     INT FK → admin(id) Admin who made assignment
assigned_at     TIMESTAMP      Time of assignment
```

**Constraints:**
- Primary Key: `id`
- Foreign Key: `panelist_id` → `panelist.id` (ON DELETE CASCADE)
- Foreign Key: `event_id` → `event.id` (ON DELETE CASCADE)
- Foreign Key: `assigned_by` → `admin.id` (ON DELETE RESTRICT)
- Unique: `(panelist_id, event_id)` - Each panelist assigned once per event
- Indexes: `idx_panelist_event_event_id`, `idx_panelist_event_panelist_id`

**Example:**
```
Panelist1 → Hackathon 2026
Panelist1 → Tech Summit 2026
Panelist2 → Hackathon 2026
```

---

### 6. participant
Stores participant/team information.

```
Column              Type           Description
id                  INT PK         Participant ID
event_id            INT FK         Event they're registered for
participant_name    VARCHAR(255)   Name of participant or team
-- email column removed
team_name           VARCHAR(255)   Team name (if applicable)
registration_number VARCHAR(100)   Registration/ID number
created_at          TIMESTAMP      Registration time
updated_at          TIMESTAMP      Last update time
```

**Constraints:**
- Primary Key: `id`
- Foreign Key: `event_id` → `event.id` (ON DELETE CASCADE)
- Indexes: `idx_participant_event_id`

**Example:**
```
Event: Hackathon 2026
├── Team Alpha (REG001)
├── Team Beta (REG002)
├── Team Gamma (REG003)
└── Team Delta (REG004)
```

---

### 7. grade
Stores individual grades submitted by panelists.

```
Column          Type              Description
id              INT PK            Grade ID
participant_id  INT FK            Participant being graded
criteria_id     INT FK            Which criteria this grade is for
panelist_id     INT FK            Which panelist submitted grade
score           DECIMAL(5,2)      Score submitted (0-max_score)
created_at      TIMESTAMP         When grade was created
updated_at      TIMESTAMP         When grade was last updated
```

**Constraints:**
- Primary Key: `id`
- Foreign Key: `participant_id` → `participant.id` (ON DELETE CASCADE)
- Foreign Key: `criteria_id` → `criteria.id` (ON DELETE CASCADE)
- Foreign Key: `panelist_id` → `panelist.id` (ON DELETE CASCADE)
- Unique: `(participant_id, criteria_id, panelist_id)` - One grade per panelist per criteria per participant
- Indexes: `idx_grade_participant_id`, `idx_grade_panelist_id`

**Example:**
```
Participant: Team Alpha
├── Innovation (scored by Panelist1): 85
├── Innovation (scored by Panelist2): 88
├── Technical (scored by Panelist1): 80
└── Technical (scored by Panelist2): 82
```

---

## Data Relationships

### Hierarchy Diagram
```
admin (creates)
  ├── panelist (creates multiple)
  │   └── panelist_event_assignment
  │       └── event (many panelists per event)
  │
  ├── event (creates)
  │   ├── criteria (multiple per event)
  │   └── participant (multiple per event)
  │       └── grade (multiple grades per participant)
  │           └── (submitted by panelist for a criteria)
  │
  └── event (updates/manages)
```

### Relationships

1. **Admin → Panelist**
   - One admin can create many panelists (1:N)
   - Cascading delete not allowed (RESTRICT)

2. **Admin → Event**
   - One admin can create many events (1:N)
   - Cascading delete not allowed (RESTRICT)

3. **Event → Criteria**
   - One event has many criteria (1:N)
   - Cascading delete enabled (CASCADE)

4. **Event ↔ Panelist** (Many-to-Many)
   - One event assigned to many panelists
   - One panelist assigned to many events
   - Through: `panelist_event_assignment`

5. **Event → Participant**
   - One event has many participants (1:N)
   - Cascading delete enabled (CASCADE)

6. **Participant → Grade**
   - One participant receives many grades (1:N)
   - Each grade is for one criteria from one panelist
   - Cascading delete enabled (CASCADE)

7. **Criteria → Grade**
   - One criteria receives many grades (1:N)
   - Cascading delete enabled (CASCADE)

8. **Panelist → Grade**
   - One panelist submits many grades (1:N)
   - Cascading delete enabled (CASCADE)

---

## Indexes

All indexes are automatically created by the schema:

```sql
idx_event_created_by                -- Fast lookup of events by creator
idx_panelist_created_by             -- Fast lookup of panelists by creator
idx_criteria_event_id               -- Fast lookup of criteria by event
idx_panelist_event_event_id         -- Fast lookup of panelists for an event
idx_panelist_event_panelist_id      -- Fast lookup of events for a panelist
idx_participant_event_id            -- Fast lookup of participants by event
idx_grade_participant_id            -- Fast lookup of grades for a participant
idx_grade_panelist_id               -- Fast lookup of grades submitted by panelist
```

---

## Common Queries

### Get all participants with their average scores for an event
```sql
SELECT 
    p.id,
    p.participant_name,
    p.team_name,
    AVG(g.score) as average_score
FROM participant p
LEFT JOIN grade g ON p.id = g.participant_id
WHERE p.event_id = 1
GROUP BY p.id;
```

### Get grade breakdown for a participant
```sql
SELECT 
    c.criteria_name,
    c.percentage,
    pan.full_name as panelist_name,
    g.score
FROM criteria c
LEFT JOIN grade g ON c.id = g.criteria_id AND g.participant_id = 5
LEFT JOIN panelist pan ON g.panelist_id = pan.id
WHERE c.event_id = 1
ORDER BY c.id, pan.full_name;
```

### Get events assigned to a panelist
```sql
SELECT e.*
FROM event e
INNER JOIN panelist_event_assignment pea ON e.id = pea.event_id
WHERE pea.panelist_id = 2;
```

### Get all grades submitted by a panelist
```sql
SELECT 
    p.participant_name,
    c.criteria_name,
    g.score
FROM grade g
INNER JOIN participant p ON g.participant_id = p.id
INNER JOIN criteria c ON g.criteria_id = c.id
WHERE g.panelist_id = 1
ORDER BY p.id, c.id;
```

### Check if panelist is assigned to event
```sql
SELECT * 
FROM panelist_event_assignment
WHERE panelist_id = 1 AND event_id = 1;
```

---

## Cascading Behavior

### Delete Cascade (CASCADE)
When a parent record is deleted, child records are automatically deleted:

- Delete **event** → Deletes all its **criteria**, **participants**, and their **grades**
- Delete **participant** → Deletes all its **grades**
- Delete **criteria** → Deletes all **grades** using that criteria
- Delete **panelist_event_assignment** → No children, just unassigns

### Delete Restrict (RESTRICT)
When a parent record is deleted, operation fails if children exist:

- Delete **admin** → Fails if they created any **panelists** or **events**
- Delete **panelist** (from assignment) → Fails if they have submitted any **grades**

---

## Performance Considerations

1. **Indexes**: All foreign keys have indexes for fast lookups
2. **Unique Constraints**: Prevent duplicate assignments and grades
3. **Normalized Design**: Eliminates data redundancy
4. **Cascading Deletes**: Maintains referential integrity automatically

---

## Backup & Restore

### Export Database
```bash
mysqldump -u root -p hackathon_grading > backup.sql
```

### Import Database
```bash
mysql -u root -p hackathon_grading < backup.sql
```

### Export Specific Table
```bash
mysqldump -u root -p hackathon_grading grades > grades_backup.sql
```
