import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Trophy, Calendar, MapPin, Users, Award, Shield, AlertTriangle, CheckCircle, Info, Navigation, Loader2, List, Map } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { DbService } from '../services/dbService';
import type { Tournament, Player, Registration, WaitlistEntry } from '../services/dbService';
import { OpenMap } from '../components/OpenMap';
import type { MapMarker } from '../components/OpenMap';
import { calculateDistanceKm, formatDistance } from '../utils/distance';

export const Tournaments: React.FC = () => {
  const location = useLocation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tournament | null>(null);
  const [registrants, setRegistrants] = useState<Registration[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<any>({ id: 'usr-visitor', role: 'Visitante', email: '' });
  const [currentPlayerData, setCurrentPlayerData] = useState<Player | null>(null);

  // View Mode: list or map
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Geolocation & Distance State
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([-34.9011, -56.1645]);
  const [mapZoom, setMapZoom] = useState(12);

  // Simulated Email alerts
  const [emailToasts, setEmailToasts] = useState<{ id: string; to: string; subject: string; message: string }[]>([]);

  const triggerSimulatedEmail = (to: string, subject: string, message: string) => {
    const id = Math.random().toString();
    setEmailToasts(prev => [...prev, { id, to, subject, message }]);
    setTimeout(() => {
      setEmailToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  // Filters state
  const [statusTab, setStatusTab] = useState<'publicado' | 'en curso' | 'finalizado'>('publicado');
  const [filterLocality, setFilterLocality] = useState('Todos');
  const [filterLeague, setFilterLeague] = useState('Todos');

  // Loaders
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch session and user role from Supabase
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        let roleVal = 'Visitante';
        if (profile) {
          let role = profile.role;
          if (profile.role === 'super_admin') {
            const viewMode = sessionStorage.getItem('admin_view_mode');
            if (viewMode && viewMode !== 'super_admin') {
              role = viewMode;
            }
          }
          switch (role) {
            case 'super_admin': roleVal = 'Super Admin'; break;
            case 'country_admin': roleVal = 'Distribuidor País'; break;
            case 'organizer': roleVal = 'Organizador'; break;
            case 'judge': roleVal = 'Juez'; break;
            case 'store': roleVal = 'Tienda'; break;
            case 'player': roleVal = 'Jugador'; break;
            default: roleVal = 'Visitante'; break;
          }
        }
        setCurrentUser({ id: session.user.id, role: roleVal, email: session.user.email || '' });
      } else {
        setCurrentUser({ id: 'usr-visitor', role: 'Visitante', email: '' });
      }
    };
    fetchSession();
  }, []);

  // Fetch player details if currentUser role is Jugador
  useEffect(() => {
    const fetchPlayer = async () => {
      if (currentUser.role === 'Jugador' && currentUser.id !== 'usr-visitor') {
        const p = await DbService.getPlayerById(currentUser.id);
        if (p) setCurrentPlayerData(p);
      }
    };
    fetchPlayer();
  }, [currentUser]);

  const loadTournaments = async () => {
    setLoadingList(true);
    const list = await DbService.getTournamentsList();
    setTournaments(list);
    
    // Parse deep-linked tournament parameter
    const queryParams = new URLSearchParams(location.search);
    const tourId = queryParams.get('tour');
    
    let matchedTour: Tournament | null = null;
    if (tourId) {
      const found = list.find(t => t.id === tourId);
      if (found) {
        matchedTour = found;
      }
    }
    
    const published = list.filter(t => t.status === statusTab);
    
    if (matchedTour) {
      handleSelectTournament(matchedTour);
    } else if (published.length > 0 && !selectedTour) {
      handleSelectTournament(published[0]);
    } else if (selectedTour) {
      // Refresh currently selected
      const updatedSelected = list.find(t => t.id === selectedTour.id);
      if (updatedSelected) {
        handleSelectTournament(updatedSelected);
      }
    }
    setLoadingList(false);
  };

  useEffect(() => {
    loadTournaments();
  }, [statusTab, location.search]);

  const handleSelectTournament = async (tour: Tournament) => {
    setSelectedTour(tour);
    if (tour.latitude && tour.longitude) {
      setMapCenter([Number(tour.latitude), Number(tour.longitude)]);
      setMapZoom(14);
    }
    setLoadingDetails(true);
    setSuccessMsg('');
    setErrorMsg('');
    const regs = await DbService.getTournamentRegistrations(tour.id);
    setRegistrants(regs);
    try {
      if (tour.waitlist_enabled) {
        const wl = await DbService.getWaitlist(tour.id);
        setWaitlist(wl);
      } else {
        setWaitlist([]);
      }
    } catch (wlErr) {
      console.error('Error fetching waitlist:', wlErr);
      setWaitlist([]);
    }
    setLoadingDetails(false);
  };

  const handleRegister = async () => {
    if (!selectedTour) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (currentUser.role !== 'Jugador' || !currentPlayerData) {
      setErrorMsg('Solamente los jugadores registrados pueden inscribirse online. Regístrate en la sección de Registro.');
      return;
    }

    // League checking
    if (selectedTour.league_id !== 'Ambas' && selectedTour.league_id !== currentPlayerData.league_id) {
      setErrorMsg(`Este torneo es exclusivo para la Liga ${selectedTour.league_id}. Tu perfil pertenece a la Liga ${currentPlayerData.league_id}.`);
      return;
    }

    try {
      const fullName = `${currentPlayerData.first_name} ${currentPlayerData.last_name}`;
      
      if (selectedTour.slots_available > 0) {
        await DbService.registerForTournament(selectedTour.id, currentPlayerData.id, fullName);
        setSuccessMsg('¡Te has inscrito exitosamente a este torneo!');
        
        triggerSimulatedEmail(
          currentPlayerData.email,
          '¡Inscripción Confirmada! - Beyblade Uruguay',
          `Hola ${currentPlayerData.first_name}, tu inscripción al torneo "${selectedTour.name}" ha sido procesada con éxito. Recuerda presentarte a las ${selectedTour.time}hs con tu BEY-ID listo en tu dispositivo para la acreditación QR.`
        );
      } else if (selectedTour.waitlist_enabled) {
        await DbService.joinWaitlist(selectedTour.id, currentPlayerData.id);
        setSuccessMsg('Cupos completos. Te has unido a la lista de espera de este torneo.');
      } else {
        setErrorMsg('El torneo está lleno y la lista de espera no está habilitada.');
        return;
      }

      // Reload lists
      await loadTournaments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la inscripción.');
    }
  };

  const handleCancelRegistration = async () => {
    if (!selectedTour || !currentPlayerData) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await DbService.cancelTournamentRegistration(selectedTour.id, currentPlayerData.id);
      setSuccessMsg('Tu inscripción ha sido cancelada y tu cupo ha sido liberado.');
      await loadTournaments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cancelar la inscripción.');
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!selectedTour || !currentPlayerData) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await DbService.leaveWaitlist(selectedTour.id, currentPlayerData.id);
      setSuccessMsg('Has salido de la lista de espera.');
      await loadTournaments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al salir de la lista de espera.');
    }
  };

  // Get user location
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalización no soportada por tu navegador.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords([latitude, longitude]);
        setSortByDistance(true);
        setMapCenter([latitude, longitude]);
        setMapZoom(13);
        setGeoLoading(false);
      },
      (error) => {
        console.error('GPS Geolocation Error:', error);
        setGeoError('No se pudo acceder a tu ubicación. Comprueba tus permisos.');
        setGeoLoading(false);
      }
    );
  };

  // Filter and sort tournaments based on filters and distance
  const filteredTournaments = tournaments
    .filter(t => {
      if (t.status !== statusTab) return false;
      if (filterLocality !== 'Todos' && t.locality.toLowerCase() !== filterLocality.toLowerCase()) return false;
      if (filterLeague !== 'Todos' && t.league_id !== filterLeague && t.league_id !== 'Ambas') return false;
      return true;
    })
    .map(t => {
      let distance = Infinity;
      if (userCoords && t.latitude && t.longitude) {
        distance = calculateDistanceKm(userCoords[0], userCoords[1], Number(t.latitude), Number(t.longitude));
      }
      return { ...t, distance };
    });

  if (sortByDistance && userCoords) {
    filteredTournaments.sort((a, b) => a.distance - b.distance);
  }

  // Map markers mapping
  const mapMarkers: MapMarker[] = filteredTournaments
    .filter(t => t.latitude && t.longitude)
    .map(t => {
      const isJornada = t.name.toLowerCase().includes('jornada') || 
                        t.name.toLowerCase().includes('taller') || 
                        t.name.toLowerCase().includes('iniciacion');
      return {
        id: t.id,
        latitude: Number(t.latitude),
        longitude: Number(t.longitude),
        type: isJornada ? 'jornada' : 'torneo',
        data: t
      };
    });

  if (userCoords) {
    mapMarkers.push({
      id: 'user-gps',
      latitude: userCoords[0],
      longitude: userCoords[1],
      type: 'user',
      data: {}
    });
  }

  const isAlreadyRegistered = registrants.some(r => r.player_id === currentPlayerData?.id);
  const waitlistEntry = waitlist.find(w => w.player_id === currentPlayerData?.id);
  const isAlreadyInWaitlist = !!waitlistEntry;

  return (
    <div className="space-y-6 text-left">
      {/* Header and filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">Torneos Oficiales</h1>
          <p className="text-xs text-gray-400">Inscríbete en torneos activos y suma puntos oficiales para el ranking nacional.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-beyblade-card p-1 rounded-xl border border-white/5 self-start">
          <button
            onClick={() => { setStatusTab('publicado'); setSelectedTour(null); }}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors ${
              statusTab === 'publicado' 
                ? 'bg-beyblade-electricCyan text-beyblade-darker shadow-neon-cyan' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Próximos
          </button>
          <button
            onClick={() => { setStatusTab('en curso'); setSelectedTour(null); }}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors ${
              statusTab === 'en curso' 
                ? 'bg-beyblade-electricRed text-white shadow-neon-red' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            En Curso
          </button>
          <button
            onClick={() => { setStatusTab('finalizado'); setSelectedTour(null); }}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors ${
              statusTab === 'finalizado' 
                ? 'bg-white/10 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Finalizados
          </button>
        </div>
      </div>

      {/* Geolocation Alerts */}
      {geoError && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed text-xs p-3 rounded-xl">
          {geoError}
        </div>
      )}

      {/* Advanced Filters & Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-beyblade-card p-4 rounded-2xl border border-white/5 text-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold uppercase">Localidad:</span>
            <select
              value={filterLocality}
              onChange={(e) => setFilterLocality(e.target.value)}
              className="bg-beyblade-dark text-xs font-bold text-white border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="Todos">Todas las Localidades</option>
              <option value="Montevideo">Montevideo</option>
              <option value="Maldonado">Maldonado</option>
              <option value="Canelones">Canelones</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold uppercase">Liga:</span>
            <select
              value={filterLeague}
              onChange={(e) => setFilterLeague(e.target.value)}
              className="bg-beyblade-dark text-xs font-bold text-white border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="Todos">Todas las Ligas</option>
              <option value="Junior">Liga Junior</option>
              <option value="Open">Liga Open</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle & GPS Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGeolocate}
            disabled={geoLoading}
            className="flex items-center gap-2 bg-beyblade-dark hover:bg-white/5 border border-white/10 hover:border-beyblade-electricCyan text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-beyblade-electricCyan" />
            ) : (
              <Navigation className="h-4 w-4 text-beyblade-electricCyan" />
            )}
            Cerca de mí
          </button>

          <div className="flex bg-beyblade-dark p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-beyblade-electricCyan text-beyblade-darker' : 'text-gray-400'}`}
              title="Vista Lista"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-beyblade-electricCyan text-beyblade-darker' : 'text-gray-400'}`}
              title="Vista Mapa"
            >
              <Map className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of tournament layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column: List of tournaments or Map view */}
        <div className="lg:col-span-1 space-y-4">
          {viewMode === 'map' ? (
            <div className="bg-beyblade-card border border-white/5 p-4 rounded-3xl overflow-hidden relative">
              <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Marcadores de Torneo</h3>
              <OpenMap
                center={mapCenter}
                zoom={mapZoom}
                markers={mapMarkers}
                onViewDetails={(id) => {
                  const found = tournaments.find(t => t.id === id);
                  if (found) handleSelectTournament(found);
                }}
                height="300px"
              />
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
              <h3 className="text-[10px] text-gray-500 font-black font-esports uppercase tracking-widest text-left">Listado de Torneos ({filteredTournaments.length})</h3>
              {loadingList ? (
                <div className="py-20 text-center text-gray-400 text-xs font-semibold">Cargando listado...</div>
              ) : filteredTournaments.length > 0 ? (
                filteredTournaments.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTournament(t)}
                    className={`bg-beyblade-card border p-4.5 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden clip-cyber-card text-left ${
                      selectedTour?.id === t.id 
                        ? 'border-beyblade-electricCyan shadow-[0_0_15px_rgba(0,240,255,0.12)] translate-x-1' 
                        : 'border-white/5 hover:border-white/12'
                    }`}
                  >
                    {/* Active highlight side line */}
                    {selectedTour?.id === t.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-beyblade-electricCyan shadow-[0_0_8px_#00F0FF]" />
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black font-esports tracking-widest uppercase border ${
                          t.league_id === 'Junior' 
                            ? 'bg-amber-400/10 text-amber-400 border-amber-400/25' 
                            : t.league_id === 'Open'
                              ? 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border-beyblade-electricCyan/25'
                              : 'bg-pink-500/10 text-pink-500 border-pink-500/25'
                        }`}>
                          Liga {t.league_id}
                        </span>
                        <span className="text-[9px] text-gray-400 font-extrabold font-esports uppercase tracking-wider">{t.format}</span>
                      </div>
                      <h3 className="font-title text-sm text-white group-hover:text-beyblade-electricCyan transition-colors uppercase tracking-wide">{t.name}</h3>
                      <div className="space-y-1 text-[11px] text-gray-400 font-esports tracking-wider">
                        <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-beyblade-electricCyan shrink-0" /> {t.date} - {t.time.substring(0, 5)} hs</p>
                        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-beyblade-electricRed shrink-0" /> {t.locality}</p>
                      </div>

                      {t.distance !== Infinity && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 text-[8px] font-black font-esports text-beyblade-electricCyan bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/25 px-2 py-0.5 rounded">
                            <Navigation className="h-2.5 w-2.5" /> {formatDistance(t.distance)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-beyblade-card border border-white/5 p-8 rounded-2xl text-center text-gray-400 text-xs font-semibold clip-cyber-card">
                  No se encontraron torneos para los filtros aplicados.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Detailed View */}
        <div className="lg:col-span-2">
          {selectedTour ? (
            <div className="bg-beyblade-card border border-white/10 rounded-[2rem] p-6 md:p-8 space-y-6 animate-fade-in clip-cyber-card shadow-xl relative overflow-hidden text-left">
              {/* Top ambient color accents */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-beyblade-electricCyan/5 rounded-full blur-2xl pointer-events-none" />

              <div className="border-b border-white/10 pb-4 space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-black font-esports tracking-widest uppercase border ${
                    selectedTour.league_id === 'Junior' 
                      ? 'bg-amber-400/10 text-amber-400 border-amber-400/25' 
                      : selectedTour.league_id === 'Open'
                        ? 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border-beyblade-electricCyan/25'
                        : 'bg-pink-500/10 text-pink-500 border-pink-500/25'
                  }`}>
                    Liga {selectedTour.league_id}
                  </span>
                  <span className="bg-black/35 border border-white/10 text-gray-400 text-[8px] font-black font-esports tracking-widest px-2.5 py-0.5 rounded uppercase">
                    Formato: {selectedTour.format}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-title text-white uppercase tracking-wider">{selectedTour.name}</h2>
              </div>

              {/* Tournament meta stats (Telemetric Cyber Boxes) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-beyblade-darker/60 border border-white/5 p-4 rounded-xl space-y-1.5 clip-cyber-card relative">
                  <span className="text-[9px] text-gray-500 uppercase font-black font-esports tracking-widest flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-beyblade-electricCyan" /> Fecha y Hora
                  </span>
                  <p className="font-extrabold text-sm text-white">{selectedTour.date}</p>
                  <p className="text-[11px] font-esports font-bold tracking-wider text-gray-400">{selectedTour.time.substring(0, 5)} hs</p>
                </div>
                
                <div className="bg-beyblade-darker/60 border border-white/5 p-4 rounded-xl space-y-1.5 clip-cyber-card relative">
                  <span className="text-[9px] text-gray-500 uppercase font-black font-esports tracking-widest flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-beyblade-electricRed" /> Dirección
                  </span>
                  <p className="font-extrabold text-sm text-white">{selectedTour.locality}</p>
                  <p className="text-[11px] font-esports font-bold tracking-wider text-gray-400 truncate">{selectedTour.address}</p>
                </div>

                <div className="bg-beyblade-darker/60 border border-white/5 p-4 rounded-xl space-y-1.5 clip-cyber-card relative">
                  <span className="text-[9px] text-gray-500 uppercase font-black font-esports tracking-widest flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-beyblade-gold" /> Cupos Disponibles
                  </span>
                  <p className="font-extrabold text-sm text-white">
                    {selectedTour.slots_available} <span className="text-xs text-gray-500 font-bold">/ {selectedTour.slots_total}</span>
                  </p>
                  <div className="w-full bg-white/5 rounded-full h-1 mt-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-beyblade-electricCyan to-beyblade-electricRed h-full rounded-full" 
                      style={{ width: `${((selectedTour.slots_total - selectedTour.slots_available) / selectedTour.slots_total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-[9px] text-gray-500 font-black font-esports uppercase tracking-widest">Descripción de la Arena</h4>
                <p className="text-xs text-gray-300 leading-relaxed bg-beyblade-darker/55 p-4 rounded-xl border border-white/5">
                  {selectedTour.description || 'Sin descripción adicional para este torneo.'}
                </p>
              </div>

              {/* Staff credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-esports uppercase tracking-wider">
                <div className="bg-black/25 p-3.5 rounded-xl border border-white/5 flex items-center gap-2.5 clip-cyber-card">
                  <Shield className="h-4.5 w-4.5 text-beyblade-electricCyan" />
                  <div>
                    <p className="text-[8px] text-gray-500 font-black tracking-widest">Organizador Oficial</p>
                    <p className="font-extrabold text-white text-xs mt-0.5">{selectedTour.organizer_name}</p>
                  </div>
                </div>
                <div className="bg-black/25 p-3.5 rounded-xl border border-white/5 flex items-center gap-2.5 clip-cyber-card">
                  <Award className="h-4.5 w-4.5 text-beyblade-gold" />
                  <div>
                    <p className="text-[8px] text-gray-500 font-black tracking-widest">Juez Certificado</p>
                    <p className="font-extrabold text-white text-xs mt-0.5">{selectedTour.judge_name || 'Sin juez asignado'}</p>
                  </div>
                </div>
              </div>

              {/* Selected Tournament Map Preview */}
              {selectedTour.latitude && selectedTour.longitude && (
                <div className="space-y-2">
                  <h4 className="text-[9px] text-gray-500 font-black font-esports uppercase tracking-widest">Mapa de Ubicación</h4>
                  <OpenMap
                    center={[Number(selectedTour.latitude), Number(selectedTour.longitude)]}
                    zoom={15}
                    markers={[{
                      id: selectedTour.id,
                      latitude: Number(selectedTour.latitude),
                      longitude: Number(selectedTour.longitude),
                      type: selectedTour.name.toLowerCase().includes('jornada') || selectedTour.name.toLowerCase().includes('taller') ? 'jornada' : 'torneo',
                      data: selectedTour
                    }]}
                    height="180px"
                  />
                </div>
              )}

              {/* Feedback panels */}
              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs p-3.5 rounded-xl flex items-center gap-2.5 font-semibold">
                  <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-400" />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/25 text-beyblade-electricRed text-xs p-3.5 rounded-xl flex items-center gap-2.5 font-semibold">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-beyblade-electricRed" />
                  {errorMsg}
                </div>
              )}

              {/* Action and Participants List */}
              <div className="space-y-4 pt-2">
                {selectedTour.status === 'publicado' && (
                  <>
                    {isAlreadyRegistered ? (
                      <div className="space-y-2">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl flex items-center justify-between font-bold">
                          <span>✓ Estás inscripto en este torneo</span>
                          <button
                            onClick={handleCancelRegistration}
                            className="text-[10px] text-beyblade-electricRed hover:underline uppercase font-black tracking-wider"
                          >
                            Cancelar Inscripción
                          </button>
                        </div>
                      </div>
                    ) : isAlreadyInWaitlist ? (
                      <div className="space-y-2">
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3.5 rounded-xl flex items-center justify-between font-bold">
                          <span>⏱ En lista de espera (Puesto {waitlistEntry?.position})</span>
                          <button
                            onClick={handleLeaveWaitlist}
                            className="text-[10px] text-beyblade-electricRed hover:underline uppercase font-black tracking-wider"
                          >
                            Salir de la lista
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleRegister}
                        disabled={selectedTour.slots_available <= 0 && !selectedTour.waitlist_enabled}
                        className="w-full py-4 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-transparent text-beyblade-darker font-black font-esports text-sm uppercase tracking-widest rounded-xl transition-all shadow-neon-cyan disabled:shadow-none hover:scale-[1.01] active:scale-95"
                      >
                        {selectedTour.slots_available <= 0 
                          ? (selectedTour.waitlist_enabled ? 'Unirse a Lista de Espera' : 'Cupos Completos') 
                          : 'Inscribirme al Evento'}
                      </button>
                    )}
                  </>
                )}

                {/* Registrants / checked-in list */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-gray-500 font-black font-esports uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-beyblade-electricCyan" /> Jugadores Inscriptos ({registrants.length})
                  </h4>

                  <div className="bg-beyblade-darker/60 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
                    {loadingDetails ? (
                      <div className="p-4 text-center text-xs text-gray-500">Cargando participantes...</div>
                    ) : registrants.length > 0 ? (
                      registrants.map((r, index) => (
                        <div key={r.id} className="p-3.5 flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-extrabold font-esports w-5 text-left">{index + 1}.</span>
                            <span className="font-extrabold text-white uppercase tracking-wide">{r.player_name}</span>
                          </div>
                          <div>
                            {r.checked_in ? (
                              <span className="text-[9px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-2 py-0.5 rounded font-black font-esports uppercase tracking-widest">
                                Acreditado
                              </span>
                            ) : (
                              <span className="text-[9px] text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded font-black font-esports uppercase tracking-widest flex items-center gap-1">
                                <Info className="h-3 w-3" /> Registrado
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-gray-500 italic">No hay competidores inscriptos todavía.</div>
                    )}
                  </div>
                </div>

                {/* Waitlist list */}
                {selectedTour.waitlist_enabled && waitlist.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] text-gray-500 font-black font-esports uppercase tracking-widest flex items-center gap-1.5">
                      ⏱ Lista de Espera ({waitlist.length})
                    </h4>
                    <div className="bg-beyblade-darker/60 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
                      {waitlist.map((w) => (
                        <div key={w.id} className="p-3.5 flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-extrabold font-esports w-5 text-left">{w.position}.</span>
                            <span className="font-extrabold text-white uppercase tracking-wide">{w.player_name}</span>
                          </div>
                          <span className="text-[9px] text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded font-black font-esports uppercase tracking-widest">
                            En espera
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-beyblade-card border border-white/5 rounded-3xl p-12 text-center text-gray-400 text-sm h-full flex flex-col items-center justify-center space-y-3">
              <Trophy className="h-10 w-10 text-gray-600" />
              <p>Selecciona un torneo de la lista para ver todos sus detalles.</p>
            </div>
          )}
        </div>

      </div>

      {/* Simulated Email Notification Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {emailToasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-beyblade-darker/95 border-2 border-beyblade-electricCyan shadow-[0_0_15px_rgba(0,240,255,0.3)] p-4 rounded-2xl pointer-events-auto animate-slide-in space-y-2"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-[10px] font-black uppercase text-beyblade-electricCyan tracking-wider">📧 Correo Simulado</span>
              <button 
                onClick={() => setEmailToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-[9px] text-gray-500 hover:text-white uppercase font-bold"
              >
                Cerrar
              </button>
            </div>
            <div className="text-[11px] space-y-1">
              <p className="text-gray-400">
                Para: <strong className="text-white">{toast.to}</strong>
              </p>
              <p className="text-white font-bold">
                Asunto: {toast.subject}
              </p>
              <p className="text-gray-400 leading-relaxed pt-1">
                {toast.message}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
