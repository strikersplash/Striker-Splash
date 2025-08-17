# Team Join Button Logic Implementation

## Overview

Updated the team browse page to show different button text and behavior based on whether teams are set to "open for anyone to join" or "by request only" during team creation.

## Changes Made

### 1. Browse Teams View (src/views/teams/browse.ejs)

- Updated button logic to check `team.is_recruiting` field
- **Open teams** (`is_recruiting: true`): Green "Join Team" button
- **Request-only teams** (`is_recruiting: false`): Orange "Request to Join" button
- **Full teams**: Grey "Team Full" button (disabled)

### 2. Modal Content

- **Open teams**: Shows success alert "This team is open for new members! You can join immediately."
- **Request-only teams**: Shows warning alert "This team requires approval to join."
- **Message field**: Optional for open teams, required for request-only teams
- **Submit button**: "Join Team" (green) for open teams, "Send Request" (orange) for request-only teams

### 3. Backend Logic (src/controllers/teams/teamController.ts)

Updated `joinTeam` function to handle both scenarios:

- **Open teams**: Directly add player to team using `Team.addMember()`
- **Request-only teams**: Create join request using `Team.createJoinRequest()`
- Added team capacity checking before processing
- Added team existence validation

### 4. Team Model (src/models/Team.ts)

Updated `addMember` method to:

- Use team's actual `team_size` instead of hardcoded limit of 5
- Check team capacity dynamically based on team configuration

## User Experience

- **Open teams**: Players can join immediately with one click
- **Request-only teams**: Players must send a request with message for captain approval
- **Visual differentiation**: Green vs Orange buttons clearly indicate the join method
- **Appropriate feedback**: Different success messages based on join type

## Database Schema

The `teams` table already includes:

- `is_recruiting` (boolean): Controls whether team is open or by-request
- `team_size` (integer): Maximum number of members

## Team Creation

During team creation, users can choose:

- "Open for new members" (`is_recruiting: true`)
- "Invite only" (`is_recruiting: false`)

This setting can be changed later by team admins.
