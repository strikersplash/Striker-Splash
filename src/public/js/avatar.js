/**
 * Avatar utility functions
 */

// Generate a color based on name
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
}

// Get initials from name
function getInitials(name) {
  const nameParts = name.split(" ");
  return nameParts.length > 1
    ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase()
    : name.charAt(0).toUpperCase();
}

// Create avatar element with photo support
function createAvatar(name, size = 40, photoPath = null) {
  if (photoPath && photoPath.trim() !== "") {
    // Create image avatar
    const avatar = document.createElement("img");
    avatar.className = "rounded-circle";

    // Ensure the path starts with a slash if it's a relative path
    if (!photoPath.startsWith("http") && !photoPath.startsWith("/")) {
      photoPath = "/" + photoPath;
    }

    // Add stronger cache-busting parameter with a unique timestamp and random component
    const timestamp = new Date().getTime() + Math.floor(Math.random() * 100000);
    avatar.src =
      photoPath +
      (photoPath.includes("?") ? "&" : "?") +
      "t=" +
      timestamp +
      "&r=" +
      Math.random();

    // Log the final image URL for debugging
    console.log("Loading image from:", avatar.src);

    avatar.alt = `${name} profile photo`;
    avatar.style.width = `${size}px`;
    avatar.style.height = `${size}px`;
    avatar.style.objectFit = "cover";
    avatar.style.border = "2px solid #dee2e6";

    // Fallback to initials if image fails to load
    avatar.onerror = function () {
      console.error("Image failed to load:", this.src, "for user:", name); // Enhanced error log

      // Try loading without cache parameter as a fallback
      if (this.src.includes("?t=") || this.src.includes("&t=")) {
        console.log("Trying without cache parameter...");
        const cleanPath = this.src.split("?")[0];
        this.src = cleanPath;

        // Set up one more fallback if that fails too
        this.onerror = function () {
          console.error(
            "Second attempt failed. Falling back to initials for:",
            name
          );
          // Create fallback avatar with initials
          const fallbackAvatar = createInitialsAvatar(name, size);
          // Copy classes from the original image element
          fallbackAvatar.className = this.className;
          // Replace the broken image with initials avatar
          if (this.parentNode) {
            this.parentNode.replaceChild(fallbackAvatar, this);
          }
        };

        // Return to avoid creating fallback avatar immediately
        return;
      }

      // Create fallback avatar
      const fallbackAvatar = createInitialsAvatar(name, size);
      // Copy classes from the original image element
      fallbackAvatar.className = this.className;
      // Replace the broken image with initials avatar
      if (this.parentNode) {
        this.parentNode.replaceChild(fallbackAvatar, this);
      }
    };

    return avatar;
  } else {
    // Create initials avatar
    return createInitialsAvatar(name, size);
  }
}

// Create initials-based avatar (fallback)
function createInitialsAvatar(name, size = 40) {
  const initials = getInitials(name);
  const color = stringToColor(name);

  const avatar = document.createElement("div");
  avatar.className =
    "rounded-circle d-flex align-items-center justify-content-center";
  avatar.style.width = `${size}px`;
  avatar.style.height = `${size}px`;
  avatar.style.backgroundColor = color;
  avatar.style.color = "#ffffff";
  avatar.style.fontWeight = "bold";
  avatar.style.fontSize = `${size / 2.5}px`;
  avatar.style.border = "2px solid #dee2e6";
  avatar.style.lineHeight = "1";
  avatar.style.userSelect = "none";
  avatar.style.fontFamily = "Arial, sans-serif"; // Ensure consistent font
  avatar.style.textAlign = "center"; // Additional centering
  avatar.style.display = "flex"; // Ensure flex display
  avatar.style.flexDirection = "column"; // Stack content vertically in center

  // Create a span for the initials to ensure proper centering
  const initialsSpan = document.createElement("span");
  initialsSpan.textContent = initials;
  initialsSpan.style.display = "flex";
  initialsSpan.style.alignItems = "center";
  initialsSpan.style.justifyContent = "center";
  initialsSpan.style.height = "100%";
  initialsSpan.style.width = "100%";

  // Add the span to the avatar instead of setting textContent directly
  avatar.appendChild(initialsSpan);

  return avatar;
}
