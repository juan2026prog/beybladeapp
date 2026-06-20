-- MIGRATION 04: SEED DATA FOR BEYBLADE URUGUAY / LATAM PILOT
-- This seeds the default settings, product catalogs, and locations into the "beyblade" schema.

-- Countries
INSERT INTO beyblade.countries (id, name) VALUES 
('UY', 'Uruguay'),
('AR', 'Argentina'),
('BR', 'Brasil')
ON CONFLICT (id) DO NOTHING;

-- Departments for Uruguay
INSERT INTO beyblade.departments (country_id, name) VALUES 
('UY', 'Montevideo'),
('UY', 'Maldonado'),
('UY', 'Canelones')
ON CONFLICT DO NOTHING;

-- Localities
INSERT INTO beyblade.localities (department_id, name, active) VALUES 
((SELECT id FROM beyblade.departments WHERE name = 'Montevideo' LIMIT 1), 'Montevideo', TRUE),
((SELECT id FROM beyblade.departments WHERE name = 'Maldonado' LIMIT 1), 'Maldonado', FALSE),
((SELECT id FROM beyblade.departments WHERE name = 'Canelones' LIMIT 1), 'Las Piedras', FALSE)
ON CONFLICT DO NOTHING;

-- Modules Config
INSERT INTO beyblade.modules_config (id, name, active) VALUES 
('junior_league', 'Liga Junior', TRUE),
('open_league', 'Liga Open', TRUE),
('teams', 'Equipos', FALSE), -- Disabled by default
('stores', 'Tiendas Certificadas', TRUE),
('stock_control', 'Control de Stock', TRUE),
('organizers', 'Organizadores Certificados', TRUE),
('judges', 'Jueces Certificados', TRUE),
('rankings_national', 'Ranking Nacional', TRUE),
('rankings_latam', 'Ranking LATAM', TRUE),
('streaming', 'Streaming / Eventos en Vivo', TRUE),
('tutorials', 'Academia Beyblade', TRUE),
('products', 'Catálogo de Productos', TRUE),
('news', 'Noticias y Lanzamientos', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Catalog Products
INSERT INTO beyblade.products (id, name, line, description, type, release_date, status) VALUES 
('BX-01', 'Sword Dran 3-60F', 'Beyblade X', 'Starter pack con lanzador. Tipo Ataque. Diseño de aspas de espada metálica.', 'starter', '2025-06-01', 'disponible'),
('BX-02', 'Scythe Hell 4-60T', 'Beyblade X', 'Booster pack (sin lanzador). Tipo Balance. Ideal para contrarrestar ataques directos.', 'booster', '2025-06-01', 'disponible'),
('BX-03', 'Wizard Arrow 4-80B', 'Beyblade X', 'Starter pack con lanzador. Tipo Resistencia. Excelente inercia rotacional.', 'starter', '2025-06-15', 'disponible'),
('BX-04', 'Knight Shield 3-80N', 'Beyblade X', 'Booster pack. Tipo Defensa. Aspas amortiguadoras que desvían impactos.', 'booster', '2025-06-15', 'disponible'),
('BX-10', 'Xtreme Battle Stadium', 'Beyblade X', 'Estadio oficial con la riel Xtreme Line integrada para aceleraciones mecánicas.', 'stadium', '2025-05-20', 'disponible'),
('BX-11', 'String Launcher Black', 'Beyblade X', 'Lanzador de cuerda oficial que provee un giro súper veloz.', 'launcher', '2025-05-20', 'disponible')
ON CONFLICT (id) DO NOTHING;

-- Tutorials
INSERT INTO beyblade.tutorials (title, category, content, video_url, min_age) VALUES
('Conceptos Básicos: Cómo Armar tu Beyblade X', 'Cómo Jugar', 'Aprende a ensamblar tu Blade, Ratchet y Bit. Asegúrate de escuchar el clic metálico para garantizar que esté bien ajustado para la Xtreme Line.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 6),
('El Arte del Lanzamiento: Speed Launch & Angle Launch', 'Guías de Lanzamiento', 'Mantén el lanzador paralelo al estadio. Para un lanzamiento plano, tira con fuerza constante. Para un lanzamiento inclinado, angula 15 grados para iniciar un patrón de flores en el estadio.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 6),
('Reglamento Competitivo Oficial Beyblade X', 'Reglas Oficiales', '1. Puntos: Xtreme Finish (3 pts), Burst Finish (2 pts), Over Finish (2 pts), Spin Finish (1 pt). El primer jugador en llegar a 4 puntos gana el match.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 8),
('Estrategias de Combate y Selección de Bits', 'Estrategias', 'El bit Flat es óptimo para movimientos agresivos sobre el riel. El bit Ball maximiza el tiempo de giro pasivo. Combina el Blade según tu oponente.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 10)
ON CONFLICT DO NOTHING;

-- News
INSERT INTO beyblade.news (title, content, image_url, country_id) VALUES
('¡Beyblade X llega oficialmente a Uruguay!', 'Hasbro Uruguay anuncia el lanzamiento oficial de la nueva generación Beyblade X. Los estadios Xtreme y las primeras líneas de Starters ya están disponibles en tiendas certificadas.', NULL, 'UY'),
('Primer Torneo Nacional Clasificatorio en Montevideo', 'Prepárate para competir por el trono oficial. El torneo se llevará a cabo en Montevideo. Inscripciones abiertas para Liga Junior y Liga Open.', NULL, 'UY'),
('Tutoriales Exclusivos de la Academia Beyblade', 'Visita nuestra sección de Academia para aprender técnicas avanzadas de lanzamiento y convertirte en un Campeón LATAM.', NULL, NULL)
ON CONFLICT DO NOTHING;
