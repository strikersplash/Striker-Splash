// Main JavaScript for Striker Splash

document.addEventListener('DOMContentLoaded', function() {
  // Handle smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 70,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // QR Code Scanner (for staff interface)
  const scannerElement = document.getElementById('qr-scanner');
  if (scannerElement) {
    // Initialize QR scanner if available
    if (typeof Html5Qrcode !== 'undefined') {
      const html5QrCode = new Html5Qrcode("qr-scanner");
      
      // Start scanning button
      document.getElementById('start-scan').addEventListener('click', function() {
        html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          onScanSuccess,
          onScanError
        );
        
        document.getElementById('scanner-controls').classList.remove('d-none');
        this.classList.add('d-none');
      });
      
      // Stop scanning button
      document.getElementById('stop-scan').addEventListener('click', function() {
        html5QrCode.stop();
        document.getElementById('scanner-controls').classList.add('d-none');
        document.getElementById('start-scan').classList.remove('d-none');
      });
      
      // QR scan success handler
      function onScanSuccess(qrCodeMessage) {
        // Stop scanning
        html5QrCode.stop();
        document.getElementById('scanner-controls').classList.add('d-none');
        document.getElementById('start-scan').classList.remove('d-none');
        
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
    document.getElementById('player-info').innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    // Send QR data to server
    fetch('/staff/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ qrData })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Display player info
        const playerInfo = document.getElementById('player-info');
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
        document.getElementById('goal-form').addEventListener('submit', logGoal);
      } else {
        // Display error
        document.getElementById('player-info').innerHTML = `
          <div class="alert alert-danger">${data.message}</div>
        `;
      }
    })
    .catch(error => {
      console.error('Error processing QR code:', error);
      document.getElementById('player-info').innerHTML = `
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
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    // Send goal data to server
    fetch('/staff/log-goal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ playerId, goals, location })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Show success message
        const playerInfo = document.getElementById('player-info');
        playerInfo.innerHTML = `
          <div class="alert alert-success">
            <h4>Goal Logged Successfully!</h4>
            <p>Player scored ${data.gameStat.goals} goal(s).</p>
            <button id="scan-another" class="btn btn-primary">Scan Another Player</button>
          </div>
        `;
        
        // Add event listener for scan another button
        document.getElementById('scan-another').addEventListener('click', function() {
          document.getElementById('player-info').innerHTML = '';
          document.getElementById('start-scan').click();
        });
      } else {
        // Show error message
        alert(`Error: ${data.message}`);
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    })
    .catch(error => {
      console.error('Error logging goal:', error);
      alert('Error logging goal. Please try again.');
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    });
  }
  
  // Manual QR code input
  const manualQRForm = document.getElementById('manual-qr-form');
  if (manualQRForm) {
    manualQRForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const qrData = document.getElementById('manual-qr-input').value;
      if (qrData) {
        processQRCode(qrData);
      }
    });
  }
});