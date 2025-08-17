/**
 * Fix for View Team Members button in competition-live.ejs
 *
 * This script adds event listeners to fix the View Team Members buttons
 * on the competition live page.
 */

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Team Members Button Fix loaded!");

  // Find all team member buttons
  const teamMemberButtons = document.querySelectorAll(".view-team-members-btn");
  console.log("Found team member buttons:", teamMemberButtons.length);

  // Add event listeners to each button
  teamMemberButtons.forEach((button) => {
    const teamId = button.getAttribute("data-team-id");
    console.log("Setting up button for team ID:", teamId);

    button.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Button clicked for team ID:", teamId);

      // Get the modal element
      const modal = document.getElementById("teamMembersModal");
      if (!modal) {
        console.error("Modal not found!");
        return;
      }

      // Show modal
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

      // Set loading state
      const teamMembersList = document.getElementById("teamMembersList");
      if (teamMembersList) {
        teamMembersList.innerHTML =
          '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading team members...</p></div>';
      }

      // Update modal title
      const modalTitle = document.getElementById("teamMembersModalLabel");
      if (modalTitle) {
        modalTitle.setAttribute("data-team-id", teamId);
        modalTitle.textContent = "Team Members (Loading...)";
      }

      // Fetch team members
      fetch(`/referee/api/team/${teamId}/members`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("API Response:", data);
          if (data.success && data.members) {
            console.log("Displaying team members:", data.members.length);
            displayTeamMembers(data.members);
          } else {
            console.error("No members found in API response");
            if (teamMembersList) {
              teamMembersList.innerHTML =
                '<div class="alert alert-warning">No team members found</div>';
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching team members:", error);
          if (teamMembersList) {
            teamMembersList.innerHTML = `<div class="alert alert-danger">Error loading team members: ${error.message}</div>`;
          }
        });
    });
  });
});

// Global function to ensure it's accessible
window.fixTeamMembersButtons = function () {
  const teamMemberButtons = document.querySelectorAll(".view-team-members-btn");
  console.log("Re-fixing team member buttons:", teamMemberButtons.length);

  teamMemberButtons.forEach((button) => {
    const teamId = button.getAttribute("data-team-id");
    // Remove existing click handlers
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    // Add new click handler
    newButton.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Fixed button clicked for team ID:", teamId);
      if (window.viewTeamMembers) {
        window.viewTeamMembers(teamId);
      } else {
        console.error("viewTeamMembers function not found!");
      }
    });
  });
};
