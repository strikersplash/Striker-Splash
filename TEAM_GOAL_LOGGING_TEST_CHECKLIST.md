# Team Goal Logging Test Checklist

This document provides a comprehensive testing checklist for the team competition goal logging functionality in the Striker Splash application.

## Pre-requisites

- [ ] Server is running and accessible at http://localhost:3000
- [ ] You are logged in as a staff member
- [ ] At least one team competition is in "Live" status
- [ ] Competition has teams with members

## 1. Team ID Consistency Tests

- [ ] Check team cards for consistent `data-team-id` attribute (should use `team.team_id`)
- [ ] Verify "View Team Members" buttons have matching `data-team-id` attributes
- [ ] Confirm score elements have IDs in the format `team-score-{teamId}`
- [ ] Confirm kicks elements have IDs in the format `team-kicks-{teamId}`

## 2. View Team Members Functionality

- [ ] Click "View Team Members" button for a team
- [ ] Verify the modal appears and shows team members
- [ ] Check that API calls to `/referee/api/team/{id}/members` succeed

### For Teams with ≤11 Members

- [ ] Verify that members are displayed with "Log Goals" buttons
- [ ] Confirm team selection UI is hidden

### For Teams with >11 Members

- [ ] Verify selection UI is visible
- [ ] Select exactly 11 members and confirm Save button enables
- [ ] Save selection and verify UI updates to show only selected members
- [ ] Verify team's max kicks updates to `/55` after selection

## 3. Log Goals Functionality

### For Individual Participants

- [ ] Click "Log Goals" for an individual participant
- [ ] Verify form loads correctly with participant details
- [ ] Submit form with valid data (0-5 kicks, 0-5 goals)
- [ ] Verify UI updates immediately with new goals/kicks
- [ ] Check that progress bar and goals badge update

### For Team Members

- [ ] Click "Log Goals" for a team member
- [ ] Verify form has hidden inputs for `participantId`, `teamId`, and `competitionId`
- [ ] Submit form with valid data
- [ ] Verify team score and kicks update immediately
- [ ] Check that team member's button updates to "Logged"

## 4. Form Validation

- [ ] Try submitting with missing required fields
- [ ] Try submitting with invalid values (e.g., non-numeric)
- [ ] Try submitting with valid edge cases (0 goals, 5 kicks)
- [ ] Verify validation messages appear correctly

## 5. UI Updates

- [ ] After logging goals, verify team score increases by goals scored
- [ ] After logging goals, verify team kicks increase by kicks used
- [ ] For participants, check progress bar updates correctly
- [ ] Verify "Log Goals" button disables after all kicks are used

## 6. Leaderboard Updates

- [ ] After logging goals, click "Refresh" button on leaderboard
- [ ] Verify leaderboard updates with new standings
- [ ] Check that team/participant positions change based on scores

## 7. Browser Refresh Tests

- [ ] Log goals for a participant/team member
- [ ] Refresh the browser
- [ ] Verify all updates persist after refresh

## 8. Edge Cases

- [ ] Test with very large teams (20+ members)
- [ ] Test with minimum team size
- [ ] Test logging goals multiple times for different team members
- [ ] Test competitions with multiple teams

## Test Execution Steps

1. Open competition live page: `/staff/competition-live/{competitionId}`
2. Run test script: `test-team-updates-final.js` to verify team ID consistency
3. Manually execute each test case above
4. Document any issues found

## Known Issues and Limitations

- Editing already logged goals is not supported
- Team members must be selected each time if the page is refreshed
- Active player selection is not persisted in the database

## Verification

After completing all tests, the following should be true:

1. Individual participants can log goals and see immediate UI updates
2. Teams with ≤11 members can log goals for any member
3. Teams with >11 members require selecting exactly 11 players
4. All UI elements update correctly after goal logging
5. Leaderboard reflects the latest standings
