-- KisanSaathi MySQL setup
-- Run manually if needed: mysql -u root -p < setup.sql

CREATE DATABASE IF NOT EXISTS kisansaathi;
USE kisansaathi;

CREATE TABLE IF NOT EXISTS farmers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  farm_name     VARCHAR(100) NOT NULL,
  village       VARCHAR(100) NOT NULL,
  district      VARCHAR(100),
  state         VARCHAR(100) NOT NULL,
  area          DECIMAL(8,2) NOT NULL,
  soil_type     VARCHAR(100),
  crop_name     VARCHAR(100) NOT NULL,
  crop_variety  VARCHAR(100),
  sowing_date   DATE,
  harvest_date  DATE,
  irrigation    VARCHAR(100),
  fertilizer    VARCHAR(200),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  phone         VARCHAR(15),
  role          ENUM('farmer', 'admin') DEFAULT 'farmer',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id     INT NOT NULL,
  category      VARCHAR(100) NOT NULL,
  description   VARCHAR(255),
  amount        DECIMAL(10,2) NOT NULL,
  expense_date  DATE NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crop_history (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id     INT NOT NULL,
  crop_name     VARCHAR(100) NOT NULL,
  variety       VARCHAR(100),
  season        VARCHAR(50),
  sowing_date   DATE,
  harvest_date  DATE,
  yield_kg      DECIMAL(10,2),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

INSERT INTO farmers (
  farm_name,
  village,
  district,
  state,
  area,
  soil_type,
  crop_name,
  crop_variety,
  irrigation,
  fertilizer,
  notes
)
VALUES
  ('North Field', 'Ludhiana', 'Ludhiana', 'Punjab', 5.50, 'Alluvial', 'Wheat', 'HD 2967', 'Borewell / Tubewell', 'DAP, Urea', 'Sample wheat farm'),
  ('South Plot', 'Amritsar', 'Amritsar', 'Punjab', 3.00, 'Alluvial', 'Rice / Paddy', 'PB1121', 'Canal', 'NPK Mix', 'Sample paddy farm'),
  ('Green Acres', 'Nashik', 'Nashik', 'Maharashtra', 8.00, 'Black (Regur)', 'Onion', 'Nasik Red', 'Drip Irrigation', 'Organic compost', 'Sample onion farm');
