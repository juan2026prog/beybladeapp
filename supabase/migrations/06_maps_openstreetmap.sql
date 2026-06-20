-- MIGRATION 06: OPENSTREETMAP AND LEAFLET INTEGRATION FOR BEYBLADE SCHEMA
-- Adds columns for latitude, longitude, and geocoding details to stores, tournaments, and localities.

-- 1. Alter stores table
ALTER TABLE beyblade.stores ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE beyblade.stores ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE beyblade.stores ADD COLUMN IF NOT EXISTS full_address text;
ALTER TABLE beyblade.stores ADD COLUMN IF NOT EXISTS geocoding_provider text;
ALTER TABLE beyblade.stores ADD COLUMN IF NOT EXISTS osm_place_id text;
ALTER TABLE beyblade.stores ADD COLUMN IF NOT EXISTS osm_type text;
ALTER TABLE beyblade.stores ADD COLUMN IF NOT EXISTS osm_class text;
ALTER TABLE beyblade.stores ADD COLUMN IF NOT EXISTS osm_importance numeric;
ALTER TABLE beyblade.stores ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

-- 2. Alter tournaments table
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS full_address text;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS geocoding_provider text;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS osm_place_id text;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS osm_type text;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS osm_class text;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS osm_importance numeric;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

-- 3. Alter localities table
ALTER TABLE beyblade.localities ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE beyblade.localities ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE beyblade.localities ADD COLUMN IF NOT EXISTS osm_place_id text;
ALTER TABLE beyblade.localities ADD COLUMN IF NOT EXISTS boundary_type text;
ALTER TABLE beyblade.localities ADD COLUMN IF NOT EXISTS auto_created boolean DEFAULT false;

-- 4. Enable RLS and add permissions/policies for auto-creation
-- Since we need to insert countries, departments, and localities during autocomplete:
-- Allow authenticated users to insert/update in these tables if they belong to their country.

-- Drop existing policies if they exist (to avoid conflicts when running migration)
DROP POLICY IF EXISTS "Authenticated users can insert countries" ON beyblade.countries;
DROP POLICY IF EXISTS "Authenticated users can insert departments" ON beyblade.departments;
DROP POLICY IF EXISTS "Authenticated users can insert localities" ON beyblade.localities;
DROP POLICY IF EXISTS "Authenticated users can update localities" ON beyblade.localities;

-- Countries insertion policy
CREATE POLICY "Authenticated users can insert countries" ON beyblade.countries
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Departments insertion policy
CREATE POLICY "Authenticated users can insert departments" ON beyblade.departments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            beyblade.get_user_role(auth.uid()) = 'super_admin' OR
            country_id = (SELECT country_id FROM beyblade.profiles WHERE id = auth.uid())
        )
    );

-- Localities insertion policy
CREATE POLICY "Authenticated users can insert localities" ON beyblade.localities
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            beyblade.get_user_role(auth.uid()) = 'super_admin' OR
            country_id = (SELECT country_id FROM beyblade.profiles WHERE id = auth.uid())
        )
    );

-- Localities update policy (in case we need to update/activate them)
CREATE POLICY "Authenticated users can update localities" ON beyblade.localities
    FOR UPDATE USING (
        beyblade.get_user_role(auth.uid()) = 'super_admin' OR
        (
            auth.uid() IS NOT NULL AND 
            country_id = (SELECT country_id FROM beyblade.profiles WHERE id = auth.uid())
        )
    );
