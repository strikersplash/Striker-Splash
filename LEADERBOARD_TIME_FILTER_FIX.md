# Leaderboard SQL Column Fix

## Issue

The individual leaderboard was throwing an SQL error when filtering by time range (day, week, month, year):

```
Error fetching leaderboard: error: column gs.created_at does not exist
```

The error occurred because the SQL query was referencing a non-existent column `gs.created_at`, while the database suggested using `s.created_at` instead.

## Solution

Updated the SQL query in the `getIndividualLeaderboard` function to use the correct column name for date filtering.

### Changed from:

```typescript
query += ` AND gs.created_at >= $${paramIndex}`;
params.push(startDate);
paramIndex++;
```

### Changed to:

```typescript
query += ` AND s.created_at >= $${paramIndex}`;
params.push(startDate);
paramIndex++;
```

## Technical Background

In the SQL query, `gs` refers to the `game_stats` table alias, while `s` refers to the `staff` table alias. The original code was trying to filter by the creation date in the `game_stats` table, but that column doesn't exist. The correct column to filter by is in the `staff` table.

## Testing

To verify this fix:

1. Visit the leaderboard page
2. Select "Today", "This Week", "This Month", or "This Year" from the Time filter
3. Apply the filters
4. The page should now load correctly without errors

## Additional Notes

- The team leaderboard time filtering is currently just a placeholder and not fully implemented
- In the future, it may be worth revisiting the overall leaderboard query structure to ensure all filters work consistently for both individual and team views
