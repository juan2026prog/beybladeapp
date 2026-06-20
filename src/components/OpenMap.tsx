import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapMarkerPopup } from './MapMarkerPopup';

// Correct default leaflet icon paths for Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  type: 'tienda' | 'torneo' | 'jornada' | 'organizador' | 'user';
  data: any;
}

interface OpenMapProps {
  center: [number, number];
  zoom: number;
  markers?: MapMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  onViewDetails?: (id: string, type: 'tienda' | 'torneo') => void;
  height?: string;
}

// Sub-component to handle map center changes dynamically
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.8 });
  }, [center, zoom, map]);
  return null;
};

// Sub-component to handle map clicks
const MapEventsHandler: React.FC<{ onMapClick?: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Create custom icons using tailwind styled markers
const createCustomIcon = (type: MapMarker['type']) => {
  let bgClass = 'bg-[#00F0FF]';
  let borderClass = 'border-[#00F0FF]';
  let textClass = 'text-[#02050A]';
  let shadowStyle = 'box-shadow: 0 0 12px rgba(0, 240, 255, 0.6), inset 0 0 6px rgba(0, 240, 255, 0.3);';
  let innerIconSvg = '';
  
  if (type === 'tienda') {
    bgClass = 'bg-beyblade-electricCyan';
    borderClass = 'border-beyblade-electricCyan';
    textClass = 'text-beyblade-darker';
    shadowStyle = 'box-shadow: 0 0 14px rgba(0, 240, 255, 0.7), inset 0 0 6px rgba(0, 240, 255, 0.3);';
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;
  } else if (type === 'torneo') {
    bgClass = 'bg-beyblade-electricRed';
    borderClass = 'border-beyblade-electricRed';
    textClass = 'text-white animate-pulse';
    shadowStyle = 'box-shadow: 0 0 14px rgba(255, 0, 85, 0.7), inset 0 0 6px rgba(255, 0, 85, 0.3);';
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a6 6 0 0 1 6 6c0 3.3-2 6-6 6S6 11.3 6 8a6 6 0 0 1 6-6z"></path></svg>`;
  } else if (type === 'jornada') {
    bgClass = 'bg-beyblade-gold';
    borderClass = 'border-beyblade-gold';
    textClass = 'text-beyblade-darker';
    shadowStyle = 'box-shadow: 0 0 14px rgba(255, 215, 0, 0.7), inset 0 0 6px rgba(255, 215, 0, 0.3);';
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
  } else if (type === 'organizador') {
    bgClass = 'bg-purple-500';
    borderClass = 'border-purple-400';
    textClass = 'text-white';
    shadowStyle = 'box-shadow: 0 0 14px rgba(168, 85, 247, 0.7), inset 0 0 6px rgba(168, 85, 247, 0.3);';
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  } else if (type === 'user') {
    bgClass = 'bg-beyblade-electricCyan';
    borderClass = 'border-white';
    textClass = 'text-beyblade-darker';
    shadowStyle = 'box-shadow: 0 0 16px rgba(0, 240, 255, 0.8);';
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>`;
  }

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${bgClass} ${borderClass} ${textClass} transition-all duration-300 transform hover:scale-110" style="${shadowStyle}">
      ${innerIconSvg}
      <div class="absolute bottom-0 w-2 h-2 translate-y-1/2 rotate-45 ${bgClass} border-r border-b ${borderClass}"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export const OpenMap: React.FC<OpenMapProps> = ({
  center,
  zoom,
  markers = [],
  onMapClick,
  onViewDetails,
  height = '400px'
}) => {
  const isOffline = !navigator.onLine;

  return (
    <div 
      className="w-full bg-beyblade-darker rounded-3xl border border-white/5 overflow-hidden relative shadow-inner"
      style={{ height }}
    >
      {isOffline && (
        <div className="absolute inset-0 bg-black/75 z-[1000] flex flex-col items-center justify-center p-6 text-center text-sm text-gray-300">
          <svg className="w-12 h-12 text-beyblade-electricRed mb-3 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 5 5 0 011.414-3.536m0 0l2.829 2.829m-2.829-2.829L3 3m7.071 5.364a9 9 0 00-2.828 6.364l2.828-2.829m4.243-4.243a8.978 8.978 0 00-6.364-2.828l2.829 2.829" />
          </svg>
          <span className="font-extrabold text-white uppercase tracking-wider mb-1">Modo Sin Conexión</span>
          <p className="max-w-xs text-xs text-gray-400">El mapa requiere conexión para cargar ubicaciones actualizadas.</p>
        </div>
      )}

      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ width: '100%', height: '100%', background: '#0F1318' }}
        zoomControl={true}
        attributionControl={false}
      >
        {/* CartoDB Dark Matter Basemap for sleek neon theme */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Dynamic center controller */}
        <ChangeMapView center={center} zoom={zoom} />
        
        {/* Click events handler */}
        <MapEventsHandler onMapClick={onMapClick} />
        
        {/* Render markers */}
        {markers.map((marker) => {
          if (isNaN(marker.latitude) || isNaN(marker.longitude)) return null;
          
          return (
            <Marker 
              key={marker.id} 
              position={[marker.latitude, marker.longitude]}
              icon={createCustomIcon(marker.type)}
            >
              {marker.type !== 'user' && (
                <Popup className="beyblade-map-popup">
                  <MapMarkerPopup 
                    type={marker.type} 
                    data={marker.data} 
                    onViewDetails={onViewDetails} 
                  />
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>

      {/* Global CSS Inject to style Leaflet popup boxes to match PWA Dark Neon theme */}
      <style>{`
        .beyblade-map-popup .leaflet-popup-content-wrapper {
          background: #141920 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 1rem !important;
          padding: 4px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
        }
        .beyblade-map-popup .leaflet-popup-tip {
          background: #141920 !important;
          border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .beyblade-map-popup .leaflet-popup-close-button {
          color: #9CA3AF !important;
          padding: 8px 12px 0 0 !important;
        }
        .beyblade-map-popup .leaflet-popup-close-button:hover {
          color: #FF0055 !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};
