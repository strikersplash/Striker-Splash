# Leaderboard Filters Form Submission Fix

## Issue

The leaderboard filters weren't working correctly because the application was using `window.location.href` to navigate with query parameters, but the parameters weren't being properly submitted to the server.

## Root Cause Analysis

1. **Incorrect Navigation Method**: Using `window.location.href` with manually constructed query strings can lead to encoding issues and parameter loss.

2. **Query Parameter Building**: The parameters were being added to the URL string, but this approach is prone to errors in encoding/decoding and may not work consistently across browsers.

3. **Form Parameters**: The server expected form parameters, but the client was sending URL query strings which might not be processed correctly.

## Solution

### 1. Changed Navigation Method from URL Redirect to Form Submission

Instead of using `window.location.href` to navigate with query parameters, we now dynamically create and submit a form:

```javascript
// Before:
window.location.href = `/leaderboard?${queryParams.join("&")}`;

// After:
const form = document.createElement("form");
form.method = "GET";
form.action = "/leaderboard";

// Add all parameters as hidden inputs
queryParams.forEach((param) => {
  const [key, value] = param.split("=");
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = key;
  input.value = decodeURIComponent(value);
  form.appendChild(input);
});

// Append form to body and submit it
document.body.appendChild(form);
form.submit();
```

### 2. Improved Parameter Handling

- Properly encoded parameters using `encodeURIComponent` when building query parameters
- Decoded parameter values when adding them to the form to ensure correct values
- Simplified the filter application logic by removing conditional filter inclusion

### 3. Applied the Fix to All Filter Controls

- Applied the fix to the "Apply Filters" button
- Applied the fix to the Individual/Team toggle radio buttons
- Applied the fix to the "Reset Filters" button

## Testing

To test this fix:

1. Visit the leaderboard page
2. Try filtering by gender, age group, district, time range, or sort order
3. Toggle between individual and team views
4. Verify that all filters work correctly in both views
5. Reset filters and verify that the view state is maintained

## Technical Background

HTML form submission is the standard way to send GET or POST requests with parameters. By switching to this method:

1. We ensure all parameters are properly encoded
2. The browser handles the submission natively, avoiding any custom encoding issues
3. The server receives the parameters in the expected format
4. We avoid potential issues with URL length limitations when many filters are applied

This fix maintains the same functionality but uses a more reliable method of parameter submission, ensuring that leaderboard filters work consistently across all browsers and devices.
