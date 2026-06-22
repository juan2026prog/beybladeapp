-- Migration: 13_organizer_pro_system.sql
-- Inicia la fase Organizador PRO 4.0

-- 1. Agregar configuración de puntos a beyblade.seasons
ALTER TABLE beyblade.seasons ADD COLUMN IF NOT EXISTS points_first integer DEFAULT 5;
ALTER TABLE beyblade.seasons ADD COLUMN IF NOT EXISTS points_second integer DEFAULT 4;
ALTER TABLE beyblade.seasons ADD COLUMN IF NOT EXISTS points_third integer DEFAULT 3;
ALTER TABLE beyblade.seasons ADD COLUMN IF NOT EXISTS points_fourth integer DEFAULT 2;
ALTER TABLE beyblade.seasons ADD COLUMN IF NOT EXISTS points_participation integer DEFAULT 1;

-- 2. Agregar clasificaciones a beyblade.tournaments
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS qualifies_regional boolean DEFAULT false;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS qualifies_nacional boolean DEFAULT false;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS qualifies_latam boolean DEFAULT false;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS qualifies_top_x integer DEFAULT 8;

-- 3. Agregar confirmed_status y check_in_by a beyblade.tournament_registrations
ALTER TABLE beyblade.tournament_registrations ADD COLUMN IF NOT EXISTS confirmed_status text CHECK (confirmed_status IN ('pendiente', 'confirmado', 'rechazado')) DEFAULT 'pendiente';
ALTER TABLE beyblade.tournament_registrations ADD COLUMN IF NOT EXISTS check_in_by uuid REFERENCES beyblade.profiles(id) ON DELETE SET NULL;

-- Actualizar registros existentes para tener 'confirmado' por defecto
UPDATE beyblade.tournament_registrations SET confirmed_status = 'confirmado' WHERE confirmed_status IS NULL;

-- 4. Agregar columna certification a beyblade.judges
ALTER TABLE beyblade.judges ADD COLUMN IF NOT EXISTS certification text DEFAULT 'Básico';

-- 5. Crear tabla de gestión de mesas (tournament_tables)
CREATE TABLE IF NOT EXISTS beyblade.tournament_tables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid NOT NULL REFERENCES beyblade.tournaments(id) ON DELETE CASCADE,
    table_number integer NOT NULL,
    match_id uuid REFERENCES beyblade.bracket_matches(id) ON DELETE SET NULL,
    judge_id uuid REFERENCES beyblade.profiles(id) ON DELETE SET NULL,
    status text NOT NULL CHECK (status IN ('libre', 'en_combate', 'finalizada')) DEFAULT 'libre',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (tournament_id, table_number)
);

-- Habilitar RLS en tournament_tables
ALTER TABLE beyblade.tournament_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tournament tables are viewable by everyone" ON beyblade.tournament_tables;
DROP POLICY IF EXISTS "Admins and organizers can manage tables" ON beyblade.tournament_tables;

CREATE POLICY "Tournament tables are viewable by everyone" ON beyblade.tournament_tables FOR SELECT USING (true);
CREATE POLICY "Admins and organizers can manage tables" ON beyblade.tournament_tables FOR ALL USING (
    (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'country_admin'::text) OR
    (EXISTS (
        SELECT 1 FROM beyblade.tournaments t
        WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    ))
);

-- Grant privileges for tournament_tables
GRANT ALL ON TABLE beyblade.tournament_tables TO anon, authenticated, service_role;

-- 6. Crear tabla de auditoría (audit_logs)
CREATE TABLE IF NOT EXISTS beyblade.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid REFERENCES beyblade.tournaments(id) ON DELETE CASCADE,
    action text NOT NULL,
    details text,
    performed_by uuid REFERENCES beyblade.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en audit_logs
ALTER TABLE beyblade.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs are viewable by everyone" ON beyblade.audit_logs;
DROP POLICY IF EXISTS "Admins and organizers can insert audit logs" ON beyblade.audit_logs;

CREATE POLICY "Audit logs are viewable by everyone" ON beyblade.audit_logs FOR SELECT USING (true);
CREATE POLICY "Admins and organizers can insert audit logs" ON beyblade.audit_logs FOR INSERT WITH CHECK (
    (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'country_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'organizer'::text)
);

-- Grant privileges for audit_logs
GRANT ALL ON TABLE beyblade.audit_logs TO anon, authenticated, service_role;

-- 7. Modificar constraint notifications_type_check para admitir 'mass_announcement'
ALTER TABLE beyblade.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE beyblade.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type = ANY (ARRAY[
    'torneo'::text, 'inscripcion'::text, 'resultados'::text, 'puntos'::text, 'tiendas'::text, 'lanzamiento'::text, 
    'new_tournament'::text, 'new_journey'::text, 'points_awarded'::text,
    'waitlist_promoted'::text, 'attendance_required'::text, 'bye_assigned'::text, 'bracket_published'::text,
    'mass_announcement'::text
  ]));

-- 8. Modificar constraint status de bracket_matches para admitir 'in_progress'
ALTER TABLE beyblade.bracket_matches DROP CONSTRAINT IF EXISTS bracket_matches_status_check;
ALTER TABLE beyblade.bracket_matches ADD CONSTRAINT bracket_matches_status_check CHECK (status IN ('pending', 'in_progress', 'completed'));
