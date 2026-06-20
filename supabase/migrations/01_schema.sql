-- MIGRATION 01: SCHEMA AND TABLES FOR BEYBLADE ISOLATED INFRASTRUCTURE
-- This migration runs inside the Supabase SQL Editor and isolates everything in the "beyblade" schema.

-- 1. Create Schema and Grant Permissions
CREATE SCHEMA IF NOT EXISTS beyblade;

GRANT USAGE ON SCHEMA beyblade TO anon, authenticated, service_role;

-- 2. Profiles (Linked to auth.users in public/auth schemas)
CREATE TABLE IF NOT EXISTS beyblade.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'country_admin', 'organizer', 'judge', 'store', 'player', 'Visitante')) DEFAULT 'Visitante',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Countries
CREATE TABLE IF NOT EXISTS beyblade.countries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Departments
CREATE TABLE IF NOT EXISTS beyblade.departments (
    id SERIAL PRIMARY KEY,
    country_id TEXT NOT NULL REFERENCES beyblade.countries(id) ON DELETE CASCADE,
    name TEXT NOT NULL UNIQUE
);

-- Localities
CREATE TABLE IF NOT EXISTS beyblade.localities (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES beyblade.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT FALSE
);

-- Players (Profiles with competitive attributes)
CREATE TABLE IF NOT EXISTS beyblade.players (
    id UUID PRIMARY KEY REFERENCES beyblade.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    country_id TEXT NOT NULL REFERENCES beyblade.countries(id),
    department TEXT NOT NULL,
    locality TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    tutor_name TEXT,
    tutor_phone TEXT,
    league_id TEXT NOT NULL CHECK (league_id IN ('Junior', 'Open')),
    qr_code_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizers
CREATE TABLE IF NOT EXISTS beyblade.organizers (
    id UUID PRIMARY KEY REFERENCES beyblade.profiles(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('Organizador Local', 'Organizador Regional', 'Organizador Nacional')) DEFAULT 'Organizador Local',
    status TEXT NOT NULL CHECK (status IN ('Pendiente', 'Aprobado', 'Suspendido', 'Rechazado')) DEFAULT 'Pendiente',
    locality_id INTEGER REFERENCES beyblade.localities(id),
    store_affiliation TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Judges
CREATE TABLE IF NOT EXISTS beyblade.judges (
    id UUID PRIMARY KEY REFERENCES beyblade.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Pendiente', 'Aprobado', 'Suspendido', 'Rechazado')) DEFAULT 'Pendiente',
    locality_id INTEGER REFERENCES beyblade.localities(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certified Stores
CREATE TABLE IF NOT EXISTS beyblade.stores (
    id UUID PRIMARY KEY REFERENCES beyblade.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    country_id TEXT NOT NULL REFERENCES beyblade.countries(id),
    department TEXT NOT NULL,
    locality TEXT NOT NULL,
    address TEXT NOT NULL,
    hours TEXT NOT NULL,
    phone TEXT,
    web_url TEXT,
    instagram TEXT,
    certification_status TEXT NOT NULL CHECK (certification_status IN ('Pendiente', 'Aprobado', 'Suspendido', 'Rechazado')) DEFAULT 'Pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catalog Products
CREATE TABLE IF NOT EXISTS beyblade.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    line TEXT NOT NULL DEFAULT 'Beyblade X',
    image_url TEXT,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('starter', 'booster', 'stadium', 'launcher', 'accesorio')),
    release_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('disponible', 'proximo lanzamiento', 'agotado')) DEFAULT 'disponible'
);

-- Store Stock Levels
CREATE TABLE IF NOT EXISTS beyblade.store_stock (
    id SERIAL PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES beyblade.stores(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES beyblade.products(id) ON DELETE CASCADE,
    stock_status TEXT NOT NULL CHECK (stock_status IN ('Disponible', 'Poco stock', 'Agotado', 'Proximamente')) DEFAULT 'Disponible',
    UNIQUE (store_id, product_id)
);

-- Tournaments
CREATE TABLE IF NOT EXISTS beyblade.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    league_id TEXT NOT NULL CHECK (league_id IN ('Junior', 'Open', 'Ambas')),
    country_id TEXT NOT NULL REFERENCES beyblade.countries(id),
    department TEXT NOT NULL,
    locality TEXT NOT NULL,
    address TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    slots_total INTEGER NOT NULL DEFAULT 32,
    slots_available INTEGER NOT NULL DEFAULT 32,
    format TEXT NOT NULL CHECK (format IN ('Eliminación Directa', 'Suizo', 'Round Robin')),
    judge_id UUID REFERENCES beyblade.profiles(id),
    organizer_id UUID NOT NULL REFERENCES beyblade.organizers(id),
    description TEXT,
    banner_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('borrador', 'publicado', 'en curso', 'finalizado')) DEFAULT 'borrador',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrations
CREATE TABLE IF NOT EXISTS beyblade.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES beyblade.tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES beyblade.players(id) ON DELETE CASCADE,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tournament_id, player_id)
);

-- Results
CREATE TABLE IF NOT EXISTS beyblade.tournament_results (
    id SERIAL PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES beyblade.tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES beyblade.players(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position > 0),
    points_awarded INTEGER NOT NULL,
    validated_by_distributor BOOLEAN NOT NULL DEFAULT FALSE,
    validated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (tournament_id, player_id)
);

-- Rankings
CREATE TABLE IF NOT EXISTS beyblade.rankings (
    id SERIAL PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES beyblade.players(id) ON DELETE CASCADE,
    league_id TEXT NOT NULL CHECK (league_id IN ('Junior', 'Open')),
    country_id TEXT NOT NULL REFERENCES beyblade.countries(id),
    locality TEXT NOT NULL,
    total_points INTEGER NOT NULL DEFAULT 0,
    tournaments_played INTEGER NOT NULL DEFAULT 0,
    UNIQUE (player_id)
);

-- Point logs
CREATE TABLE IF NOT EXISTS beyblade.ranking_points_log (
    id SERIAL PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES beyblade.players(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES beyblade.tournaments(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules Config
CREATE TABLE IF NOT EXISTS beyblade.modules_config (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- News Feed
CREATE TABLE IF NOT EXISTS beyblade.news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    country_id TEXT REFERENCES beyblade.countries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academy Tutorials
CREATE TABLE IF NOT EXISTS beyblade.tutorials (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Cómo Jugar', 'Reglas Oficiales', 'Estrategias', 'Guías de Lanzamiento')),
    content TEXT NOT NULL,
    video_url TEXT,
    min_age INTEGER DEFAULT 0
);

-- Teams
CREATE TABLE IF NOT EXISTS beyblade.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    captain_id UUID REFERENCES beyblade.players(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Grant full privileges on all tables & sequences in the isolated schema to anonymous, authenticated, and service role
GRANT ALL ON ALL TABLES IN SCHEMA beyblade TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA beyblade TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA beyblade GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA beyblade GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA beyblade GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
