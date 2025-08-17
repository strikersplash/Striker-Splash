# Football Team Size and Competition Management Updates

## Overview

This update adds support for real football team sizes (up to 23 players) and implements new rules for team competitions where only 11 players from larger teams can participate in a competition.

## Features Added

### 1. New Team Size Options

- Added new team size options: 18-a-side (Full Squad) and 23-a-side (Extended Squad)
- Updated validation logic in the Team model

### 2. Team Competition Rules

- Teams with 11+ players require:

  - Minimum of 11 players to participate in competitions
  - Maximum of 23 players in the team
  - Exactly 11 players must be selected when setting up a competition

- Teams with fewer than 11 players:
  - Both teams must have the same number of players
  - Validation ensures both teams can field the required number of players

### 3. Player Selection During Competition Setup

- When setting up a competition with 11+ player teams:
  - Staff must select exactly 11 active players from each team
  - Selection is stored in the new `custom_competition_active_players` table
  - Only selected players can participate in the competition

### 4. UI Improvements

- Added player selection UI in competition setup
- Non-selected players appear greyed out in the live competition view
- "Log Goals" buttons are disabled for non-selected players
- Added visual indicators and helpful messages about player selection

### 5. Other Changes

- Removed the recent activity table from team competition live view
- Added database table for tracking active players in competitions

## Database Changes

- Added `custom_competition_active_players` table
- Added appropriate indexes for performance

## Migration

Run the `add-active-players-migration.sh` script to add the required database table.

## Usage Instructions

1. When creating a team, you can now select 18 or 23 players as team sizes.
2. When setting up a competition with 11+ player teams:
   - You must select exactly 11 active players from each team.
   - Teams with fewer than 11 players will show an error.
3. During the competition:
   - Only selected active players will be enabled for goal logging.
   - Non-selected players will appear greyed out.

## Implementation Notes

- For teams with 11+ players, validation ensures:
  - Each team has at least 11 players
  - Exactly 11 players are selected before the competition can be created
- For teams with fewer than 11 players, validation ensures:
  - Both teams have enough players for the selected team size
  - Both teams have the same number of players
