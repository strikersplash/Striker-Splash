# FINAL FIX: Custom Competition Goals Now Appear in Global Leaderboard

## The Problem

After implementing the initial fix to insert custom competition goals into `game_stats`, the goals were still not appearing in the global leaderboard.

## Root Cause Analysis

The issue was in the leaderboard query in `/src/controllers/leaderboard/leaderboardController.ts`:

**Original Query:**

```sql
FROM game_stats gs
JOIN players p ON gs.player_id = p.id
JOIN staff s ON gs.staff_id = s.id
JOIN queue_tickets qt ON gs.queue_ticket_id = qt.id  -- INNER JOIN
WHERE qt.status = 'played'
AND qt.official = TRUE
```

**Problem:**

- Custom competition entries in `game_stats` have `queue_ticket_id = NULL`
- The `INNER JOIN` with `queue_tickets` was filtering out all custom competition entries
- Only regular queue entries were being included in the leaderboard

## The Fix

Changed the query to use `LEFT JOIN` and modified the WHERE clause:

**Fixed Query:**

```sql
FROM game_stats gs
JOIN players p ON gs.player_id = p.id
JOIN staff s ON gs.staff_id = s.id
LEFT JOIN queue_tickets qt ON gs.queue_ticket_id = qt.id  -- LEFT JOIN
WHERE (qt.status = 'played' AND qt.official = TRUE) OR gs.competition_type = 'custom_competition'
```

**Solution:**

- `LEFT JOIN` allows entries with NULL `queue_ticket_id`
- WHERE clause includes both regular queue entries AND custom competition entries
- Custom competition goals now appear in the global leaderboard

## Verification

✅ **Database Test:** Direct query shows custom competition goals in results
✅ **API Test:** `/leaderboard` endpoint returns players with updated totals
✅ **UI Test:** Global leaderboard shows correct goal totals including custom competitions

## Before & After

**Before:**

- Tysha Daniels: 71 goals (without custom competition)
- Joshua Smith: 40 goals (without custom competition)

**After:**

- Tysha Daniels: 74 goals (71 + 3 from custom competition)
- Joshua Smith: 45 goals (40 + 5 from custom competition)

## Status: ✅ FULLY RESOLVED

Custom competition goals now appear correctly in the global leaderboard accessible from the navbar.
