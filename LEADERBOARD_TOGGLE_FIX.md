# Leaderboard Toggle Fix

## Issue

The team/individual toggle on the main leaderboard page was not working properly. When clicking on the "Teams" button in the navbar, the view wouldn't switch from individual players to teams - it continued to show the individual players leaderboard.

## Root Cause

There was a mismatch between the CSS hiding/showing mechanism and the JavaScript toggle logic:

1. The HTML was using Bootstrap's `d-none` class to show/hide the leaderboards:

   ```html
   <div
     id="individual-leaderboard"
     class="<%= filters.type === 'team' ? 'd-none' : '' %>"
   >
     <div
       id="team-leaderboard"
       class="<%= filters.type === 'team' ? '' : 'd-none' %>"
     ></div>
   </div>
   ```

2. But the JavaScript was trying to add/remove custom `hidden` and `visible` classes:

   ```javascript
   individualLeaderboard.className =
     individualLeaderboard.className.replace("visible", "").trim() + " hidden";
   teamLeaderboard.className =
     teamLeaderboard.className.replace("hidden", "").trim() + " visible";
   ```

3. Additionally, there were conflicting CSS rules that used `!important` to force specific display behaviors:

   ```css
   #individual-leaderboard {
     display: block !important;
   }

   #team-leaderboard {
     display: none !important;
   }
   ```

These conflicting approaches prevented the toggle from working correctly.

## Solution

1. **Updated the JavaScript toggle logic** to use Bootstrap's `d-none` class consistently:

   ```javascript
   // Client-side toggle for immediate feedback
   if (type === "team") {
     console.log("Hiding individual, showing team");
     individualLeaderboard.classList.add("d-none");
     teamLeaderboard.classList.remove("d-none");
   } else {
     console.log("Showing individual, hiding team");
     individualLeaderboard.classList.remove("d-none");
     teamLeaderboard.classList.add("d-none");
   }
   ```

2. **Removed the conflicting CSS rules** that were overriding the display properties with `!important`.

## Verification

To verify this fix works:

1. Navigate to the main leaderboard page from the navbar
2. Click on the "Teams" button in the toggle
3. Confirm that the team leaderboard is displayed instead of the individual one
4. Click on the "Individual" button in the toggle
5. Confirm that the individual leaderboard is displayed again

The toggle now properly switches between individual and team views without requiring a page reload.
