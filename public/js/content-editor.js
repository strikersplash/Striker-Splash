// Content editing functionality for admin users
class ContentEditor {
  constructor() {
    this.isEditing = false;
    this.originalContent = {};
    this.currentSection = "";
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Edit button click handler
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("admin-edit-btn")) {
        e.preventDefault();
        const section = e.target.dataset.section;
        this.toggleEditMode(section);
      }
    });

    // Save button click handler
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("save-content-btn")) {
        e.preventDefault();
        this.saveContent();
      }
    });

    // Cancel button click handler
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("cancel-edit-btn")) {
        e.preventDefault();
        this.cancelEdit();
      }
    });

    // Handle escape key to cancel editing
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isEditing) {
        this.cancelEdit();
      }
    });
  }

  toggleEditMode(section) {
    if (this.isEditing) {
      this.cancelEdit();
    }

    this.isEditing = true;
    this.currentSection = section;
    this.originalContent = {};

    // Find all editable elements in the section
    const editableElements = document.querySelectorAll(
      `[data-editable="${section}"]`
    );

    editableElements.forEach((element) => {
      const key = element.dataset.key;
      const currentValue =
        element.textContent || element.src || element.alt || "";
      this.originalContent[key] = currentValue;

      // Create input field based on element type
      const input = this.createInputField(element, currentValue);

      // Replace element with input
      element.style.display = "none";
      element.parentNode.insertBefore(input, element.nextSibling);
    });

    // Show save/cancel buttons
    this.showEditControls(section);
  }

  createInputField(element, value) {
    let input;

    if (element.tagName === "IMG") {
      // For images, create a text input for the src
      input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.className = "form-control admin-edit-input";
      input.placeholder = "Image URL";
    } else if (
      element.tagName === "H1" ||
      element.tagName === "H2" ||
      element.tagName === "H3" ||
      element.tagName === "H4"
    ) {
      // For headings, create a text input
      input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.className = "form-control admin-edit-input";
    } else if (element.tagName === "P" && value.length > 100) {
      // For long paragraphs, create a textarea
      input = document.createElement("textarea");
      input.value = value;
      input.className = "form-control admin-edit-input";
      input.rows = 3;
    } else {
      // For other elements, create a text input
      input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.className = "form-control admin-edit-input";
    }

    input.dataset.key = element.dataset.key;
    input.dataset.originalElement = element.tagName;

    return input;
  }

  showEditControls(section) {
    // Hide the edit button
    const editBtn = document.querySelector(
      `.admin-edit-btn[data-section="${section}"]`
    );
    if (editBtn) {
      editBtn.style.display = "none";
    }

    // Create and show save/cancel buttons
    const controlsDiv = document.createElement("div");
    controlsDiv.className = "admin-edit-controls mt-3";
    controlsDiv.innerHTML = `
            <button class="btn btn-success save-content-btn me-2">
                <i class="bi bi-check-lg"></i> Save Changes
            </button>
            <button class="btn btn-secondary cancel-edit-btn">
                <i class="bi bi-x-lg"></i> Cancel
            </button>
        `;

    // Insert controls after the edit button
    if (editBtn) {
      editBtn.parentNode.insertBefore(controlsDiv, editBtn.nextSibling);
    }
  }

  async saveContent() {
    const updates = {};
    const inputs = document.querySelectorAll(".admin-edit-input");

    inputs.forEach((input) => {
      const key = input.dataset.key;
      updates[key] = input.value;
    });

    try {
      const response = await fetch("/admin/content/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: this.currentSection,
          updates: updates,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the original elements with new values
        inputs.forEach((input) => {
          const key = input.dataset.key;
          const originalElement = document.querySelector(
            `[data-editable="${this.currentSection}"][data-key="${key}"]`
          );

          if (originalElement) {
            if (originalElement.tagName === "IMG") {
              originalElement.src = input.value;
            } else {
              originalElement.textContent = input.value;
            }
          }
        });

        this.exitEditMode();
        this.showSuccessMessage("Content updated successfully!");
      } else {
        this.showErrorMessage("Failed to update content: " + result.message);
      }
    } catch (error) {
      console.error("Error saving content:", error);
      this.showErrorMessage("Failed to update content. Please try again.");
    }
  }

  cancelEdit() {
    // Restore original content
    Object.keys(this.originalContent).forEach((key) => {
      const originalElement = document.querySelector(
        `[data-editable="${this.currentSection}"][data-key="${key}"]`
      );
      if (originalElement) {
        if (originalElement.tagName === "IMG") {
          originalElement.src = this.originalContent[key];
        } else {
          originalElement.textContent = this.originalContent[key];
        }
      }
    });

    this.exitEditMode();
  }

  exitEditMode() {
    // Remove input fields
    const inputs = document.querySelectorAll(".admin-edit-input");
    inputs.forEach((input) => input.remove());

    // Show original elements
    const editableElements = document.querySelectorAll(
      `[data-editable="${this.currentSection}"]`
    );
    editableElements.forEach((element) => {
      element.style.display = "";
    });

    // Remove edit controls
    const controls = document.querySelector(".admin-edit-controls");
    if (controls) {
      controls.remove();
    }

    // Show edit button again
    const editBtn = document.querySelector(
      `.admin-edit-btn[data-section="${this.currentSection}"]`
    );
    if (editBtn) {
      editBtn.style.display = "";
    }

    // Reset state
    this.isEditing = false;
    this.originalContent = {};
    this.currentSection = "";
  }

  showSuccessMessage(message) {
    this.showMessage(message, "success");
  }

  showErrorMessage(message) {
    this.showMessage(message, "danger");
  }

  showMessage(message, type) {
    // Create alert
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText =
      "top: 20px; right: 20px; z-index: 9999; max-width: 400px;";
    alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    document.body.appendChild(alert);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 3000);
  }
}

// Initialize content editor when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ContentEditor();
});
