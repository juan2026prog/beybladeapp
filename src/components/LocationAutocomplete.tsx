import React, { useEffect, useState, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { GeocodingService } from '../services/geocodingService';
import type { NormalizedLocation } from '../services/geocodingService';
import { OpenMap } from './OpenMap';

interface LocationAutocompleteProps {
  onSelect: (location: NormalizedLocation) => void;
  initialAddress?: string;
  initialCoords?: { lat: number; lng: number };
  countryCode?: string; // Optional: filter searches to this country code (e.g. "UY")
  placeholder?: string;
  className?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  onSelect,
  initialAddress = '',
  initialCoords,
  countryCode,
  placeholder = 'Buscar dirección o localidad...',
  className = ''
}) => {
  const [query, setQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<NormalizedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<NormalizedLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize selected location if initial coordinates are provided
  useEffect(() => {
    if (initialCoords && initialCoords.lat && initialCoords.lng && initialAddress) {
      setSelectedLocation({
        latitude: initialCoords.lat,
        longitude: initialCoords.lng,
        full_address: initialAddress,
        address: initialAddress.split(',')[0] || '',
        country: '',
        country_code: countryCode || '',
        department: '',
        locality: '',
        postcode: '',
        osm_place_id: '',
        osm_type: '',
        osm_class: '',
        osm_importance: 0,
        geocoding_provider: 'manual'
      });
    }
  }, [initialCoords, initialAddress]);

  // Debounced search query
  useEffect(() => {
    if (!query || query.trim().length < 3 || (selectedLocation && selectedLocation.full_address === query)) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      const results = await GeocodingService.searchAddress(query, countryCode);
      setSuggestions(results);
      setLoading(false);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query, countryCode, selectedLocation]);

  // Click outside listener to hide suggestions list
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: NormalizedLocation) => {
    setSelectedLocation(loc);
    setQuery(loc.full_address);
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect(loc);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className={`space-y-2 relative w-full ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-beyblade-electricCyan" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            if (selectedLocation && e.target.value !== selectedLocation.full_address) {
              setSelectedLocation(null);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full bg-beyblade-dark text-xs font-semibold text-white border border-white/10 rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-beyblade-electricCyan transition-colors"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-beyblade-card border border-white/10 rounded-2xl shadow-2xl p-1 no-scrollbar animate-slide-in">
          {suggestions.map((loc, idx) => (
            <div
              key={loc.osm_place_id || idx}
              onClick={() => handleSelect(loc)}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
            >
              <MapPin className="h-4 w-4 text-beyblade-electricCyan shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-snug">
                  {loc.address || 'Ubicación encontrada'}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {loc.locality && `${loc.locality}, `}
                  {loc.department && `${loc.department}, `}
                  {loc.country}
                </p>
                {loc.osm_class && (
                  <span className="inline-block text-[8px] font-black uppercase text-beyblade-electricCyan bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 px-1 rounded mt-1.5">
                    {loc.osm_class}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Map Preview */}
      {selectedLocation && (
        <div className="bg-beyblade-card/40 border border-white/5 p-3 rounded-2xl overflow-hidden relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-beyblade-electricCyan" /> Ubicación Confirmada
            </span>
            <span className="text-[9px] text-gray-500 font-mono">
              {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
            </span>
          </div>
          <OpenMap
            center={[selectedLocation.latitude, selectedLocation.longitude]}
            zoom={15}
            markers={[{
              id: 'preview',
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              type: 'user',
              data: {}
            }]}
            height="150px"
          />
        </div>
      )}
    </div>
  );
};
