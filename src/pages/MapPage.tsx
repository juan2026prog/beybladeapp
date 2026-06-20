import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Navigation, SlidersHorizontal, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { DbService } from '../services/dbService';
import type { Store as StoreType, Tournament as TournamentType, Organizer as OrganizerType } from '../services/dbService';
import { OpenMap } from '../components/OpenMap';
import type { MapMarker } from '../components/OpenMap';

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [tournaments, setTournaments] = useState<TournamentType[]>([]);
  const [organizers, setOrganizers] = useState<OrganizerType[]>([]);
  const [localities, setLocalities] = useState<any[]>([]);
  
  // Filter lists
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number; country_id: string; name: string }[]>([]);
  
  // Selected Filters
  const [selectedCountry, setSelectedCountry] = useState('Todos');
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [selectedLocality, setSelectedLocality] = useState('Todos');
  
  // Type toggles
  const [showStores, setShowStores] = useState(true);
  const [showTournaments, setShowTournaments] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showOrganizers, setShowOrganizers] = useState(true);
  
  // Other filters
  const [selectedLeague, setSelectedLeague] = useState('Todos');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Map State
  const [mapCenter, setMapCenter] = useState<[number, number]>([-34.9011, -56.1645]); // Montevideo default
  const [mapZoom, setMapZoom] = useState(12);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  
  // Loading & UI State
  const [loading, setLoading] = useState(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch countries, departments, localities
        const { data: countriesData } = await supabase.from('countries').select('*');
        setCountries(countriesData || []);
        
        const { data: deptsData } = await supabase.from('departments').select('*');
        setDepartments(deptsData || []);

        const locs = await DbService.getLocalities();
        setLocalities(locs || []);

        // 2. Fetch stores, tournaments, organizers
        const storesList = await DbService.getStoresList();
        // Only show approved stores with coordinates
        const approvedStores = storesList.filter(s => s.certification_status === 'Aprobado' && s.latitude && s.longitude);
        setStores(approvedStores);

        const tourList = await DbService.getTournamentsList();
        // Only show published/ongoing/finished tournaments with coordinates
        const activeTours = tourList.filter(t => t.status !== 'borrador' && t.latitude && t.longitude);
        setTournaments(activeTours);

        const orgList = await DbService.getOrganizersList();
        // Filter approved organizers
        const approvedOrgs = orgList.filter(o => o.status === 'Aprobado');
        setOrganizers(approvedOrgs);

        // Center map to average of active items if available
        if (approvedStores.length > 0) {
          setMapCenter([Number(approvedStores[0].latitude), Number(approvedStores[0].longitude)]);
        }
      } catch (err) {
        console.error('Error loading map data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMapData();
  }, []);

  // Filter lists based on hierarchy
  const filteredDeptsList = departments.filter(d => selectedCountry === 'Todos' || d.country_id === selectedCountry);
  const filteredLocsList = localities.filter(l => {
    if (selectedCountry !== 'Todos') {
      const deptsInCountry = departments.filter(d => d.country_id === selectedCountry).map(d => d.name.toLowerCase());
      if (!deptsInCountry.includes(l.department.toLowerCase())) return false;
    }
    if (selectedDept !== 'Todos' && l.department.toLowerCase() !== selectedDept.toLowerCase()) return false;
    return true;
  });

  // Reset dependent filters when parent filters change
  useEffect(() => {
    setSelectedDept('Todos');
    setSelectedLocality('Todos');
  }, [selectedCountry]);

  useEffect(() => {
    setSelectedLocality('Todos');
  }, [selectedDept]);

  // Request user location GPS
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage('La geolocalización no es compatible con este navegador.');
      return;
    }
    
    setMessage('Obteniendo tu ubicación...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setUserCoords([latitude, longitude]);
        setMapZoom(14);
        setMessage('');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setMessage('No se pudo obtener tu ubicación. Verifica los permisos.');
      }
    );
  };

  // View details navigator helper
  const handleViewDetails = (id: string, type: 'tienda' | 'torneo') => {
    if (type === 'tienda') {
      navigate(`/stores?store=${id}`);
    } else if (type === 'torneo') {
      navigate(`/tournaments?tour=${id}`);
    }
  };

  // Process data to markers
  const markers: MapMarker[] = [];

  // Add user location marker if available
  if (userCoords) {
    markers.push({
      id: 'user-gps',
      latitude: userCoords[0],
      longitude: userCoords[1],
      type: 'user',
      data: {}
    });
  }

  // Helper to check geographical filtering
  const matchesGeoFilter = (item: any) => {
    if (selectedCountry !== 'Todos' && item.country_id !== selectedCountry) return false;
    if (selectedDept !== 'Todos' && item.department.toLowerCase() !== selectedDept.toLowerCase()) return false;
    if (selectedLocality !== 'Todos' && item.locality.toLowerCase() !== selectedLocality.toLowerCase()) return false;
    return true;
  };

  // Add Stores markers
  if (showStores) {
    stores.forEach(s => {
      if (matchesGeoFilter(s)) {
        markers.push({
          id: `store-${s.id}`,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          type: 'tienda',
          data: s
        });
      }
    });
  }

  // Add Tournaments and Events markers
  tournaments.forEach(t => {
    if (matchesGeoFilter(t)) {
      // Filter by league
      if (selectedLeague !== 'Todos' && t.league_id !== 'Ambas' && t.league_id !== selectedLeague) return;
      
      // Filter by date
      if (selectedDate && t.date !== selectedDate) return;

      const isJornada = t.name.toLowerCase().includes('jornada') || 
                        t.name.toLowerCase().includes('taller') || 
                        t.name.toLowerCase().includes('iniciacion') || 
                        t.name.toLowerCase().includes('practica');

      if (isJornada && showEvents) {
        markers.push({
          id: `event-${t.id}`,
          latitude: Number(t.latitude),
          longitude: Number(t.longitude),
          type: 'jornada',
          data: t
        });
      } else if (!isJornada && showTournaments) {
        markers.push({
          id: `tournament-${t.id}`,
          latitude: Number(t.latitude),
          longitude: Number(t.longitude),
          type: 'torneo',
          data: t
        });
      }
    }
  });

  // Add Organizers markers (Lookup coordinates via locality ID)
  if (showOrganizers) {
    organizers.forEach(o => {
      const loc = localities.find(l => l.id === o.locality_id);
      if (loc && loc.latitude && loc.longitude) {
        // Build mock geofilter object
        const geoCheck = {
          country_id: o.country_id,
          department: loc.department,
          locality: loc.name
        };
        if (matchesGeoFilter(geoCheck)) {
          markers.push({
            id: `organizer-${o.id}`,
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
            type: 'organizador',
            data: o
          });
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
            <Map className="h-6 w-6 text-beyblade-electricCyan" /> Mapa Beyblade Oficial
          </h1>
          <p className="text-xs text-gray-400">Visualiza torneos oficiales, tiendas certificadas, eventos de práctica y organizadores de la región.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleUseMyLocation}
            className="flex items-center gap-2 bg-beyblade-card border border-white/10 hover:border-beyblade-electricCyan text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <Navigation className="h-4 w-4 text-beyblade-electricCyan" />
            Usar mi ubicación
          </button>
          
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="flex md:hidden items-center gap-2 bg-beyblade-card border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 text-beyblade-electricCyan text-xs p-3 rounded-xl flex items-center gap-2">
          <Info className="h-4 w-4 animate-pulse shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Grid Layout: Desktop Filters Panel and Map Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Filters (visible on desktop) */}
        <div className={`space-y-6 lg:col-span-1 ${showFilterDrawer ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-beyblade-card border border-white/5 p-5 rounded-3xl space-y-6">
            <h3 className="text-xs text-gray-400 font-extrabold uppercase tracking-wider border-b border-white/5 pb-2">
              Filtros de Búsqueda
            </h3>
            
            {/* Territory Hierarchy */}
            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-gray-400 font-bold uppercase">País</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-beyblade-dark text-xs font-semibold text-white border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-beyblade-electricCyan"
                >
                  <option value="Todos">Todos los países</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Departamento / Provincia</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-beyblade-dark text-xs font-semibold text-white border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-beyblade-electricCyan"
                >
                  <option value="Todos">Todos los departamentos</option>
                  {Array.from(new Set(filteredDeptsList.map(d => d.name))).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Localidad</label>
                <select
                  value={selectedLocality}
                  onChange={(e) => setSelectedLocality(e.target.value)}
                  className="w-full bg-beyblade-dark text-xs font-semibold text-white border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-beyblade-electricCyan"
                >
                  <option value="Todos">Todas las localidades</option>
                  {Array.from(new Set(filteredLocsList.map(l => l.name))).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type Toggles */}
            <div className="space-y-3.5 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Mostrar en Mapa</span>
              
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-200 hover:text-white">
                <input
                  type="checkbox"
                  checked={showStores}
                  onChange={(e) => setShowStores(e.target.checked)}
                  className="rounded border-white/10 text-emerald-500 bg-beyblade-dark focus:ring-0 focus:ring-offset-0 h-4 w-4"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tiendas Certificadas
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-200 hover:text-white">
                <input
                  type="checkbox"
                  checked={showTournaments}
                  onChange={(e) => setShowTournaments(e.target.checked)}
                  className="rounded border-white/10 text-rose-500 bg-beyblade-dark focus:ring-0 focus:ring-offset-0 h-4 w-4"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Torneos Competitivos
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-200 hover:text-white">
                <input
                  type="checkbox"
                  checked={showEvents}
                  onChange={(e) => setShowEvents(e.target.checked)}
                  className="rounded border-white/10 text-amber-500 bg-beyblade-dark focus:ring-0 focus:ring-offset-0 h-4 w-4"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Jornadas / Prácticas
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-200 hover:text-white">
                <input
                  type="checkbox"
                  checked={showOrganizers}
                  onChange={(e) => setShowOrganizers(e.target.checked)}
                  className="rounded border-white/10 text-violet-500 bg-beyblade-dark focus:ring-0 focus:ring-offset-0 h-4 w-4"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span> Organizadores Oficiales
                </span>
              </label>
            </div>

            {/* Other Filters */}
            <div className="space-y-4 border-t border-white/5 pt-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Liga (Torneos)</label>
                <select
                  value={selectedLeague}
                  onChange={(e) => setSelectedLeague(e.target.value)}
                  className="w-full bg-beyblade-dark text-xs font-semibold text-white border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  <option value="Todos">Todas las ligas</option>
                  <option value="Junior">Junior</option>
                  <option value="Open">Open</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Fecha Específica</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-beyblade-dark text-xs font-semibold text-white border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Leaflet Map and Metrics summary */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="bg-beyblade-card border border-white/5 rounded-3xl h-[500px] flex flex-col items-center justify-center text-gray-400 gap-3">
              <Loader2 className="h-8 w-8 text-beyblade-electricCyan animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">Cargando ubicaciones...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Markers count badges */}
              <div className="flex flex-wrap gap-2 text-[10px] font-extrabold uppercase">
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl">
                  {markers.filter(m => m.type === 'tienda').length} Tiendas
                </span>
                <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1.5 rounded-xl">
                  {markers.filter(m => m.type === 'torneo').length} Torneos
                </span>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl">
                  {markers.filter(m => m.type === 'jornada').length} Jornadas
                </span>
                <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 px-3 py-1.5 rounded-xl">
                  {markers.filter(m => m.type === 'organizador').length} Organizadores
                </span>
              </div>

              {/* The Live Interactive Leaflet Map */}
              <OpenMap
                center={mapCenter}
                zoom={mapZoom}
                markers={markers}
                onViewDetails={handleViewDetails}
                height="500px"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple loader helper
const Loader2: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
