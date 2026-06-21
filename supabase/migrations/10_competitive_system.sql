-- Migration: Create Phase 3.0 Competitive Engine

-- 1. Seasons Table
CREATE TABLE IF NOT EXISTS beyblade.seasons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    country_id text REFERENCES beyblade.countries(id) ON DELETE CASCADE,
    league_type text NOT NULL CHECK (league_type IN ('junior', 'open')),
    start_date date NOT NULL,
    end_date date NOT NULL,
    description text,
    status text NOT NULL CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on Seasons
ALTER TABLE beyblade.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seasons are viewable by everyone" ON beyblade.seasons FOR SELECT USING (true);
CREATE POLICY "Admins can manage seasons" ON beyblade.seasons FOR ALL USING (
    (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'country_admin'::text)
);

-- 2. Alter Tournaments
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES beyblade.seasons(id) ON DELETE SET NULL;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS max_players integer DEFAULT 32;
ALTER TABLE beyblade.tournaments ADD COLUMN IF NOT EXISTS waitlist_enabled boolean DEFAULT true;

UPDATE beyblade.tournaments SET max_players = COALESCE(slots_total, 32) WHERE max_players IS NULL;

-- 3. Brackets Table
CREATE TABLE IF NOT EXISTS beyblade.brackets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid NOT NULL REFERENCES beyblade.tournaments(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
    status text NOT NULL CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE beyblade.brackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brackets are viewable by everyone" ON beyblade.brackets FOR SELECT USING (true);
CREATE POLICY "Admins and organizers can manage brackets" ON beyblade.brackets FOR ALL USING (
    (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'country_admin'::text) OR
    (EXISTS (
        SELECT 1 FROM beyblade.tournaments t
        WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    ))
);

-- 4. Bracket Matches Table
CREATE TABLE IF NOT EXISTS beyblade.bracket_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bracket_id uuid NOT NULL REFERENCES beyblade.brackets(id) ON DELETE CASCADE,
    round_number integer NOT NULL,
    match_number integer NOT NULL,
    player1_id uuid REFERENCES beyblade.players(id) ON DELETE SET NULL,
    player2_id uuid REFERENCES beyblade.players(id) ON DELETE SET NULL,
    winner_id uuid REFERENCES beyblade.players(id) ON DELETE SET NULL,
    player1_score integer DEFAULT 0,
    player2_score integer DEFAULT 0,
    bye_assigned boolean NOT NULL DEFAULT false,
    next_match_id uuid REFERENCES beyblade.bracket_matches(id) ON DELETE SET NULL,
    next_match_player_slot integer CHECK (next_match_player_slot IN (1, 2)),
    status text NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE beyblade.bracket_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bracket matches are viewable by everyone" ON beyblade.bracket_matches FOR SELECT USING (true);
CREATE POLICY "Admins and organizers can manage matches" ON beyblade.bracket_matches FOR ALL USING (
    (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'country_admin'::text) OR
    (EXISTS (
        SELECT 1 FROM beyblade.brackets b
        JOIN beyblade.tournaments t ON b.tournament_id = t.id
        WHERE b.id = bracket_id AND t.organizer_id = auth.uid()
    ))
);

-- 5. BYE Draw Logs Table
CREATE TABLE IF NOT EXISTS beyblade.bye_draw_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid NOT NULL REFERENCES beyblade.tournaments(id) ON DELETE CASCADE,
    player_id uuid NOT NULL REFERENCES beyblade.players(id) ON DELETE CASCADE,
    generated_at timestamp with time zone DEFAULT now(),
    generated_by uuid REFERENCES beyblade.profiles(id) ON DELETE SET NULL,
    seed_used text,
    UNIQUE (tournament_id, player_id)
);

ALTER TABLE beyblade.bye_draw_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bye draw logs are viewable by everyone" ON beyblade.bye_draw_logs FOR SELECT USING (true);
CREATE POLICY "Admins and organizers can manage bye logs" ON beyblade.bye_draw_logs FOR ALL USING (
    (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'country_admin'::text) OR
    (EXISTS (
        SELECT 1 FROM beyblade.tournaments t
        WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    ))
);

-- 6. Waitlist Table
CREATE TABLE IF NOT EXISTS beyblade.waitlist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid NOT NULL REFERENCES beyblade.tournaments(id) ON DELETE CASCADE,
    player_id uuid NOT NULL REFERENCES beyblade.players(id) ON DELETE CASCADE,
    position integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (tournament_id, player_id),
    UNIQUE (tournament_id, position)
);

ALTER TABLE beyblade.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Waitlist viewable by everyone" ON beyblade.waitlist FOR SELECT USING (true);
CREATE POLICY "Players can manage their waitlist positions" ON beyblade.waitlist FOR ALL USING (
    (auth.uid() = player_id) OR
    (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'country_admin'::text) OR
    (EXISTS (
        SELECT 1 FROM beyblade.tournaments t
        WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    ))
);

-- 7. Attendance Confirmations Table
CREATE TABLE IF NOT EXISTS beyblade.attendance_confirmations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid NOT NULL REFERENCES beyblade.tournaments(id) ON DELETE CASCADE,
    player_id uuid NOT NULL REFERENCES beyblade.players(id) ON DELETE CASCADE,
    confirmed boolean, -- NULL: pending, true: confirmed, false: declined
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (tournament_id, player_id)
);

ALTER TABLE beyblade.attendance_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance confirmations viewable by everyone" ON beyblade.attendance_confirmations FOR SELECT USING (true);
CREATE POLICY "Players can confirm their own attendance" ON beyblade.attendance_confirmations FOR ALL USING (
    (auth.uid() = player_id) OR
    (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'country_admin'::text) OR
    (EXISTS (
        SELECT 1 FROM beyblade.tournaments t
        WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    ))
);

-- 8. Player Statistics Table
CREATE TABLE IF NOT EXISTS beyblade.player_statistics (
    player_id uuid PRIMARY KEY REFERENCES beyblade.players(id) ON DELETE CASCADE,
    tournaments_played integer DEFAULT 0,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    podiums_first integer DEFAULT 0,
    podiums_second integer DEFAULT 0,
    podiums_third integer DEFAULT 0,
    podiums_fourth integer DEFAULT 0,
    points_total integer DEFAULT 0,
    win_rate numeric DEFAULT 0.0,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE beyblade.player_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player stats are viewable by everyone" ON beyblade.player_statistics FOR SELECT USING (true);
CREATE POLICY "Admins can manage player stats" ON beyblade.player_statistics FOR ALL USING (
    (beyblade.get_user_role(auth.uid()) = 'super_admin'::text) OR
    (beyblade.get_user_role(auth.uid()) = 'country_admin'::text)
);

-- 9. Trigger and Recalculate Function
CREATE OR REPLACE FUNCTION beyblade.recalculate_player_statistics(p_id uuid)
RETURNS void AS $$
DECLARE
  v_tournaments_played integer;
  v_wins integer;
  v_losses integer;
  v_podiums_first integer;
  v_podiums_second integer;
  v_podiums_third integer;
  v_podiums_fourth integer;
  v_points_total integer;
  v_win_rate numeric;
BEGIN
  -- Count validated tournaments
  SELECT count(*), COALESCE(sum(points_awarded), 0)
  INTO v_tournaments_played, v_points_total
  FROM beyblade.tournament_results
  WHERE player_id = p_id AND validated_by_distributor = true;

  -- Count wins in brackets (where winner_id is player and it wasn't a BYE)
  SELECT count(*)
  INTO v_wins
  FROM beyblade.bracket_matches bm
  JOIN beyblade.brackets b ON bm.bracket_id = b.id
  JOIN beyblade.tournaments t ON b.tournament_id = t.id
  JOIN beyblade.tournament_results tr ON tr.tournament_id = t.id AND tr.player_id = p_id
  WHERE bm.winner_id = p_id 
    AND bm.bye_assigned = false
    AND tr.validated_by_distributor = true;

  -- Count losses in brackets (where player was in match, match is completed, but player didn't win)
  SELECT count(*)
  INTO v_losses
  FROM beyblade.bracket_matches bm
  JOIN beyblade.brackets b ON bm.bracket_id = b.id
  JOIN beyblade.tournaments t ON b.tournament_id = t.id
  JOIN beyblade.tournament_results tr ON tr.tournament_id = t.id AND tr.player_id = p_id
  WHERE (bm.player1_id = p_id OR bm.player2_id = p_id)
    AND bm.winner_id != p_id
    AND bm.winner_id IS NOT NULL
    AND tr.validated_by_distributor = true;

  -- Count podiums
  SELECT 
    COUNT(*) FILTER (WHERE position = 1),
    COUNT(*) FILTER (WHERE position = 2),
    COUNT(*) FILTER (WHERE position = 3),
    COUNT(*) FILTER (WHERE position = 4)
  INTO 
    v_podiums_first,
    v_podiums_second,
    v_podiums_third,
    v_podiums_fourth
  FROM beyblade.tournament_results
  WHERE player_id = p_id AND validated_by_distributor = true;

  -- Calculate win rate
  IF (v_wins + v_losses) > 0 THEN
    v_win_rate := ROUND((v_wins::numeric / (v_wins + v_losses)::numeric) * 100, 2);
  ELSE
    v_win_rate := 0.0;
  END IF;

  -- Upsert player statistics
  INSERT INTO beyblade.player_statistics (
    player_id, tournaments_played, wins, losses, podiums_first, podiums_second, podiums_third, podiums_fourth, points_total, win_rate, updated_at
  )
  VALUES (
    p_id, v_tournaments_played, v_wins, v_losses, v_podiums_first, v_podiums_second, v_podiums_third, v_podiums_fourth, v_points_total, v_win_rate, now()
  )
  ON CONFLICT (player_id)
  DO UPDATE SET
    tournaments_played = EXCLUDED.tournaments_played,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    podiums_first = EXCLUDED.podiums_first,
    podiums_second = EXCLUDED.podiums_second,
    podiums_third = EXCLUDED.podiums_third,
    podiums_fourth = EXCLUDED.podiums_fourth,
    points_total = EXCLUDED.points_total,
    win_rate = EXCLUDED.win_rate,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION beyblade.trg_fn_update_player_statistics()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.validated_by_distributor = true) OR
     (TG_OP = 'UPDATE' AND NEW.validated_by_distributor = true AND OLD.validated_by_distributor = false) THEN
    PERFORM beyblade.recalculate_player_statistics(NEW.player_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_player_statistics ON beyblade.tournament_results;
CREATE TRIGGER trg_update_player_statistics
AFTER INSERT OR UPDATE ON beyblade.tournament_results
FOR EACH ROW EXECUTE FUNCTION beyblade.trg_fn_update_player_statistics();

-- 10. Alter Notification Type Check Constraints
ALTER TABLE beyblade.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE beyblade.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type = ANY (ARRAY[
    'torneo'::text, 'inscripcion'::text, 'resultados'::text, 'puntos'::text, 'tiendas'::text, 'lanzamiento'::text, 
    'new_tournament'::text, 'new_journey'::text, 'points_awarded'::text,
    'waitlist_promoted'::text, 'attendance_required'::text, 'bye_assigned'::text, 'bracket_published'::text
  ]));

ALTER TABLE beyblade.notification_delivery_logs DROP CONSTRAINT IF EXISTS notification_delivery_logs_type_check;
ALTER TABLE beyblade.notification_delivery_logs ADD CONSTRAINT notification_delivery_logs_type_check 
  CHECK (type = ANY (ARRAY[
    'new_tournament'::text, 'new_journey'::text, 'points_awarded'::text,
    'waitlist_promoted'::text, 'attendance_required'::text, 'bye_assigned'::text, 'bracket_published'::text
  ]));

-- 11. Helper RPC for waitlist queue shifts
CREATE OR REPLACE FUNCTION beyblade.shift_waitlist_positions(t_id uuid, from_pos integer)
RETURNS void AS $$
BEGIN
  UPDATE beyblade.waitlist
  SET position = position - 1
  WHERE tournament_id = t_id AND position > from_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
