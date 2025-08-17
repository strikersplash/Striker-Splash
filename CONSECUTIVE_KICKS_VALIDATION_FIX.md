# Consecutive Kicks Validation Fix

## Issue

The consecutive kicks feature was incorrectly validating that consecutive kicks could not exceed the goals scored in the current session. This was wrong because consecutive kicks represent a **streak across multiple sessions**, not just the current attempt.

## Example Scenario

- Player scores 3 goals out of 5 kicks in current session
- Player is on a streak and has made 4 consecutive kicks total (including previous sessions)
- System was incorrectly blocking this with "consecutive kicks cannot exceed total goals scored"

## Fix Applied

### ❌ Removed Incorrect Validations

#### Frontend (`src/views/referee/interface.ejs`):

- Removed: `if (consecutive > goals)` validation
- Removed: `if (goals < 3)` validation for tracking consecutive kicks

#### Backend (`src/controllers/staff/scanController.ts`):

- Removed: `if (consKicks > goals)` validation
- Removed: `if (goals < 3)` validation for tracking consecutive kicks

### ✅ Kept Correct Validation

#### Still Validates:

- `consecutive >= 3` (minimum consecutive kicks to track)
- Only allows positive integers
- Proper data type validation

### 📝 Updated Help Text

#### Before:

- "Check this if the player made consecutive goals (minimum 3 in a row required, no maximum limit)"
- "How many kicks in a row did the player make? (minimum 3)"

#### After:

- "Track player's current consecutive kick streak (minimum 3, can span multiple sessions)"
- "Total consecutive kicks in their current streak (minimum 3, can exceed goals in this session)"

#### Updated Error Messages:

- Before: "Consecutive kicks must be at least 3 and cannot exceed the total goals scored."
- After: "Consecutive kicks must be at least 3."

## How It Works Now

### ✅ Correct Behavior:

1. **Current Session**: Player scores 3 out of 5 kicks
2. **Consecutive Streak**: Player has made 6 consecutive kicks across multiple sessions
3. **System**: Allows logging 6 consecutive kicks
4. **Leaderboard**: Shows 3 goals for this session, updates best streak to 6 if it's a new record

### 🎯 Key Points:

- **Goals Scored** = affects leaderboard ranking (goals per session)
- **Consecutive Kicks** = tracks streak across sessions, affects "Best Streak" column
- **Independent Tracking** = consecutive kicks can be higher than current session goals
- **Personal Records** = consecutive kicks updates player's best streak if higher

## Benefits

### For Referees:

- No more confusing validation errors
- Can properly track long-term streaks
- Clear help text explains the difference

### For Players:

- Accurate streak tracking across multiple sessions
- Recognition for maintaining consistency over time
- Personal records properly tracked and displayed

### For System:

- Correct data model implementation
- Proper separation of session goals vs. streak tracking
- More meaningful leaderboard metrics

---

**Status**: ✅ Fixed and Deployed  
**Validation**: ✅ Now correctly allows consecutive > session goals  
**Help Text**: ✅ Updated to clarify streak tracking  
**Testing**: ✅ Ready for use
