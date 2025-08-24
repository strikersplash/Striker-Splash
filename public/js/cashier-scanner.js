// Dedicated QR scanner logic for cashier interface
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const startBtn = document.getElementById("start-scan");
    const stopBtn = document.getElementById("stop-scan");
    const containerId = "qr-reader";
    let html5QrCode = null;
    let active = false;

    if (!startBtn || !stopBtn || !document.getElementById(containerId)) {
      return; // Not on cashier page
    }

    function setRunning(running) {
      active = running;
      if (running) {
        startBtn.classList.add("d-none");
        stopBtn.classList.remove("d-none");
      } else {
        startBtn.classList.remove("d-none");
        stopBtn.classList.add("d-none");
      }
    }

    startBtn.addEventListener("click", async () => {
      console.log("[Scanner] Start clicked");
      if (typeof Html5Qrcode === "undefined") {
        console.error("[Scanner] Html5Qrcode not loaded");
        startBtn.disabled = true;
        setTimeout(() => (startBtn.disabled = false), 1200);
        return;
      }
      if (active) {
        console.log("[Scanner] Already running");
        return;
      }
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode(containerId);
      }
      try {
        setRunning(true);
        let cameraConfig = { facingMode: "environment" };
        try {
          const cams = await Html5Qrcode.getCameras();
          if (cams && cams.length) {
            const preferred =
              cams.find((c) => /back|rear|environment/i.test(c.label)) ||
              cams[0];
            cameraConfig = preferred.id;
            console.log(
              "[Scanner] Using camera:",
              preferred.label || preferred.id
            );
          }
        } catch (e) {
          console.warn("[Scanner] Camera list failed, fallback", e);
        }
        await html5QrCode.start(
          cameraConfig,
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            console.log("[Scanner] Code:", decodedText);
            try {
              await html5QrCode.stop();
            } catch (e) {}
            setRunning(false);
            let payload = decodedText;
            // If QR contains JSON, parse it to extract playerId or similar
            if (
              typeof decodedText === "string" &&
              decodedText.trim().startsWith("{")
            ) {
              try {
                const obj = JSON.parse(decodedText);
                payload = obj;
              } catch (e) {
                console.warn(
                  "[Scanner] Failed to parse JSON QR payload, using raw string"
                );
              }
            }
            if (typeof processQRCode === "function") {
              processQRCode(payload);
            } else {
              console.warn(
                "[Scanner] processQRCode not defined - showing fallback"
              );
              const infoDiv = document.getElementById("player-info");
              if (infoDiv) {
                infoDiv.innerHTML =
                  '<div class="alert alert-info">Scanned: ' +
                  (typeof payload === "object"
                    ? JSON.stringify(payload)
                    : payload) +
                  "</div>";
              }
            }
          },
          (err) => {
            /* ignore frequent not found errors */
          }
        );
        console.log("[Scanner] Started");
      } catch (err) {
        console.error("[Scanner] Start failed", err);
        setRunning(false);
        const area = document.getElementById(containerId);
        if (area) {
          area.innerHTML =
            '<div class="alert alert-danger p-2 small">Cannot start camera. Check permissions.</div>';
        }
      }
    });

    stopBtn.addEventListener("click", async () => {
      console.log("[Scanner] Stop clicked");
      if (html5QrCode) {
        try {
          await html5QrCode.stop();
        } catch (e) {
          console.warn("[Scanner] Stop error", e);
        }
      }
      setRunning(false);
    });
  });
})();
