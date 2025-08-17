# Leaderboard Filter Fixes

## Issue

The leaderboard filters weren't working correctly, particularly for the team leaderboard view. When applying filters like gender, age group, district, or time range on the team leaderboard, SQL errors occurred:

```
Error fetching team leaderboard: error: missing FROM-clause entry for table "p"
```

This error happened because the team leaderboard query was referencing player attributes (from table "p") but didn't include the players table in the query's FROM clause.

## Root Cause Analysis

1. **Missing Table Join**: The team leaderboard query referenced player fields (`p.gender`, `p.age_group`, etc.) but didn't join the players table.

2. **Incorrect Filter Logic**: The filters were being applied directly to players rather than checking if any team member matched the filter criteria.

3. **Incomplete Time Range Filter**: The time filter was commented out for team leaderboards.

4. **Sort Filter Implementation**: The team leaderboard didn't respect the sort parameter.

## Solution

### 1. Added Missing Table Join

Added a proper join to the players table in the team leaderboard query:

```sql
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN players p ON p.id = tm.player_id  /* Added this join */
LEFT JOIN team_activity ta ON ta.team_id = t.id
```

### 2. Improved Filter Logic for Teams

Updated the gender, age, and district filters to use EXISTS subqueries to check if any team member matches the criteria:

```sql
EXISTS (
  SELECT 1 FROM team_members tm2
  JOIN players p2 ON p2.id = tm2.player_id
  WHERE tm2.team_id = t.id AND p2.gender = $1
)
```

This approach checks if there's at least one player on the team that meets the filter criteria.

### 3. Implemented Time Range Filter

Added time range filtering for team leaderboards using the team's last_activity timestamp:

```sql
WHERE ta.last_activity >= $1
```

### 4. Updated Sort Logic

Updated the ORDER BY clause to properly handle the sort filter parameter.

## Testing

To test these fixes:

1. Visit the leaderboard page
2. Try filtering by gender, age group, district, and time range
3. Toggle between individual and team views
4. Verify that all filters work correctly in both views
5. Check that the sort filter properly orders the results

## Additional Notes

- All filters now work for both individual and team views
- The team leaderboard now shows teams where at least one member matches the filter criteria
- The streak sorting for teams falls back to sorting by goals since teams don't have streak metrics
- Updated UI to provide better guidance:
  - Removed filter disabling since all filters now work for teams
  - Added helpful tooltip for the streak sorting option in team view
  - Changed the filter info message to explain how team filters work
- Filter parameters are properly encoded in the URL
- Updated the frontend filter application logic to properly handle both individual and team filters
