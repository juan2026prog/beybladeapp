-- Migration: Add Delete Policy for Tournaments
-- Allows Super Admin, Country Admin, and the Organizer who created the tournament to delete it

DROP POLICY IF EXISTS "Admins or owners can delete tournaments in their country" ON beyblade.tournaments;
CREATE POLICY "Admins or owners can delete tournaments in their country" ON beyblade.tournaments
    FOR DELETE USING (
        (auth.uid() = organizer_id) OR
        (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
        ((beyblade.get_user_role(auth.uid()) = 'country_admin'::text) AND (country_id = (
            SELECT profiles.country_id FROM beyblade.profiles 
            WHERE profiles.id = auth.uid()
        )))
    );
