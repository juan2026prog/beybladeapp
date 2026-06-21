-- Migration: Make seasons end_date optional
ALTER TABLE beyblade.seasons ALTER COLUMN end_date DROP NOT NULL;
