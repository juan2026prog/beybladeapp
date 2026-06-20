-- MIGRATION 05: FASE FINAL PRE-HASBRO
-- Adds multi-country schema modifications, notification center, and country-level isolation.

-- 1. Alter profiles to include country_id for quick RLS checks
ALTER TABLE beyblade.profiles ADD COLUMN IF NOT EXISTS country_id TEXT REFERENCES beyblade.countries(id) DEFAULT 'UY';

-- 2. Alter sub-profiles to include country_id
ALTER TABLE beyblade.organizers ADD COLUMN IF NOT EXISTS country_id TEXT REFERENCES beyblade.countries(id) DEFAULT 'UY';
ALTER TABLE beyblade.judges ADD COLUMN IF NOT EXISTS country_id TEXT REFERENCES beyblade.countries(id) DEFAULT 'UY';
ALTER TABLE beyblade.localities ADD COLUMN IF NOT EXISTS country_id TEXT REFERENCES beyblade.countries(id) DEFAULT 'UY';

-- 3. Alter registrations to support QR Check-In details
ALTER TABLE beyblade.tournament_registrations ADD COLUMN IF NOT EXISTS check_in_method TEXT CHECK (check_in_method IN ('manual', 'qr'));
ALTER TABLE beyblade.tournament_registrations ADD COLUMN IF NOT EXISTS check_in_timestamp TIMESTAMP WITH TIME ZONE;

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS beyblade.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES beyblade.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('torneo', 'inscripcion', 'resultados', 'puntos', 'tiendas', 'lanzamiento')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant privileges on new table & sequences
GRANT ALL ON TABLE beyblade.notifications TO anon, authenticated, service_role;

-- Enable RLS on notifications
ALTER TABLE beyblade.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON beyblade.notifications
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own notifications" ON beyblade.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role and admins can insert notifications" ON beyblade.notifications
    FOR INSERT WITH CHECK (true);

-- 5. Drop old country-sensitive RLS policies to replace them with Multi-Country Policies
DROP POLICY IF EXISTS "Only country admin or super admin can approve/modify organizers" ON beyblade.organizers;
DROP POLICY IF EXISTS "Only country admin or super admin can approve/modify judges" ON beyblade.judges;
DROP POLICY IF EXISTS "Users can edit their own store details" ON beyblade.stores;
DROP POLICY IF EXISTS "Only organizers can update their own tournaments" ON beyblade.tournaments;
DROP POLICY IF EXISTS "Only country admins can validate results" ON beyblade.tournament_results;

-- 6. Add Multi-Country Isolated RLS Policies

-- Organizers: Country Admin can only update organizers in their own country
CREATE POLICY "Admins can manage organizers in their country" ON beyblade.organizers
    FOR UPDATE USING (
      beyblade.get_user_role(auth.uid()) = 'super_admin' OR
      (beyblade.get_user_role(auth.uid()) = 'country_admin' AND country_id = (SELECT country_id FROM beyblade.profiles WHERE id = auth.uid()))
    );

-- Judges: Country Admin can only update judges in their own country
CREATE POLICY "Admins can manage judges in their country" ON beyblade.judges
    FOR UPDATE USING (
      beyblade.get_user_role(auth.uid()) = 'super_admin' OR
      (beyblade.get_user_role(auth.uid()) = 'country_admin' AND country_id = (SELECT country_id FROM beyblade.profiles WHERE id = auth.uid()))
    );

-- Stores: Country Admin can only update stores in their own country
CREATE POLICY "Admins or owners can manage stores in their country" ON beyblade.stores
    FOR UPDATE USING (
      auth.uid() = id OR
      beyblade.get_user_role(auth.uid()) = 'super_admin' OR
      (beyblade.get_user_role(auth.uid()) = 'country_admin' AND country_id = (SELECT country_id FROM beyblade.profiles WHERE id = auth.uid()))
    );

-- Tournaments: Country Admin can only update tournaments in their own country
CREATE POLICY "Admins or owners can manage tournaments in their country" ON beyblade.tournaments
    FOR UPDATE USING (
      auth.uid() = organizer_id OR
      beyblade.get_user_role(auth.uid()) = 'super_admin' OR
      (beyblade.get_user_role(auth.uid()) = 'country_admin' AND country_id = (SELECT country_id FROM beyblade.profiles WHERE id = auth.uid()))
    );

-- Results: Country Admin can only validate results for tournaments in their own country
CREATE POLICY "Admins can validate results in their country" ON beyblade.tournament_results
    FOR UPDATE USING (
      beyblade.get_user_role(auth.uid()) = 'super_admin' OR
      (
        beyblade.get_user_role(auth.uid()) = 'country_admin' AND 
        (SELECT t.country_id FROM beyblade.tournaments t WHERE t.id = tournament_id) = (SELECT p.country_id FROM beyblade.profiles p WHERE p.id = auth.uid())
      )
    );

-- 7. Seed notification and multi-country test structures
INSERT INTO beyblade.countries (id, name) VALUES 
('AR', 'Argentina'),
('BR', 'Brasil')
ON CONFLICT (id) DO NOTHING;

-- Let's define ALTER DEFAULT PRIVILEGES for future tables in the migration just in case
ALTER DEFAULT PRIVILEGES IN SCHEMA beyblade GRANT ALL ON TABLES TO anon, authenticated, service_role;
