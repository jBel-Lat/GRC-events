# Tournament Feature Setup Guide

## Step 1: Run the Database Migration

If you haven't already, run this SQL migration to add the tournament feature to your database:

### Option A: Using MySQL CLI
```bash
mysql -u root -p hackathon_grading < database/add_tournament_feature.sql
```

### Option B: Using MySQL Workbench or phpMyAdmin
Copy and paste this SQL into your MySQL client:

```sql
USE hackathon_grading;
ALTER TABLE event ADD COLUMN is_tournament BOOLEAN DEFAULT FALSE AFTER is_elimination;
CREATE INDEX idx_event_is_tournament ON event(is_tournament);
```

### Option C: Check if column already exists
Run this to check:
```sql
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'event' AND COLUMN_NAME = 'is_tournament';
```

If it returns nothing, run the migration above.

## Step 2: Restart Your Backend Server

After running the migration:
1. Stop the Node backend server (Ctrl+C in terminal)
2. Run `npm start` to restart it

## Step 3: Hard Refresh Your Browser

Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to clear all cached files and reload.

## Step 4: Test the Feature

1. Click "+ Add Event"
2. Fill in the event name and description
3. **Check the "This is a Tournament Event" checkbox**
4. You can leave the grading criteria empty since it's optional for tournaments
5. Click "Create Event"
6. Go to the **Tournament** section in the sidebar
7. You should now see your tournament event in the dropdown!
8. The event card in the Events section should show a **🏆 Tournament** label

## Troubleshooting

If the tournament section still doesn't appear:

1. **Check the browser console** (F12 → Console tab) for error messages
2. **Check the server logs** in the terminal running `npm start`
3. **Verify the database migration ran** by checking if the `is_tournament` column exists
4. **Clear browser cache** - sometimes old files are cached

## What Should Happen

- Tournament checkbox in create event form → optional criteria
- Tournament events appear with 🏆 badge in Events section
- Tournament events appear in dropdown in Tournament section
- Can select tournament event → add teams → generate bracket → choose winners
