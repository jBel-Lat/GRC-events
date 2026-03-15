# Event Elimination Features - Implementation Guide

## Overview
Added complete elimination feature support to the Event Program for managing games with elimination rounds (e.g., tournaments, bracket-style competitions).

## Features Added

### 1. Database Schema Updates
**File:** `database/add_elimination_feature.sql`

New columns added to `participant` table:
- `is_eliminated` (BOOLEAN) - Tracks if participant has been eliminated
- `elimination_round` (VARCHAR) - Records which round they were eliminated in

New column added to `event` table:
- `is_elimination` (BOOLEAN) - Flags if event has elimination features enabled

### 2. Backend Updates

#### Event Controller (`backend/controllers/eventController.js`)
- `createEvent()` - Now handles `is_elimination` field
- `updateEvent()` - Supports updating elimination feature flag

#### Participant Controller (`backend/controllers/participantController.js`)
- `getEventParticipants()` - Returns `is_eliminated` and `elimination_round` fields
- `updateParticipant()` - Now accepts and updates elimination status fields

### 3. Frontend Updates

#### HTML Form Updates (`frontend/public/admin/dashboard.html`)
- **Add Event Modal**: Added checkbox "Has Elimination Features"
- **Edit Event Modal**: Added checkbox "Has Elimination Features"

#### JavaScript Elimination Functions (`frontend/public/admin/js/elimination.js`)
New file with three main functions:
1. **`toggleElimination(participantId, isEliminated)`** 
   - Updates elimination status via API
   - Refreshes participant list after update

2. **`openEliminationModal(participantId)`**
   - Prompts admin to enter elimination round name
   - Calls `markAsEliminated()` after validation

3. **`markAsEliminated(participantId, round)`**
   - Sends PATCH request with elimination data
   - Updates UI automatically

#### Events Display Updates (`frontend/public/admin/js/events.js`)
Participant cards now show:
- ❌ "Eliminated" badge next to participant name if eliminated
- Elimination round information if available
- Two action buttons based on status:
  - If active: "🔒 Eliminate" button
  - If eliminated: "↩️ Restore" button to reverse elimination

#### CSS Styling (`frontend/public/css/admin.css`)
- `.participant-card.eliminated` - Greyed out, slightly transparent
- Red left border for quick visual identification
- Strikethrough text for eliminated participants

### 4. API Endpoints Used

**PATCH /api/participants/:id**
```json
{
  "is_eliminated": true/false,
  "elimination_round": "Round 1" | "Semis" | "Finals" | etc
}
```

## Usage Workflow

### Setting Up an Elimination Event
1. Click "Add Event" button
2. Fill in event details (name, dates, etc.)
3. **Check "Has Elimination Features"** checkbox
4. Add grading criteria
5. Click "Create Event"

### Managing Eliminations During Event
1. View event and its participants
2. For each participant:
   - Click **"🔒 Eliminate"** button
   - Enter elimination round (e.g., "Round 1", "Quarterfinals")
   - Participant card will update with eliminated status
3. To restore a participant:
   - Click **"↩️ Restore"** button on an eliminated participant
   - Status reverts to active

### Viewing Elimination Status
- Participants are displayed in the list with clear visual indicators
- Eliminated participants show with:
  - ❌ Emoji badge
  - Greyed-out card styling
  - Round information below registration number
  - "Restore" button instead of "Eliminate"

## Technical Notes

### Database Prerequisites
Run the migration script to add new columns:
```sql
mysql -u root -p hackathon_grading < database/add_elimination_feature.sql
```

### Frontend Script Dependencies
Must include in order:
1. `api.js` - API communication
2. `events.js` - Event management
3. `elimination.js` - Elimination features (NEW)
4. `admin.js` - Main admin script

### Data Structure
```javascript
{
  id: 1,
  participant_name: "John Doe",
  team_name: "Team Alpha",
  registration_number: "REG001",
  is_eliminated: true,
  elimination_round: "Quarterfinals"
}
```

## Files Created/Modified

### Created
- `frontend/public/admin/js/elimination.js` - Elimination feature functions
- `database/add_elimination_feature.sql` - Database migration

### Modified
- `backend/controllers/eventController.js` - Added `is_elimination` support
- `backend/controllers/participantController.js` - Added elimination fields
- `frontend/public/admin/dashboard.html` - Added event elimination checkbox
- `frontend/public/css/admin.css` - Added elimination styling (pending)

## Future Enhancements

1. **Bracket Visualization** - Display tournament bracket structure
2. **Batch Operations** - Eliminate multiple participants at once
3. **Round Management** - Organize participants by elimination round
4. **Elimination History** - Timeline view of eliminations
5. **Auto-Elimination** - Eliminate lowest scoring participants automatically
6. **Export/Reports** - Generate elimination reports and statistics

## Troubleshooting

### Elimination Status Not Showing
- Ensure `elimination.js` is loaded after `events.js`
- Check browser console for API errors
- Verify database migration was run

### Buttons Not Working
- Confirm admin token is valid in localStorage
- Check network requests in browser DevTools
- Verify API endpoints are returning success

### Styling Issues
- Clear browser cache (Ctrl+Shift+Del)
- Ensure admin.css has `.eliminated` class styles
- Check that CSS file loaded without 404 errors
