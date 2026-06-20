-- SQL Database Schema for Beyblade LATAM / Uruguay Oficial
-- This schema represents the Supabase infrastructure ready to be executed in the Supabase SQL Editor.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Distribuidor País', 'Organizador', 'Juez', 'Tienda', 'Jugador', 'Visitante')) DEFAULT 'Jugador',
    email TEXT
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Countries
CREATE TABLE IF NOT EXISTS public.countries (
    id TEXT PRIMARY KEY, -- e.g. 'UY', 'AR', 'BR'
    name TEXT NOT NULL UNIQUE
);

-- 3. Departments / Provinces
CREATE TABLE IF NOT EXISTS public.departments (
    id SERIAL PRIMARY KEY,
    country_id TEXT NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE(country_id, name)
);

-- 4. Localities
CREATE TABLE IF NOT EXISTS public.localities (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT FALSE, -- Activated automatically when there's an approved organizer & 1+ event
    UNIQUE(department_id, name)
);

-- 5. Players
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    country_id TEXT NOT NULL REFERENCES public.countries(id),
    department TEXT NOT NULL,
    locality TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    tutor_name TEXT,
    tutor_phone TEXT,
    league_id TEXT NOT NULL CHECK (league_id IN ('Junior', 'Open')),
    qr_code_token TEXT NOT NULL UNIQUE DEFAULT md5(random()::text),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 6. Organizers
CREATE TABLE IF NOT EXISTS public.organizers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('Organizador Local', 'Organizador Regional', 'Organizador Nacional')) DEFAULT 'Organizador Local',
    status TEXT NOT NULL CHECK (status IN ('Pendiente', 'Aprobado', 'Suspendido', 'Rechazado')) DEFAULT 'Pendiente',
    locality_id INTEGER REFERENCES public.localities(id),
    store_affiliation TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

-- 7. Judges
CREATE TABLE IF NOT EXISTS public.judges (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Pendiente', 'Aprobado', 'Suspendido', 'Rechazado')) DEFAULT 'Pendiente',
    locality_id INTEGER REFERENCES public.localities(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;

-- 8. Stores
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    country_id TEXT NOT NULL REFERENCES public.countries(id),
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

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 9. Products
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    line TEXT NOT NULL DEFAULT 'Beyblade X',
    image_url TEXT,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('starter', 'booster', 'stadium', 'launcher', 'accesorio')),
    release_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('disponible', 'proximo lanzamiento', 'agotado')) DEFAULT 'disponible'
);

-- 10. Store Stock
CREATE TABLE IF NOT EXISTS public.store_stock (
    id SERIAL PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    stock_status TEXT NOT NULL CHECK (stock_status IN ('Disponible', 'Poco stock', 'Agotado', 'Proximamente')) DEFAULT 'Disponible',
    UNIQUE (store_id, product_id)
);

ALTER TABLE public.store_stock ENABLE ROW LEVEL SECURITY;

-- 11. Tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    league_id TEXT NOT NULL CHECK (league_id IN ('Junior', 'Open', 'Ambas')),
    country_id TEXT NOT NULL REFERENCES public.countries(id),
    department TEXT NOT NULL,
    locality TEXT NOT NULL,
    address TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    slots_total INTEGER NOT NULL DEFAULT 32,
    slots_available INTEGER NOT NULL DEFAULT 32,
    format TEXT NOT NULL CHECK (format IN ('Eliminación Directa', 'Suizo', 'Round Robin')),
    judge_id UUID REFERENCES public.profiles(id),
    organizer_id UUID NOT NULL REFERENCES public.organizers(id),
    description TEXT,
    banner_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('borrador', 'publicado', 'en curso', 'finalizado')) DEFAULT 'borrador',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- 12. Tournament Registrations
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tournament_id, player_id)
);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- 13. Tournament Results
CREATE TABLE IF NOT EXISTS public.tournament_results (
    id SERIAL PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position > 0),
    points_awarded INTEGER NOT NULL,
    validated_by_distributor BOOLEAN NOT NULL DEFAULT FALSE,
    validated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (tournament_id, player_id)
);

ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- 14. Rankings
CREATE TABLE IF NOT EXISTS public.rankings (
    id SERIAL PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    league_id TEXT NOT NULL CHECK (league_id IN ('Junior', 'Open')),
    country_id TEXT NOT NULL REFERENCES public.countries(id),
    locality TEXT NOT NULL,
    total_points INTEGER NOT NULL DEFAULT 0,
    tournaments_played INTEGER NOT NULL DEFAULT 0,
    UNIQUE (player_id)
);

ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

-- 15. Ranking Points Log
CREATE TABLE IF NOT EXISTS public.ranking_points_log (
    id SERIAL PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ranking_points_log ENABLE ROW LEVEL SECURITY;

-- 16. Modules Config (Hasbro admin control)
CREATE TABLE IF NOT EXISTS public.modules_config (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 17. News and Launches
CREATE TABLE IF NOT EXISTS public.news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    country_id TEXT REFERENCES public.countries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Tutorials / Academy
CREATE TABLE IF NOT EXISTS public.tutorials (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Cómo Jugar', 'Reglas Oficiales', 'Estrategias', 'Guías de Lanzamiento')),
    content TEXT NOT NULL,
    video_url TEXT,
    min_age INTEGER DEFAULT 0
);

-- 19. Teams
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    captain_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Players Policies
CREATE POLICY "Players are viewable by everyone" ON public.players FOR SELECT USING (true);
CREATE POLICY "Players can update their own profile" ON public.players FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can create players" ON public.players FOR INSERT WITH CHECK (true);

-- Tournaments Policies
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Organizers can create and edit their own tournaments" ON public.tournaments 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('Super Admin', 'Distribuidor País', 'Organizador')
        )
    );

-- Tournament Registrations
CREATE POLICY "Registrations viewable by everyone" ON public.tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Players can register themselves" ON public.tournament_registrations 
    FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Organizers can manage registrations" ON public.tournament_registrations 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('Super Admin', 'Distribuidor País', 'Organizador')
        )
    );

-- Results Policies
CREATE POLICY "Results are viewable by everyone" ON public.tournament_results FOR SELECT USING (true);
CREATE POLICY "Judges and Organizers can write results" ON public.tournament_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('Super Admin', 'Distribuidor País', 'Organizador', 'Juez')
        )
    );

-- Rankings Policies
CREATE POLICY "Rankings are viewable by everyone" ON public.rankings FOR SELECT USING (true);


-- =========================================================================
-- pilot SEED DATA FOR URUGUAY
-- =========================================================================

-- Countries
INSERT INTO public.countries (id, name) VALUES 
('UY', 'Uruguay'),
('AR', 'Argentina'),
('BR', 'Brasil')
ON CONFLICT (id) DO NOTHING;

-- Departments for Uruguay
INSERT INTO public.departments (country_id, name) VALUES 
('UY', 'Montevideo'),
('UY', 'Maldonado'),
('UY', 'Canelones')
ON CONFLICT DO NOTHING;

-- Localities
INSERT INTO public.localities (department_id, name, active) VALUES 
((SELECT id FROM public.departments WHERE name = 'Montevideo' LIMIT 1), 'Montevideo', true),
((SELECT id FROM public.departments WHERE name = 'Maldonado' LIMIT 1), 'Maldonado', false),
((SELECT id FROM public.departments WHERE name = 'Canelones' LIMIT 1), 'Las Piedras', false)
ON CONFLICT DO NOTHING;

-- Modules Config
INSERT INTO public.modules_config (id, name, active) VALUES 
('junior_league', 'Liga Junior', true),
('open_league', 'Liga Open', true),
('teams', 'Equipos', false), -- Disabled by default
('stores', 'Tiendas Certificadas', true),
('stock_control', 'Control de Stock', true),
('organizers', 'Organizadores Certificados', true),
('judges', 'Jueces Certificados', true),
('rankings_national', 'Ranking Nacional', true),
('rankings_latam', 'Ranking LATAM', true),
('streaming', 'Streaming / Eventos en Vivo', true),
('tutorials', 'Academia Beyblade', true),
('products', 'Catálogo de Productos', true),
('news', 'Noticias y Lanzamientos', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Official Products
INSERT INTO public.products (id, name, line, description, type, release_date, status) VALUES 
('BX-01', 'Sword Dran 3-60F', 'Beyblade X', 'Starter pack con lanzador. Tipo Ataque. Diseño de aspas de espada metálica.', 'starter', '2025-06-01', 'disponible'),
('BX-02', 'Scythe Hell 4-60T', 'Beyblade X', 'Booster pack (sin lanzador). Tipo Balance. Ideal para contrarrestar ataques directos.', 'booster', '2025-06-01', 'disponible'),
('BX-03', 'Wizard Arrow 4-80B', 'Beyblade X', 'Starter pack con lanzador. Tipo Resistencia. Excelente inercia rotacional.', 'starter', '2025-06-15', 'disponible'),
('BX-04', 'Knight Shield 3-80N', 'Beyblade X', 'Booster pack. Tipo Defensa. Aspas amortiguadoras que desvían impactos.', 'booster', '2025-06-15', 'disponible'),
('BX-10', 'Xtreme Battle Stadium', 'Beyblade X', 'Estadio oficial con la riel Xtreme Line integrada para aceleraciones mecánicas.', 'stadium', '2025-05-20', 'disponible'),
('BX-11', 'String Launcher Black', 'Beyblade X', 'Lanzador de cuerda oficial que provee un giro súper veloz.', 'launcher', '2025-05-20', 'disponible')
ON CONFLICT (id) DO NOTHING;

-- Official Tutorials
INSERT INTO public.tutorials (title, category, content, video_url, min_age) VALUES
('Conceptos Básicos: Cómo Armar tu Beyblade X', 'Cómo Jugar', 'Aprende a ensamblar tu Blade, Ratchet y Bit. Asegúrate de escuchar el clic metálico para garantizar que esté bien ajustado para la Xtreme Line.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 6),
('El Arte del Lanzamiento: Speed Launch & Angle Launch', 'Guías de Lanzamiento', 'Mantén el lanzador paralelo al estadio. Para un lanzamiento plano, tira con fuerza constante. Para un lanzamiento inclinado, angula 15 grados para iniciar un patrón de flores en el estadio.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 6),
('Reglamento Competitivo Oficial Beyblade X', 'Reglas Oficiales', '1. Puntos: Xtreme Finish (3 pts), Burst Finish (2 pts), Over Finish (2 pts), Spin Finish (1 pt). El primer jugador en llegar a 4 puntos gana el match.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 8),
('Estrategias de Combate y Selección de Bits', 'Estrategias', 'El bit Flat es óptimo para movimientos agresivos sobre el riel. El bit Ball maximiza el tiempo de giro pasivo. Combina el Blade según tu oponente.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 10);

-- Official News
INSERT INTO public.news (title, content, image_url, country_id) VALUES
('¡Beyblade X llega oficialmente a Uruguay!', 'Hasbro Uruguay anuncia el lanzamiento oficial de la nueva generación Beyblade X. Los estadios Xtreme y las primeras líneas de Starters ya están disponibles en tiendas certificadas.', NULL, 'UY'),
('Primer Torneo Nacional Clasificatorio en Montevideo', 'Prepárate para competir por el trono oficial. El torneo se llevará a cabo en Montevideo. Inscripciones abiertas para Liga Junior y Liga Open.', NULL, 'UY'),
('Tutoriales Exclusivos de la Academia Beyblade', 'Visita nuestra sección de Academia para aprender técnicas avanzadas de lanzamiento y convertirte en un Campeón LATAM.', NULL, NULL);
