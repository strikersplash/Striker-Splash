-- db-setup.sql
DROP DATABASE IF EXISTS striker_splash;
DROP ROLE IF EXISTS striker_splash;

CREATE ROLE striker_splash WITH LOGIN PASSWORD 'striker_splash' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE striker_splash WITH OWNER = striker_splash ENCODING = 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8' TEMPLATE = template0;
\connect striker_splash

-- Staff table for authentication
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('staff', 'admin')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Players table
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  dob DATE NOT NULL,
  residence VARCHAR(100) NOT NULL,
  qr_hash VARCHAR(100) NOT NULL UNIQUE,
  age_group VARCHAR(50) NOT NULL,
  photo_path VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Shots (payments) table
CREATE TABLE shots (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  shots_quantity INTEGER NOT NULL,
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_reference VARCHAR(100),
  timestamp TIMESTAMP NOT NULL DEFAULT now()
);

-- Game stats table
CREATE TABLE game_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  goals INTEGER NOT NULL DEFAULT 1,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  location VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT now()
);

-- Event locations table
CREATE TABLE event_locations (
  id SERIAL PRIMARY KEY,
  location VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Uploads table
CREATE TABLE uploads (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
INSERT INTO staff (username, password_hash, name, role) 
VALUES ('admin', '$2a$10$JmQzF5KSGdJ8O5oRlVUgxOUKFvgBFbKgQZpJMJkJ6.UZe.z1JpJXi', 'Administrator', 'admin');

-- Insert default staff user (password: staff123)
INSERT INTO staff (username, password_hash, name, role) 
VALUES ('staff', '$2a$10$JmQzF5KSGdJ8O5oRlVUgxOUKFvgBFbKgQZpJMJkJ6.UZe.z1JpJXi', 'Staff Member', 'staff');

-- Insert test players
INSERT INTO players (name, phone, dob, residence, qr_hash, age_group, password_hash)
VALUES 
  ('John Doe', '07700900001', '1990-01-15', 'Belize City', 'qr_hash_john_123456789', 'Adults 31-50 years', '$2a$10$JmQzF5KSGdJ8O5oRlVUgxOUKFvgBFbKgQZpJMJkJ6.UZe.z1JpJXi'),
  ('Jane Smith', '07700900002', '2010-05-20', 'San Pedro', 'qr_hash_jane_123456789', 'Teens 11-17 years', '$2a$10$JmQzF5KSGdJ8O5oRlVUgxOUKFvgBFbKgQZpJMJkJ6.UZe.z1JpJXi'),
  ('Billy Kid', '07700900003', '2015-11-10', 'Belmopan', 'qr_hash_billy_123456789', 'Up to 10 years', '$2a$10$JmQzF5KSGdJ8O5oRlVUgxOUKFvgBFbKgQZpJMJkJ6.UZe.z1JpJXi');

-- Insert test shots
INSERT INTO shots (player_id, amount, shots_quantity, payment_status, payment_reference)
VALUES 
  (1, 10.00, 5, 'completed', 'TEST-123456789'),
  (2, 6.00, 3, 'completed', 'TEST-987654321'),
  (3, 2.00, 1, 'completed', 'TEST-456789123');

-- Insert test game stats
INSERT INTO game_stats (player_id, goals, staff_id, location)
VALUES 
  (1, 3, 1, 'Belize City Event'),
  (1, 2, 1, 'San Pedro Event'),
  (2, 1, 2, 'Belmopan Event');

-- Insert test event locations
INSERT INTO event_locations (location, start_date, end_date)
VALUES
  ('Belize City - BTL Park', '2023-06-10', '2023-06-12'),
  ('San Pedro - Central Park', '2023-06-17', '2023-06-19'),
  ('Belmopan - Market Square', '2023-06-24', '2023-06-26'),
  ('Placencia - Main Beach', '2023-07-01', '2023-07-03');

GRANT ALL PRIVILEGES ON DATABASE striker_splash TO striker_splash;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO striker_splash;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO striker_splash;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO striker_splash;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO striker_splash;
CREATE EXTENSION IF NOT EXISTS pgcrypto;