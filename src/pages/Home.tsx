import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trophy, MapPin, Sparkles, ChevronRight, Newspaper, 
  Calendar, Award
} from 'lucide-react';
import { DbService } from '../services/dbService';
import type { Tournament, RankingEntry, NewsItem, Journey, HeroBanner } from '../services/dbService';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  
  // Real database states
  const [dbTournaments, setDbTournaments] = useState<Tournament[]>([]);
  const [dbRankings, setDbRankings] = useState<RankingEntry[]>([]);
  const [dbNews, setDbNews] = useState<NewsItem[]>([]);
  const [dbJourneys, setDbJourneys] = useState<Journey[]>([]);
  const [rankingTab, setRankingTab] = useState<'Open' | 'Junior'>('Open');

  // Hero Banners dynamic states
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [tours, ranks, newsItems, journeysList, banners] = await Promise.all([
          DbService.getTournamentsList(),
          DbService.getRankingsList(),
          DbService.getNews(),
          DbService.getJourneys(),
          DbService.getHeroBanners(),
        ]);
        
        setDbTournaments(tours);
        setDbRankings(ranks);
        setDbNews(newsItems);
        setDbJourneys(journeysList);
        setHeroBanners(banners.filter(b => b.active));
      } catch (err) {
        console.error('Error fetching home data:', err);
      }
    };
    fetchHomeData();
  }, []);

  // Active banners carousel setup
  const activeBanners = useMemo(() => {
    if (heroBanners.length > 0) return heroBanners;
    return [{
      badge: 'Uruguay Ecosistema Certificado',
      title_l1: 'BEYBLADE X',
      title_l2: 'URUGUAY',
      subtitle: 'Prepárate para la aceleración Xtreme. Regístrate en torneos oficiales y escala el ranking nacional.',
      cta_primary: 'Registrarme',
      cta_primary_link: '/register',
      cta_secondary: 'Ver Torneos',
      cta_secondary_link: '/tournaments',
      image_url: 'xtreme',
      country_id: 'UY',
      active: true
    }];
  }, [heroBanners]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners]);

  const currentBanner = activeBanners[currentBannerIndex] || activeBanners[0];

  // --- UPCOMING TOURNAMENT DESTACADO ---
  const upcomingTournament = useMemo(() => {
    const active = dbTournaments.filter(t => t.status === 'publicado');
    if (active.length > 0) {
      // Sort by date and time ascending to get the closest one
      return [...active].sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
        return dateTimeA - dateTimeB;
      })[0];
    }
    
    // Fallback Mock Tournament
    return {
      id: 'mock-t1',
      name: 'Copa Xtreme Montevideo Inicial',
      league_id: 'Open' as const,
      date: '2026-06-25',
      time: '15:00',
      locality: 'Montevideo',
      address: 'Centro Blader UY',
      slots_total: 32,
      slots_available: 18,
      status: 'publicado' as const,
    };
  }, [dbTournaments]);

  // --- RANKINGS (JUNIOR & OPEN) ---
  const juniorRankings = useMemo(() => {
    const list = dbRankings.filter(r => r.league_id === 'Junior');
    if (list.length > 0) {
      return [...list].sort((a, b) => b.total_points - a.total_points).slice(0, 3);
    }
    return [
      { player_id: 'pj-1', player_name: 'Santi Junior', total_points: 390, tournaments_played: 4, locality: 'Montevideo', league_id: 'Junior' as const, country_id: 'UY' },
      { player_id: 'pj-2', player_name: 'Fede Blader', total_points: 340, tournaments_played: 3, locality: 'Montevideo', league_id: 'Junior' as const, country_id: 'UY' },
      { player_id: 'pj-3', player_name: 'Lucas X', total_points: 290, tournaments_played: 3, locality: 'Maldonado', league_id: 'Junior' as const, country_id: 'UY' }
    ];
  }, [dbRankings]);

  const openRankings = useMemo(() => {
    const list = dbRankings.filter(r => r.league_id === 'Open');
    if (list.length > 0) {
      return [...list].sort((a, b) => b.total_points - a.total_points).slice(0, 3);
    }
    return [
      { player_id: 'po-1', player_name: 'Max Steel', total_points: 420, tournaments_played: 5, locality: 'Montevideo', league_id: 'Open' as const, country_id: 'UY' },
      { player_id: 'po-2', player_name: 'Blader K', total_points: 380, tournaments_played: 4, locality: 'Maldonado', league_id: 'Open' as const, country_id: 'UY' },
      { player_id: 'po-3', player_name: 'Gaston X', total_points: 310, tournaments_played: 4, locality: 'Montevideo', league_id: 'Open' as const, country_id: 'UY' }
    ];
  }, [dbRankings]);

  const activeRankings = rankingTab === 'Open' ? openRankings : juniorRankings;

  // --- COMBINED NEWS AND JOURNEYS (MAX 3 CARDS) ---
  const newsAndJourneys = useMemo(() => {
    if (dbNews.length === 0 && dbJourneys.length === 0) {
      return [];
    }
    
    const items: Array<{ id: string; type: 'news' | 'journey'; title: string; date: string; content: string; url: string }> = [];
    
    dbNews.forEach(n => {
      items.push({
        id: `news-${n.id}`,
        type: 'news',
        title: n.title,
        date: n.created_at,
        content: n.content,
        url: '/news'
      });
    });

    dbJourneys.forEach(j => {
      items.push({
        id: `journey-${j.id}`,
        type: 'journey',
        title: j.title,
        date: j.starts_at,
        content: `Jornada programada en ${j.address || ''}.`,
        url: '/academy'
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  }, [dbNews, dbJourneys]);

  const getPlayerInitials = (name: string) => {
    if (!name) return 'BY';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-10 pb-12">
      
      {/* 1. Cinematic Hero Section */}
      <section className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-beyblade-dark via-beyblade-card to-[#040912] border border-white/10 py-10 px-6 md:px-12 text-center md:text-left flex flex-col lg:flex-row items-center gap-8 shadow-[0_15px_35px_rgba(0,240,255,0.04)] tech-grid speed-lines">
        {/* Ambient glows */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-beyblade-electricCyan/30 blur-[2px] animate-float-p1 top-10 left-12" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-beyblade-electricRed/40 blur-[1px] animate-float-p2 top-1/4 right-24" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-beyblade-electricCyan/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-beyblade-electricRed/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex-1 space-y-5 relative z-10 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 text-beyblade-electricCyan text-[9px] font-black font-esports uppercase tracking-widest animate-pulse">
            <Sparkles className="h-3 w-3" /> {currentBanner.badge}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase leading-none font-esports">
            <span className="font-title text-transparent bg-clip-text bg-gradient-to-r from-beyblade-electricCyan via-white to-beyblade-electricRed drop-shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              {currentBanner.title_l1}
            </span> 
            <br />
            <span className="text-glow-cyan text-white block mt-1 tracking-wider text-4xl md:text-5xl">
              {currentBanner.title_l2}
            </span>
          </h1>

          <p className="text-gray-300 text-xs md:text-sm leading-relaxed max-w-lg">
            {currentBanner.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
            {currentBanner.cta_primary && currentBanner.cta_primary_link && (
              <Link
                to={currentBanner.cta_primary_link}
                className="px-6 py-3.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports tracking-widest rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-center text-xs shadow-neon-cyan uppercase flex items-center justify-center gap-2"
              >
                {currentBanner.cta_primary}
              </Link>
            )}
            {currentBanner.cta_secondary && currentBanner.cta_secondary_link && (
              <Link
                to={currentBanner.cta_secondary_link}
                className="px-6 py-3.5 bg-beyblade-card/60 border border-white/10 hover:border-beyblade-electricCyan/40 hover:bg-white/5 text-white font-black font-esports tracking-widest rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-center text-xs uppercase flex items-center justify-center"
              >
                {currentBanner.cta_secondary}
              </Link>
            )}
          </div>
        </div>

        {/* Stadium Mockup Decors or Custom Image */}
        <div className="relative flex-grow flex-shrink-0 flex justify-center items-center z-10 select-none w-full lg:w-1/3 min-h-[250px]">
          {currentBanner.image_url && currentBanner.image_url !== 'xtreme' ? (
            <img 
              src={currentBanner.image_url} 
              alt="Banner Visual" 
              className="w-full max-w-sm h-64 object-contain rounded-2xl drop-shadow-[0_0_20px_rgba(0,240,255,0.15)] animate-float-p1"
            />
          ) : (
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
          )}
        </div>

        {/* Carousel Indicators */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'bg-beyblade-electricCyan w-5 shadow-[0_0_8px_#00F0FF]' : 'bg-white/20'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 2. Próximo Torneo Destacado */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Trophy className="h-5 w-5 text-beyblade-electricCyan text-glow-cyan" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest font-esports">
            Próximo Torneo Destacado
          </h2>
        </div>

        {upcomingTournament && (
          <div 
            onClick={() => navigate(`/tournaments?tour=${upcomingTournament.id}`)}
            className="group bg-beyblade-card hover:bg-beyblade-card/90 border border-beyblade-electricCyan/20 hover:border-beyblade-electricCyan/45 p-6 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden clip-cyber-card shadow-lg text-left"
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-beyblade-electricCyan to-beyblade-electricRed"></div>
            
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-beyblade-electricCyan/15 text-beyblade-electricCyan border border-beyblade-electricCyan/35 px-2.5 py-0.5 rounded-lg text-[9px] font-black font-esports tracking-wider uppercase animate-pulse">
                  PRÓXIMO EVENTO
                </span>
                <span className="bg-white/5 text-gray-300 border border-white/10 px-2.5 py-0.5 rounded-lg text-[9px] font-black font-esports tracking-wider uppercase">
                  Liga {upcomingTournament.league_id}
                </span>
              </div>
              
              <div>
                <h3 className="font-title text-xl text-white group-hover:text-beyblade-electricCyan transition-colors uppercase tracking-wider leading-tight">
                  {upcomingTournament.name}
                </h3>
                <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 max-w-xl font-semibold">
                  Participa en el torneo oficial puntuable para el ranking de Uruguay. Acelera tu Beyblade X sobre la riel extrema y derrota a tus oponentes.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-gray-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4.5 w-4.5 text-beyblade-electricCyan" /> {upcomingTournament.date} @ {upcomingTournament.time.substring(0, 5)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4.5 w-4.5 text-beyblade-electricRed" /> {upcomingTournament.locality} - {upcomingTournament.address}
                </span>
              </div>
            </div>

            <div className="flex md:flex-col items-end justify-between md:justify-center w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0 shrink-0 gap-4">
              <div className="text-left md:text-right">
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest font-esports block">Cupos Disponibles</span>
                <p className="text-xl font-black text-white">{upcomingTournament.slots_available} <span className="text-xs text-gray-500">/ {upcomingTournament.slots_total}</span></p>
              </div>
              <button className="px-5 py-2.5 bg-beyblade-electricCyan text-beyblade-darker font-black font-esports rounded-xl text-[10px] uppercase tracking-widest transition-all duration-300 shadow-md group-hover:scale-105">
                Inscribirme
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Ranking Destacado */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-beyblade-gold text-glow-gold" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest font-esports">
              Ranking Destacado (Top 3)
            </h2>
          </div>
          
          <div className="flex bg-beyblade-darker/80 p-0.5 rounded-lg border border-white/5 self-stretch sm:self-auto">
            <button
              onClick={() => setRankingTab('Open')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-[9px] font-black font-esports uppercase tracking-widest transition-all ${
                rankingTab === 'Open'
                  ? 'bg-beyblade-gold text-beyblade-darker'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Liga Open
            </button>
            <button
              onClick={() => setRankingTab('Junior')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-[9px] font-black font-esports uppercase tracking-widest transition-all ${
                rankingTab === 'Junior'
                  ? 'bg-beyblade-gold text-beyblade-darker'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Liga Junior
            </button>
          </div>
        </div>

        {/* Compact Podio Card */}
        <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 clip-cyber-card shadow-lg relative min-h-[220px] flex flex-col justify-center">
          <div className="absolute inset-0 tech-grid opacity-[0.03] pointer-events-none"></div>
          
          <div className="flex items-end justify-center gap-2 md:gap-4 pt-6 pb-2 select-none max-w-md mx-auto w-full">
            
            {/* 2nd Place */}
            {activeRankings[1] && (
              <div className="flex flex-col items-center flex-1">
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-beyblade-silver to-slate-400 border border-beyblade-silver flex items-center justify-center shadow-md">
                  <span className="font-title text-[10px] text-beyblade-darker">{getPlayerInitials(activeRankings[1].player_name)}</span>
                  <div className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 rounded-full bg-beyblade-silver/20 text-beyblade-silver border border-beyblade-silver/30 font-black font-esports text-[8px] flex items-center justify-center shadow-sm">2</div>
                </div>
                <span className="font-extrabold text-[10px] text-white truncate max-w-[80px] mt-1.5 uppercase block">{activeRankings[1].player_name.split(' ')[0]}</span>
                <span className="text-[8px] text-beyblade-silver font-black font-esports tracking-wider">{activeRankings[1].total_points} PTS</span>
                <div className="w-full bg-beyblade-silver/10 border border-beyblade-silver/20 h-10 rounded-t-lg mt-2 relative flex items-center justify-center">
                  <span className="text-[10px] font-black text-beyblade-silver font-esports">II</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {activeRankings[0] && (
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-beyblade-gold to-yellow-400 border border-beyblade-gold flex items-center justify-center shadow-lg">
                  <span className="font-title text-xs text-beyblade-darker">{getPlayerInitials(activeRankings[0].player_name)}</span>
                  <span className="absolute -top-4 text-sm animate-bounce [animation-duration:3s]">👑</span>
                  <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-beyblade-gold text-beyblade-darker border border-beyblade-gold/50 font-black font-esports text-[9px] flex items-center justify-center shadow-md">1</div>
                </div>
                <span className="font-black text-xs text-white truncate max-w-[90px] mt-1.5 uppercase block">{activeRankings[0].player_name.split(' ')[0]}</span>
                <span className="text-[9px] text-beyblade-gold font-black font-esports tracking-wider">{activeRankings[0].total_points} PTS</span>
                <div className="w-full bg-beyblade-gold/10 border border-beyblade-gold/30 h-14 rounded-t-lg mt-2 relative flex items-center justify-center">
                  <span className="text-xs font-black text-beyblade-gold font-esports">I</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {activeRankings[2] && (
              <div className="flex flex-col items-center flex-1">
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-beyblade-bronze to-amber-700 border border-beyblade-bronze flex items-center justify-center shadow-md">
                  <span className="font-title text-[10px] text-white">{getPlayerInitials(activeRankings[2].player_name)}</span>
                  <div className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 rounded-full bg-beyblade-bronze/20 text-beyblade-bronze border border-beyblade-bronze/30 font-black font-esports text-[8px] flex items-center justify-center shadow-sm">3</div>
                </div>
                <span className="font-extrabold text-[10px] text-white truncate max-w-[80px] mt-1.5 uppercase block">{activeRankings[2].player_name.split(' ')[0]}</span>
                <span className="text-[8px] text-beyblade-bronze font-black font-esports tracking-wider">{activeRankings[2].total_points} PTS</span>
                <div className="w-full bg-beyblade-bronze/10 border border-beyblade-bronze/20 h-7 rounded-t-lg mt-2 relative flex items-center justify-center">
                  <span className="text-[10px] font-black text-beyblade-bronze font-esports">III</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 4. Dónde jugar / dónde comprar */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <MapPin className="h-5 w-5 text-beyblade-electricRed text-glow-red" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest font-esports">
            Dónde Jugar y Comprar
          </h2>
        </div>

        <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden clip-cyber-card shadow-lg text-left">
          <div className="absolute inset-0 tech-grid opacity-[0.03] pointer-events-none"></div>
          
          <div className="flex-1 space-y-3 z-10">
            <h3 className="text-lg font-title text-white uppercase tracking-wider">Mapa Blader Oficial de Uruguay</h3>
            <p className="text-xs text-gray-300 leading-relaxed font-semibold max-w-xl">
              Encuentra arenas de juego, clubes de competidores y jugueterías oficiales con stock certificado de Beyblade X de Hasbro cerca de ti.
            </p>
            <Link 
              to="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-beyblade-electricCyan text-beyblade-darker font-black font-esports text-[10px] uppercase tracking-widest rounded-lg hover:bg-white transition-all shadow-md mt-2"
            >
              Ver Mapa Oficial
            </Link>
          </div>

          {/* Styled Radar Map Mini Placeholder */}
          <div className="w-full md:w-56 h-36 bg-beyblade-darker/70 border border-white/5 rounded-2xl relative overflow-hidden shrink-0 flex items-center justify-center z-10 select-none">
            <div className="absolute inset-0 tech-grid opacity-25"></div>
            <svg className="w-40 h-40 text-beyblade-electricCyan/5" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" />
            </svg>
            
            {/* Pulsing indicators */}
            <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-beyblade-electricCyan/25 border border-beyblade-electricCyan flex items-center justify-center shadow-lg animate-ping [animation-duration:3s]">
              <div className="w-1.5 h-1.5 rounded-full bg-beyblade-electricCyan"></div>
            </div>
            <div className="absolute bottom-1/3 right-1/4 w-3 h-3 rounded-full bg-beyblade-electricRed/25 border border-beyblade-electricRed flex items-center justify-center shadow-lg animate-ping [animation-duration:2.5s]">
              <div className="w-1.5 h-1.5 rounded-full bg-beyblade-electricRed"></div>
            </div>
            <span className="absolute bottom-2 text-[7px] text-gray-500 font-mono uppercase tracking-widest">MAP ACTIVE</span>
          </div>
        </div>
      </section>

      {/* 5. Noticias y Jornadas */}
      {newsAndJourneys.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-beyblade-electricCyan" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest font-esports">
                Noticias y Jornadas
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {newsAndJourneys.map((item) => (
              <div 
                key={item.id}
                className="bg-beyblade-card border border-white/5 rounded-2xl p-4.5 space-y-3 hover:border-white/15 transition-all duration-300 flex flex-col justify-between min-h-[140px] clip-cyber-card shadow-md text-left"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase font-esports tracking-wider">
                    <span className={`px-2 py-0.5 rounded ${
                      item.type === 'news' 
                        ? 'text-beyblade-electricCyan bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/25' 
                        : 'text-amber-400 bg-amber-400/10 border border-amber-400/25'
                    }`}>
                      {item.type === 'news' ? 'Noticia UY' : 'Jornada'}
                    </span>
                    <span className="text-gray-500">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-title text-xs text-white uppercase tracking-wider line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed font-semibold">{item.content}</p>
                </div>
                <Link to={item.url} className="text-[9px] font-black font-esports uppercase tracking-widest text-beyblade-electricCyan hover:underline inline-flex items-center gap-0.5 mt-2">
                  Ver más <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer Deportivo Oficial */}
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
