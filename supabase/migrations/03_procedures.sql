-- MIGRATION 03: DATABASE PROCEDURES, RPC, AND TRIGGERS FOR BEYBLADE SCHEMA
-- All security-definer procedures must use SET search_path = '' and fully qualified names.

-- 1. RPC for Atomic Tournament Registration with concurrency locks
CREATE OR REPLACE FUNCTION beyblade.register_player_to_tournament(
  t_id UUID,
  p_id UUID
) RETURNS VOID AS $$
DECLARE
  v_slots_available INTEGER;
  v_already_registered BOOLEAN;
  v_status TEXT;
BEGIN
  -- 1. Check if already registered to avoid duplicates
  SELECT EXISTS (
    SELECT 1 
    FROM beyblade.tournament_registrations 
    WHERE tournament_id = t_id AND player_id = p_id
  ) INTO v_already_registered;

  IF v_already_registered THEN
    RAISE EXCEPTION 'Jugador ya está inscripto en este torneo.';
  END IF;

  -- 2. Lock the tournament row for update to avoid race conditions and fetch status
  SELECT slots_available, status INTO v_slots_available, v_status
  FROM beyblade.tournaments
  WHERE id = t_id 
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Torneo no encontrado.';
  END IF;

  IF v_status <> 'publicado' THEN
    RAISE EXCEPTION 'Inscripción no permitida. El torneo no está en estado publicado (Estado actual: %)', v_status;
  END IF;

  IF v_slots_available <= 0 THEN
    RAISE EXCEPTION 'Cupos agotados para este torneo.';
  END IF;

  -- 3. Insert registration record
  INSERT INTO beyblade.tournament_registrations (tournament_id, player_id)
  VALUES (t_id, p_id);

  -- 4. Decrement available slots
  UPDATE beyblade.tournaments
  SET slots_available = slots_available - 1
  WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant execution to public roles
GRANT EXECUTE ON FUNCTION beyblade.register_player_to_tournament(UUID, UUID) TO anon, authenticated, service_role;


-- 2. Trigger for Automatic Leaderboard and Points Calculation upon validation
CREATE OR REPLACE FUNCTION beyblade.update_rankings_on_validation()
RETURNS TRIGGER AS $$
DECLARE
  v_league TEXT;
  v_country TEXT;
  v_locality TEXT;
  v_player_name TEXT;
BEGIN
  -- Execute only if validated_by_distributor changes from FALSE to TRUE
  IF NEW.validated_by_distributor = TRUE AND OLD.validated_by_distributor = FALSE THEN
    
    -- Retrieve player attributes
    SELECT first_name || ' ' || last_name, league_id, country_id, locality 
    INTO v_player_name, v_league, v_country, v_locality
    FROM beyblade.players
    WHERE id = NEW.player_id;

    IF v_player_name IS NULL THEN
      RETURN NEW; -- Player details not found
    END IF;

    -- Upsert ranking record
    INSERT INTO beyblade.rankings (player_id, league_id, country_id, locality, total_points, tournaments_played)
    VALUES (NEW.player_id, v_league, v_country, v_locality, NEW.points_awarded, 1)
    ON CONFLICT (player_id) 
    DO UPDATE SET 
      total_points = beyblade.rankings.total_points + EXCLUDED.total_points,
      tournaments_played = beyblade.rankings.tournaments_played + 1;

    -- Insert log entry
    INSERT INTO beyblade.ranking_points_log (player_id, tournament_id, points, reason)
    VALUES (NEW.player_id, NEW.tournament_id, NEW.points_awarded, 'Puntos sumados por validación de resultados de torneo');
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Bind trigger to results table
CREATE OR REPLACE TRIGGER trg_validate_tournament_results
AFTER UPDATE ON beyblade.tournament_results
FOR EACH ROW
EXECUTE FUNCTION beyblade.update_rankings_on_validation();


-- 3. Auth trigger syncing auth.users with beyblade.profiles
CREATE OR REPLACE FUNCTION beyblade.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO beyblade.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'Visitante'); -- Default role on sign up
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Bind trigger to auth.users (runs as postgres superuser)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION beyblade.handle_new_user();
