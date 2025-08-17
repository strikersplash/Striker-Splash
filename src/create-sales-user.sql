-- Create the first outside sales user
-- Username: sales, Password: password123, Role: sales

-- First, let's hash the password (password123)
-- We'll use a pre-computed bcrypt hash for 'password123'
INSERT INTO staff (username, password_hash, name, role) 
VALUES (
  'sales', 
  '$2a$10$xIdKaOVrG/mg/0qLIbe5.OQMAPmxfRP3MQpUyMiSN/tP0J8KacIB2', 
  'Outside Sales User', 
  'sales'
);
