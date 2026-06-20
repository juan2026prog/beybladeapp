import React from 'react';
import { MapPin, Clock, Calendar, Users, ShoppingBag, ArrowRight } from 'lucide-react';
import type { Store, Tournament } from '../services/dbService';

interface MapMarkerPopupProps {
  type: 'tienda' | 'torneo' | 'jornada' | 'organizador';
  data: any;
  onViewDetails?: (id: string, type: 'tienda' | 'torneo') => void;
}

export const MapMarkerPopup: React.FC<MapMarkerPopupProps> = ({ type, data, onViewDetails }) => {
  if (type === 'tienda') {
    const store = data as Store;
    return (
      <div className="p-1 min-w-[200px] text-xs text-gray-200 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-extrabold text-sm text-white tracking-wide leading-tight">{store.name}</h4>
          <span className="shrink-0 text-[8px] font-black uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">
            Certificada
          </span>
        </div>
        
        <div className="space-y-1 text-gray-400">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span>{store.locality}, {store.address}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span>{store.hours}</span>
          </p>
        </div>

        <div className="pt-1.5 border-t border-white/5 flex items-center justify-between gap-2">
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <ShoppingBag className="h-3 w-3" /> Stock Disponible
          </span>
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(store.id, 'tienda')}
              className="text-[10px] font-black text-beyblade-electricCyan hover:underline uppercase flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
            >
              Ver tienda <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'torneo') {
    const tour = data as Tournament;
    const isJunior = tour.league_id === 'Junior';
    const leagueColor = isJunior ? 'text-beyblade-electricCyan bg-beyblade-electricCyan/10 border-beyblade-electricCyan/20' : 'text-beyblade-electricRed bg-beyblade-electricRed/10 border-beyblade-electricRed/20';
    
    return (
      <div className="p-1 min-w-[200px] text-xs text-gray-200 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-extrabold text-sm text-white tracking-wide leading-tight">{tour.name}</h4>
          <span className={`shrink-0 text-[8px] font-black uppercase border px-1.5 py-0.5 rounded ${leagueColor}`}>
            Liga {tour.league_id}
          </span>
        </div>

        <div className="space-y-1 text-gray-400">
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span>{tour.date} @ {tour.time.substring(0, 5)}hs</span>
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span>{tour.locality}, {tour.address}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span>{tour.slots_available} / {tour.slots_total} cupos libres</span>
          </p>
        </div>

        {onViewDetails && (
          <div className="pt-1.5 border-t border-white/5 text-right">
            <button
              onClick={() => onViewDetails(tour.id, 'torneo')}
              className="text-[10px] font-black text-beyblade-electricCyan hover:underline uppercase flex items-center gap-0.5 ml-auto cursor-pointer bg-transparent border-none p-0"
            >
              Ver torneo <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === 'jornada') {
    return (
      <div className="p-1 min-w-[180px] text-xs text-gray-200 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-extrabold text-sm text-white tracking-wide leading-tight">{data.name}</h4>
          <span className="shrink-0 text-[8px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
            Jornada
          </span>
        </div>
        <div className="space-y-1 text-gray-400">
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span>{data.date}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span>{data.address}</span>
          </p>
        </div>
      </div>
    );
  }

  if (type === 'organizador') {
    return (
      <div className="p-1 min-w-[180px] text-xs text-gray-200 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-extrabold text-sm text-white tracking-wide leading-tight">{data.name}</h4>
          <span className="shrink-0 text-[8px] font-black uppercase text-violet-400 bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 rounded">
            Organizador
          </span>
        </div>
        <div className="space-y-1 text-gray-400">
          <p className="text-beyblade-electricCyan font-bold text-[10px]">{data.level}</p>
          {data.store_affiliation && (
            <p className="flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <span>Afiliación: {data.store_affiliation}</span>
            </p>
          )}
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span>{data.locality_name || 'Uruguay'}</span>
          </p>
        </div>
      </div>
    );
  }

  return null;
};
