-- ============================================================
-- Database off-chain untuk autentikasi pemilih (MySQL / MariaDB)
-- Import lewat phpMyAdmin atau:  mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS voter_db;
USE voter_db;

CREATE TABLE IF NOT EXISTS voters (
    voter_id VARCHAR(36)  NOT NULL,           -- NIM / ID pemilih
    role     ENUM('admin', 'user') NOT NULL,  -- hak akses
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (voter_id)
);

-- Akun contoh (data dummy, ganti sebelum dipakai)
INSERT INTO voters (voter_id, role, password) VALUES
    ('admin01',  'admin', 'admin123'),
    ('10120001', 'user',  'voter123'),
    ('10120002', 'user',  'voter123'),
    ('10120003', 'user',  'voter123');
