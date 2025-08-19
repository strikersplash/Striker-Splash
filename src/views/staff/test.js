<div class="container mt-5">
  <div class="row">
    <div class="col-md-12">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>
        </h2>
        <div>
          <a href="/staff/competition-setup" class="btn btn-secondary me-2">
            <i class="bi bi-arrow-left"></i> Back to Setup
          </a>
          <button class="btn btn-danger" id="end-competition-btn">
            <i class="bi bi-stop-circle"></i> End Competition
          </button>
        </div>
      </div>

      <!-- Competition Details Card -->
      <div class="card mb-5">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">Competition Details</h5>
        </div>
        <div class="card-body pb-4">
          <div class="row">
            <div class="col-md-3">
            </div>
            <div class="col-md-3">
            </div>
            <div class="col-md-3">
            </div>
            <div class="col-md-3">
            </div>
          </div>
        </div>
      </div>

      <!-- Individual Competition Interface -->
      <div class="row">
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">Participants</h5>
            </div>
            <div class="card-body">
                  <div id="participants-list">
                    <div
                      class="card mb-2 participant-card"
                    >
                      <div class="card-body">
                        <div
                          class="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <small class="text-muted"
                            >
                          </div>
                          <div class="text-end">
                            <div class="progress mb-2" style="width: 100px">
                              <div
                                class="progress-bar"
                                role="progressbar"
                                aria-valuemin="0"
                              >
                              </div>
                            </div>
                            <span class="badge bg-success"
                            >
                          </div>
                        </div>
                        <div class="mt-2">
                          <button
                            class="btn btn-sm btn-primary me-1 log-goals-btn"
                          >
                            <i class="bi bi-plus-circle"></i> Log Goals
                          </button>
                          <span class="text-muted small">
                            Math.round((participant.goals /
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Leaderboard Panel -->
            <div class="col-md-6 mb-4">            <div class="card h-100">
              <div class="card-header bg-warning text-dark">
                <div class="d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">Live Leaderboard</h5>
                  <button class="btn btn-sm btn-outline-dark" id="manual-refresh-btn">
                    <i class="bi bi-arrow-clockwise"></i> Refresh
                  </button>
                </div>
              </div>
                <div class="card-body">
                  <div id="leaderboard-list">
                    <!-- Will be populated by JavaScript -->
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Team Competition Interface -->
          <div class="row">
            <div class="col-md-6 mb-4">
              <div class="card h-100">
                <div class="card-header bg-success text-white">
                  <h5 class="mb-0">Teams</h5>
                </div>
                <div class="card-body">
                  <div id="teams-list">
                    <div
                      class="card mb-3 team-card"
                    >
                      <div class="card-header">
                        <small class="text-muted"
                        >
                      </div>
                      <div class="card-body">
                        <div class="row">
                          <div class="col-md-6">
                            <strong>Team Score:</strong>
                            <span
                              class="badge bg-primary"
                              >0</span
                            >
                          </div>
                          <div class="col-md-6">
                            <strong>Total Kicks:</strong>
                          </div>
                        </div>
                        <div class="mt-2">
                          <button
                            class="btn btn-sm btn-primary view-team-members-btn"
                          >
                            <i class="bi bi-people"></i> View Team Members
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Team Leaderboard Panel -->
            <div class="col-md-6 mb-4">
              <div class="card h-100">
                <div class="card-header bg-warning text-dark">
                  <h5 class="mb-0">Team Standings</h5>
                </div>
                <div class="card-body">
                  <div id="team-leaderboard-list">
                    <!-- Will be populated by JavaScript -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Goals Modal -->
    <div class="modal fade" id="logGoalsModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="logGoalsModalLabel">Log Goals</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div class="modal-body">
            <form id="logGoalsForm">
              <input type="hidden" id="participantId" name="participantId" />
              <input type="hidden" id="teamId" name="teamId" />
              
              <!-- Dynamic player selector for team goals will be inserted here -->
              <div id="team-player-selector-container"></div>

              <div class="mb-3">
                <label for="playerName" class="form-label">Player</label>
                <input
                  type="text"
                  class="form-control"
                  id="playerName"
                  readonly
                />
              </div>

              <div class="mb-3">
                <label for="kicksUsed" class="form-label">Kicks Used</label>
                <select
                  class="form-select"
                  id="kicksUsed"
                  name="kicksUsed"
                  required
                >
                  <option value="1">1 Kick</option>
                  <option value="2">2 Kicks</option>
                  <option value="3">3 Kicks</option>
                  <option value="4">4 Kicks</option>
                  <option value="5" selected>5 Kicks</option>
                </select>
              </div>

              <div class="mb-3">
                <label for="goalsScored" class="form-label">Goals Scored</label>
                <select
                  class="form-select"
                  id="goalsScored"
                  name="goalsScored"
                  required
                >
                  <option value="0">0 Goals</option>
                  <option value="1">1 Goal</option>
                  <option value="2">2 Goals</option>
                  <option value="3">3 Goals</option>
                  <option value="4">4 Goals</option>
                  <option value="5">5 Goals</option>
                </select>
              </div>

              <div class="mb-3">
                <label for="consecutiveKicks" class="form-label"
                  >Consecutive Kicks (Optional)</label
                >
                <input
                  type="number"
                  class="form-control"
                  id="consecutiveKicks"
                  name="consecutiveKicks"
                  min="3"
                  max="20"
                  placeholder="Enter if 3 or more consecutive"
                />
              </div>

              <div class="mb-3">
                <label for="notes" class="form-label">Notes (Optional)</label>
                <textarea
                  class="form-control"
                  id="notes"
                  name="notes"
                  rows="2"
                ></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              id="submit-goals-btn"
            >
              Log Goals
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Members Modal -->
    <div class="modal fade" id="teamMembersModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="teamMembersModalLabel" data-team-id="">Team Members</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div class="modal-body">
            <div id="teamMembersList">
              <!-- Will be populated by JavaScript -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      console.log("=== COMPETITION LIVE PAGE SCRIPT STARTING ===");
      console.log("Window location:", window.location.href);
      
      // Define global functions first, outside of DOMContentLoaded
      // This ensures they are available for inline onclick handlers
      
      // Global variables 
      let competitionId;
      let competitionType;
      let participantsWithLoggedGoals = []; // Track participants who already logged goals
      let activeTeamPlayers = {}; // Will store active player IDs for teams with size >= 11

      // Move viewTeamMembers function outside DOMContentLoaded so it's available for onclick handlers
      window.viewTeamMembers = function(teamId) {
        console.log("=== VIEW TEAM MEMBERS CALLED ===");
        console.log("Team ID:", teamId);
        // Make sure teamId is a string
        teamId = String(teamId);
        
        if (!teamId) {
          console.error("Error: Missing team ID");
          showNotification("Error: Missing team ID", "danger");
          return;
        }
        
        // Get modal element
        const modal = document.getElementById("teamMembersModal");
        if (!modal) {
          console.error("Error: Modal not found");
          showNotification("Error: Modal not found", "danger");
          return;
        }
        
        // Check if Bootstrap is available
        if (typeof bootstrap === 'undefined') {
          console.error("Error: Bootstrap not loaded");
          showNotification("Error: Bootstrap not loaded", "danger");
          return;
        }
        
        console.log("Attempting to show modal...");
        
        // Show modal immediately
        try {
          const bsModal = new bootstrap.Modal(modal);
          bsModal.show();
          console.log("Modal shown successfully");
        } catch (error) {
          console.error("Error showing modal:", error);
          showNotification("Error showing modal: " + error.message, "danger");
          return;
        }
        
        // Set loading content
        const teamMembersList = document.getElementById("teamMembersList");
        if (teamMembersList) {
          teamMembersList.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading team members...</p></div>';
        }
        
        // Update modal title
        const modalTitle = document.getElementById("teamMembersModalLabel");
        if (modalTitle) {
          modalTitle.setAttribute('data-team-id', teamId);
          modalTitle.textContent = "Team Members (Loading...)";
        }
        
        // Fetch team members
        fetch(`/referee/api/team/${teamId}/members`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data.success && data.members) {
              displayTeamMembers(data.members);
            } else {
              console.error("No members found in API response");
              if (teamMembersList) {
                teamMembersList.innerHTML = '<div class="alert alert-warning">No team members found</div>';
              }
            }
          })
          .catch(error => {
            console.error("Error fetching team members:", error);
            if (teamMembersList) {
              teamMembersList.innerHTML = '<div class="alert alert-danger">Error loading team members: ' + error.message + '</div>';
            }
          });
      };
      
      // Show notification function
      function showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        notification.innerHTML = `
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Auto-hide after duration
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, duration);
      }

      // Function to load participants who already logged goals
      function loadParticipantsWithLoggedGoals() {
        const competitionId = window.location.pathname.split('/').pop();
        fetch(`/staff/competition-setup/${competitionId}/participants-with-goals`)
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              participantsWithLoggedGoals = data.participantsWithGoals;
              console.log("Loaded participants with goals:", participantsWithLoggedGoals);
              
              // Update UI for already logged goals
              updateLogGoalsButtons();
            }
          })
          .catch(error => {
            console.error("Error loading participants with logged goals:", error);
          });
      }

      // Function to update log goals buttons
function updateLogGoalsButtons() {
  if (participantsWithLoggedGoals.length === 0) return;
  
  // Handle individual participants
  document.querySelectorAll('.log-goals-btn').forEach(button => {
    const participantId = button.getAttribute('data-participant-id');
    if (participantsWithLoggedGoals.some(p => p.player_id == participantId)) {
      button.classList.remove('btn-primary');
      button.classList.add('btn-secondary');
      button.disabled = true;
      button.innerHTML = '<i class="bi bi-check-circle"></i> Logged';
    }
  });
  
  // Handle team members
  document.querySelectorAll('.log-member-goals-btn').forEach(button => {
    const memberId = button.getAttribute('data-member-id');
    if (participantsWithLoggedGoals.some(p => p.player_id == memberId)) {
      button.classList.remove('btn-primary');
      button.classList.add('btn-secondary');
      button.disabled = true;
      button.innerHTML = '<i class="bi bi-check-circle"></i> Logged';
    }
  });
}

      window.logGoals = function(participantId) {
        console.log("logGoals called with participantId:", participantId);
        
        // Find participant data
        const participantCard = document.querySelector(
          `[data-participant-id="${participantId}"]`
        );          if (!participantCard) {
            console.error("Participant card not found for ID:", participantId);
            showNotification("Error: Participant not found", "danger");
            return;
          }
          
          const participantName = participantCard.querySelector("h6");
          if (!participantName) {
            console.error("Participant name element not found");
            showNotification("Error: Participant name not found", "danger");
            return;
          }

        console.log("Setting modal values...");
        document.getElementById("participantId").value = participantId;
        document.getElementById("playerName").value = participantName.textContent;
        document.getElementById("teamId").value = "";

        // Check if modal element exists
        const modalElement = document.getElementById("logGoalsModal");
        if (!modalElement) {
          console.error("Modal element not found");
          showNotification("Error: Modal not found", "danger");
          return;
        }

        console.log("Showing modal...");
        try {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        } catch (error) {
          console.error("Error showing modal:", error);
          showNotification("Error showing modal: " + error.message, "danger");
          console.log("Bootstrap available?", typeof bootstrap);
          console.log("Modal element:", modalElement);
        }
      };

      window.logTeamGoals = function(teamId) {
        // Store the team ID for recovery
        localStorage.setItem('currentTeamId', teamId);
        console.log("Log goals for team ID:", teamId);
        
        // Get team members first
        fetch(`/referee/api/team/${teamId}/members`)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            if (data.success && data.members.length > 0) {
              let activeMembers = [];
              
              // Check if we have active players for this team
              if (activeTeamPlayers && activeTeamPlayers[teamId] && activeTeamPlayers[teamId].length > 0) {
                // Filter members to only active players
                activeMembers = data.members.filter(member => 
                  activeTeamPlayers[teamId].includes(parseInt(member.id))
                );
                
                if (activeMembers.length === 0) {
                  // No active players found, but we have members
                  showNotification("No active players found for this team. Using all team members.", "warning");
                  activeMembers = data.members;
                }
              } else {
                // No active players defined, use all members
                activeMembers = data.members;
              }
              
              // Create a dropdown for selecting team members
              const playerSelector = document.createElement('select');
              playerSelector.className = 'form-select mb-3';
              playerSelector.id = 'team-player-selector';
              
              activeMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = member.name;
                playerSelector.appendChild(option);
              });
              
              // Set initial values from the first member
              const firstMember = activeMembers[0];
              document.getElementById("participantId").value = firstMember.id;
              document.getElementById("playerName").value = firstMember.name;
              document.getElementById("teamId").value = teamId;
              
              // Replace any existing selector
              const existingSelector = document.getElementById('team-player-selector-container');
              if (existingSelector) {
                existingSelector.innerHTML = '';
                existingSelector.appendChild(playerSelector);
              } else {
                // Create a container for the selector
                const container = document.createElement('div');
                container.id = 'team-player-selector-container';
                container.className = 'mb-3';
                
                const label = document.createElement('label');
                label.htmlFor = 'team-player-selector';
                label.textContent = 'Select Player:';
                label.className = 'form-label';
                
                container.appendChild(label);
                container.appendChild(playerSelector);
                
                // Add before the goals input
                const goalsInput = document.querySelector('#logGoalsForm .modal-body .form-group');
                if (goalsInput) {
                  goalsInput.parentNode.insertBefore(container, goalsInput);
                }
              }
              
              // Add event listener to update values when selection changes
              playerSelector.addEventListener('change', function() {
                const selectedId = this.value;
                const selectedMember = activeMembers.find(m => m.id == selectedId);
                if (selectedMember) {
                  document.getElementById("participantId").value = selectedMember.id;
                  document.getElementById("playerName").value = selectedMember.name;
                }
              });
              
              try {
                const modal = new bootstrap.Modal(document.getElementById("logGoalsModal"));
                modal.show();
              } catch (error) {
                console.error("Error showing team goals modal:", error);
                showNotification("Error showing modal: " + error.message, "danger");
              }
            } else {
              showNotification("No team members found", "warning");
            }
          })
          .catch((error) => {
            console.error("Error getting team members:", error);
            showNotification("Error getting team members: " + error.message, "danger");
          });
      };

      // This function has been removed and merged with the original viewTeamMembers function above

      // Directly handle member goal clicks from the modal
      document.addEventListener('click', function(event) {
        // Delegate click handling for log member goals buttons
        if (event.target.closest('.log-member-goals-btn')) {
          const button = event.target.closest('.log-member-goals-btn');
          const memberId = button.getAttribute('data-member-id');
          const memberName = button.getAttribute('data-member-name');
          const teamId = button.getAttribute('data-team-id'); // Store team ID for reference
          
          console.log("Log goals for member ID:", memberId, "name:", memberName, "team ID:", teamId, "type:", typeof memberId);
          
          if (!memberId) {
            console.error("Missing member ID from button:", button);
            showNotification("Error: Missing team member ID", "danger");
            return;
          }
          
          // Check if goals have already been logged for this player
          if (participantsWithLoggedGoals.some(p => p.player_id == memberId)) {
            showNotification("Goals have already been logged for " + memberName, "warning");
            return;
          }
          
          // Get the participantId input element and check if it exists
          const participantIdInput = document.getElementById("participantId");
          const playerNameInput = document.getElementById("playerName");
          const teamIdInput = document.getElementById("teamId");
          
          if (!participantIdInput || !playerNameInput || !teamIdInput) {
            console.error("Missing form input elements");
            showNotification("Error: Form elements not found", "danger");
            return;
          }
          
          // Make sure we're setting a numeric value
          participantIdInput.value = memberId;
          playerNameInput.value = memberName;
          
          // Find the team ID from the current URL
          // URLs are like /staff/competition-live/123 where 123 is the competition ID
          const competitionId = window.location.pathname.split('/').pop();
          
          // Get the team ID from the button if available
          const buttonTeamId = button.getAttribute('data-team-id');
          // Set teamId based on the button attribute
          teamIdInput.value = buttonTeamId || "";
          
          try {
            // Close team members modal and open log goals modal
            const teamModal = bootstrap.Modal.getInstance(document.getElementById("teamMembersModal"));
            teamModal.hide();
            
            setTimeout(() => {
              const logModal = new bootstrap.Modal(document.getElementById("logGoalsModal"));
              logModal.show();
            }, 300);
          } catch (error) {
            console.error("Error logging member goals:", error);
            showNotification("Error: " + error.message, "danger");
          }
        }
      });

      window.submitGoals = function() {
        const form = document.getElementById("logGoalsForm");
        const submitButton = document.getElementById("submit-goals-btn");
        const formData = new FormData(form);
        
        // Show loading state
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging...';
        submitButton.disabled = true;

        // Create the data object for submission
        // Check for team player selector (for team goal logging)
        let selectedPlayerId = null;
        const teamPlayerSelector = document.getElementById('team-player-selector');
        if (teamPlayerSelector) {
          selectedPlayerId = teamPlayerSelector.value;
          }
        
        // Get participantId from form or selector and make sure it's a number
        const participantIdValue = selectedPlayerId || formData.get("participantId");
        console.log("Raw participantId:", participantIdValue, "type:", typeof participantIdValue);
        
        let parsedParticipantId;
        try {
          parsedParticipantId = parseInt(participantIdValue);
          console.log("Parsed participantId:", parsedParticipantId);
          if (isNaN(parsedParticipantId)) {
            throw new Error("Invalid participant ID");
          }
        } catch (e) {
          console.error("Error parsing participantId:", e);
          showNotification("Invalid participant ID", "danger");
          submitButton.innerHTML = originalButtonText;
          submitButton.disabled = false;
          return;
        }
        
        // Get teamId from form or localStorage
        let teamIdValue = formData.get("teamId");
        let parsedTeamId = null;
        
        // Try form value first
        if (teamIdValue && teamIdValue !== "null" && teamIdValue !== "") {
          try {
            parsedTeamId = parseInt(teamIdValue);
            console.log("Using team ID from form:", parsedTeamId);
          } catch (e) {
            console.error("Error parsing team ID from form:", e);
          }
        }
        
        // If not found in form, try localStorage
        if (!parsedTeamId) {
          const storedTeamId = localStorage.getItem('currentTeamId');
          if (storedTeamId) {
            try {
              parsedTeamId = parseInt(storedTeamId);
              console.log("Using team ID from localStorage:", parsedTeamId);
            } catch (e) {
              console.error("Error parsing team ID from localStorage:", e);
            }
          }
        }
        
        const data = {
          competitionId: parseInt(competitionId),
          participantId: parsedParticipantId,
          // Use the parsed teamId
          teamId: parsedTeamId,
          kicksUsed: parseInt(formData.get("kicksUsed")),
          goals: parseInt(formData.get("goalsScored")),
          consecutiveKicks: formData.get("consecutiveKicks")
            ? parseInt(formData.get("consecutiveKicks"))
            : null,
          notes: formData.get("notes") || null,
        };

        // Debug log the data being sent
        // Validate required fields before submission
        if (!data.competitionId) {
          showNotification("Error: Missing competition ID", "danger");
          console.error("Missing competitionId:", competitionId);
          return;
        }
        if (!data.participantId) {
          showNotification("Error: Missing participant ID", "danger");
          console.error("Missing participantId:", data.participantId);
          return;
        }

        fetch("/staff/competition-setup/log-goals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => {
            // Log the raw response before parsing
            // Clone the response so we can both log it and parse it as JSON
            const responseClone = response.clone();
            
            // Log the raw response body as text (helps debug non-JSON responses)
            responseClone.text().then(text => {
              });
            
            return response.json();
          })
          .then((result) => {
            if (result.success) {
              try {
                const modal = bootstrap.Modal.getInstance(document.getElementById("logGoalsModal"));
                modal.hide();
              } catch (error) {
                console.error("Error hiding modal:", error);
              }

              // Reset form
              form.reset();
              
              // Update the UI immediately for the participant
              const participantId = data.participantId;
              
              // Add this participant to the logged goals array immediately
              if (!participantsWithLoggedGoals.some(p => p.player_id == participantId)) {
                participantsWithLoggedGoals.push({
                  player_id: participantId,
                  team_id: data.teamId || null
                });
                console.log("Updated participantsWithLoggedGoals array:", participantsWithLoggedGoals);
              }
              
              // Update button status immediately for this member in the team modal
              document.querySelectorAll(`.log-member-goals-btn[data-member-id="${participantId}"]`).forEach(button => {
                button.classList.remove('btn-primary');
                button.classList.add('btn-secondary');
                button.disabled = true;
                button.innerHTML = '<i class="bi bi-check-circle"></i> Logged';
              });
              
              const participantCard = document.querySelector(`[data-participant-id="${participantId}"]`);
              
              if (participantCard) {
                try {
                  // Get current values from the participant card
                  const progressBar = participantCard.querySelector(".progress-bar");
                  const goalsBadge = participantCard.querySelector(".badge");
                  const accuracySpan = participantCard.querySelector(".text-muted.small");
                  
                  if (progressBar) {
                    // Get current kicks from the data attribute
                    const currentKicks = parseInt(progressBar.getAttribute("data-kicks-taken")) || 0;
                    const totalKicks = parseInt(progressBar.getAttribute("data-total-kicks")) || 5;
                    const newKicks = currentKicks + data.kicksUsed;
                    const percentage = Math.round((newKicks / totalKicks) * 100);
                    
                    progressBar.style.width = percentage + "%";
                    progressBar.textContent = `${newKicks}/${totalKicks}`;
                    progressBar.setAttribute("data-kicks-taken", newKicks);
                    progressBar.setAttribute("aria-valuenow", newKicks);
                  }
                  
                  if (goalsBadge) {
                    // Extract current goals from the badge text
                    const currentGoalsText = goalsBadge.textContent || "Goals: 0";
                    const currentGoals = parseInt(currentGoalsText.match(/\d+/)?.[0] || "0");
                    const newGoals = currentGoals + data.goals;
                    goalsBadge.textContent = `Goals: ${newGoals}`;
                  }
                  
                  if (accuracySpan && progressBar) {
                    const newKicks = parseInt(progressBar.getAttribute("data-kicks-taken"));
                    const newGoalsText = goalsBadge?.textContent || "Goals: 0";
                    const newGoals = parseInt(newGoalsText.match(/\d+/)?.[0] || "0");
                    const accuracy = newKicks > 0 ? Math.round((newGoals / newKicks) * 100) : 0;
                    accuracySpan.textContent = `Accuracy: ${accuracy}%`;
                  }
                  
                  // Add highlight animation
                  participantCard.classList.add('highlight-success');
                  setTimeout(() => {
                    participantCard.classList.remove('highlight-success');
                  }, 1500);
                } catch (error) {
                  console.error("Error updating participant card:", error);
                  // If immediate update fails, just refresh the data
                  refreshCompetitionData();
                }
              }

              // Refresh data in the background (immediate)
              setTimeout(() => {
                refreshCompetitionData();
                loadRecentActivity();
                loadParticipantsWithLoggedGoals(); // Also reload participants with logged goals
              }, 100); // Small delay to ensure database commit is complete

              showNotification("Goals logged successfully!");
            } else {
              showNotification("Error logging goals: " + result.message, "danger");
            }
          })
          .catch((error) => {
            console.error("Error logging goals:", error);
            showNotification("Error logging goals. Please try again.", "danger");
          })
          .finally(() => {
            // Reset button state
            const submitButton = document.getElementById("submit-goals-btn");
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
          });
      };

      // Missing function stub to prevent errors
      function loadRecentActivity() {
        ");
        // TODO: Implement recent activity loading if needed
      }

      window.endCompetition = function() {
        console.log("endCompetition function called");
        console.log("competitionId:", competitionId);
        console.log("window.location.pathname:", window.location.pathname);
        
        if (confirm("Are you sure you want to end this competition? This action cannot be undone.")) {
          // Check if we're on the test page
          const isTestPage = window.location.pathname.includes('competition-live-test');
          const endpointUrl = isTestPage 
            ? `/staff/competition-setup-test/${competitionId}/end`
            : `/staff/competition-setup/${competitionId}/end`;
          
          console.log("isTestPage:", isTestPage);
          console.log("endpointUrl:", endpointUrl);
          
          fetch(endpointUrl, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            }
          })
            .then((response) => {
              // Handle non-JSON responses (like redirects to login)
              if (!response.ok && response.status === 302) {
                // Redirect to login
                console.log("Redirecting to login due to 302");
                window.location.href = '/auth/login';
                return;
              }
              
              if (!response.headers.get('content-type')?.includes('application/json')) {
                // Not a JSON response, probably an error page
                console.error("Non-JSON response received");
                console.error("Response content-type:", response.headers.get('content-type'));
                showNotification("Authentication required. Please log in and try again.", "danger");
                return;
              }
              
              return response.json();
            })
            .then((data) => {
              if (data && data.success) {
                showNotification("Competition ended successfully!");
                // Wait a moment before redirecting so the user can see the notification
                setTimeout(() => {
                  window.location.href = "/staff/competition-setup";
                }, 1500);
              } else if (data) {
                showNotification("Error ending competition: " + (data.message || "Unknown error"), "danger");
              }
            })
            .catch((error) => {
              console.error("Error ending competition:", error);
              showNotification("Error ending competition. Please check your connection and try again.", "danger");
            });
        }
      };

      // Helper function to display team members
      function displayTeamMembers(members) {
        const container = document.getElementById("teamMembersList");
        container.innerHTML = "";
        
        if (!members || members.length === 0) {
          container.innerHTML = '<div class="alert alert-warning">No team members found</div>';
          return;
        }
        
        // Extract team info
        const firstMember = members[0];
        const teamName = firstMember.team_name || '';
        const teamId = firstMember.team_id || null;
        const teamSize = parseInt(firstMember.team_size) || 0;
        
        // Debug team ID
        if (!teamId) {
          console.error("Missing team ID in API response:", members);
          showNotification("Error: Team ID missing from server response", "danger");
        } else {
          // Save team ID to localStorage for recovery
          localStorage.setItem('currentTeamId', teamId);
        }
        
        // Check if this team has active player selection (11+ players)
        const hasActiveSelection = teamId && teamSize >= 11 && activeTeamPlayers[teamId];
        
        // Update modal title and store team ID
        const modalTitle = document.getElementById("teamMembersModalLabel");
        if (modalTitle) {
          modalTitle.textContent = teamName ? `${teamName} - Team Members` : "Team Members";
          if (teamId) {
            modalTitle.setAttribute('data-team-id', teamId);
            console.log("Setting team ID on modal title:", teamId);
          }
        }
        
        // Also store the team ID in a hidden input for backup
        container.innerHTML = `<input type="hidden" id="current-team-id" value="${teamId}" />`;
        
        // Add team information header with team ID
        const teamHeader = document.createElement('div');
        teamHeader.className = 'team-name mb-3';
        teamHeader.setAttribute('data-team-id', teamId);
        teamHeader.innerHTML = `<h6>${teamName}</h6><small>Team ID: ${teamId} • Players: ${members.length}</small>`;
        container.appendChild(teamHeader);
        
        console.log("Displaying team members:", members);
        console.log("Current participants with logged goals:", participantsWithLoggedGoals);
        
        // Display info alert if this is a large team with player selection
        if (members.length > 11) {
          const infoAlert = document.createElement("div");
          infoAlert.className = "alert alert-info";
          infoAlert.innerHTML = `
            <i class="bi bi-info-circle"></i> This team has ${members.length} players, but only 11 can participate in goal logging.
            Click on a player card to toggle their active status. Only active players will be able to log goals.
            <div class="d-flex justify-content-between mt-2">
              <span><strong>Active players:</strong> <span id="active-players-count">0</span>/11</span>
              <button id="save-active-players" class="btn btn-sm btn-primary">
                <i class="bi bi-save"></i> Save Selection
              </button>
            </div>
          `;
          container.appendChild(infoAlert);
        }

        members.forEach((member) => {
          // Make sure we have the player_id
          const memberId = member.player_id;
          
          if (!memberId) {
            console.error("Member missing player_id:", member);
            return;
          }
          
          const hasLoggedGoals = participantsWithLoggedGoals.some(p => p.player_id == memberId);
          
          // Check if this player is inactive (for teams with 11+ players)
          let isInactive = false;
          if (hasActiveSelection) {
            isInactive = !activeTeamPlayers[teamId].includes(parseInt(memberId));
          }
          
          const memberCard = document.createElement("div");
          // Make card selectable for teams with more than 11 players
          const isLargeTeam = members.length > 11;
          memberCard.className = `card mb-2 ${isInactive ? 'bg-light' : ''} ${isLargeTeam ? 'player-selectable' : ''}`;
          if (isLargeTeam) {
            memberCard.setAttribute('data-member-id', memberId);
            memberCard.setAttribute('data-active', isInactive ? 'false' : 'true');
            memberCard.setAttribute('data-team-id', teamId); // Add team ID to player cards
          }
          
          // Determine button state based on logged goals and inactive status
          let buttonClass = 'btn-primary';
          let buttonText = '<i class="bi bi-plus-circle"></i> Log Goals';
          let buttonDisabled = '';
          
          if (hasLoggedGoals) {
            buttonClass = 'btn-secondary';
            buttonText = '<i class="bi bi-check-circle"></i> Logged';
            buttonDisabled = 'disabled';
          } else if (isInactive) {
            buttonClass = 'btn-outline-secondary';
            buttonText = '<i class="bi bi-x-circle"></i> Not Active';
            buttonDisabled = 'disabled';
          }
          
          memberCard.innerHTML = `
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="d-flex align-items-center">
                    ${isLargeTeam ? 
                      `<div class="form-check me-2">
                        <input class="form-check-input player-active-toggle" type="checkbox" 
                          id="player-active-${memberId}" ${!isInactive ? 'checked' : ''}
                          data-member-id="${memberId}">
                      </div>` : ''
                    }
                    <div>
                      <h6 class="mb-1 ${isInactive ? 'text-muted' : ''}">
                        ${member.name}
                        ${member.is_captain ? '<span class="badge bg-warning ms-1">Captain</span>' : ""}
                        ${isInactive ? '<span class="badge bg-secondary ms-1">Not Active</span>' : ""}
                      </h6>
                      <small class="text-muted">${member.age_group || ''} ${
                        member.residence ? '• ' + member.residence : ''
                      }</small>
                    </div>
                  </div>
                </div>
                <button class="btn btn-sm ${buttonClass} log-member-goals-btn" 
                  data-member-id="${memberId}" 
                  data-member-name="${member.name}"
                  data-team-id="${member.team_id || ''}"
                  ${buttonDisabled}>
                  ${buttonText}
                </button>
              </div>
            </div>
          `;
          container.appendChild(memberCard);
        });
      }

      // DOM Ready Event
      document.addEventListener("DOMContentLoaded", function () {
        console.log("=== DOM CONTENT LOADED ===");
        
        // Set global variables
        
        console.log("Competition ID set to:", competitionId);
        console.log("Competition Type set to:", competitionType);

        console.log("Competition page loaded, Bootstrap available:", typeof bootstrap !== 'undefined');
        console.log("Modal element exists:", document.getElementById("logGoalsModal") !== null);
        
        // Load participants with logged goals
        loadParticipantsWithLoggedGoals();
        
        // For team competitions, load active players
        if (competitionType === "team") {
          loadActiveTeamPlayers();
        }
        
        // Verify Bootstrap modal functionality is available
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          console.log("Bootstrap Modal is available");
          
          // Add a test button that shows the modal directly
          const testButton = document.createElement('button');
          testButton.className = 'btn btn-sm btn-secondary';
          testButton.textContent = 'Test Modal';
          testButton.style.display = 'none'; // Hide by default, useful for debugging
          testButton.onclick = function() {
            try {
              const testModal = new bootstrap.Modal(document.getElementById('logGoalsModal'));
              testModal.show();
            } catch (error) {
              console.error("Error in test modal:", error);
              showNotification("Test modal error: " + error.message, "danger");
            }
          };
          
          // Append to body for testing if needed
          document.body.appendChild(testButton);
        } else {
          console.error("Bootstrap Modal is NOT available!");
        }

        // Initialize progress bars
        initializeProgressBars();

        // Auto-refresh data every 3 seconds (reduced from 5 for better testing)
        console.log("Setting up auto-refresh interval");
        setInterval(() => {
          console.log("Auto-refresh triggered");
          refreshCompetitionData();
        }, 3000);

        // Initial load
        refreshCompetitionData();
        loadRecentActivity();
        loadParticipantsWithLoggedGoals();
        
        // Add event listeners for all interactive buttons
        document.addEventListener('click', function(event) {
          console.log("=== CLICK EVENT DETECTED ===");
          console.log("Clicked element:", event.target);
          console.log("Clicked element classes:", event.target.className);
          
          // Individual participant log goals
          if (event.target.closest('.log-goals-btn')) {
            const button = event.target.closest('.log-goals-btn');
            const participantId = button.getAttribute('data-participant-id');
            logGoals(participantId);
          }
          
          // View team members
          if (event.target.closest('.view-team-members-btn')) {
            console.log("=== VIEW TEAM MEMBERS BUTTON CLICKED ===");
            const button = event.target.closest('.view-team-members-btn');
            const teamId = button.getAttribute('data-team-id');
            
            // Debug team ID
            console.log("View team members button clicked for team ID:", teamId, "of type:", typeof teamId);
            console.log("Button element:", button);
            
            if (!teamId) {
              console.error("Missing team ID on button:", button);
              showNotification("Error: Button is missing team ID attribute", "danger");
              return;
            }
            
            viewTeamMembers(teamId);
          }
        });
        
        // Add event listener for End Competition button
        console.log("=== ADDING END COMPETITION BUTTON EVENT LISTENER ===");
        const endButton = document.getElementById('end-competition-btn');
        console.log("End button element:", endButton);
        
        if (endButton) {
          endButton.addEventListener('click', function() {
            console.log("=== END COMPETITION BUTTON CLICKED ===");
            endCompetition();
          });
          console.log("✓ End competition event listener added successfully");
        } else {
          console.error("✗ End competition button not found!");
        }
        
        // Add event listener for Submit Goals button in modal
        document.getElementById('submit-goals-btn').addEventListener('click', function() {
          submitGoals();
        });
        
        // Add event listener for manual refresh button
        document.getElementById('manual-refresh-btn').addEventListener('click', function() {
          console.log("Manual refresh button clicked");
          refreshCompetitionData();
          showNotification("Refreshing leaderboard...", "info");
        });

        function initializeProgressBars() {
          document
            .querySelectorAll(".progress-bar[data-kicks-taken]")
            .forEach((bar) => {
              const kicksTaken = parseInt(
                bar.getAttribute("data-kicks-taken") || "0"
              );
              const totalKicks = parseInt(
                bar.getAttribute("data-total-kicks") || "1"
              );
              const percentage = Math.round((kicksTaken / totalKicks) * 100);
              bar.style.width = percentage + "%";
              bar.setAttribute("aria-valuenow", kicksTaken);
              bar.setAttribute("aria-valuemax", totalKicks);
            });
        }

        function refreshCompetitionData() {
          if (competitionType === "individual") {
            refreshIndividualLeaderboard();
          } else {
            refreshTeamLeaderboard();
          }
        }

        function refreshIndividualLeaderboard() {
          console.log("Refreshing individual leaderboard for competition:", competitionId);
          
          fetch(`/staff/competition-setup/${competitionId}/leaderboard`)
            .then((response) => {
              return response.json();
            })
            .then((data) => {
              if (data.success) {
                displayIndividualLeaderboard(data.leaderboard);
                updateParticipantCards(data.participants);
                console.log("Leaderboard and participant cards updated");
              } else {
                console.error("Leaderboard API returned error:", data.message);
              }
            })
            .catch((error) => {
              console.error("Error refreshing leaderboard:", error);
            });
        }

        function refreshTeamLeaderboard() {
          fetch(`/staff/competition-setup/${competitionId}/team-leaderboard`)
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                displayTeamLeaderboard(data.leaderboard);
                updateTeamCards(data.teams);
              }
            })
            .catch((error) => {
              console.error("Error refreshing team leaderboard:", error);
            });
        }

        function displayIndividualLeaderboard(leaderboard) {
          const container = document.getElementById("leaderboard-list");
          if (!container) {
            console.error("Leaderboard container not found!");
            return;
          }
          
          container.innerHTML = "";

          if (leaderboard.length === 0) {
            container.innerHTML = '<p class="text-muted">No scores yet</p>';
            return;
          }

          leaderboard.forEach((participant, index) => {
            console.log(`Creating leaderboard entry for participant:`, participant);
            
            const position = index + 1;
            let badgeClass = "bg-secondary";
            if (position === 1) badgeClass = "bg-warning";
            else if (position === 2) badgeClass = "bg-secondary";
            else if (position === 3) badgeClass = "bg-warning";

            const leaderboardItem = document.createElement("div");
            leaderboardItem.className = "border-bottom pb-2 mb-2";
            leaderboardItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <span class="badge ${badgeClass} me-2">#${position}</span>
            <strong>${participant.name}</strong>
          </div>
          <div class="text-end">
            <span class="badge bg-success me-1">${participant.goals || 0} goals</span>
            <small class="text-muted">${Math.round(participant.accuracy || 0)}% accuracy</small>
          </div>
        </div>
      `;
            container.appendChild(leaderboardItem);
            
            console.log(`Added leaderboard entry for ${participant.name}: ${participant.goals} goals, ${participant.accuracy}% accuracy`);
          });
          
          console.log("Leaderboard display completed");
        }

        function displayTeamLeaderboard(leaderboard) {
          const container = document.getElementById("team-leaderboard-list");
          container.innerHTML = "";

          if (leaderboard.length === 0) {
            container.innerHTML = '<p class="text-muted">No scores yet</p>';
            return;
          }

          leaderboard.forEach((team, index) => {
            const position = index + 1;
            let badgeClass = "bg-secondary";
            if (position === 1) badgeClass = "bg-warning";
            else if (position === 2) badgeClass = "bg-secondary";
            else if (position === 3) badgeClass = "bg-warning";

            const leaderboardItem = document.createElement("div");
            leaderboardItem.className = "border-bottom pb-2 mb-2";
            leaderboardItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <span class="badge ${badgeClass} me-2">#${position}</span>
            <strong>${team.name}</strong>
          </div>
          <div class="text-end">
            <span class="badge bg-success me-1">${team.total_goals} goals</span>
            <small class="text-muted">${team.accuracy}% accuracy</small>
          </div>
        </div>
      `;
            container.appendChild(leaderboardItem);
          });
        }

        function updateParticipantCards(participants) {
          participants.forEach((participant) => {
            console.log(`Updating card for participant ${participant.id} (${participant.name}):`, participant);
            
            const card = document.querySelector(
              `[data-participant-id="${participant.id}"]`
            );
            
            if (!card) {
              console.error(`Card not found for participant ID ${participant.id}`);
              return;
            }

            const progressBar = card.querySelector(".progress-bar");
            const goalsBadge = card.querySelector(".badge");
            const accuracySpan = card.querySelector(".text-muted.small");
            const logGoalsBtn = card.querySelector(".log-goals-btn");

            if (progressBar) {
              const kicksTaken = participant.kicks_taken || 0;
              const totalKicks = 5; // Competition kicks per player
              const percentage = Math.round((kicksTaken / totalKicks) * 100);
              
              progressBar.style.width = percentage + "%";
              progressBar.textContent = `${kicksTaken}/${totalKicks}`;
              progressBar.setAttribute("data-kicks-taken", kicksTaken.toString());
              
              console.log(`Updated progress bar: ${kicksTaken}/${totalKicks} (${percentage}%)`);
              
              // Disable the Log Goals button if all kicks have been taken
              if (kicksTaken >= totalKicks && logGoalsBtn) {
                logGoalsBtn.classList.remove('btn-primary');
                logGoalsBtn.classList.add('btn-secondary');
                logGoalsBtn.disabled = true;
                logGoalsBtn.innerHTML = '<i class="bi bi-check-circle"></i> Completed';
              }
            }

            if (goalsBadge) {
              const goals = participant.goals || 0;
              goalsBadge.textContent = `Goals: ${goals}`;
              console.log(`Updated goals badge: ${goals}`);
            }

            if (accuracySpan) {
              const accuracy = Math.round(participant.accuracy || 0);
              accuracySpan.textContent = `Accuracy: ${accuracy}%`;
              console.log(`Updated accuracy: ${accuracy}%`);
            }
          });
          
          console.log("Participant cards update completed");
        }

        function updateTeamCards(teams) {
          teams.forEach((team) => {
            const scoreElement = document.getElementById(
              `team-score-${team.id}`
            );
            const kicksElement = document.getElementById(
              `team-kicks-${team.id}`
            );

            if (scoreElement) {
              scoreElement.textContent = team.total_goals || 0;
            }

            if (kicksElement) {
              const totalKicks = team.total_kicks || 0;
              const maxKicks = team.max_kicks || 25; // Default to 25 if not provided
              kicksElement.textContent = `${totalKicks}/${maxKicks}`;
              console.log(`Updated team kicks: ${totalKicks}/${maxKicks}`);
            }
          });
        }

        // These functions have been moved outside DOMContentLoaded 
        // to make them globally accessible for the inline onclick handlers
      });
      // Notification function to replace alerts
      function showNotification(message, type = 'success') {
        // Create notification container if it doesn't exist
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
          notificationContainer = document.createElement('div');
          notificationContainer.id = 'notification-container';
          notificationContainer.style.position = 'fixed';
          notificationContainer.style.top = '20px';
          notificationContainer.style.right = '20px';
          notificationContainer.style.zIndex = '9999';
          notificationContainer.style.minWidth = '300px';
          notificationContainer.style.maxWidth = '400px';
          document.body.appendChild(notificationContainer);
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.role = 'alert';
        notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        notification.style.marginBottom = '10px';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // Add appropriate icon based on notification type
        let icon = 'bi-check-circle-fill';
        if (type === 'danger') icon = 'bi-exclamation-triangle-fill';
        if (type === 'warning') icon = 'bi-exclamation-circle-fill';
        if (type === 'info') icon = 'bi-info-circle-fill';
        
        notification.innerHTML = `
          <div class="d-flex align-items-center">
            <i class="bi ${icon} me-2"></i>
            <div>${message}</div>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
          notification.style.opacity = '1';
          notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Auto dismiss after 4 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          notification.style.transform = 'translateY(-20px)';
          
          setTimeout(() => {
            try {
              const bsAlert = bootstrap.Alert.getInstance(notification);
              if (bsAlert) {
                bsAlert.close();
              } else {
                notification.remove();
              }
            } catch (error) {
              notification.remove();
            }
          }, 300);
        }, 4000);
      }

      // Function to load active players for teams
      function loadActiveTeamPlayers() {
        // Try loading from localStorage first (fallback in case server fails)
        try {
          const teams = Object.keys(localStorage)
            .filter(key => key.startsWith('activeTeamPlayers-'))
            .reduce((acc, key) => {
              const teamId = key.replace('activeTeamPlayers-', '');
              try {
                acc[teamId] = JSON.parse(localStorage.getItem(key));
              } catch (e) {
                console.warn(`Failed to parse localStorage data for team ${teamId}`, e);
              }
              return acc;
            }, {});
          
          if (Object.keys(teams).length > 0) {
            activeTeamPlayers = teams; // Use localStorage data while waiting for server
          }
        } catch (e) {
          console.warn("Error accessing localStorage:", e);
        }
        
        // Load from server
        fetch(`/staff/competition-setup/${competitionId}/active-players`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data.success) {
              // Organize active players by team ID
              activeTeamPlayers = {};
              data.activePlayersByTeam.forEach(item => {
                if (!activeTeamPlayers[item.team_id]) {
                  activeTeamPlayers[item.team_id] = [];
                }
                activeTeamPlayers[item.team_id].push(item.player_id);
              });
              // Cache in localStorage for redundancy
              try {
                Object.entries(activeTeamPlayers).forEach(([teamId, players]) => {
                  localStorage.setItem(`activeTeamPlayers-${teamId}`, JSON.stringify(players));
                });
              } catch (e) {
                console.warn("Error saving to localStorage:", e);
              }
              
              // Update any visible player cards
              updatePlayerCardStatuses();
            } else {
              console.error("Error loading active players:", data.message);
              showNotification("Failed to load active player data", "warning");
            }
          })
          .catch(error => {
            console.error("Error fetching active players:", error);
            showNotification("Error loading active player data", "danger");
          });
      }

      // Function to update active player count
      // Update player card status based on active players data
      function updatePlayerCardStatuses() {
        const playerCards = document.querySelectorAll('.player-selectable');
        playerCards.forEach(card => {
          const playerId = parseInt(card.getAttribute('data-member-id'));
          const teamId = card.getAttribute('data-team-id');
          
          if (teamId && activeTeamPlayers[teamId]) {
            const isActive = activeTeamPlayers[teamId].includes(playerId);
            card.classList.toggle('bg-light', !isActive);
            card.setAttribute('data-active', isActive ? 'true' : 'false');
            
            // Also update any checkboxes
            const checkbox = card.querySelector('.player-active-toggle');
            if (checkbox) {
              checkbox.checked = isActive;
            }
          }
        });
      }
      
      function updateActivePlayerCount() {
        const activeCheckboxes = document.querySelectorAll('.player-active-toggle:checked');
        const countElement = document.getElementById('active-players-count');
        
        if (countElement) {
          countElement.textContent = activeCheckboxes.length;
          
          // Check if we have exactly 11 active players
          const saveButton = document.getElementById('save-active-players');
          if (activeCheckboxes.length === 11) {
            saveButton.classList.remove('btn-secondary');
            saveButton.classList.add('btn-primary');
            saveButton.disabled = false;
          } else {
            saveButton.classList.remove('btn-primary');
            saveButton.classList.add('btn-secondary');
            saveButton.disabled = activeCheckboxes.length !== 11;
          }
        }
      }
      
      // Handler for player active toggles
      document.addEventListener('click', function(event) {
        if (event.target.classList.contains('player-active-toggle')) {
          const playerId = event.target.dataset.memberId;
          const card = document.querySelector(`.player-selectable[data-member-id="${playerId}"]`);
          
          if (card) {
            // Toggle active status
            const isActive = event.target.checked;
            card.classList.toggle('bg-light', !isActive);
            card.setAttribute('data-active', isActive ? 'true' : 'false');
            
            // Update active/inactive badge
            const badge = card.querySelector('.badge.bg-secondary');
            if (badge) {
              badge.style.display = isActive ? 'none' : 'inline';
            }
            
            // Update button state
            const button = card.querySelector('.log-member-goals-btn');
            if (button) {
              if (isActive) {
                button.classList.replace('btn-outline-secondary', 'btn-primary');
                button.innerHTML = '<i class="bi bi-plus-circle"></i> Log Goals';
                button.disabled = false;
              } else {
                button.classList.replace('btn-primary', 'btn-outline-secondary');
                button.innerHTML = '<i class="bi bi-x-circle"></i> Not Active';
                button.disabled = true;
              }
            }
            
            updateActivePlayerCount();
          }
        }
      });
      
      // Handler for save active players button
      document.addEventListener('click', function(event) {
        if (event.target.id === 'save-active-players' || event.target.closest('#save-active-players')) {
          // Get the selected player IDs
          const activeCheckboxes = document.querySelectorAll('.player-active-toggle:checked');
          const activePlayers = Array.from(activeCheckboxes).map(cb => parseInt(cb.dataset.memberId));
          
          if (activePlayers.length !== 11) {
            showNotification('Please select exactly 11 active players', 'warning');
            return;
          }
          
          // Try multiple sources for team ID
          let teamId = null;
          
          // Method 1: Get from modal title attribute
          const modalTitle = document.getElementById('teamMembersModalLabel');
          if (modalTitle && modalTitle.getAttribute('data-team-id')) {
            teamId = modalTitle.getAttribute('data-team-id');
            console.log("Found team ID from modal title:", teamId);
          }
          
          // Method 2: Get from hidden input field
          if (!teamId) {
            const hiddenInput = document.getElementById('current-team-id');
            if (hiddenInput && hiddenInput.value) {
              teamId = hiddenInput.value;
              console.log("Found team ID from hidden input:", teamId);
            }
          }
          
          // Method 3: Get from team-name data attribute
          if (!teamId) {
            const currentTeamContainer = document.querySelector('.modal-body .team-name');
            if (currentTeamContainer && currentTeamContainer.getAttribute('data-team-id')) {
              teamId = currentTeamContainer.getAttribute('data-team-id');
              console.log("Found team ID from team name container:", teamId);
            }
          }
          
          // Method 4: Get from localStorage (fallback)
          if (!teamId) {
            const storedTeamId = localStorage.getItem('currentTeamId');
            if (storedTeamId) {
              teamId = storedTeamId;
              console.log("Found team ID from localStorage:", teamId);
            }
          }
          
          // Method 5: Get from player cards if all else fails
          if (!teamId) {
            const firstPlayerCard = document.querySelector('.player-selectable');
            if (firstPlayerCard && firstPlayerCard.getAttribute('data-team-id')) {
              teamId = firstPlayerCard.getAttribute('data-team-id');
              }
          }
          
          if (!teamId) {
            showNotification('Team ID not found. Please refresh the page and try again.', 'danger');
            console.error("Could not determine team ID from any source");
            return;
          }
          
          saveActivePlayersForTeam(teamId, activePlayers);
        }
      });
      
      // Function to save active players for a team
      function saveActivePlayersForTeam(teamId, activePlayers) {
          // Validate input
          if (!teamId) {
            console.error("Team ID is missing");
            showNotification('Error: Team ID is required', 'danger');
            return Promise.reject(new Error('Team ID is required'));
          }
          
          if (!Array.isArray(activePlayers) || activePlayers.length !== 11) {
            console.error("Invalid active players array:", activePlayers);
            showNotification('Error: Exactly 11 active players required', 'warning');
            return Promise.reject(new Error('Invalid active players array'));
          }
          
          // Show loading notification
          showNotification('Saving active players...', 'info', 1500);
          
          // Make API call with better error handling
          const apiUrl = `/staff/competition-setup/${competitionId}/team/${teamId}/active-players`;
          return fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activePlayers })
          })
            .then(response => {
              if (!response.ok) {
                console.error("API response not OK:", response.status, response.statusText);
                return response.json().then(errorData => {
                  throw new Error(errorData.message || `Server error: ${response.status}`);
                });
              }
              return response.json();
            })
            .then(data => {
              if (data.success) {
                showNotification('Active players saved successfully', 'success');
                // Update the active players in memory
                activeTeamPlayers[teamId] = activePlayers;
                
                // Update the UI
                const playerCards = document.querySelectorAll('.player-selectable');
                playerCards.forEach(card => {
                  const playerId = parseInt(card.getAttribute('data-member-id'));
                  const isActive = activePlayers.includes(playerId);
                  card.classList.toggle('bg-light', !isActive);
                  card.setAttribute('data-active', isActive ? 'true' : 'false');
                });
                
                // Save to localStorage for redundancy
                try {
                  localStorage.setItem(`activeTeamPlayers-${teamId}`, JSON.stringify(activePlayers));
                } catch (e) {
                  console.warn("Failed to save active players to localStorage:", e);
                }
                
                return data;
              } else {
                const errorMsg = data.message || 'Unknown error saving active players';
                console.error("API error:", errorMsg);
                showNotification(`Failed to save active players: ${errorMsg}`, 'danger');
                throw new Error(errorMsg);
              }
            })
            .catch(error => {
              console.error('Error saving active players:', error);
              showNotification(`Error saving active players: ${error.message}`, 'danger');
              throw error;
            });
        }
      });
    </script>

    <style>
      .participant-card,
      .team-card {
        transition: all 0.3s ease;
      }
      
      @keyframes highlight-card {
        0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
        100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
      }
      
      .highlight-success {
        animation: highlight-card 1.5s ease-out;
      }

      .participant-card:hover,
      .team-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }

      .progress {
        height: 20px;
      }

      .badge {
        font-size: 0.8em;
      }

      #recent-activity {
        max-height: 400px;
        overflow-y: auto;
      }

      .card-header {
        border-bottom: 2px solid rgba(0, 0, 0, 0.1);
      }
    </style>
  </div>
</div>
