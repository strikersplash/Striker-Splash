#!/bin/bash

# Final Verification Test Runner
echo "Running final verification test for team goal logging..."

# Make sure Node.js is available
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed or not in PATH"
  exit 1
fi

# Run the test script
node final-verification-test.js

# Check if test completed successfully
if [ $? -eq 0 ]; then
  echo "Test script completed successfully."
  echo "Review the output and follow the verification steps."
  
  # Extract the competition URL from the log file
  URL=$(grep "Test URL:" final-verification-test.log | cut -d' ' -f3)
  
  if [ ! -z "$URL" ]; then
    echo "Opening test competition in browser..."
    xdg-open "$URL"
  else
    echo "Could not find test URL in log file."
  fi
else
  echo "Test script failed. Please check the logs for details."
fi
