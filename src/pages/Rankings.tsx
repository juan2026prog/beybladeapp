import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, MapPin, Search, ChevronRight, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { DbService } from '../services/dbService';
import type { RankingEntry, Season } from '../services/dbService';

// Helper to extract player initials for cyber-avatars
const getPlayerInitials = (name: string) => {
  if (!name) return 'BY';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Memoized table row component for rankings
const RankingRow = React.memo(({ r, rankPos }: { r: RankingEntry; rankPos: number }) => {
  const isPodium = rankPos <= 3;
  const initials = getPlayerInitials(r.player_name);
  
  return (
    <tr 
      className="hover:bg-white/5 transition-all duration-200 cursor-pointer group border-b border-white/5"
    >
      <td className="py-4 px-6 text-center font-bold">
        {isPodium ? (
          <span className={`inline-flex w-7 h-7 rounded-lg items-center justify-center font-black font-esports text-xs ${
            rankPos === 1 
              ? 'bg-beyblade-gold/15 text-beyblade-gold border border-beyblade-gold/30 shadow-[0_0_10px_rgba(255,215,0,0.2)]' 
              : rankPos === 2 
                ? 'bg-beyblade-silver/15 text-beyblade-silver border border-beyblade-silver/20' 
                : 'bg-beyblade-bronze/15 text-beyblade-bronze border border-beyblade-bronze/20'
          }`}>
            {rankPos}
          </span>
        ) : (
          <span className="text-gray-500 font-extrabold font-esports">{rankPos}</span>
        )}
      </td>
      <td className="py-4 px-4">
        <Link 
          to={`/profile/${r.player_id}`}
          className="font-extrabold text-white hover:text-beyblade-electricCyan transition-colors flex items-center gap-3 group/link"
        >
          {/* Avatar Bubble */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black font-esports border ${
            rankPos === 1 
              ? 'bg-beyblade-gold/10 text-beyblade-gold border-beyblade-gold/40' 
              : rankPos === 2 
                ? 'bg-beyblade-silver/10 text-beyblade-silver border-beyblade-silver/30'
                : rankPos === 3
                  ? 'bg-beyblade-bronze/10 text-beyblade-bronze border-beyblade-bronze/30'
                  : 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border-beyblade-electricCyan/20'
          }`}>
            {initials}
          </div>
          <span className="uppercase tracking-wide group-hover/link:translate-x-0.5 transition-transform">{r.player_name}</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover/link:opacity-100 transition-all text-beyblade-electricCyan shrink-0" />
        </Link>
      </td>
      <td className="py-4 px-4 font-bold text-gray-400 font-esports uppercase tracking-wider">
        {r.locality}
      </td>
      <td className="py-4 px-4 text-center font-black font-esports text-sm text-gray-300">
        {r.tournaments_played}
      </td>
      <td className="py-4 px-6 text-right">
        <span className="font-black text-sm text-beyblade-electricCyan font-esports tracking-wider">{r.total_points} PTS</span>
      </td>
    </tr>
  );
});

RankingRow.displayName = 'RankingRow';

export const Rankings: React.FC = () => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<'Junior' | 'Open'>('Open');
  const [selectedCountry, setSelectedCountry] = useState<string>('UY');
  const [selectedLocality, setSelectedLocality] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('Global');
  const [localities, setLocalities] = useState<string[]>([]);

  // Fetch initial lookup lists (Seasons and Localities)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [seasonData, localityData] = await Promise.all([
          DbService.getSeasons(),
          DbService.getLocalities()
        ]);
        const visibleSeasons = seasonData.filter(s => s.status === 'active' || s.status === 'completed');
        setSeasons(visibleSeasons);
        
        const locNames = Array.from(new Set(localityData.map(l => l.name))).sort();
        setLocalities(locNames);
      } catch (err) {
        console.error('Error fetching rankings metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch rankings whenever selectedSeason changes
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        let data: RankingEntry[] = [];
        if (selectedSeason === 'Global') {
          data = await DbService.getRankingsList();
        } else {
          data = await DbService.getSeasonRankings(selectedSeason);
        }
        setRankings(data);
      } catch (err) {
        console.error('Error fetching rankings list:', err);
      }
    };
    fetchRankings();
  }, [selectedSeason]);

  // Filter rankings memoized to avoid redundant computation on re-renders
  const filteredRankings = useMemo(() => {
    return rankings
      .filter(r => {
        if (r.league_id !== selectedLeague) return false;
        if (r.country_id !== selectedCountry) return false;
        if (selectedLocality !== 'Todos' && r.locality.toLowerCase() !== selectedLocality.toLowerCase()) return false;
        if (searchQuery && !r.player_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.total_points - a.total_points);
  }, [rankings, selectedLeague, selectedCountry, selectedLocality, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/5 pb-4 space-y-1">
        <h1 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
          <Award className="h-6 w-6 text-beyblade-gold" /> Rankings Oficiales Beyblade
        </h1>
        <p className="text-xs text-gray-400">Clasificación nacional e internacional oficial basada en los resultados validados de torneos.</p>
      </div>

      {/* Filters Board */}
      <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* League Tabs */}
          <div className="flex bg-beyblade-darker p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setSelectedLeague('Junior')}
              className={`px-5 py-2 rounded-lg font-bold text-xs uppercase transition-colors ${
                selectedLeague === 'Junior' 
                  ? 'bg-amber-400 text-beyblade-darker shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Liga Junior (6-14)
            </button>
            <button
              onClick={() => setSelectedLeague('Open')}
              className={`px-5 py-2 rounded-lg font-bold text-xs uppercase transition-colors ${
                selectedLeague === 'Open' 
                  ? 'bg-beyblade-electricCyan text-beyblade-darker shadow-neon-cyan' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Liga Open (14+)
            </button>
          </div>

          {/* Territory & Season selects */}
          <div className="flex flex-wrap gap-3">
            {/* Season Selector */}
            <div className="flex items-center gap-2 bg-beyblade-darker px-3 py-1.5 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-gray-500">Temporada:</span>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="Global">Histórico (Todas)</option>
                {seasons.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status === 'active' ? 'Activa' : 'Finalizada'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-beyblade-darker px-3 py-1.5 rounded-xl border border-white/5">
              <Globe className="h-4 w-4 text-gray-500" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="UY">Uruguay</option>
                <option value="AR">Argentina (Próximamente)</option>
                <option value="BR">Brasil (Próximamente)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-beyblade-darker px-3 py-1.5 rounded-xl border border-white/5">
              <MapPin className="h-4 w-4 text-gray-500" />
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="Todos">Todas las Localidades</option>
                {localities.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar jugador por nombre..."
            className="w-full bg-beyblade-darker border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-beyblade-electricCyan"
          />
        </div>
      </div>

      {/* Podium spotlight (Top 3 Visual Layout) */}
      {filteredRankings.length >= 3 && !searchQuery && (
        <section className="grid grid-cols-3 gap-4 max-w-xl mx-auto pt-10 pb-4 items-end select-none">
          
          {/* 2nd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-beyblade-card/90 border border-white/5 rounded-t-3xl p-4 text-center h-44 flex flex-col justify-between relative clip-cyber-card shadow-lg"
          >
            {/* Rank bubble */}
            <div className="absolute top-2 left-3 w-6 h-6 rounded-lg bg-beyblade-silver/20 text-beyblade-silver border border-beyblade-silver/30 font-black font-esports text-xs flex items-center justify-center">
              2
            </div>
            
            <div className="mt-6 flex-1 flex flex-col justify-center">
              {/* Silver Avatar */}
              <div className="relative w-12 h-12 mx-auto mb-2.5 flex items-center justify-center rounded-full bg-gradient-to-tr from-beyblade-silver to-slate-400 border border-beyblade-silver shadow-[0_0_10px_rgba(192,192,192,0.25)]">
                <span className="font-title text-xs text-beyblade-darker">{getPlayerInitials(filteredRankings[1].player_name)}</span>
              </div>
              <h4 className="font-extrabold text-xs text-white truncate uppercase tracking-wide">{filteredRankings[1].player_name}</h4>
              <p className="text-[8px] text-gray-500 font-extrabold font-esports uppercase tracking-widest truncate">{filteredRankings[1].locality}</p>
            </div>

            <div className="bg-beyblade-darker/60 py-1.5 px-2 rounded-lg border border-white/5 mt-2">
              <span className="font-black text-xs text-beyblade-silver font-esports tracking-wider">{filteredRankings[1].total_points} PTS</span>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            initial={{ opacity: 0, y: 70, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
            className="bg-gradient-to-t from-beyblade-card to-beyblade-card/85 border-2 border-beyblade-gold/30 rounded-t-3xl p-5 text-center h-52 flex flex-col justify-between relative shadow-[0_0_25px_rgba(255,215,0,0.12)] z-10"
          >
            {/* Crown & Rank badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-beyblade-gold text-beyblade-darker border border-beyblade-gold/50 font-black font-esports text-sm flex items-center justify-center shadow-[0_0_12px_rgba(255,215,0,0.4)] z-20">
              1
            </div>

            <div className="mt-4 flex-1 flex flex-col justify-center">
              {/* Gold Avatar with Crown */}
              <div className="relative w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-full bg-gradient-to-tr from-beyblade-gold to-yellow-400 border border-beyblade-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                <span className="font-title text-sm text-beyblade-darker">{getPlayerInitials(filteredRankings[0].player_name)}</span>
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-base select-none animate-bounce [animation-duration:3s]">👑</span>
              </div>
              
              <h4 className="font-black text-sm text-white truncate uppercase tracking-wider drop-shadow-sm">{filteredRankings[0].player_name}</h4>
              <p className="text-[8px] text-gray-400 font-extrabold font-esports uppercase tracking-widest truncate">{filteredRankings[0].locality}</p>
            </div>

            <div className="bg-beyblade-darker/80 py-1.5 px-3 rounded-lg border border-beyblade-gold/25 mt-2 shadow-inner">
              <span className="font-black text-sm text-beyblade-gold font-esports tracking-widest">{filteredRankings[0].total_points} PTS</span>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-beyblade-card/90 border border-white/5 rounded-t-3xl p-4 text-center h-38 flex flex-col justify-between relative clip-cyber-card shadow-lg"
          >
            {/* Rank bubble */}
            <div className="absolute top-2 left-3 w-6 h-6 rounded-lg bg-beyblade-bronze/20 text-beyblade-bronze border border-beyblade-bronze/30 font-black font-esports text-xs flex items-center justify-center">
              3
            </div>

            <div className="mt-6 flex-1 flex flex-col justify-center">
              {/* Bronze Avatar */}
              <div className="relative w-11 h-11 mx-auto mb-2 flex items-center justify-center rounded-full bg-gradient-to-tr from-beyblade-bronze to-amber-700 border border-beyblade-bronze shadow-[0_0_8px_rgba(205,127,50,0.25)]">
                <span className="font-title text-xs text-white">{getPlayerInitials(filteredRankings[2].player_name)}</span>
              </div>
              <h4 className="font-extrabold text-xs text-white truncate uppercase tracking-wide">{filteredRankings[2].player_name}</h4>
              <p className="text-[8px] text-gray-500 font-extrabold font-esports uppercase tracking-widest truncate">{filteredRankings[2].locality}</p>
            </div>

            <div className="bg-beyblade-darker/60 py-1.5 px-2 rounded-lg border border-white/5 mt-2">
              <span className="font-black text-xs text-beyblade-bronze font-esports tracking-wider">{filteredRankings[2].total_points} PTS</span>
            </div>
          </motion.div>

        </section>
      )}

      {/* Rankings Leaderboard Table */}
      <div className="bg-beyblade-card border border-white/5 rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/30 border-b border-white/5 text-[10px] text-gray-400 font-black uppercase tracking-wider">
                <th className="py-4 px-6 text-center w-16">Puesto</th>
                <th className="py-4 px-4">Jugador</th>
                <th className="py-4 px-4">Localidad</th>
                <th className="py-4 px-4 text-center w-24">Torneos</th>
                <th className="py-4 px-6 text-right w-32">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-gray-300">
              {filteredRankings.length > 0 ? (
                filteredRankings.map((r, index) => (
                  <RankingRow key={r.player_id} r={r} rankPos={index + 1} />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 px-6 text-center text-gray-500 italic">
                    No hay jugadores clasificados para esta liga o localidad en este momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
