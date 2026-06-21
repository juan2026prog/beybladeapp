-- Migration: Fix Insert Policies on Tournaments and Journeys
-- Exposes INSERT rights to Super Admin and Country Admin roles

DROP POLICY IF EXISTS "Only approved organizers can insert tournaments" ON beyblade.tournaments;
CREATE POLICY "Admins and approved organizers can insert tournaments" ON beyblade.tournaments
    FOR INSERT WITH CHECK (
        (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
        (beyblade.get_user_role(auth.uid()) = 'country_admin'::text) OR
        ((beyblade.get_user_role(auth.uid()) = 'organizer'::text) AND (EXISTS (
            SELECT 1 FROM beyblade.organizers 
            WHERE organizers.id = auth.uid() AND organizers.status = 'Aprobado'::text
        )))
    );

DROP POLICY IF EXISTS "Approved organizers can insert journeys" ON beyblade.journeys;
CREATE POLICY "Admins and approved organizers can insert journeys" ON beyblade.journeys
    FOR INSERT WITH CHECK (
        (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
        (beyblade.get_user_role(auth.uid()) = 'country_admin'::text) OR
        ((beyblade.get_user_role(auth.uid()) = 'organizer'::text) AND (EXISTS (
            SELECT 1 FROM beyblade.organizers 
            WHERE organizers.id = auth.uid() AND organizers.status = 'Aprobado'::text
        )))
    );
