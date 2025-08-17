# Team Member Count Validation Fix

## Issue Identified

The "Create Team Competition" button was showing incorrect team member counts, displaying "Ace Strikers (has 0, needs 5)" even though both teams actually have 5 members.

## Root Cause

The validation logic had a **data source mismatch**:

1. **For large teams (11+ players)**: The code calls `fetchTeamMembers()` to get detailed member lists and stores them in `teamMembers` object
2. **For small teams (< 11 players)**: The code does NOT call `fetchTeamMembers()` but still tries to access `teamMembers[teamId]` which is empty
3. **Result**: `members.length` returns 0 for all small teams because `teamMembers[teamId]` is undefined

## The Bug

```javascript
// This only runs for teamSize >= 11
if (teamSize >= 11) {
  fetchTeamMembers(team.id);
}

// But this validation runs for teamSize < 11 and tries to access teamMembers
for (let team of selectedTeams) {
  const members = teamMembers[teamId] || []; // This is always empty for small teams!
  const memberCount = members.length; // Always 0
}
```

## The Fix

Changed the validation for small teams to use the `member_count` property that's already available in the team object:

```javascript
// BEFORE (broken):
const members = teamMembers[teamId] || [];
const memberCount = members.length;

// AFTER (fixed):
const memberCount = team.member_count || 0;
```

## Why This Works

- The `team.member_count` property comes from the database when teams are searched and added
- The console logs show: "Adding team: Object { id: 1, name: "Ace Strikers", captain_name: "John Doe", member_count: 5 }"
- This value is accurate and doesn't require additional API calls for small teams

## Expected Result

After restarting the server:

- Teams with 5 members should pass validation for 5-a-side competitions
- The error message should no longer appear for teams that actually have enough players
- The competition creation should proceed successfully

## Server Restart Required

The server needs to be restarted to apply this fix. After restart, try creating the team competition again - it should work correctly now.
