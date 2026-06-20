-- MIGRATION 02: ROW LEVEL SECURITY (RLS) POLICIES FOR BEYBLADE SCHEMA
-- This migration secures all tables and restricts writes based on profiles roles.

-- 1. Helper function to check roles securely
CREATE OR REPLACE FUNCTION beyblade.get_user_role(u_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role 
  FROM beyblade.profiles 
  WHERE id = u_id;
  RETURN COALESCE(v_role, 'Visitante');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant execution of function to public/auth users
GRANT EXECUTE ON FUNCTION beyblade.get_user_role(UUID) TO anon, authenticated, service_role;

-- 2. Enable RLS on all tables
ALTER TABLE beyblade.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.store_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.ranking_points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyblade.localities ENABLE ROW LEVEL SECURITY;

-- 3. Define Policies

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON beyblade.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON beyblade.profiles FOR UPDATE USING (auth.uid() = id);

-- Players Policies
CREATE POLICY "Players are viewable by everyone" ON beyblade.players FOR SELECT USING (true);
CREATE POLICY "Players can insert their own details" ON beyblade.players FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Players can update their own details" ON beyblade.players FOR UPDATE USING (auth.uid() = id);

-- Organizers Policies
CREATE POLICY "Organizers viewable by everyone" ON beyblade.organizers FOR SELECT USING (true);
CREATE POLICY "Users can insert their own organizer application" ON beyblade.organizers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Only country admin or super admin can approve/modify organizers" ON beyblade.organizers 
    FOR UPDATE USING (beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin'));

-- Judges Policies
CREATE POLICY "Judges viewable by everyone" ON beyblade.judges FOR SELECT USING (true);
CREATE POLICY "Users can insert their own judge application" ON beyblade.judges FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Only country admin or super admin can approve/modify judges" ON beyblade.judges 
    FOR UPDATE USING (beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin'));

-- Stores Policies
CREATE POLICY "Stores viewable by everyone" ON beyblade.stores FOR SELECT USING (true);
CREATE POLICY "Users can insert their own store request" ON beyblade.stores FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can edit their own store details" ON beyblade.stores FOR UPDATE USING (
    auth.uid() = id OR 
    beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin')
);

-- Store Stock Policies
CREATE POLICY "Stock viewable by everyone" ON beyblade.store_stock FOR SELECT USING (true);
CREATE POLICY "Stores can insert their stock items" ON beyblade.store_stock FOR INSERT WITH CHECK (
    auth.uid() = store_id AND 
    EXISTS (SELECT 1 FROM beyblade.stores WHERE id = auth.uid() AND certification_status = 'Aprobado')
);
CREATE POLICY "Certified stores can update their own stock" ON beyblade.store_stock FOR UPDATE USING (
    auth.uid() = store_id AND 
    EXISTS (SELECT 1 FROM beyblade.stores WHERE id = auth.uid() AND certification_status = 'Aprobado')
);

-- Tournaments Policies
CREATE POLICY "Tournaments viewable by everyone" ON beyblade.tournaments FOR SELECT USING (true);
CREATE POLICY "Only approved organizers can insert tournaments" ON beyblade.tournaments FOR INSERT WITH CHECK (
    beyblade.get_user_role(auth.uid()) = 'organizer' AND
    EXISTS (SELECT 1 FROM beyblade.organizers WHERE id = auth.uid() AND status = 'Aprobado')
);
CREATE POLICY "Only organizers can update their own tournaments" ON beyblade.tournaments FOR UPDATE USING (
    auth.uid() = organizer_id OR 
    beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin')
);

-- Tournament Registrations
CREATE POLICY "Registrations viewable by everyone" ON beyblade.tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Players can insert registrations" ON beyblade.tournament_registrations FOR INSERT WITH CHECK (
    auth.uid() = player_id
);
CREATE POLICY "Organizers or admins can manage registrations" ON beyblade.tournament_registrations FOR ALL USING (
    beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin', 'organizer')
);

-- Tournament Results
CREATE POLICY "Results viewable by everyone" ON beyblade.tournament_results FOR SELECT USING (true);
CREATE POLICY "Judges or organizers can insert results" ON beyblade.tournament_results FOR INSERT WITH CHECK (
    beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin', 'organizer', 'judge')
);
CREATE POLICY "Only country admins can validate results" ON beyblade.tournament_results FOR UPDATE USING (
    beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin')
);

-- Rankings & Logs Policies
CREATE POLICY "Rankings viewable by everyone" ON beyblade.rankings FOR SELECT USING (true);
CREATE POLICY "Ranking logs viewable by everyone" ON beyblade.ranking_points_log FOR SELECT USING (true);

-- Products, News, Tutorials Admin Policies
CREATE POLICY "Products viewable by everyone" ON beyblade.products FOR SELECT USING (true);
CREATE POLICY "Products manageable by admin" ON beyblade.products FOR ALL USING (
    beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin')
);

CREATE POLICY "News viewable by everyone" ON beyblade.news FOR SELECT USING (true);
CREATE POLICY "News manageable by admin" ON beyblade.news FOR ALL USING (
    beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin')
);

CREATE POLICY "Tutorials viewable by everyone" ON beyblade.tutorials FOR SELECT USING (true);
CREATE POLICY "Tutorials manageable by admin" ON beyblade.tutorials FOR ALL USING (
    beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin')
);

CREATE POLICY "Countries viewable by everyone" ON beyblade.countries FOR SELECT USING (true);
CREATE POLICY "Departments viewable by everyone" ON beyblade.departments FOR SELECT USING (true);
CREATE POLICY "Localities viewable by everyone" ON beyblade.localities FOR SELECT USING (true);
