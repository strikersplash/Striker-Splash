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

  // Update tickets required when kicks selection changes
  const kicksSelector = document.getElementById("kicks-requested");
  if (kicksSelector) {
    kicksSelector.addEventListener("change", updateTicketsRequired);
  }
});

// Function to load upcoming events
function loadUpcomingEvents() {
  const eventsLoading = document.getElementById("events-loading");
  const eventsContainer = document.getElementById("events-container");
  const noEvents = document.getElementById("no-events");
  const eventsTable = document.getElementById("events-table");

  if (!eventsLoading || !eventsContainer || !eventsTable) return;

  eventsLoading.style.display = "block";
  eventsContainer.style.display = "none";

  // Use the public API endpoint that doesn't require login
  fetch("/api/public/events")
    .then((response) => response.json())
    .then((data) => {
      eventsLoading.style.display = "none";
      eventsContainer.style.display = "block";

      if (data.success && data.events && data.events.length > 0) {
        noEvents.style.display = "none";

        // Store available tickets and registrations
        window.availableTickets = 0;
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
                window.availableTickets = userData.availableTickets || 0;

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
        noEvents.style.display = "block";
      }
    })
    .catch((error) => {
      console.error("Error loading events:", error);
      eventsLoading.style.display = "none";
      eventsContainer.style.display = "block";
      noEvents.style.display = "block";
      noEvents.innerHTML =
        "<p>No upcoming events scheduled at this time. Check back soon!</p>";
    });
}

// Populate events table with data
function populateEventsTable(events, registeredEventIds, isLoggedIn) {
  const tbody = document.getElementById("events-table").querySelector("tbody");
  tbody.innerHTML = "";

  events.forEach((event) => {
    const row = document.createElement("tr");

    // Check if event is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(event.start_date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(event.end_date);
    endDate.setHours(23, 59, 59, 999);

    const isEventToday = startDate <= today && today <= endDate;
    const isRegistered = registeredEventIds.includes(event.id);

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
      <td>
        <span class="badge bg-${
          event.event_type === "competition" ? "danger" : "info"
        }">
          ${event.event_type === "competition" ? "Competition" : "Practice"}
        </span>
      </td>
      <td>${event.tickets_required} per kick (max ${event.max_kicks} kicks)</td>
      <td>
        ${
          isLoggedIn
            ? isRegistered
              ? '<span class="badge bg-success">Registered</span>'
              : isEventToday
              ? `<button class="btn btn-sm btn-primary register-btn" 
                 data-event-id="${event.id}" 
                 data-max-kicks="${event.max_kicks}" 
                 data-tickets-per-kick="${event.tickets_required}" 
                 data-event-name="${event.name}" 
                 data-event-type="${event.event_type}" 
                 data-start-date="${event.start_date}" 
                 data-end-date="${event.end_date}">Register</button>`
              : '<span class="badge bg-secondary">Not available today</span>'
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
    <span class="badge bg-${eventType === "competition" ? "danger" : "info"}">
      ${eventType === "competition" ? "Competition" : "Practice"}
    </span>
    <span class="ms-2">${ticketsPerKick} ticket${
    ticketsPerKick > 1 ? "s" : ""
  } required per kick</span>
  `;
  document.getElementById(
    "event-dates"
  ).textContent = `Event dates: ${startDate} to ${endDate}`;

  // Display available tickets
  document.getElementById("available-tickets").textContent =
    window.availableTickets || 0;

  // Limit kicks selector based on max kicks
  const kicksSelector = document.getElementById("kicks-requested");
  kicksSelector.innerHTML = '<option value="">Select number of kicks</option>';

  for (let i = 1; i <= Math.min(maxKicks, 5); i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i === 1 ? "1 kick" : `${i} kicks`;
    kicksSelector.appendChild(option);
  }

  // Reset form - don't set competition checkbox based on event type
  // Let users choose whether it's practice or competition
  document.getElementById("is-competition").checked = false;
  document.getElementById("tickets-required").textContent = "0";

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("eventRegistrationModal")
  );
  modal.show();
}

// Update tickets required calculation
function updateTicketsRequired() {
  const kicksRequested =
    parseInt(document.getElementById("kicks-requested").value, 10) || 0;
  const registerBtn = document.getElementById("register-button");

  // Get the selected event's tickets per kick
  const eventId = document.getElementById("event-id").value;
  const eventBtn = document.querySelector(
    `.register-btn[data-event-id="${eventId}"]`
  );
  const ticketsPerKick = parseInt(eventBtn?.dataset.ticketsPerKick, 10) || 1;

  // Calculate total tickets required
  const totalTicketsRequired = kicksRequested * ticketsPerKick;
  document.getElementById("tickets-required").textContent =
    totalTicketsRequired;

  // Disable register button if not enough tickets
  if (registerBtn) {
    const availableTickets = window.availableTickets || 0;
    registerBtn.disabled =
      totalTicketsRequired > availableTickets || kicksRequested === 0;

    if (totalTicketsRequired > availableTickets) {
      document.getElementById("tickets-required").innerHTML = `
        ${totalTicketsRequired} <span class="text-danger">(Not enough tickets available)</span>
      `;
    }
  }
}

// Register for event
function registerForEvent() {
  const eventId = document.getElementById("event-id").value;
  const kicksRequested = parseInt(
    document.getElementById("kicks-requested").value,
    10
  );
  const isCompetition = document.getElementById("is-competition").checked;

  if (!eventId || !kicksRequested) {
    alert("Please select the number of kicks you want");
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
        // Update available tickets
        window.availableTickets = data.remainingTickets;

        // Hide modal
        bootstrap.Modal.getInstance(
          document.getElementById("eventRegistrationModal")
        ).hide();

        // Show success message
        alert(
          `Successfully registered for the event! You used ${data.ticketsUsed} tickets.`
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
                <h5 class="mb-1">${reg.name}</h5>
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
