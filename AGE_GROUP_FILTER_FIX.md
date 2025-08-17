# Age Group Filter Fix

## Issue

The leaderboard age filter dropdown was showing redundant and obsolete age group options, specifically:

- "18-30"
- "adult"

These options are no longer used in the system but were still appearing in the age filter dropdown, potentially confusing users and causing inconsistent filtering results.

## Solution

The SQL query in the leaderboard controller was updated to explicitly exclude these redundant age groups from the dropdown.

### Before:

```typescript
// Get age brackets for filter dropdown
const ageBracketsResult = await pool.query(
  "SELECT DISTINCT age_group as name FROM players WHERE age_group IS NOT NULL ORDER BY age_group"
);
```

### After:

```typescript
// Get age brackets for filter dropdown, excluding redundant options
const ageBracketsResult = await pool.query(
  "SELECT DISTINCT age_group as name FROM players WHERE age_group IS NOT NULL AND age_group NOT IN ('18-30', 'adult') ORDER BY age_group"
);
```

## Technical Details

The SQL query now includes an additional condition to exclude specific age groups that are considered obsolete:

```sql
AND age_group NOT IN ('18-30', 'adult')
```

This ensures that only current and relevant age groups appear in the filter dropdown, making the user interface cleaner and filtering more accurate.

## Testing

To verify this fix:

1. Visit the leaderboard page
2. Click on the Age dropdown filter
3. Confirm that "18-30" and "adult" options are not present in the dropdown
4. Verify that all other legitimate age groups are still displayed
5. Test filtering by different age groups to ensure it works correctly

## Related Improvements

This change works alongside other leaderboard filter enhancements:

- Context-aware filtering for team vs individual views
- Proper encoding of filter parameters in URLs
- Improved filter application logic
