# Team Member Selection Persistence Fix

## Issue Fixed

When selecting 11 players for a team with more than 11 members and then logging goals for one of them, the selection was being lost. Upon reopening the team members modal, users would need to reselect all 11 players again, creating a poor user experience.

## Implementation

The selection persistence has been fixed with the following changes:

1. **Selection Storage**

   - Team selections are stored in the `activeTeamPlayers` object
   - This object maps team IDs to arrays of selected player IDs

2. **Persistence Between Modal Openings**

   - When opening the team members modal, we now check if there's an existing selection
   - If 11 players were already selected for a team, we show them directly instead of the selection UI

3. **Reset Capability**

   - Added a "Reset Selection" button that allows users to start over with player selection
   - This button clears the stored selection and shows the full list again

4. **Visual Confirmation**
   - Added an alert banner that confirms when we're showing previously selected players
   - Makes it clear to users that their selection was preserved

## Code Changes

1. Modified `viewTeamMembers` function to check for existing selections:

```javascript
if (
  activeTeamPlayers[teamId] &&
  activeTeamPlayers[teamId].length === 11 &&
  data.members.length > 11
) {
  console.log("Using previously selected players for team", teamId);

  // Get the selected members data
  const selectedMemberIds = activeTeamPlayers[teamId];
  const membersWithSelectionInfo = data.members.map((member) => ({
    ...member,
    selected: selectedMemberIds.includes(parseInt(member.id)),
  }));

  // Render the selected view directly
  renderSelectedTeamMembers(
    membersWithSelectionInfo,
    selectedMemberIds,
    teamId
  );

  // Make sure the team's maximum kicks is updated to 55 (11 players * 5 kicks)
  updateTeamMaxKicks(teamId, 55);
}
```

2. Added notification banner to selected view:

```html
<div class="alert alert-success mb-3">
  <i class="bi bi-info-circle me-2"></i>
  Showing your selected 11 players.
  <button
    class="btn btn-sm btn-outline-success ms-2"
    onclick="resetTeamMemberSelection('${teamId}')"
  >
    Reset Selection
  </button>
</div>
```

3. Added reset function:

```javascript
function resetTeamMemberSelection(teamId) {
  console.log("Resetting player selection for team", teamId);

  // Clear the active players for this team
  if (activeTeamPlayers[teamId]) {
    delete activeTeamPlayers[teamId];
  }

  // Re-fetch team members to show the full selection UI
  viewTeamMembers(teamId);

  // Show notification
  showNotification(
    "Player selection reset. Please select 11 players again.",
    "info"
  );
}
```

## Testing

To test this fix:

1. Open a team competition with a team that has more than 11 members
2. Click "View Team Members" and select exactly 11 players
3. Click "Confirm Selection" to save your selection
4. Log goals for one of the selected players
5. Close the modal and reopen it by clicking "View Team Members" again
6. Verify that your previous selection is shown instead of the selection UI
7. Test the "Reset Selection" button to ensure it allows you to make a new selection

The selection will persist until you manually reset it or refresh the page.
