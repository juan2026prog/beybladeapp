-- MIGRATION 07: NOTIFICATIONS AND PREFERENCES PILOT SYSTEM
-- Isolates all structures under the "beyblade" schema.

-- 1. Alter notifications type constraint & add url column
ALTER TABLE beyblade.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE beyblade.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN ('torneo', 'inscripcion', 'resultados', 'puntos', 'tiendas', 'lanzamiento', 'new_tournament', 'new_journey', 'points_awarded')
);
ALTER TABLE beyblade.notifications ADD COLUMN IF NOT EXISTS url TEXT;


-- 2. Create notification preferences table
CREATE TABLE IF NOT EXISTS beyblade.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES beyblade.profiles(id) ON DELETE CASCADE,
    new_tournament_in_app BOOLEAN NOT NULL DEFAULT true,
    new_tournament_push BOOLEAN NOT NULL DEFAULT false,
    new_tournament_whatsapp BOOLEAN NOT NULL DEFAULT false,
    new_journey_in_app BOOLEAN NOT NULL DEFAULT true,
    new_journey_push BOOLEAN NOT NULL DEFAULT false,
    new_journey_whatsapp BOOLEAN NOT NULL DEFAULT false,
    points_awarded_in_app BOOLEAN NOT NULL DEFAULT true,
    points_awarded_push BOOLEAN NOT NULL DEFAULT false,
    points_awarded_whatsapp BOOLEAN NOT NULL DEFAULT false,
    locality_only BOOLEAN NOT NULL DEFAULT true,
    country_id TEXT REFERENCES beyblade.countries(id) ON DELETE SET NULL,
    locality_id INTEGER REFERENCES beyblade.localities(id) ON DELETE SET NULL,
    whatsapp_phone TEXT,
    whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false,
    whatsapp_verified BOOLEAN NOT NULL DEFAULT false,
    push_enabled BOOLEAN NOT NULL DEFAULT false,
    push_subscription JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and Grant Privileges
ALTER TABLE beyblade.notification_preferences ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE beyblade.notification_preferences TO anon, authenticated, service_role;

-- 3. Create Journeys Table
CREATE TABLE IF NOT EXISTS beyblade.journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    country_id TEXT REFERENCES beyblade.countries(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES beyblade.departments(id) ON DELETE SET NULL,
    locality_id INTEGER REFERENCES beyblade.localities(id) ON DELETE SET NULL,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'publicado',
    created_by UUID REFERENCES beyblade.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS and Grant Privileges
ALTER TABLE beyblade.journeys ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE beyblade.journeys TO anon, authenticated, service_role;

-- 4. Create Notification Delivery Logs Table
CREATE TABLE IF NOT EXISTS beyblade.notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES beyblade.profiles(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES beyblade.notifications(id) ON DELETE CASCADE,
    channel TEXT CHECK (channel IN ('in_app', 'push', 'whatsapp')),
    type TEXT CHECK (type IN ('new_tournament', 'new_journey', 'points_awarded')),
    status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
    provider TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and Grant Privileges
ALTER TABLE beyblade.notification_delivery_logs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE beyblade.notification_delivery_logs TO anon, authenticated, service_role;

-- 5. RLS Policies

-- Preferences policies
CREATE POLICY "Users can view their own preferences" ON beyblade.notification_preferences
    FOR SELECT USING (
      auth.uid() = user_id OR
      beyblade.get_user_role(auth.uid()) = 'super_admin' OR
      (
        beyblade.get_user_role(auth.uid()) = 'country_admin' AND 
        (SELECT p.country_id FROM beyblade.profiles p WHERE p.id = user_id) = (SELECT p2.country_id FROM beyblade.profiles p2 WHERE p2.id = auth.uid())
      )
    );

CREATE POLICY "Users can insert their own preferences" ON beyblade.notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON beyblade.notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Journeys policies
CREATE POLICY "Journeys are viewable by everyone" ON beyblade.journeys
    FOR SELECT USING (true);

CREATE POLICY "Approved organizers can insert journeys" ON beyblade.journeys
    FOR INSERT WITH CHECK (
      beyblade.get_user_role(auth.uid()) = 'organizer' AND
      EXISTS (SELECT 1 FROM beyblade.organizers WHERE id = auth.uid() AND status = 'Aprobado')
    );

CREATE POLICY "Admins or creators can manage journeys" ON beyblade.journeys
    FOR UPDATE USING (
      auth.uid() = created_by OR
      beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin')
    );

-- Delivery logs policies
CREATE POLICY "Users or admins can view delivery logs" ON beyblade.notification_delivery_logs
    FOR SELECT USING (
      auth.uid() = user_id OR
      beyblade.get_user_role(auth.uid()) IN ('super_admin', 'country_admin')
    );

CREATE POLICY "Anyone can insert delivery logs" ON beyblade.notification_delivery_logs
    FOR INSERT WITH CHECK (true);

-- 6. Trigger for profile preferences creation
CREATE OR REPLACE FUNCTION beyblade.handle_new_profile_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO beyblade.notification_preferences (
    user_id,
    new_tournament_in_app, new_tournament_push, new_tournament_whatsapp,
    new_journey_in_app, new_journey_push, new_journey_whatsapp,
    points_awarded_in_app, points_awarded_push, points_awarded_whatsapp,
    locality_only,
    country_id,
    locality_id
  )
  VALUES (
    NEW.id,
    true, false, false,
    true, false, false,
    true, false, false,
    true,
    NEW.country_id,
    null
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS trg_create_profile_preferences ON beyblade.profiles;
CREATE TRIGGER trg_create_profile_preferences
AFTER INSERT ON beyblade.profiles
FOR EACH ROW EXECUTE FUNCTION beyblade.handle_new_profile_preferences();

-- 7. Initialize default preferences for existing profiles
INSERT INTO beyblade.notification_preferences (user_id, country_id)
SELECT id, country_id FROM beyblade.profiles
ON CONFLICT (user_id) DO NOTHING;
