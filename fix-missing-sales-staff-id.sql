-- Fix missing staff_id for transactions created by the sales user
-- This will set staff_id to the correct value for all transactions where it is missing

UPDATE transactions
SET staff_id = (SELECT id FROM staff WHERE username = 'sales' LIMIT 1)
WHERE staff_id IS NULL;

-- You can run this with:
-- psql -h localhost -U striker_splash -d striker_splash -f fix-missing-sales-staff-id.sql
