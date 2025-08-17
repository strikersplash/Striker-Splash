// Main JavaScript for Striker Splash

document.addEventListener("DOMContentLoaded", function () {
  // Mobile-specific initialization
  initializeMobileEnhancements();

  // Handle smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const navbarHeight = document.querySelector(".navbar").offsetHeight;
        window.scrollTo({
          top: targetElement.offsetTop - navbarHeight - 10,
          behavior: "smooth",
        });
      }
    });
  });

  // QR Code Scanner (for staff interface)
  const scannerElement = document.getElementById("qr-scanner");
  if (scannerElement) {
    // Initialize QR scanner if available
    if (typeof Html5Qrcode !== "undefined") {
      const html5QrCode = new Html5Qrcode("qr-scanner");

      // Start scanning button
      document
        .getElementById("start-scan")
        .addEventListener("click", function () {
          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: isMobile() ? 200 : 250 }, // Smaller QR box on mobile
            onScanSuccess,
            onScanError
          );

          document
            .getElementById("scanner-controls")
            .classList.remove("d-none");
          this.classList.add("d-none");
        });

      // Stop scanning button
      document
        .getElementById("stop-scan")
        .addEventListener("click", function () {
          html5QrCode.stop();
          document.getElementById("scanner-controls").classList.add("d-none");
          document.getElementById("start-scan").classList.remove("d-none");
        });

      // QR scan success handler
      function onScanSuccess(qrCodeMessage) {
        // Stop scanning
        html5QrCode.stop();
        document.getElementById("scanner-controls").classList.add("d-none");
        document.getElementById("start-scan").classList.remove("d-none");

        // Process QR code data
        processQRCode(qrCodeMessage);
      }

      // QR scan error handler
      function onScanError(error) {
        console.warn(`QR scan error: ${error}`);
      }
    }
  }

  // Process QR code data
  function processQRCode(qrData) {
    // Show loading indicator
    document.getElementById("player-info").innerHTML =
      '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    // Send QR data to server
    fetch("/staff/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ qrData }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Display player info
          const playerInfo = document.getElementById("player-info");
          playerInfo.innerHTML = `
          <div class="alert alert-success">Player verified!</div>
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">${data.player.name}</h5>
              <p class="card-text">Age Group: ${data.player.ageGroup}</p>
              <form id="goal-form">
                <input type="hidden" name="playerId" value="${data.player.id}">
                <div class="mb-3">
                  <label for="goals" class="form-label">Goals Scored</label>
                  <input type="number" class="form-control" id="goals" name="goals" value="1" min="0" max="10">
                </div>
                <div class="mb-3">
                  <label for="location" class="form-label">Location</label>
                  <input type="text" class="form-control" id="location" name="location" required>
                </div>
                <button type="submit" class="btn btn-primary">Log Goal</button>
              </form>
            </div>
          </div>
        `;

          // Add event listener for goal form
          document
            .getElementById("goal-form")
            .addEventListener("submit", logGoal);
        } else {
          // Display error
          document.getElementById("player-info").innerHTML = `
          <div class="alert alert-danger">${data.message}</div>
        `;
        }
      })
      .catch((error) => {
        console.error("Error processing QR code:", error);
        document.getElementById("player-info").innerHTML = `
        <div class="alert alert-danger">Error processing QR code. Please try again.</div>
      `;
      });
  }

  // Log goal
  function logGoal(e) {
    e.preventDefault();

    const form = e.target;
    const playerId = form.elements.playerId.value;
    const goals = form.elements.goals.value;
    const location = form.elements.location.value;

    // Show loading indicator
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

    // Send goal data to server
    fetch("/staff/log-goal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playerId, goals, location }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Show success message
          const playerInfo = document.getElementById("player-info");
          playerInfo.innerHTML = `
          <div class="alert alert-success">
            <h4>Goal Logged Successfully!</h4>
            <p>Player scored ${data.gameStat.goals} goal(s).</p>
            <button id="scan-another" class="btn btn-primary">Scan Another Player</button>
          </div>
        `;

          // Add event listener for scan another button
          document
            .getElementById("scan-another")
            .addEventListener("click", function () {
              document.getElementById("player-info").innerHTML = "";
              document.getElementById("start-scan").click();
            });
        } else {
          // Show error message
          alert(`Error: ${data.message}`);
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
        }
      })
      .catch((error) => {
        console.error("Error logging goal:", error);
        alert("Error logging goal. Please try again.");
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      });
  }

  // Manual QR code input
  const manualQRForm = document.getElementById("manual-qr-form");
  if (manualQRForm) {
    manualQRForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const qrData = document.getElementById("manual-qr-input").value;
      if (qrData) {
        processQRCode(qrData);
      }
    });
  }
});

// Mobile-specific enhancements
function initializeMobileEnhancements() {
  // Handle mobile keyboard behavior
  if (isMobile()) {
    handleMobileKeyboard();
  }

  // Handle touch events for better mobile interaction
  handleTouchEvents();

  // Handle mobile table scrolling
  handleMobileTableScrolling();

  // Handle mobile dropdown auto-close
  handleMobileDropdowns();

  // Handle mobile form validation
  handleMobileFormValidation();

  // Handle mobile leaderboard toggle
  handleMobileLeaderboardToggle();
}

// Detect if device is mobile
function isMobile() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768
  );
}

// Handle mobile keyboard appearing/disappearing
function handleMobileKeyboard() {
  const originalHeight = window.innerHeight;

  window.addEventListener("resize", function () {
    const currentHeight = window.innerHeight;
    const heightDifference = originalHeight - currentHeight;

    // If keyboard is open (height decreased significantly)
    if (heightDifference > 150) {
      document.body.classList.add("keyboard-open");
    } else {
      document.body.classList.remove("keyboard-open");
    }
  });
}

// Handle touch events for better mobile interaction
function handleTouchEvents() {
  // Add touch feedback for buttons
  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("touchstart", function () {
      this.style.opacity = "0.8";
    });

    button.addEventListener("touchend", function () {
      this.style.opacity = "1";
    });
  });

  // Handle touch scrolling for cards
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("touchstart", function () {
      this.style.transform = "scale(0.98)";
    });

    card.addEventListener("touchend", function () {
      this.style.transform = "scale(1)";
    });
  });
}

// Handle mobile table scrolling
function handleMobileTableScrolling() {
  const tables = document.querySelectorAll(".table-responsive");

  tables.forEach((table) => {
    // Add scroll hint for mobile tables
    if (isMobile()) {
      const scrollHint = document.createElement("div");
      scrollHint.className =
        "mobile-scroll-hint text-muted small text-center mb-2";
      scrollHint.innerHTML =
        '<i class="bi bi-arrow-left-right"></i> Scroll horizontally to see more';
      table.parentNode.insertBefore(scrollHint, table);

      // Hide hint after first scroll
      table.addEventListener(
        "scroll",
        function () {
          if (scrollHint) {
            scrollHint.style.display = "none";
          }
        },
        { once: true }
      );
    }
  });
}

// Handle mobile dropdown behavior
function handleMobileDropdowns() {
  document.querySelectorAll(".dropdown-menu").forEach((dropdown) => {
    dropdown.addEventListener("click", function (e) {
      // Close dropdown when clicking on mobile
      if (isMobile() && e.target.classList.contains("dropdown-item")) {
        setTimeout(() => {
          const bsDropdown = bootstrap.Dropdown.getInstance(
            dropdown.previousElementSibling
          );
          if (bsDropdown) {
            bsDropdown.hide();
          }
        }, 100);
      }
    });
  });
}

// Handle mobile form validation
function handleMobileFormValidation() {
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      const invalidFields = form.querySelectorAll(":invalid");

      if (invalidFields.length > 0 && isMobile()) {
        // Scroll to first invalid field on mobile
        invalidFields[0].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });
  });
}

// Handle mobile leaderboard toggle
function handleMobileLeaderboardToggle() {
  const individualRadio = document.getElementById("individual-radio");
  const teamRadio = document.getElementById("team-radio");
  const individualLeaderboard = document.getElementById(
    "individual-leaderboard"
  );
  const teamLeaderboard = document.getElementById("team-leaderboard");

  if (individualRadio && teamRadio) {
    [individualRadio, teamRadio].forEach((radio) => {
      radio.addEventListener("change", function () {
        if (this.id === "individual-radio" && this.checked) {
          individualLeaderboard.classList.remove("d-none");
          teamLeaderboard.classList.add("d-none");
        } else if (this.id === "team-radio" && this.checked) {
          teamLeaderboard.classList.remove("d-none");
          individualLeaderboard.classList.add("d-none");
        }
      });
    });
  }
}

// Add CSS for mobile keyboard handling
const mobileStyles = document.createElement("style");
mobileStyles.textContent = `
  .keyboard-open {
    height: 100vh !important;
    overflow: hidden;
  }
  
  .keyboard-open .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1030;
  }
  
  .keyboard-open main {
    padding-top: 60px;
    max-height: calc(100vh - 60px);
    overflow-y: auto;
  }
  
  .mobile-scroll-hint {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .rank-badge {
    display: inline-block;
    min-width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    border-radius: 50%;
    background: #6c757d;
    color: white;
    font-weight: bold;
    font-size: 0.875rem;
  }
  
  .rank-badge.rank-1 {
    background: #ffd700;
    color: #333;
  }
  
  .rank-badge.rank-2 {
    background: #c0c0c0;
    color: #333;
  }
  
  .rank-badge.rank-3 {
    background: #cd7f32;
    color: white;
  }
  
  @media (max-width: 767px) {
    .rank-badge {
      min-width: 25px;
      height: 25px;
      line-height: 25px;
      font-size: 0.8rem;
    }
  }
`;
document.head.appendChild(mobileStyles);
