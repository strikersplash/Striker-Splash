# End Competition Button Fix

## Issue

The "End Competition" button on the competition-live page was not properly ending the competition. Instead of ending the competition directly, it was simply redirecting the user to the competition setup page, requiring an extra click on another "End" button.

## Solution

### Changes Made:

1. Modified the End Competition button click handler to make a proper AJAX POST request directly to the endpoint that ends the competition
2. Added error handling and success/failure notifications for better user feedback
3. Enhanced the confirmation message to make it clear that ending a competition cannot be undone
4. Implemented a smooth transition with notifications and a delayed redirect after successful competition ending

### Technical Details:

The original code was using a simple redirect:

```javascript
if (confirm("Are you sure you want to end this competition?")) {
  window.location.href = "/staff/competition-setup";
}
```

This was changed to use a proper fetch request to the correct endpoint with full error handling:

```javascript
if (
  confirm(
    "Are you sure you want to end this competition? This cannot be undone."
  )
) {
  try {
    // Show a loading message
    showNotification("Ending competition...", "info");

    // Make a POST request to end the competition
    const response = await fetch(
      `/staff/competition-setup/<%= competition.id %>/end`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const result = await response.json();

    if (result.success) {
      showNotification("Competition ended successfully!", "success");
      // Redirect to competition setup page after a short delay
      setTimeout(() => {
        window.location.href = "/staff/competition-setup";
      }, 1000);
    } else {
      showNotification(`Failed to end competition: ${result.message}`, "error");
    }
  } catch (error) {
    console.error("Error ending competition:", error);
    showNotification("Error ending competition. Please try again.", "error");
  }
}
```

### Benefits:

- Streamlined user experience: the competition ends with one click
- Better user feedback with loading, success, and error notifications
- Proper error handling for network or server issues
- Reduced chance of user error (forgetting to end the competition after being redirected)
- Clearer messaging about the irreversible nature of ending a competition

### Testing:

To test this fix:

1. Navigate to a live competition page
2. Click the "End Competition" button
3. Confirm the dialog
4. Observe the loading notification
5. Verify the success notification appears
6. Confirm you are automatically redirected to the competition setup page
7. Verify that the competition status is changed to "completed"
