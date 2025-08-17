# Leaderboard Context-Aware Filters Enhancement

## Overview

This enhancement improves the user experience on the leaderboard page by making the filters context-aware based on whether the user is viewing individual or team leaderboards. Filters that are not applicable to team leaderboards (gender, age, district) are visually disabled when viewing the team leaderboard, preventing potential bugs and providing clear visual feedback.

## Implementation Details

### 1. Context-Aware Filter Disabling

When users toggle between individual and team leaderboards:

- For individual leaderboards: All filters are enabled
- For team leaderboards: Individual-specific filters (gender, age, district) are disabled and grayed out

### 2. Visual Feedback

- Disabled filters have a grayed-out appearance
- A tooltip is added to disabled filters explaining why they're not available
- An informational message appears below the filters when viewing team leaderboards

### 3. Filter Application Logic

- When applying filters in team view, individual-specific filters are not included in the query
- When resetting filters, the current leaderboard type (individual or team) is maintained

### 4. Persistent View State

- The current view state (individual or team) is maintained when:
  - Applying filters
  - Resetting filters
  - Page refresh

## Technical Changes

1. Added a `disableIndividualOnlyFilters()` function to toggle filter state:

   ```javascript
   function disableIndividualOnlyFilters(disable) {
     const individualOnlyFilters = [
       "gender-filter",
       "age-filter",
       "district-filter",
     ];

     individualOnlyFilters.forEach((filterId) => {
       const filterElement = document.getElementById(filterId);
       if (filterElement) {
         filterElement.disabled = disable;
         filterElement.parentElement.classList.toggle("text-muted", disable);
         if (disable) {
           filterElement.title =
             "This filter is only available for individual players";
         } else {
           filterElement.removeAttribute("title");
         }
       }
     });
   }
   ```

2. Updated toggle handler to manage filter state:

   ```javascript
   if (type === "team") {
     individualLeaderboard.classList.add("d-none");
     teamLeaderboard.classList.remove("d-none");
     disableIndividualOnlyFilters(true);
   } else {
     individualLeaderboard.classList.remove("d-none");
     teamLeaderboard.classList.add("d-none");
     disableIndividualOnlyFilters(false);
   }
   ```

3. Added context-aware filter application:

   ```javascript
   // Only add individual filters if we're in individual view
   if (!isTeamView) {
     // Add gender, age, residence filters
   }
   ```

4. Added informational message for users:
   ```html
   <div id="filter-info" class="small text-muted mt-2">
     <i class="bi bi-info-circle"></i> Some filters are disabled for team
     leaderboards.
   </div>
   ```

## User Experience Benefits

1. **Clear Expectations**: Users understand which filters apply to each leaderboard type
2. **Reduced Errors**: Prevents users from applying irrelevant filters to teams
3. **Visual Consistency**: Maintains the same filter layout while providing clear visual cues
4. **Contextual Help**: Informational messages explain why certain filters are disabled

## Testing

To test this enhancement:

1. Visit the leaderboard page
2. Toggle between "Individual" and "Teams" views
3. Verify that filters are properly enabled/disabled
4. Apply filters in each view and verify the results
5. Reset filters and verify the view state is maintained
