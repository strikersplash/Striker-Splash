document.addEventListener("DOMContentLoaded", function () {
  // Load upcoming events when the page loads
  loadUpcomingEvents();

  // Set up event handlers for logged-in users
  if (document.getElementById("refresh-events-btn")) {
    document
      .getElementById("refresh-events-btn")
      .addEventListener("click", loadUpcomingEvents);
  }

  if (document.getElementById("view-registrations-btn")) {
    document
      .getElementById("view-registrations-btn")
      .addEventListener("click", showMyRegistrations);
  }

  if (document.getElementById("register-button")) {
    document
      .getElementById("register-button")
      .addEventListener("click", registerForEvent);
  }

  // Note: kicks are now fixed at 5, no need for change event listener
});

// Function to load upcoming events
function loadUpcomingEvents() {
  const eventsLoading = document.getElementById("events-loading");
  const eventsContainer = document.getElementById("events-container");
  const noEventsRow = document.getElementById("no-events-row");
  const eventsTable = document.getElementById("events-table");

  if (!eventsLoading || !eventsContainer || !eventsTable) return;

  eventsLoading.style.display = "block";
  eventsContainer.style.display = "none";

  // Use the public API endpoint that doesn't require login
  console.log("=== FETCHING EVENTS FROM API ===");
  fetch("/api/public/events")
    .then((response) => {
      console.log("API Response status:", response.status);
      return response.json();
    })
    .then((data) => {
      console.log("API Response data:", data);
      eventsLoading.style.display = "none";
      eventsContainer.style.display = "block";

      if (data.success && data.events && data.events.length > 0) {
        console.log(`Found ${data.events.length} events, hiding no-events row`);
        if (noEventsRow) noEventsRow.style.display = "none";

        // Store available kicks and registrations
        window.availableKicks = 0;
        let registeredEventIds = [];

        // Check if user is logged in as player
        const isLoggedIn =
          typeof isPlayerLoggedIn !== "undefined" && isPlayerLoggedIn;

        if (isLoggedIn) {
          // Get player data if logged in
          fetch("/api/events/upcoming")
            .then((response) => response.json())
            .then((userData) => {
              if (userData.success) {
                window.availableKicks = userData.availableKicks || 0;

                if (
                  userData.registrations &&
                  userData.registrations.length > 0
                ) {
                  registeredEventIds = userData.registrations.map(
                    (reg) => reg.event_id
                  );
                }

                populateEventsTable(
                  data.events,
                  registeredEventIds,
                  isLoggedIn
                );
              }
            })
            .catch((error) => {
              console.error("Error fetching player data:", error);
              populateEventsTable(data.events, [], isLoggedIn);
            });
        } else {
          // Not logged in, just show events
          populateEventsTable(data.events, [], isLoggedIn);
        }
      } else {
        console.log("No events found or API call failed");
        console.log("data.success:", data.success);
        console.log("data.events:", data.events);
        if (data.events) console.log("data.events.length:", data.events.length);
        if (noEventsRow) noEventsRow.style.display = "table-row";
      }
    })
    .catch((error) => {
      console.error("Error loading events:", error);
      eventsLoading.style.display = "none";
      eventsContainer.style.display = "block";
      if (noEventsRow) noEventsRow.style.display = "table-row";
    });
}

// Populate events table with data
function populateEventsTable(events, registeredEventIds, isLoggedIn) {
  const tbody = document.getElementById("events-table").querySelector("tbody");
  const noEventsRow = document.getElementById("no-events-row");

  // Clear existing content but preserve the no-events row
  const existingRows = tbody.querySelectorAll("tr:not(#no-events-row)");
  existingRows.forEach((row) => row.remove());

  // Hide the no-events row since we have events
  if (noEventsRow) noEventsRow.style.display = "none";

  events.forEach((event) => {
    const row = document.createElement("tr");

    // Check if event is available for registration
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(event.start_date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(event.end_date);
    endDate.setHours(23, 59, 59, 999);

    const isEventActive = today <= endDate; // Allow registration until event ends
    const isRegistered = registeredEventIds.includes(event.id);
    const isRegistrationClosed = event.registration_closed === true; // Check if staff closed registration

    // Format dates for display
    const formattedStartDate = startDate.toLocaleDateString();
    const formattedEndDate = endDate.toLocaleDateString();
    const dateRange =
      formattedStartDate === formattedEndDate
        ? formattedStartDate
        : `${formattedStartDate} - ${formattedEndDate}`;

    // Create table row
    row.innerHTML = `
      <td>${dateRange}</td>
      <td>${event.name}</td>
      <td>$1 per kick (max 5 kicks per turn)</td>
      <td>
        ${
          isLoggedIn
            ? isRegistered
              ? '<span class="badge bg-success">Registered</span>'
              : isRegistrationClosed
              ? '<span class="badge bg-danger">Registration Closed</span>'
              : isEventActive
              ? `<button class="btn btn-sm btn-primary register-btn" 
                 data-event-id="${event.id}" 
                 data-max-kicks="${event.max_kicks}" 
                 data-tickets-per-kick="${event.tickets_required}" 
                 data-event-name="${event.name}" 
                 data-event-type="${event.event_type}" 
                 data-start-date="${event.start_date}" 
                 data-end-date="${event.end_date}">Register</button>`
              : '<span class="badge bg-secondary">Event Ended</span>'
            : '<span class="badge bg-warning">Login to register</span>'
        }
      </td>
    `;

    tbody.appendChild(row);
  });

  // Add event handlers to register buttons
  document.querySelectorAll(".register-btn").forEach((button) => {
    button.addEventListener("click", showRegistrationModal);
  });
}

// Show registration modal
function showRegistrationModal() {
  const eventId = this.dataset.eventId;
  const eventName = this.dataset.eventName;
  const eventType = this.dataset.eventType;
  const maxKicks = parseInt(this.dataset.maxKicks, 10);
  const ticketsPerKick = parseInt(this.dataset.ticketsPerKick, 10);
  const startDate = new Date(this.dataset.startDate).toLocaleDateString();
  const endDate = new Date(this.dataset.endDate).toLocaleDateString();

  // Update modal content
  document.getElementById("event-id").value = eventId;
  document.getElementById(
    "eventModalTitle"
  ).textContent = `Register for ${eventName}`;
  document.getElementById("event-details").innerHTML = `
    <strong>${eventName}</strong><br>
    <span>$1 per kick (max 5 kicks per turn)</span><br>
    <small class="text-muted">You can choose between competition or practice play when registering.</small>
  `;
  document.getElementById(
    "event-dates"
  ).textContent = `Event dates: ${startDate} to ${endDate}`;

  // Display available tickets
  document.getElementById("available-tickets").textContent =
    window.availableKicks || 0;

  // Since kicks are now fixed at 5, automatically calculate required tickets
  updateTicketsRequired();

  // Reset form - don't set competition checkbox based on event type
  // Let users choose whether it's practice or competition
  document.getElementById("is-competition").checked = false;

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("eventRegistrationModal")
  );
  modal.show();
}

// Update kicks required calculation
function updateTicketsRequired() {
  const kicksRequested =
    parseInt(document.getElementById("kicks-requested").value, 10) || 0;
  const registerBtn = document.getElementById("register-button");

  // Calculate total kicks required (now 1:1 ratio)
  const totalKicksRequired = kicksRequested;
  document.getElementById("tickets-required").textContent = totalKicksRequired;

  // Disable register button if not enough kicks
  if (registerBtn) {
    const availableKicks = window.availableKicks || 0;
    registerBtn.disabled =
      totalKicksRequired > availableKicks || kicksRequested === 0;

    if (totalKicksRequired > availableKicks) {
      document.getElementById("tickets-required").innerHTML = `
        ${totalKicksRequired} <span class="text-danger">(Not enough kicks available)</span>
      `;
    }
  }
}

// Register for event
function registerForEvent() {
  const eventId = document.getElementById("event-id").value;
  const kicksRequested = 5; // Fixed at 5 kicks
  const isCompetition = document.getElementById("is-competition").checked;

  if (!eventId) {
    alert("Error: No event selected");
    return;
  }

  // Disable button and show loading
  const registerBtn = document.getElementById("register-button");
  registerBtn.disabled = true;
  registerBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';

  // Send registration request
  fetch("/api/events/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventId,
      kicksRequested,
      isCompetition,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Update available kicks
        window.availableKicks = data.remainingKicks;

        // Hide modal
        bootstrap.Modal.getInstance(
          document.getElementById("eventRegistrationModal")
        ).hide();

        // Show success message
        alert(
          `Successfully registered for the event! You used ${data.kicksUsed} kicks.`
        );

        // Reload events to refresh statuses
        loadUpcomingEvents();
      } else {
        alert(`Error: ${data.message || "Failed to register for event"}`);
      }
    })
    .catch((error) => {
      console.error("Error registering for event:", error);
      alert("An error occurred while registering. Please try again.");
    })
    .finally(() => {
      // Re-enable button
      registerBtn.disabled = false;
      registerBtn.innerHTML = "Register";
    });
}

// Show my registrations modal
function showMyRegistrations() {
  const registrationsLoading = document.getElementById("registrations-loading");
  const registrationsContainer = document.getElementById(
    "registrations-container"
  );

  if (!registrationsLoading || !registrationsContainer) return;

  // Show loading
  registrationsLoading.style.display = "block";
  registrationsContainer.style.display = "none";

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("myRegistrationsModal")
  );
  modal.show();

  // Load registrations
  fetch("/api/events/registrations")
    .then((response) => response.json())
    .then((data) => {
      registrationsLoading.style.display = "none";
      registrationsContainer.style.display = "block";

      if (data.success && data.registrations && data.registrations.length > 0) {
        let html = '<div class="list-group">';

        data.registrations.forEach((reg) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const startDate = new Date(reg.start_date);
          startDate.setHours(0, 0, 0, 0);

          const canCancel = startDate > today;

          html += `
            <div class="list-group-item">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${reg.event_name}</h5>
                <small>${new Date(
                  reg.registration_date
                ).toLocaleDateString()}</small>
              </div>
              <p class="mb-1">
                <strong>Event Dates:</strong> ${new Date(
                  reg.start_date
                ).toLocaleDateString()} to ${new Date(
            reg.end_date
          ).toLocaleDateString()}<br>
                <strong>Kicks:</strong> ${reg.kicks_requested} 
                <span class="badge bg-${
                  reg.is_competition ? "danger" : "info"
                }">
                  ${reg.is_competition ? "Competition" : "Practice"}
                </span><br>
                <strong>Tickets Used:</strong> ${reg.tickets_used}
              </p>
              ${
                reg.description
                  ? `<small class="text-muted">${reg.description}</small><br>`
                  : ""
              }
              ${
                canCancel
                  ? `
                <button class="btn btn-sm btn-danger mt-2 cancel-registration" data-registration-id="${reg.id}">
                  Cancel Registration
                </button>`
                  : '<span class="badge bg-info mt-2">Cannot cancel on event day</span>'
              }
            </div>
          `;
        });

        html += "</div>";
        registrationsContainer.innerHTML = html;

        // Add event handlers for cancel buttons
        document.querySelectorAll(".cancel-registration").forEach((button) => {
          button.addEventListener("click", cancelRegistration);
        });
      } else {
        registrationsContainer.innerHTML =
          '<p class="text-center">You have no event registrations.</p>';
      }
    })
    .catch((error) => {
      console.error("Error loading registrations:", error);
      registrationsLoading.style.display = "none";
      registrationsContainer.style.display = "block";
      registrationsContainer.innerHTML =
        '<p class="text-danger text-center">Error loading your registrations. Please try again.</p>';
    });
}

// Cancel registration
function cancelRegistration() {
  if (
    !confirm(
      "Are you sure you want to cancel this registration? Your tickets will be refunded."
    )
  ) {
    return;
  }

  const registrationId = this.dataset.registrationId;

  // Disable button and show loading
  this.disabled = true;
  this.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cancelling...';

  // Send cancellation request
  fetch(`/api/events/registrations/${registrationId}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Update available tickets
        window.availableTickets =
          (window.availableTickets || 0) + (data.ticketsRefunded || 0);

        // Show success message
        alert(
          `Registration cancelled. ${data.ticketsRefunded} tickets have been refunded.`
        );

        // Refresh registrations and events
        showMyRegistrations();
        loadUpcomingEvents();
      } else {
        alert(`Error: ${data.message || "Failed to cancel registration"}`);
        this.disabled = false;
        this.innerHTML = "Cancel Registration";
      }
    })
    .catch((error) => {
      console.error("Error cancelling registration:", error);
      alert("An error occurred while cancelling. Please try again.");
      this.disabled = false;
      this.innerHTML = "Cancel Registration";
    });
}
