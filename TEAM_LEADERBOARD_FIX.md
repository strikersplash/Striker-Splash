# Team Leaderboard Fix

## Issue

The team leaderboard was displaying incorrect values for team goals and attempts. Teams like Hit Makers and Ace Strikers were showing values like 95 goals and 125 attempts, which were inconsistent with the actual team activity.

## Investigation

1. Examined the team leaderboard query in the `leaderboardController.ts` file
2. Checked the database tables:
   - `team_stats` - Contains both global team stats (with `competition_id=NULL`) and competition-specific stats
   - `custom_competition_activity` - Contains individual activity entries with `team_id` field
3. Found that the previous query was potentially double-counting data across multiple sources

## Fix

- Modified the team leaderboard query to only use the `custom_competition_activity` table as the source of truth
- This table contains all individual entries for each player's goal-logging activity
- Verified that the totals match our expectations:
  - Team "Hit Makers" (id=7): 19 goals from 25 attempts (5 players × 5 kicks each)
  - Team "Ace Strikers" (id=1): 16 goals from 25 attempts (5 players × 5 kicks each)

## Additional Notes

- The `team_stats` table still provides a good backup source of data, but using `custom_competition_activity` directly ensures we avoid double-counting
- The team dashboard and other areas of the app may still use `team_stats` for efficiency, which is fine as long as the data insertion logic is correct

## Future Improvements

- Consider refactoring other areas of the app to use consistent data sources
- Add database triggers to ensure `team_stats` always stays in sync with `custom_competition_activity`
- Add validation checks on the front end to catch and warn about data inconsistencies
