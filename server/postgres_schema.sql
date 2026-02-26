-- PostgreSQL schema for MoiBook2025 (Supabase)
-- Run this in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255),
  event_side VARCHAR(255),
  event_date DATE,
  event_time VARCHAR(10),
  location VARCHAR(255),
  venue VARCHAR(255),
  place VARCHAR(255),
  event_head VARCHAR(255),
  event_head_prof VARCHAR(255),
  event_organizer VARCHAR(255),
  event_organizer_prof VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  invitation_count INTEGER,
  table_count INTEGER,
  approval_pins JSONB,
  data JSONB
);

CREATE TABLE IF NOT EXISTS registrars (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  designation VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  permission BOOLEAN DEFAULT true,
  data JSONB
);

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  member_code VARCHAR(64),
  name VARCHAR(255),
  initial VARCHAR(50),
  base_name VARCHAR(255),
  full_name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  town VARCHAR(255),
  town_id VARCHAR(64),
  street VARCHAR(255),
  relationship_name VARCHAR(255),
  relationship_type VARCHAR(64),
  relationship VARCHAR(255),
  education VARCHAR(255),
  profession VARCHAR(255),
  is_maternal_uncle BOOLEAN DEFAULT false,
  notes TEXT,
  source_event_id INTEGER,
  data JSONB,
  uuid VARCHAR(36)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_code ON members (member_code);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255),
  value TEXT,
  data JSONB
);

CREATE TABLE IF NOT EXISTS moi_entries (
  id SERIAL PRIMARY KEY,
  event_id INTEGER,
  serial_no INTEGER,
  table_no VARCHAR(50),
  contributor_name VARCHAR(255),
  amount NUMERIC(12,2) DEFAULT 0,
  phone VARCHAR(50),
  note TEXT,
  denominations JSONB,
  member_id VARCHAR(255),
  town VARCHAR(255),
  town_id VARCHAR(64),
  street VARCHAR(255),
  initial VARCHAR(50),
  base_name VARCHAR(255),
  relationship_name VARCHAR(255),
  relationship_type VARCHAR(64),
  relationship VARCHAR(255),
  education VARCHAR(255),
  profession VARCHAR(255),
  is_maternal_uncle BOOLEAN DEFAULT false,
  entry_type VARCHAR(64),
  data JSONB,
  uuid VARCHAR(36),
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moi_entries_event_id ON moi_entries (event_id);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  event_name VARCHAR(200) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time VARCHAR(20) NOT NULL,
  invitation_count INTEGER DEFAULT NULL,
  amount NUMERIC(10,2) DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'online',
  payment_reference VARCHAR(100) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
