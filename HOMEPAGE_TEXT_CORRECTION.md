# Homepage Text Correction

## Issue

On the homepage in the "How It Works" section, step 2 "Purchase Kicks" incorrectly stated "Buy kicks for $1 each (min. 5 kicks)" when it should indicate a maximum, not minimum, of 5 kicks per turn.

## Solution

Changed the text to correctly reflect the rules of the game:

- Before: "Buy kicks for $1 each (min. 5 kicks)"
- After: "Buy kicks for $1 each (max 5 kicks per turn)"

## Files Changed

1. `/src/views/public/home.ejs`
2. `/src/views/public/home_simple.ejs`

## Why This Fix Matters

This correction ensures that users understand the actual rules of the competition. The previous text incorrectly suggested that users must purchase at least 5 kicks, when in reality the rule is that users can purchase up to a maximum of 5 kicks per turn.

## Testing

To verify this fix:

1. Visit the homepage
2. Scroll down to the "How It Works" section
3. Confirm that step 2 now correctly states "Buy kicks for $1 each (max 5 kicks per turn)"

This text now matches the description in other parts of the application, ensuring consistent messaging across the platform.
