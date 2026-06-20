import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, MapPin, Sparkles, BookOpen, ChevronRight, Newspaper, Calendar, Award } from 'lucide-react';
import { DbService } from '../services/dbService';
import type { Tournament, RankingEntry, NewsItem } from '../services/dbService';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [topRankings, setTopRankings] = useState<RankingEntry[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Get tournaments
      const tours = await DbService.getTournamentsList();
      const upcoming = tours
        .filter(t => t.status === 'publicado')
        .slice(0, 2);
      setUpcomingTournaments(upcoming);

      // Get rankings
      const allRanks = await DbService.getRankingsList();
      const sorted = [...allRanks].sort((a, b) => b.total_points - a.total_points).slice(0, 3);
      setTopRankings(sorted);

      // Get news
      const allNews = await DbService.getNews();
      setNews(allNews.slice(0, 3));
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-12">
      {/* 1. Cinematic Hero Section */}
      <section className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-beyblade-dark via-beyblade-card to-[#040912] border border-white/10 py-16 px-6 md:px-16 text-center md:text-left flex flex-col lg:flex-row items-center gap-12 shadow-[0_15px_35px_rgba(0,240,255,0.05)] tech-grid speed-lines">
        {/* Floating cyber energy particles */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-beyblade-electricCyan/30 blur-[2px] animate-float-p1 top-10 left-12" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-beyblade-electricRed/40 blur-[1px] animate-float-p2 top-1/4 right-24" />
        <div className="absolute w-3 h-3 rounded-full bg-beyblade-electricCyan/20 blur-[3px] animate-float-p1 bottom-12 left-1/2" />
        <div className="absolute w-2 h-2 rounded-full bg-beyblade-electricRed/30 blur-[2px] animate-float-p2 bottom-20 left-20" />
        
        {/* Radial ambient background glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-beyblade-electricCyan/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-beyblade-electricRed/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex-1 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 text-beyblade-electricCyan text-[10px] font-black font-esports uppercase tracking-widest animate-pulse">
            <Sparkles className="h-3 w-3" /> Uruguay Ecosistema Certificado
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase leading-none font-esports">
            <span className="font-title text-transparent bg-clip-text bg-gradient-to-r from-beyblade-electricCyan via-white to-beyblade-electricRed drop-shadow-[0_0_10px_rgba(0,240,255,0.25)]">
              BEYBLADE X
            </span> 
            <br />
            <span className="text-glow-red text-beyblade-electricRed block mt-1 tracking-wider">
              LIGA LATAM
            </span>
          </h1>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-lg">
            Prepárate para la aceleración Xtreme. Regístrate oficialmente como competidor, inscríbete en los torneos nacionales y escala posiciones hacia la cima del ranking latinoamericano.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
            <Link
              to="/register"
              className="px-8 py-4.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports tracking-widest rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-center text-sm shadow-neon-cyan uppercase flex items-center justify-center gap-2"
            >
              Unirme a la competencia
            </Link>
            <Link
              to="/tournaments"
              className="px-8 py-4.5 bg-beyblade-card/60 border border-white/10 hover:border-beyblade-electricCyan/40 hover:bg-white/5 text-white font-black font-esports tracking-widest rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-center text-sm uppercase flex items-center justify-center"
            >
              Ver Torneos
            </Link>
          </div>
        </div>

        {/* Visual spinning Beyblade mockup inside cards */}
        <div className="relative flex-1 flex justify-center items-center z-10 select-none">
          <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
            
            {/* Outer animated orbits */}
            <div className="absolute inset-0 border-2 border-dashed border-beyblade-electricCyan/20 rounded-full animate-orbit-cw"></div>
            <div className="absolute inset-6 border border-beyblade-electricRed/15 rounded-full animate-orbit-ccw"></div>
            
            {/* X-Line Rail Track (Concentric glowing ring representing stadium acceleration) */}
            <div className="absolute inset-12 border-4 border-double border-beyblade-electricCyan/45 rounded-full animate-x-pulse shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-center justify-center">
              {/* Pulsing accelerator tick lines */}
              <div className="absolute w-[103%] h-0.5 bg-beyblade-electricCyan/30 rotate-45"></div>
              <div className="absolute w-[103%] h-0.5 bg-beyblade-electricCyan/30 -rotate-45"></div>
              <div className="absolute w-[103%] h-0.5 bg-beyblade-electricCyan/30 rotate-[90deg]"></div>
            </div>

            {/* Inner Cyber Spinner Decors */}
            <div className="absolute inset-20 border border-white/5 rounded-full flex items-center justify-center bg-beyblade-darker/40 backdrop-blur-sm">
              <svg className="w-full h-full text-beyblade-electricCyan/5 opacity-40 animate-orbit-cw [animation-duration:35s]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" strokeDasharray="3, 3" fill="none" />
                <path d="M50 5 L50 95 M5 50 L95 50" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>
            
            {/* Central Graphic representing Xtreme gear (Rotating Beyblade Core) */}
            <div className="w-52 h-52 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-beyblade-electricRed via-beyblade-dark to-beyblade-electricCyan p-1 animate-orbit-cw [animation-duration:2.5s] shadow-[0_0_35px_rgba(0,240,255,0.25)] hover:[animation-duration:1s] transition-all">
              <div className="w-full h-full rounded-full bg-beyblade-card flex flex-col items-center justify-center relative overflow-hidden">
                {/* Radial speed burst overlays */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)] z-10" />
                
                {/* Visual Gear Accelerators */}
                <div className="absolute top-3 w-2 h-7 bg-beyblade-electricCyan rounded-full shadow-[0_0_10px_#00F0FF]"></div>
                <div className="absolute bottom-3 w-2 h-7 bg-beyblade-electricRed rounded-full shadow-[0_0_10px_#FF0055]"></div>
                <div className="absolute left-3 h-2 w-7 bg-beyblade-gold rounded-full shadow-[0_0_10px_#FFD700]"></div>
                <div className="absolute right-3 h-2 w-7 bg-white rounded-full shadow-[0_0_10px_#FFF]"></div>
                
                <span className="text-white font-title text-xl md:text-2xl tracking-widest text-glow-cyan z-20">X-LINE</span>
                <span className="text-[9px] text-gray-400 font-esports font-black tracking-wider uppercase mt-1 z-20">XTREME ACCEL</span>
                <span className="text-[7px] text-[#00F0FF] font-mono font-bold tracking-widest uppercase opacity-75 mt-0.5 z-20">GEAR RATIO 12:1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Grid Sections (Tournaments & Leaderboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upcoming Tournaments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest font-esports">
              <Trophy className="h-5 w-5 text-beyblade-electricCyan" />
              Próximos Torneos Oficiales
            </h2>
            <Link to="/tournaments" className="text-xs font-esports font-bold tracking-wider text-beyblade-electricCyan hover:text-white uppercase transition-colors flex items-center gap-1">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {upcomingTournaments.length > 0 ? (
              upcomingTournaments.map((t) => (
                <div 
                  key={t.id}
                  onClick={() => navigate(`/tournaments`)}
                  className="group bg-beyblade-card hover:bg-beyblade-card/90 border border-white/5 hover:border-beyblade-electricCyan/20 p-5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden clip-cyber-card shadow-lg hover:shadow-[0_0_15px_rgba(0,240,255,0.08)] hover:-translate-y-0.5"
                >
                  {/* Left-side decor line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-beyblade-electricCyan to-beyblade-electricRed"></div>
                  
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/25 px-2 py-0.5 rounded text-[8px] font-black font-esports tracking-widest uppercase">
                        OFICIAL CERTIFICADO
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black font-esports tracking-widest uppercase border ${
                        t.league_id === 'Junior' 
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400/25' 
                          : 'bg-beyblade-electricRed/10 text-beyblade-electricRed border-beyblade-electricRed/25'
                      }`}>
                        Liga {t.league_id}
                      </span>
                    </div>
                    <h3 className="font-title text-base text-white group-hover:text-beyblade-electricCyan transition-colors uppercase tracking-wide">
                      {t.name}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-[11px] text-gray-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-beyblade-electricCyan" /> {t.date} @ {t.time.substring(0, 5)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-beyblade-electricRed" /> {t.locality}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5 justify-between sm:justify-center">
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest font-esports">Cupos Disponibles</p>
                      <p className="text-base font-black text-white">{t.slots_available} <span className="text-xs text-gray-500 font-bold">/ {t.slots_total}</span></p>
                    </div>
                    <button className="px-4 py-2 bg-beyblade-electricCyan/10 text-beyblade-electricCyan group-hover:bg-beyblade-electricCyan group-hover:text-beyblade-darker rounded-lg text-[10px] font-black font-esports uppercase tracking-widest transition-all duration-300 border border-beyblade-electricCyan/20">
                      Acreditarse
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-beyblade-card border border-white/5 p-8 rounded-2xl text-center text-gray-400 text-xs font-semibold clip-cyber-card">
                No hay torneos próximos programados en este momento.
              </div>
            )}
          </div>
        </div>

        {/* Top Rankings Preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest font-esports">
              <Award className="h-5 w-5 text-beyblade-gold" />
              Líderes Nacionales
            </h2>
            <Link to="/rankings" className="text-xs font-esports font-bold tracking-wider text-beyblade-gold hover:text-white uppercase transition-colors flex items-center gap-1">
              Ver tabla <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-beyblade-card border border-white/5 rounded-2xl p-4 divide-y divide-white/5 space-y-1 clip-cyber-card shadow-lg">
            {topRankings.map((r, idx) => (
              <div key={r.player_id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center font-black font-esports text-xs ${
                    idx === 0 
                      ? 'bg-beyblade-gold/15 text-beyblade-gold border border-beyblade-gold/40 shadow-[0_0_10px_rgba(255,215,0,0.15)]' 
                      : idx === 1 
                        ? 'bg-beyblade-silver/15 text-beyblade-silver border border-beyblade-silver/30' 
                        : 'bg-beyblade-bronze/15 text-beyblade-bronze border border-beyblade-bronze/30'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white uppercase tracking-wide">{r.player_name}</h4>
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider font-esports">
                      {r.locality} • Liga {r.league_id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-beyblade-electricCyan tracking-wider font-esports">{r.total_points} PTS</span>
                  <p className="text-[8px] text-gray-500 font-extrabold uppercase font-esports tracking-wider">{r.tournaments_played} Torneos</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Certifications Link */}
          <div className="bg-gradient-to-br from-beyblade-card to-[#050B14] border border-beyblade-electricCyan/15 rounded-2xl p-5 text-center space-y-4 clip-cyber-card shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-beyblade-electricCyan/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="font-title text-xs text-white uppercase tracking-widest">¿Dónde comprar Beyblade X?</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">Encuentra distribuidores oficiales Hasbro autorizados en Uruguay con stock original verificado.</p>
            <Link 
              to="/stores" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 hover:border-beyblade-electricCyan hover:bg-beyblade-electricCyan/20 text-beyblade-electricCyan hover:text-white text-[10px] font-black font-esports uppercase tracking-widest rounded-lg transition-all shadow-[0_0_12px_rgba(0,240,255,0.05)]"
            >
              <MapPin className="h-3.5 w-3.5" /> Buscar Tiendas
            </Link>
          </div>
        </div>
      </div>

      {/* 3. News & Academia Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Academia Beyblade */}
        <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 clip-cyber-card shadow-lg relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-24 h-24 bg-beyblade-electricCyan/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <div className="p-3 bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 text-beyblade-electricCyan rounded-2xl w-fit">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-title text-white uppercase tracking-wider">Academia Beyblade</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-semibold">
              ¿Eres nuevo en la arena? Aprende las reglas oficiales de Beyblade X, consejos de ensamble (Blades, Ratchets, Bits), técnicas de lanzamiento y estrategias para dominar el Xtreme Finish.
            </p>
          </div>
          <Link
            to="/academy"
            className="flex items-center justify-between px-4 py-3.5 bg-white/5 hover:bg-beyblade-electricCyan/10 hover:text-beyblade-electricCyan border border-white/5 hover:border-beyblade-electricCyan/30 rounded-xl text-[10px] font-black font-esports uppercase tracking-widest transition-all group"
          >
            Aprender a Jugar
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* News & Launches (Dynamic list) */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest font-esports">
              <Newspaper className="h-5 w-5 text-beyblade-electricCyan" />
              Noticias y Lanzamientos Oficiales
            </h2>
            <Link to="/news" className="text-xs font-esports font-bold tracking-wider text-beyblade-electricCyan hover:text-white uppercase transition-colors flex items-center gap-1">
              Ver más <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {news.map(n => (
              <div 
                key={n.id}
                className="bg-beyblade-card border border-white/5 rounded-2xl p-5 space-y-4 hover:border-white/15 transition-all duration-300 flex flex-col justify-between clip-cyber-card shadow-md text-left"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black font-esports tracking-widest text-beyblade-electricRed uppercase bg-beyblade-electricRed/10 border border-beyblade-electricRed/25 px-2 py-0.5 rounded">
                      {n.country_id ? `${n.country_id} oficial` : 'Global'}
                    </span>
                    <span className="text-[9px] text-gray-500 font-extrabold uppercase font-esports tracking-wider">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-title text-xs text-white uppercase tracking-wider line-clamp-1">{n.title}</h4>
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed font-semibold">{n.content}</p>
                </div>
                <Link to="/news" className="text-[10px] font-black font-esports uppercase tracking-widest text-beyblade-electricCyan hover:underline inline-flex items-center gap-1 mt-2">
                  Leer noticia <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
