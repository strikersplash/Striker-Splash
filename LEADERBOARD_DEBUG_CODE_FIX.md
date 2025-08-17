# Leaderboard Debug Code Fix

## Issue

Debug JavaScript code was appearing directly in the rendered HTML of the leaderboard page:

```
// Check initial state based on current view const isTeamView = document.getElementById('team-radio').checked; if (isTeamView) { disableIndividualOnlyFilters(true); console.log('Initial state: Team view, disabling individual-only filters'); } else { console.log('Initial state: Individual view, all filters enabled'); }h4 class="mb-2 mb-md-0">Striker Splash Leaderboard
```

## Solution

1. Added the "sort-filter" to the list of filters that are disabled when viewing teams
2. Fixed an EJS rendering issue where debug JavaScript code was being rendered directly in the HTML instead of being enclosed in script tags

### Changes Made:

1. Updated the `disableIndividualOnlyFilters` function to properly handle the sort filter
2. Fixed the issue with debug JavaScript showing up in the HTML
3. Made sure all JavaScript code is properly enclosed in script tags

### Technical Details:

This issue was likely caused by:

- JavaScript debug code accidentally rendered directly in the HTML instead of being enclosed in script tags
- A missing opening/closing script tag or incorrect EJS template syntax
- The fix ensures all JavaScript is properly contained within script tags

### Impact:

- Improved user experience by removing debug code from the UI
- Ensured the sort filter is properly disabled when viewing team leaderboards
- Fixed the visual appearance of the leaderboard page
