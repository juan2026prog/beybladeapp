-- Migration: Allow organizers to manage seasons
DROP POLICY IF EXISTS "Admins can manage seasons" ON beyblade.seasons;
DROP POLICY IF EXISTS "Admins and organizers can manage seasons" ON beyblade.seasons;

CREATE POLICY "Admins and organizers can manage seasons" ON beyblade.seasons FOR ALL USING (
    (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'country_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'organizer'::text)
);
