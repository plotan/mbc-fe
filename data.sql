-- SQL Schema for Badminton Management App
-- This schema is designed for PostgreSQL.

-- Enum types for status fields to ensure data consistency.
CREATE TYPE GENDER_TYPE AS ENUM ('Male', 'Female');
CREATE TYPE PAYMENT_STATUS AS ENUM ('Paid', 'Unpaid');
CREATE TYPE TRANSACTION_TYPE AS ENUM ('Income', 'Expense');
CREATE TYPE TOURNAMENT_TYPE AS ENUM ('Men''s Singles', 'Women''s Singles', 'Men''s Doubles', 'Women''s Doubles', 'Mixed Doubles');
CREATE TYPE TOURNAMENT_STATUS AS ENUM ('Upcoming', 'In Progress', 'Completed');

-- Table for Court Bookings
-- This table stores information about each court booking period.
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    court_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cost NUMERIC(12, 2) NOT NULL,
    max_members INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Club Members
-- Each member is linked to a booking via booking_id.
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL, -- Link to a court booking
    name VARCHAR(255) NOT NULL,
    gender GENDER_TYPE NOT NULL,
    phone VARCHAR(50),
    status PAYMENT_STATUS NOT NULL DEFAULT 'Unpaid',
    join_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Cashflow Transactions
-- Stores all income and expense records.
CREATE TABLE cashflow (
    id SERIAL PRIMARY KEY,
    type TRANSACTION_TYPE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Tournaments
-- The 'bracket' column uses JSONB to store the complex, nested structure of the tournament bracket.
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type TOURNAMENT_TYPE NOT NULL,
    status TOURNAMENT_STATUS NOT NULL DEFAULT 'Upcoming',
    bracket JSONB, -- Stores the entire bracket structure, including teams, players, and winners.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create indexes for frequently queried columns for better performance.
CREATE INDEX idx_members_booking_id ON members(booking_id);
CREATE INDEX idx_cashflow_date ON cashflow(date);
CREATE INDEX idx_tournaments_status ON tournaments(status);

-- Add this new table to your data.sql file

-- Table for Admin Users
-- Stores hashed passwords for security
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Example of inserting a pre-hashed admin user.
-- The password 'adminpass' was hashed using bcrypt.
-- You should generate your own hash on the server when creating a user.
INSERT INTO admins (username, password_hash) VALUES ('admin', '$2a$10$f5.j9G9hG1L5a2f8j/o1U.V1ZzE7Y9E0s1XzG2r3s4c5D6e7F8g9h');

-- Add new columns to the bookings table for enhanced details
ALTER TABLE bookings
ADD COLUMN day VARCHAR(50),
ADD COLUMN start_hour TIME WITHOUT TIME ZONE,
ADD COLUMN end_hour TIME WITHOUT TIME ZONE,
ADD COLUMN maps_url TEXT;