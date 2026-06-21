import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Trophy, Calendar, MapPin, ShieldAlert, Award as BadgeIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { DbService } from '../services/dbService';
import type { Player, TournamentResult, PlayerStatistics } from '../services/dbService';
import { NotificationPreferences } from '../components/NotificationPreferences';

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [nationalRank, setNationalRank] = useState<number>(0);
  const [localRank, setLocalRank] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [tournamentsPlayed, setTournamentsPlayed] = useState<number>(0);
  const [history, setHistory] = useState<(TournamentResult & { tournamentName: string; date: string })[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStatistics | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'historial' | 'carrera'>('carrera');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setLoggedInUserId(session.user.id);
      }
    };
    fetchSession();
  }, []);


  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      setLoading(true);

      const p = await DbService.getPlayerById(id);
      if (p) {
        setPlayer(p);

        // Fetch Player Statistics
        try {
          const stats = await DbService.getPlayerStatistics(p.id);
          setPlayerStats(stats);
        } catch (err) {
          console.error('Error fetching player statistics:', err);
        }

        // Calculate Rankings and Stats
        const rankings = await DbService.getRankingsList();
        
        // National Rank position (same league)
        const leagueRanks = [...rankings]
          .filter(r => r.league_id === p.league_id && r.country_id === p.country_id)
          .sort((a, b) => b.total_points - a.total_points);
        const natIndex = leagueRanks.findIndex(r => r.player_id === p.id);
        setNationalRank(natIndex !== -1 ? natIndex + 1 : leagueRanks.length + 1);

        // Locality Rank position (same league and locality)
        const localRanks = [...rankings]
          .filter(r => r.league_id === p.league_id && r.locality.toLowerCase() === p.locality.toLowerCase())
          .sort((a, b) => b.total_points - a.total_points);
        const locIndex = localRanks.findIndex(r => r.player_id === p.id);
        setLocalRank(locIndex !== -1 ? locIndex + 1 : localRanks.length + 1);

        // Total Points
        const playerRank = rankings.find(r => r.player_id === p.id);
        setPoints(playerRank ? playerRank.total_points : 0);
        setTournamentsPlayed(playerRank ? playerRank.tournaments_played : 0);

        // Fetch tournament results history
        const allTournaments = await DbService.getTournamentsList();
        const results = await DbService.getPlayerResults(p.id);
        
        // Filter results for this player
        const playerResults = results.filter(r => r.validated_by_distributor);
        
        const historyDetails = playerResults.map(res => {
          const tour = allTournaments.find(t => t.id === res.tournament_id);
          return {
            ...res,
            tournamentName: tour ? tour.name : 'Torneo Oficial',
            date: tour ? tour.date : 'Fecha Desconocida'
          };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setHistory(historyDetails);
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-beyblade-electricCyan border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">Cargando perfil oficial de Beyblade...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-md mx-auto bg-beyblade-card border border-white/5 rounded-3xl p-8 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-beyblade-electricRed mx-auto" />
        <h2 className="text-xl font-bold text-white uppercase">Perfil No Encontrado</h2>
        <p className="text-sm text-gray-400">El ID de jugador especificado no existe o no ha sido aprobado aún.</p>
        <Link to="/" className="inline-block px-6 py-2.5 bg-beyblade-electricCyan text-beyblade-darker font-bold rounded-lg text-sm">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  // Badges calculation logic
  const badges = [
    { title: 'Pionero', description: 'Registrado en el lanzamiento piloto UY.', active: true, icon: BadgeIcon, color: 'text-amber-400' },
    { title: 'Primer Combate', description: 'Completó al menos 1 torneo.', active: tournamentsPlayed >= 1, icon: Trophy, color: 'text-beyblade-electricCyan' },
    { title: 'Podio Oficial', description: 'Logró 1º, 2º o 3º puesto.', active: history.some(h => h.position <= 3), icon: Award, color: 'text-beyblade-gold' },
    { title: 'Coleccionista', description: 'Más de 3 torneos jugados.', active: tournamentsPlayed >= 3, icon: BadgeIcon, color: 'text-pink-500' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header Card */}
      <section className="bg-beyblade-card border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-beyblade-electricCyan/10 rounded-full blur-3xl"></div>
        
        {/* Avatar */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-beyblade-electricCyan to-beyblade-electricRed p-1 shrink-0">
          <div className="w-full h-full rounded-2xl bg-beyblade-dark flex items-center justify-center text-4xl md:text-5xl font-black text-white">
            {player.first_name[0]}
          </div>
        </div>

        {/* Player Details */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                player.league_id === 'Junior' 
                  ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                  : 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/20'
              }`}>
                Liga {player.league_id}
              </span>
              <span className="bg-white/5 border border-white/10 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <MapPin className="h-3 w-3 text-beyblade-electricCyan" /> {player.locality}, {player.country_id}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">{player.first_name} {player.last_name}</h1>
            <p className="text-xs text-gray-500">Miembro desde {new Date(player.created_at).toLocaleDateString()}</p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-beyblade-darker/60 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Puntos Totales</p>
              <p className="text-lg font-black text-beyblade-electricCyan">{points} pts</p>
            </div>
            <div className="bg-beyblade-darker/60 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Rango Nacional</p>
              <p className="text-lg font-black text-white">#{nationalRank}</p>
            </div>
            <div className="bg-beyblade-darker/60 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Rango Local</p>
              <p className="text-lg font-black text-white">#{localRank}</p>
            </div>
            <div className="bg-beyblade-darker/60 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Torneos Jugados</p>
              <p className="text-lg font-black text-white">{tournamentsPlayed}</p>
            </div>
          </div>
        </div>

        {/* QR Code Container for check-in */}
        <div className="bg-beyblade-dark border border-white/5 rounded-2xl p-4 text-center space-y-2 w-48 shrink-0">
          <div className="w-28 h-28 mx-auto bg-white p-1.5 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=02050a&data=${encodeURIComponent(
                JSON.stringify({
                  player_id: player.id,
                  bey_id: player.qr_code_token,
                  nombre: `${player.first_name} ${player.last_name}`,
                  hash_validation: `BEY-${player.qr_code_token}-${player.id.substring(0, 8)}`
                })
              )}`}
              alt="Scan Check-in QR" 
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Código de Check-in</p>
            <p className="text-[9px] text-beyblade-electricCyan font-mono">{player.qr_code_token}</p>
          </div>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="flex bg-beyblade-card p-1 rounded-xl border border-white/5 self-start max-w-xs">
        <button
          onClick={() => setProfileActiveTab('carrera')}
          className={`flex-1 px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all duration-200 ${
            profileActiveTab === 'carrera' 
              ? 'bg-beyblade-electricCyan text-beyblade-darker shadow-[0_0_12px_rgba(0,240,255,0.35)]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Mi Carrera
        </button>
        <button
          onClick={() => setProfileActiveTab('historial')}
          className={`flex-1 px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all duration-200 ${
            profileActiveTab === 'historial' 
              ? 'bg-beyblade-electricCyan text-beyblade-darker shadow-[0_0_12px_rgba(0,240,255,0.35)]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Actividad
        </button>
      </div>

      {profileActiveTab === 'carrera' ? (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Main stats cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Combat Record Card */}
            <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden clip-cyber-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-beyblade-electricCyan/5 rounded-full blur-2xl"></div>
              <h3 className="text-xs text-gray-400 font-black font-esports uppercase tracking-widest mb-4">Registro de Combates</h3>
              
              <div className="flex items-center justify-around py-4">
                <div className="text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Victorias</span>
                  <span className="text-3xl font-black text-emerald-400 font-esports tracking-wide">{playerStats?.wins ?? 0}</span>
                </div>
                <div className="h-10 w-[1px] bg-white/5"></div>
                <div className="text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Derrotas</span>
                  <span className="text-3xl font-black text-beyblade-electricRed font-esports tracking-wide">{playerStats?.losses ?? 0}</span>
                </div>
              </div>

              <div className="mt-4 bg-black/30 rounded-2xl p-4 border border-white/5 text-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Tasa de Victorias (Win Rate)</span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-black text-beyblade-electricCyan font-esports">
                    {playerStats?.win_rate !== undefined ? Number(playerStats.win_rate).toFixed(1) : '0.0'}%
                  </span>
                  <div className="flex-1 max-w-[120px] bg-white/5 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-beyblade-electricCyan h-full shadow-neon-cyan rounded-full" 
                      style={{ width: `${Math.min(playerStats?.win_rate ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Overview Card */}
            <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden clip-cyber-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-beyblade-gold/5 rounded-full blur-2xl"></div>
              <h3 className="text-xs text-gray-400 font-black font-esports uppercase tracking-widest mb-4">Eficiencia Competitiva</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 font-bold">Torneos Jugados</span>
                  <span className="font-extrabold text-white text-sm">{playerStats?.tournaments_played ?? 0}</span>
                </div>
                
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 font-bold">Puntos Totales</span>
                  <span className="font-extrabold text-beyblade-electricCyan text-sm">{playerStats?.points_total ?? 0} PTS</span>
                </div>
                
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 font-bold">Promedio de Puntos</span>
                  <span className="font-extrabold text-white text-sm">
                    {playerStats?.tournaments_played ? ((playerStats.points_total / playerStats.tournaments_played).toFixed(1)) : '0.0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Competitive Rank Info Card */}
            <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden clip-cyber-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-beyblade-electricRed/5 rounded-full blur-2xl"></div>
              <h3 className="text-xs text-gray-400 font-black font-esports uppercase tracking-widest mb-4">Estado del Ranking</h3>
              
              <div className="space-y-4">
                <div className="text-center py-2">
                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block mb-1">Rango Nacional</span>
                  <span className="text-3xl font-black text-white font-esports">#{nationalRank}</span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 font-bold">Rango Local ({player.locality})</span>
                  <span className="font-extrabold text-white text-sm">#{localRank}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Podiums Breakdown */}
          <div className="space-y-4 text-left">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-white/5 pb-2">Desglose de Podios Obtenidos</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* 1st Place */}
              <div className="bg-gradient-to-t from-beyblade-card to-beyblade-gold/5 border border-beyblade-gold/20 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden clip-cyber-card">
                <div className="text-2xl">👑</div>
                <div>
                  <span className="text-[10px] text-beyblade-gold uppercase font-black tracking-widest block">Campeón</span>
                  <span className="text-sm text-gray-400 font-bold block">1º Puesto</span>
                </div>
                <div className="text-2xl font-black text-white font-esports">{playerStats?.podiums_first ?? 0}</div>
              </div>

              {/* 2nd Place */}
              <div className="bg-gradient-to-t from-beyblade-card to-beyblade-silver/5 border border-beyblade-silver/20 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden clip-cyber-card">
                <div className="text-2xl">🥈</div>
                <div>
                  <span className="text-[10px] text-beyblade-silver uppercase font-black tracking-widest block">Subcampeón</span>
                  <span className="text-sm text-gray-400 font-bold block">2º Puesto</span>
                </div>
                <div className="text-2xl font-black text-white font-esports">{playerStats?.podiums_second ?? 0}</div>
              </div>

              {/* 3rd Place */}
              <div className="bg-gradient-to-t from-beyblade-card to-beyblade-bronze/5 border border-beyblade-bronze/20 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden clip-cyber-card">
                <div className="text-2xl">🥉</div>
                <div>
                  <span className="text-[10px] text-beyblade-bronze uppercase font-black tracking-widest block">Tercer Lugar</span>
                  <span className="text-sm text-gray-400 font-bold block">3º Puesto</span>
                </div>
                <div className="text-2xl font-black text-white font-esports">{playerStats?.podiums_third ?? 0}</div>
              </div>

              {/* 4th Place */}
              <div className="bg-gradient-to-t from-beyblade-card to-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden clip-cyber-card">
                <div className="text-2xl">🏅</div>
                <div>
                  <span className="text-[10px] text-gray-300 uppercase font-black tracking-widest block">Cuarto Lugar</span>
                  <span className="text-sm text-gray-400 font-bold block">4º Puesto</span>
                </div>
                <div className="text-2xl font-black text-white font-esports">{playerStats?.podiums_fourth ?? 0}</div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          {/* Results History */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-extrabold text-white uppercase tracking-wide border-b border-white/5 pb-3">
              Historial de Competencia
            </h2>
            
            <div className="space-y-4">
              {history.length > 0 ? (
                history.map((h) => (
                  <div key={h.id} className="bg-beyblade-card border border-white/5 rounded-xl p-4 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-white text-sm">{h.tournamentName}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {h.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Posición</span>
                        <span className={`font-black text-base ${
                          h.position === 1 ? 'text-beyblade-gold' : h.position === 2 ? 'text-beyblade-silver' : 'text-white'
                        }`}>
                          {h.position}º Puesto
                        </span>
                      </div>
                      <div className="pl-4 border-l border-white/5">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Puntos</span>
                        <span className="font-black text-base text-beyblade-electricCyan">+{h.points_awarded}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-beyblade-card border border-white/5 rounded-2xl p-8 text-center text-gray-400 text-sm">
                  Aún no has competido en torneos oficiales validados. ¡Inscríbete en el próximo torneo para sumar puntos!
                </div>
              )}
            </div>
          </div>

          {/* Badges / Badges list */}
          <div className="space-y-6">
            <h2 className="text-lg font-extrabold text-white uppercase tracking-wide border-b border-white/5 pb-3">
              Logros Obtenidos
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {badges.map((b, idx) => {
                const Icon = b.icon;
                return (
                  <div 
                    key={idx} 
                    className={`bg-beyblade-card border rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 ${
                      b.active 
                        ? 'border-white/5 opacity-100' 
                        : 'border-white/5 opacity-40 grayscale select-none'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl bg-black/40 ${b.active ? b.color : 'text-gray-600'}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{b.title}</h4>
                      <p className="text-xs text-gray-400">{b.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Notification Preferences Section (Only visible for the owner of the profile) */}
      {loggedInUserId === player.id && (
        <section className="pt-4 animate-fade-in">
          <NotificationPreferences userId={player.id} />
        </section>
      )}
    </div>
  );
};
