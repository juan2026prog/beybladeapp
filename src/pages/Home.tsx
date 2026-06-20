import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trophy, MapPin, Sparkles, BookOpen, ChevronRight, Newspaper, 
  Calendar, Award, Users, ShoppingBag, Flag
} from 'lucide-react';
import { DbService } from '../services/dbService';
import type { Tournament, RankingEntry, NewsItem, Product, Journey, Store, Player } from '../services/dbService';

interface ActivityItem {
  id: string;
  type: 'player' | 'tournament' | 'store' | 'journey';
  text: string;
  time: string;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  
  // Real database states
  const [dbTournaments, setDbTournaments] = useState<Tournament[]>([]);
  const [dbRankings, setDbRankings] = useState<RankingEntry[]>([]);
  const [dbNews, setDbNews] = useState<NewsItem[]>([]);
  const [dbJourneys, setDbJourneys] = useState<Journey[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbStores, setDbStores] = useState<Store[]>([]);
  const [dbPlayers, setDbPlayers] = useState<Player[]>([]);
  const [dbLocalities, setDbLocalities] = useState<any[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [tours, ranks, newsItems, journeysList, prods, activeStores, playersList, locs] = await Promise.all([
          DbService.getTournamentsList(),
          DbService.getRankingsList(),
          DbService.getNews(),
          DbService.getJourneys(),
          DbService.getProductsList(),
          DbService.getStoresList(),
          DbService.getPlayersList(),
          DbService.getLocalities(),
        ]);
        
        setDbTournaments(tours);
        setDbRankings(ranks);
        setDbNews(newsItems);
        setDbJourneys(journeysList);
        setDbProducts(prods);
        setDbStores(activeStores);
        setDbPlayers(playersList);
        setDbLocalities(locs);
      } catch (err) {
        console.error('Error fetching home data:', err);
      }
    };
    fetchHomeData();
  }, []);

  // --- MOCK FALLBACKS FOR EMPTY DATABASE SEEDS ---
  const tournaments = useMemo(() => {
    const active = dbTournaments.filter(t => t.status === 'publicado');
    if (active.length > 0) return active.slice(0, 2);
    
    // Fallback Mock Tournaments
    return [
      {
        id: 'mock-t1',
        name: 'Copa Xtreme Montevideo Inicial',
        league_id: 'Open' as const,
        date: '2026-06-25',
        time: '15:00',
        locality: 'Montevideo',
        slots_total: 32,
        slots_available: 18,
        status: 'publicado' as const,
      },
      {
        id: 'mock-t2',
        name: 'Desafío Blader Junior Accel',
        league_id: 'Junior' as const,
        date: '2026-06-28',
        time: '11:00',
        locality: 'Maldonado',
        slots_total: 16,
        slots_available: 6,
        status: 'publicado' as const,
      }
    ];
  }, [dbTournaments]);

  const rankings = useMemo(() => {
    if (dbRankings.length > 0) {
      return [...dbRankings].sort((a, b) => b.total_points - a.total_points).slice(0, 3);
    }
    
    // Fallback Mock Rankings
    return [
      { player_id: 'p-1', player_name: 'Max Steel', total_points: 420, tournaments_played: 5, locality: 'Montevideo', league_id: 'Open' as const, country_id: 'UY' },
      { player_id: 'p-2', player_name: 'Blader K', total_points: 380, tournaments_played: 4, locality: 'Maldonado', league_id: 'Open' as const, country_id: 'UY' },
      { player_id: 'p-3', player_name: 'Gaston X', total_points: 310, tournaments_played: 4, locality: 'Montevideo', league_id: 'Open' as const, country_id: 'UY' }
    ];
  }, [dbRankings]);

  const news = useMemo(() => {
    if (dbNews.length > 0) return dbNews.slice(0, 3);
    
    // Fallback Mock News
    return [
      {
        id: 'news-1',
        title: '¡Lanzamiento Oficial de Beyblade X en Uruguay!',
        content: 'Hasbro oficializa el desembarco del nuevo sistema de aceleración Xtreme Line en tiendas seleccionadas del país. ¡Búscalo hoy mismo!',
        created_at: new Date().toISOString(),
        country_id: 'UY'
      },
      {
        id: 'news-2',
        title: 'Primer Torneo Nacional Clasificatorio',
        content: 'Inscríbete en la Liga Open para participar del primer torneo del año con premios exclusivos y clasificación al campeonato regional.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        country_id: 'UY'
      },
      {
        id: 'news-3',
        title: 'Academia Beyblade X: Guía de Ratchets y Bits',
        content: 'Descubre cómo configurar tu Blade con los mejores combos de Ratchet y Bit para maximizar tu estabilidad y aceleración en el estadio.',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        country_id: 'UY'
      }
    ];
  }, [dbNews]);

  const products = useMemo(() => {
    const beys = dbProducts.filter(p => p.type === 'starter' || p.type === 'booster');
    if (beys.length > 0) return beys.slice(0, 4);
    
    // Fallback Mock Products
    return [
      {
        id: 'BX-01',
        name: 'Sword Dran 3-60F',
        type: 'starter' as const,
        line: 'Beyblade X Starter Pack',
        description: 'Beyblade de ataque rápido que aprovecha el riel del estadio para acelerar violentamente.',
        status: 'disponible' as const,
        combatType: 'Ataque',
        color: 'from-red-500 to-amber-500'
      },
      {
        id: 'BX-02',
        name: 'Hells Scythe 4-60T',
        type: 'starter' as const,
        line: 'Beyblade X Starter Pack',
        description: 'Balance ideal para asimilar impactos y contragolpear con precisión milimétrica.',
        status: 'disponible' as const,
        combatType: 'Equilibrio',
        color: 'from-emerald-500 to-teal-500'
      },
      {
        id: 'BX-03',
        name: 'Wizard Arrow 4-80B',
        type: 'starter' as const,
        line: 'Beyblade X Starter Pack',
        description: 'Diseño de resistencia centrífuga para mantener el giro al centro del estadio.',
        status: 'disponible' as const,
        combatType: 'Resistencia',
        color: 'from-amber-400 to-yellow-500'
      },
      {
        id: 'BX-20',
        name: 'Dran Dagger 4-60R',
        type: 'booster' as const,
        line: 'Beyblade X Booster Pack',
        description: 'Especialista en ráfagas de golpes continuos para desestabilizar oponentes pesados.',
        status: 'disponible' as const,
        combatType: 'Ataque',
        color: 'from-red-500 to-amber-500'
      }
    ];
  }, [dbProducts]);

  const journeys = useMemo(() => {
    if (dbJourneys.length > 0) return dbJourneys.slice(0, 2);
    
    // Fallback Mock Journeys
    return [
      {
        id: 'j-1',
        title: 'Taller de Iniciación Blader',
        starts_at: new Date(Date.now() + 172800000).toISOString(),
        address: 'Centro Cívico Montevideo',
        locality_id: 1,
        organizer_name: 'Daniel Blader UY',
        status: 'publicado'
      },
      {
        id: 'j-2',
        title: 'Clase Abierta Xtreme Accel',
        starts_at: new Date(Date.now() + 345600000).toISOString(),
        address: 'Local Oficial Hasbro',
        locality_id: 2,
        organizer_name: 'Hasbro Promotores',
        status: 'publicado'
      }
    ];
  }, [dbJourneys]);

  const stats = useMemo(() => {
    const playersCount = dbPlayers.length || 312;
    const tournamentsCount = dbTournaments.length || 24;
    const localitiesCount = dbLocalities.filter(l => l.active).length || 8;
    const storesCount = dbStores.filter(s => s.certification_status === 'Aprobado').length || 6;
    
    return { playersCount, tournamentsCount, localitiesCount, storesCount };
  }, [dbPlayers, dbTournaments, dbLocalities, dbStores]);

  // --- RECENT ACTIVITY GENERATOR ---
  const recentActivity = useMemo(() => {
    const list: ActivityItem[] = [];
    
    // Map players
    dbPlayers.slice(0, 2).forEach(p => {
      list.push({
        id: `act-p-${p.id}`,
        type: 'player',
        text: `¡El Blader ${p.first_name} ${p.last_name[0]}. se ha registrado en la liga ${p.league_id}!`,
        time: p.created_at
      });
    });
    
    // Map tournaments
    dbTournaments.slice(0, 2).forEach(t => {
      list.push({
        id: `act-t-${t.id}`,
        type: 'tournament',
        text: `Torneo anunciado: "${t.name}" en la localidad de ${t.locality}.`,
        time: t.date
      });
    });

    // Map stores
    dbStores.filter(s => s.certification_status === 'Aprobado').slice(0, 2).forEach(s => {
      list.push({
        id: `act-s-${s.id}`,
        type: 'store',
        text: `Nueva tienda certificada: "${s.name}" en ${s.locality}.`,
        time: (s as any).created_at || new Date().toISOString()
      });
    });

    // Map journeys
    dbJourneys.slice(0, 2).forEach(j => {
      list.push({
        id: `act-j-${j.id}`,
        type: 'journey',
        text: `Nueva jornada programada: "${j.title}" por el organizador ${(j as any).organizer_name || 'Organizador'}.`,
        time: j.starts_at
      });
    });

    // Sort by time desc
    const sorted = list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4);
    if (sorted.length > 0) return sorted;

    // Fallback Mock Activities
    return [
      { id: 'm-act-1', type: 'player', text: '¡El Blader Gaston M. se ha registrado en la liga Open (UY)!', time: new Date().toISOString() },
      { id: 'm-act-2', type: 'tournament', text: 'Torneo anunciado: "Copa Xtreme Montevideo" para el 25 de Junio.', time: new Date(Date.now() - 3600000).toISOString() },
      { id: 'm-act-3', type: 'store', text: 'Nueva tienda certificada: "Giro Juguetería Centro" en Montevideo.', time: new Date(Date.now() - 7200000).toISOString() },
      { id: 'm-act-4', type: 'journey', text: 'Nueva jornada programada: "Taller de Iniciación Blader" en Maldonado.', time: new Date(Date.now() - 14400000).toISOString() }
    ];
  }, [dbPlayers, dbTournaments, dbStores, dbJourneys]);

  const getPlayerInitials = (name: string) => {
    if (!name) return 'BY';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getCombatBadgeDetails = (type: string) => {
    switch (type) {
      case 'Ataque':
        return 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]';
      case 'Defensa':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]';
      case 'Resistencia':
        return 'bg-amber-400/10 text-amber-400 border border-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.15)]';
      case 'Equilibrio':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]';
    }
  };

  return (
    <div className="space-y-10 pb-12">
      
      {/* 1. Cinematic Hero Section (Margins compressed by 30%) */}
      <section className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-beyblade-dark via-beyblade-card to-[#040912] border border-white/10 py-10 px-6 md:px-12 text-center md:text-left flex flex-col lg:flex-row items-center gap-8 shadow-[0_15px_35px_rgba(0,240,255,0.04)] tech-grid speed-lines">
        {/* Ambient glows */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-beyblade-electricCyan/30 blur-[2px] animate-float-p1 top-10 left-12" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-beyblade-electricRed/40 blur-[1px] animate-float-p2 top-1/4 right-24" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-beyblade-electricCyan/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-beyblade-electricRed/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex-1 space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 text-beyblade-electricCyan text-[9px] font-black font-esports uppercase tracking-widest animate-pulse">
            <Sparkles className="h-3 w-3" /> Uruguay Ecosistema Certificado
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase leading-none font-esports">
            <span className="font-title text-transparent bg-clip-text bg-gradient-to-r from-beyblade-electricCyan via-white to-beyblade-electricRed drop-shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              BEYBLADE X
            </span> 
            <br />
            <span className="text-glow-red text-beyblade-electricRed block mt-1 tracking-wider text-4xl md:text-5xl">
              LIGA LATAM
            </span>
          </h1>

          <p className="text-gray-300 text-xs md:text-sm leading-relaxed max-w-lg">
            Prepárate para la aceleración Xtreme. Regístrate oficialmente como competidor, inscríbete en torneos nacionales y escala posiciones hacia la cima del ranking regional.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
            <Link
              to="/register"
              className="px-6 py-3.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports tracking-widest rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-center text-xs shadow-neon-cyan uppercase flex items-center justify-center gap-2"
            >
              Unirme a la competencia
            </Link>
            <Link
              to="/tournaments"
              className="px-6 py-3.5 bg-beyblade-card/60 border border-white/10 hover:border-beyblade-electricCyan/40 hover:bg-white/5 text-white font-black font-esports tracking-widest rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-center text-xs uppercase flex items-center justify-center"
            >
              Ver Torneos
            </Link>
          </div>
        </div>

        {/* Stadium Mockup Decors */}
        <div className="relative flex-1 flex justify-center items-center z-10 select-none">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-dashed border-beyblade-electricCyan/20 rounded-full animate-orbit-cw"></div>
            <div className="absolute inset-6 border border-beyblade-electricRed/15 rounded-full animate-orbit-ccw"></div>
            <div className="absolute inset-12 border-4 border-double border-beyblade-electricCyan/45 rounded-full animate-x-pulse shadow-[0_0_20px_rgba(0,240,255,0.15)]"></div>
            
            {/* Center Core spinner */}
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-beyblade-electricRed via-beyblade-dark to-beyblade-electricCyan p-1 animate-orbit-cw [animation-duration:3s] shadow-[0_0_25px_rgba(0,240,255,0.2)]">
              <div className="w-full h-full rounded-full bg-beyblade-card flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-2.5 w-1.5 h-5 bg-beyblade-electricCyan rounded-full shadow-[0_0_8px_#00F0FF]"></div>
                <div className="absolute bottom-2.5 w-1.5 h-5 bg-beyblade-electricRed rounded-full shadow-[0_0_8px_#FF0055]"></div>
                <span className="text-white font-title text-base tracking-widest text-glow-cyan">X-LINE</span>
                <span className="text-[7px] text-gray-500 font-esports font-bold tracking-widest uppercase mt-0.5">GEAR ACCEL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bloque de Estadísticas (KPIs) */}
      <section className="space-y-4">
        <div className="text-left">
          <span className="text-[9px] text-beyblade-electricCyan font-black uppercase tracking-widest font-esports block">Ecosistema Uruguay</span>
          <h2 className="text-lg font-black text-white uppercase tracking-wider font-title mt-0.5">Comunidad Beyblade X</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-beyblade-card border border-white/5 p-4 rounded-2xl relative overflow-hidden clip-cyber-card shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 tech-grid opacity-10"></div>
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-gray-400 font-extrabold uppercase font-esports tracking-wider">Jugadores Registrados</span>
              <Users className="h-4.5 w-4.5 text-beyblade-electricCyan" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-title tracking-wider">{stats.playersCount}</span>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider font-esports">Activos</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-beyblade-electricCyan to-transparent opacity-20"></div>
          </div>

          <div className="bg-beyblade-card border border-white/5 p-4 rounded-2xl relative overflow-hidden clip-cyber-card shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 tech-grid opacity-10"></div>
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-gray-400 font-extrabold uppercase font-esports tracking-wider">Torneos Realizados</span>
              <Trophy className="h-4.5 w-4.5 text-beyblade-electricRed" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-title tracking-wider">{stats.tournamentsCount}</span>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-esports">Competencias</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-beyblade-electricRed to-transparent opacity-20"></div>
          </div>

          <div className="bg-beyblade-card border border-white/5 p-4 rounded-2xl relative overflow-hidden clip-cyber-card shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 tech-grid opacity-10"></div>
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-gray-400 font-extrabold uppercase font-esports tracking-wider">Localidades Activas</span>
              <Flag className="h-4.5 w-4.5 text-purple-500" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-title tracking-wider">{stats.localitiesCount}</span>
              <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider font-esports">Ciudades</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-transparent opacity-20"></div>
          </div>

          <div className="bg-beyblade-card border border-white/5 p-4 rounded-2xl relative overflow-hidden clip-cyber-card shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 tech-grid opacity-10"></div>
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-gray-400 font-extrabold uppercase font-esports tracking-wider">Tiendas Certificadas</span>
              <ShoppingBag className="h-4.5 w-4.5 text-beyblade-gold" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-title tracking-wider">{stats.storesCount}</span>
              <span className="text-[9px] text-beyblade-gold font-bold uppercase tracking-wider font-esports">Locales</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-beyblade-gold to-transparent opacity-20"></div>
          </div>
        </div>
      </section>

      {/* 3. Grid: Upcoming Tournaments & Premium Podio Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Upcoming Tournaments (Grid Span 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest font-esports">
              <Trophy className="h-4.5 w-4.5 text-beyblade-electricCyan text-glow-cyan" />
              Próximos Torneos Oficiales
            </h2>
            <Link to="/tournaments" className="text-[10px] font-esports font-black tracking-wider text-beyblade-electricCyan hover:text-white uppercase transition-colors flex items-center gap-1">
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tournaments.map((t) => (
              <div 
                key={t.id}
                onClick={() => navigate(`/tournaments`)}
                className="group bg-beyblade-card hover:bg-beyblade-card/90 border border-white/5 hover:border-beyblade-electricCyan/20 p-4.5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] relative overflow-hidden clip-cyber-card shadow-md"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-beyblade-electricCyan to-beyblade-electricRed"></div>
                
                <div className="space-y-2.5 text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/25 px-2 py-0.5 rounded text-[8px] font-black font-esports tracking-wider uppercase">
                      OFICIAL
                    </span>
                    <span className="bg-white/5 text-gray-400 border border-white/5 px-2 py-0.5 rounded text-[8px] font-black font-esports tracking-wider uppercase">
                      Liga {t.league_id}
                    </span>
                  </div>
                  <h3 className="font-title text-xs text-white group-hover:text-beyblade-electricCyan transition-colors uppercase tracking-wide line-clamp-1">
                    {t.name}
                  </h3>
                  <div className="flex flex-col gap-1 text-[10px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-beyblade-electricCyan" /> {t.date} @ {t.time.substring(0, 5)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-beyblade-electricRed" /> {t.locality}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-2.5">
                  <div className="text-left">
                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest font-esports block">Cupos</span>
                    <p className="text-xs font-black text-white">{t.slots_available} <span className="text-[10px] text-gray-500">/ {t.slots_total}</span></p>
                  </div>
                  <button className="px-3 py-1 bg-beyblade-electricCyan/10 text-beyblade-electricCyan group-hover:bg-beyblade-electricCyan group-hover:text-beyblade-darker rounded-lg text-[9px] font-black font-esports uppercase tracking-widest transition-all duration-300 border border-beyblade-electricCyan/20">
                    Acreditarse
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Premium Podio Rankings (Grid Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest font-esports">
              <Award className="h-4.5 w-4.5 text-beyblade-gold text-glow-gold" />
              Podio Nacional
            </h2>
            <Link to="/rankings" className="text-[10px] font-esports font-black tracking-wider text-beyblade-gold hover:text-white uppercase transition-colors flex items-center gap-1">
              Tabla Completa <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="bg-beyblade-card border border-white/5 rounded-3xl p-4.5 clip-cyber-card shadow-lg relative flex flex-col justify-between min-h-[220px]">
            <div className="absolute inset-0 tech-grid opacity-[0.03] pointer-events-none"></div>
            
            {/* Staggered Esports Podium Layout */}
            <div className="flex items-end justify-center gap-2.5 pt-6 pb-2 select-none">
              
              {/* 2nd Place */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-beyblade-silver to-slate-400 border border-beyblade-silver flex items-center justify-center shadow-md">
                  <span className="font-title text-[9px] text-beyblade-darker">{getPlayerInitials(rankings[1]?.player_name)}</span>
                  <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-beyblade-silver/20 text-beyblade-silver border border-beyblade-silver/30 font-black font-esports text-[8px] flex items-center justify-center shadow-sm">2</div>
                </div>
                <span className="font-extrabold text-[9px] text-white truncate max-w-[65px] mt-1.5 uppercase block">{rankings[1]?.player_name.split(' ')[0]}</span>
                <span className="text-[7px] text-beyblade-silver font-black font-esports tracking-wider">{rankings[1]?.total_points} PTS</span>
                <div className="w-full bg-beyblade-silver/10 border border-beyblade-silver/20 h-8 rounded-t-lg mt-2 relative">
                  <div className="absolute inset-x-0 bottom-1 text-[8px] font-black text-beyblade-silver font-esports">II</div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-beyblade-gold to-yellow-400 border border-beyblade-gold flex items-center justify-center shadow-lg">
                  <span className="font-title text-xs text-beyblade-darker">{getPlayerInitials(rankings[0]?.player_name)}</span>
                  <span className="absolute -top-3.5 text-xs animate-bounce [animation-duration:3s]">👑</span>
                  <div className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 rounded-full bg-beyblade-gold text-beyblade-darker border border-beyblade-gold/50 font-black font-esports text-[8px] flex items-center justify-center shadow-md">1</div>
                </div>
                <span className="font-black text-[10px] text-white truncate max-w-[75px] mt-1.5 uppercase block">{rankings[0]?.player_name.split(' ')[0]}</span>
                <span className="text-[8px] text-beyblade-gold font-black font-esports tracking-wider">{rankings[0]?.total_points} PTS</span>
                <div className="w-full bg-beyblade-gold/10 border border-beyblade-gold/30 h-11 rounded-t-lg mt-2 relative">
                  <div className="absolute inset-x-0 bottom-1 text-[9px] font-black text-beyblade-gold font-esports">I</div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-beyblade-bronze to-amber-700 border border-beyblade-bronze flex items-center justify-center shadow-md">
                  <span className="font-title text-[9px] text-white">{getPlayerInitials(rankings[2]?.player_name)}</span>
                  <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-beyblade-bronze/20 text-beyblade-bronze border border-beyblade-bronze/30 font-black font-esports text-[8px] flex items-center justify-center shadow-sm">3</div>
                </div>
                <span className="font-extrabold text-[9px] text-white truncate max-w-[65px] mt-1.5 uppercase block">{rankings[2]?.player_name.split(' ')[0]}</span>
                <span className="text-[7px] text-beyblade-bronze font-black font-esports tracking-wider">{rankings[2]?.total_points} PTS</span>
                <div className="w-full bg-beyblade-bronze/10 border border-beyblade-bronze/20 h-6 rounded-t-lg mt-2 relative">
                  <div className="absolute inset-x-0 bottom-1 text-[8px] font-black text-beyblade-bronze font-esports">III</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 4. Productos Destacados (New Section) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest font-esports">
            <ShoppingBag className="h-4.5 w-4.5 text-beyblade-electricCyan" />
            Productos Destacados
          </h2>
          <Link to="/products" className="text-[10px] font-esports font-black tracking-wider text-beyblade-electricCyan hover:text-white uppercase transition-colors flex items-center gap-1">
            Catálogo Completo <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => {
            const combatType = (p as any).combatType || 'Ataque';
            const badgeClass = getCombatBadgeDetails(combatType);
            
            return (
              <div 
                key={p.id}
                className="bg-beyblade-card border border-white/5 rounded-2xl p-4 hover:border-beyblade-electricCyan/20 transition-all duration-300 flex flex-col justify-between min-h-[220px] group relative overflow-hidden clip-cyber-card shadow-md"
              >
                <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none"></div>
                
                <div className="space-y-2.5 text-left">
                  {/* Category / Status Header */}
                  <div className="flex justify-between items-center text-[8px] font-black uppercase font-esports tracking-wider">
                    <span className="text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                      {p.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${badgeClass}`}>
                      {combatType}
                    </span>
                  </div>

                  {/* Visual placeholder core */}
                  <div className="h-24 bg-beyblade-darker/60 rounded-xl border border-white/5 relative flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 rounded-full border border-dashed border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-beyblade-electricCyan/20 to-beyblade-electricRed/20 blur-sm absolute"></div>
                      <ShoppingBag className="h-5 w-5 text-gray-500 z-10" />
                    </div>
                    <span className="absolute bottom-1 right-2 text-[8px] text-gray-600 font-mono font-bold">{p.id}</span>
                  </div>

                  {/* Titles */}
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-white text-xs group-hover:text-beyblade-electricCyan transition-colors line-clamp-1 uppercase tracking-wide">
                      {p.name}
                    </h4>
                    <span className="text-[8px] text-gray-500 font-bold uppercase block font-esports tracking-wider">{p.line}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link 
                    to="/products"
                    className="w-full py-2 bg-beyblade-electricCyan/10 hover:bg-beyblade-electricCyan text-beyblade-electricCyan hover:text-beyblade-darker border border-beyblade-electricCyan/20 rounded-xl text-[9px] font-black font-esports uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Ver Producto
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Próximas Jornadas (New Section) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest font-esports">
            <BookOpen className="h-4.5 w-4.5 text-beyblade-electricCyan" />
            Próximas Jornadas y Academias
          </h2>
          <Link to="/academy" className="text-[10px] font-esports font-black tracking-wider text-beyblade-electricCyan hover:text-white uppercase transition-colors flex items-center gap-1">
            Academia Completa <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journeys.length > 0 ? (
            journeys.map((j: any) => (
              <div 
                key={j.id}
                className="bg-beyblade-card border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden clip-cyber-card shadow-md text-left"
              >
                <div className="space-y-2 flex-1">
                  <span className="text-[8px] font-black font-esports tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded uppercase">
                    TALLER / PRÁCTICA
                  </span>
                  <h4 className="font-title text-xs text-white uppercase tracking-wider line-clamp-1">{j.title}</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-beyblade-electricCyan" /> 
                      {new Date(j.starts_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-beyblade-electricRed" /> 
                      {(j.address || '').split(',')[0]}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0 shrink-0 gap-2">
                  <div className="text-left sm:text-right">
                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest font-esports block">Organiza</span>
                    <span className="text-[10px] font-extrabold text-white uppercase tracking-wide">{j.organizer_name}</span>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/academy')}
                    className="px-3.5 py-1.5 bg-beyblade-electricCyan/15 text-beyblade-electricCyan hover:bg-beyblade-electricCyan hover:text-beyblade-darker rounded-lg text-[9px] font-black font-esports uppercase tracking-widest transition-all duration-300 border border-beyblade-electricCyan/20"
                  >
                    Ver Jornada
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-beyblade-card border border-white/5 p-6 rounded-2xl text-center text-gray-400 text-xs font-semibold clip-cyber-card">
              No hay jornadas de práctica agendadas actualmente. Regístrate para recibir notificaciones de próximos eventos en tu localidad.
            </div>
          )}
        </div>
      </section>

      {/* 6. Tiendas Certificadas (New Section) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest font-esports">
            <ShoppingBag className="h-4.5 w-4.5 text-beyblade-gold text-glow-gold" />
            Tiendas Certificadas
          </h2>
          <Link to="/stores" className="text-[10px] font-esports font-black tracking-wider text-beyblade-gold hover:text-white uppercase transition-colors flex items-center gap-1">
            Buscar en Uruguay <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden clip-cyber-card shadow-lg text-left">
          <div className="absolute inset-0 tech-grid opacity-[0.03] pointer-events-none"></div>
          
          <div className="flex-1 space-y-4 z-10">
            <h3 className="text-xl font-title text-white uppercase tracking-wider">¿Dónde Comprar Beyblade X?</h3>
            <p className="text-xs text-gray-300 leading-relaxed font-semibold max-w-lg">
              Encuentra productos oficiales Beyblade X de Hasbro cerca de ti. Compara stock local en tiempo real y adquiere lanzadores, estadios y Beys certificados en jugueterías oficiales de Uruguay.
            </p>
            <div className="flex flex-wrap gap-4 text-[10px] font-extrabold uppercase font-esports text-gray-400">
              <span className="flex items-center gap-1.5"><MapPin className="h-4.5 w-4.5 text-beyblade-electricCyan" /> {stats.storesCount} locales validados</span>
              <span className="flex items-center gap-1.5"><Sparkles className="h-4.5 w-4.5 text-beyblade-gold" /> Stock oficial Hasbro</span>
            </div>
            <Link 
              to="/stores"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-beyblade-gold text-beyblade-darker font-black font-esports text-[10px] uppercase tracking-widest rounded-lg hover:bg-white transition-all shadow-md mt-2"
            >
              Ver Todas las Tiendas
            </Link>
          </div>

          {/* Styled Esports Digital Radar Map Mini Placeholder */}
          <div className="w-full md:w-56 h-40 bg-beyblade-darker/70 border border-white/5 rounded-2xl relative overflow-hidden shrink-0 flex items-center justify-center z-10 select-none">
            <div className="absolute inset-0 tech-grid opacity-25"></div>
            <svg className="w-48 h-48 text-beyblade-gold/5" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" />
            </svg>
            
            {/* Pulsing local indicators */}
            <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-beyblade-gold/25 border border-beyblade-gold flex items-center justify-center shadow-lg animate-ping [animation-duration:3s]">
              <div className="w-1 h-1 rounded-full bg-beyblade-gold"></div>
            </div>
            <div className="absolute bottom-1/3 right-1/4 w-3 h-3 rounded-full bg-beyblade-gold/25 border border-beyblade-gold flex items-center justify-center shadow-lg animate-ping [animation-duration:2.5s]">
              <div className="w-1 h-1 rounded-full bg-beyblade-gold"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-beyblade-gold/25 border border-beyblade-gold flex items-center justify-center shadow-lg animate-ping [animation-duration:4s]">
              <div className="w-1.5 h-1.5 rounded-full bg-beyblade-gold"></div>
            </div>
            <span className="absolute bottom-2 text-[8px] text-gray-500 font-mono uppercase tracking-widest">MAP TELEMETRY ACTIVE</span>
          </div>

        </div>
      </section>

      {/* 7. Grid: Noticias y Lanzamientos & Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: News (Grid Span 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest font-esports">
              <Newspaper className="h-4.5 w-4.5 text-beyblade-electricCyan" />
              Noticias y Lanzamientos
            </h2>
            <Link to="/news" className="text-[10px] font-esports font-black tracking-wider text-beyblade-electricCyan hover:text-white uppercase transition-colors flex items-center gap-1">
              Ver más <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {news.slice(0, 2).map((n) => (
              <div 
                key={n.id}
                className="bg-beyblade-card border border-white/5 rounded-2xl p-4.5 space-y-3 hover:border-white/15 transition-all duration-300 flex flex-col justify-between min-h-[140px] clip-cyber-card shadow-md text-left"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase font-esports tracking-wider">
                    <span className="text-beyblade-electricRed bg-beyblade-electricRed/10 border border-beyblade-electricRed/25 px-2 py-0.5 rounded">
                      {n.country_id ? `${n.country_id} oficial` : 'Global'}
                    </span>
                    <span className="text-gray-500">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-title text-xs text-white uppercase tracking-wider line-clamp-1">{n.title}</h4>
                  <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed font-semibold">{n.content}</p>
                </div>
                <Link to="/news" className="text-[9px] font-black font-esports uppercase tracking-widest text-beyblade-electricCyan hover:underline inline-flex items-center gap-0.5 mt-2">
                  Leer Noticia <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed (Grid Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest font-esports">
              <Users className="h-4.5 w-4.5 text-beyblade-electricCyan" />
              Última Actividad
            </h2>
          </div>

          <div className="bg-beyblade-card border border-white/5 rounded-3xl p-4.5 clip-cyber-card shadow-lg relative min-h-[140px] flex flex-col gap-3">
            <div className="absolute inset-0 tech-grid opacity-[0.02] pointer-events-none"></div>
            
            <div className="space-y-3.5 text-left">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex gap-2.5 items-start text-[10px] leading-snug">
                  <div className="w-1.5 h-1.5 rounded-full bg-beyblade-electricCyan mt-1 shrink-0 shadow-[0_0_6px_rgba(0,240,255,0.8)]"></div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-gray-300 font-sans">{act.text}</p>
                    <span className="text-[7.5px] text-gray-500 font-mono font-bold uppercase tracking-wider">
                      {new Date(act.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 8. Academia de Combate (Difficulty levels) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest font-esports">
            <BookOpen className="h-4.5 w-4.5 text-beyblade-electricCyan" />
            Academia Beyblade X
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 flex flex-col justify-between space-y-4 clip-cyber-card shadow-lg text-left relative group">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-[8px] font-black font-esports tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded uppercase">
                  Principiante
                </span>
              </div>
              <h3 className="text-base font-title text-white uppercase tracking-wider">Reglamento y Lanzamiento</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                Aprende la reglamentación básica de competencia, la forma correcta de usar el lanzador oficial y cómo ejecutar el Xtreme Finish.
              </p>
            </div>
            <Link
              to="/academy"
              className="flex items-center justify-between px-3 py-2.5 bg-white/5 group-hover:bg-beyblade-electricCyan/10 group-hover:text-beyblade-electricCyan border border-white/5 group-hover:border-beyblade-electricCyan/30 rounded-xl text-[9px] font-black font-esports uppercase tracking-widest transition-all"
            >
              Comenzar Guía
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 flex flex-col justify-between space-y-4 clip-cyber-card shadow-lg text-left relative group">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="p-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-[8px] font-black font-esports tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2.5 py-0.5 rounded uppercase">
                  Intermedio
                </span>
              </div>
              <h3 className="text-base font-title text-white uppercase tracking-wider">Combos y Ensambles</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                Domina el ensamble del sistema de 3 partes de Beyblade X: el Blade (metal), el Ratchet (altura y dientes) y el Bit (eje de giro).
              </p>
            </div>
            <Link
              to="/academy"
              className="flex items-center justify-between px-3 py-2.5 bg-white/5 group-hover:bg-beyblade-electricCyan/10 group-hover:text-beyblade-electricCyan border border-white/5 group-hover:border-beyblade-electricCyan/30 rounded-xl text-[9px] font-black font-esports uppercase tracking-widest transition-all"
            >
              Ver Combos
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 flex flex-col justify-between space-y-4 clip-cyber-card shadow-lg text-left relative group">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-[8px] font-black font-esports tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded uppercase">
                  Avanzado
                </span>
              </div>
              <h3 className="text-base font-title text-white uppercase tracking-wider">Estrategias Xtreme Accel</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                Análisis táctico del engranaje del riel. Trucos de fricción en estadio y combinaciones ganadoras para torneos nacionales oficiales.
              </p>
            </div>
            <Link
              to="/academy"
              className="flex items-center justify-between px-3 py-2.5 bg-white/5 group-hover:bg-beyblade-electricCyan/10 group-hover:text-beyblade-electricCyan border border-white/5 group-hover:border-beyblade-electricCyan/30 rounded-xl text-[9px] font-black font-esports uppercase tracking-widest transition-all"
            >
              Ver Estrategias
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Footer Deportivo Oficial */}
      <footer className="border-t border-white/5 pt-8 mt-12 text-left relative">
        <div className="absolute inset-0 tech-grid opacity-[0.01] pointer-events-none"></div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-xs font-semibold">
          {/* Column Competir */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-[10px] text-white uppercase tracking-widest font-esports border-b border-white/5 pb-1">Competir</h4>
            <ul className="space-y-2 text-gray-400 uppercase tracking-wider font-esports text-[9px]">
              <li><Link to="/tournaments" className="hover:text-beyblade-electricCyan transition-colors">Torneos Oficiales</Link></li>
              <li><Link to="/rankings" className="hover:text-beyblade-electricCyan transition-colors">Ranking Nacional</Link></li>
              <li><Link to="/teams" className="hover:text-beyblade-electricCyan transition-colors">Equipos de Competidores</Link></li>
            </ul>
          </div>

          {/* Column Comunidad */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-[10px] text-white uppercase tracking-widest font-esports border-b border-white/5 pb-1">Comunidad</h4>
            <ul className="space-y-2 text-gray-400 uppercase tracking-wider font-esports text-[9px]">
              <li><Link to="/academy" className="hover:text-beyblade-electricCyan transition-colors">Academia de Combate</Link></li>
              <li><Link to="/news" className="hover:text-beyblade-electricCyan transition-colors">Noticias & Lanzamientos</Link></li>
              <li><Link to="/academy" className="hover:text-beyblade-electricCyan transition-colors">Jornadas Blader</Link></li>
            </ul>
          </div>

          {/* Column Retail */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-[10px] text-white uppercase tracking-widest font-esports border-b border-white/5 pb-1">Hasbro Retail</h4>
            <ul className="space-y-2 text-gray-400 uppercase tracking-wider font-esports text-[9px]">
              <li><Link to="/products" className="hover:text-beyblade-electricCyan transition-colors">Catálogo de Productos</Link></li>
              <li><Link to="/stores" className="hover:text-beyblade-electricCyan transition-colors">Tiendas Certificadas</Link></li>
            </ul>
          </div>

          {/* Column Legal */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-[10px] text-white uppercase tracking-widest font-esports border-b border-white/5 pb-1">Legal</h4>
            <ul className="space-y-2 text-gray-400 uppercase tracking-wider font-esports text-[9px]">
              <li><a href="#/terms" className="hover:text-beyblade-electricCyan transition-colors">Términos de Servicio</a></li>
              <li><a href="#/privacy" className="hover:text-beyblade-electricCyan transition-colors">Políticas de Privacidad</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-[10px] font-esports uppercase tracking-widest font-bold">
          <p>© 2026 Beyblade LATAM Platform - Hasbro Oficial Uruguay</p>
          <div className="flex gap-4">
            <span className="text-gray-600">XTREME LINE ACCEL v2.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
