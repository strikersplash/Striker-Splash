-- Add support for 'sales' role in the staff table
-- This allows outside sales users to access cashier functionality

-- First, drop the existing check constraint
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;

-- Add the new constraint that includes 'sales' role
ALTER TABLE staff ADD CONSTRAINT staff_role_check 
CHECK (role IN ('staff', 'admin', 'sales'));

-- Add comment for clarity
COMMENT ON COLUMN staff.role IS 'User role: staff, admin, or sales (outside sales users who can access cashier interface)';
