-- ============================================================
-- CLEANUP: Remove junk data from businesses table
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Delete businesses with no name or "Unknown" names
DELETE FROM businesses WHERE name IS NULL OR name = '' OR name = 'Unknown';

-- 2. Delete businesses with no phone number (your requirement: every business must have a phone)
DELETE FROM businesses WHERE phone IS NULL OR phone = '' OR phone = 'EMPTY';

-- 3. Delete obvious junk entries
DELETE FROM businesses WHERE name LIKE '%test%' AND LENGTH(name) < 10;

-- 4. Verify what's left
SELECT COUNT(*) AS remaining_businesses FROM businesses;
SELECT COUNT(*) AS with_phone FROM businesses WHERE phone IS NOT NULL AND phone != '' AND phone != 'EMPTY';
SELECT DISTINCT category FROM businesses ORDER BY category;
