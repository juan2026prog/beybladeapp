import React from 'react';
import { ArrowUp, Trash2, Clock, CheckCircle } from 'lucide-react';
import type { WaitlistEntry } from '../../services/dbService';

interface WaitlistTabProps {
  waitlistEntries: WaitlistEntry[];
  onPromote: (playerId: string) => void;
  onRemove: (playerId: string) => void;
}

export const WaitlistTab: React.FC<WaitlistTabProps> = ({
  waitlistEntries,
  onPromote,
  onRemove
}) => {
  // Sort waitlist entries by position ascending
  const sortedEntries = [...waitlistEntries].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4 animate-fade-in text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <h4 className="font-extrabold text-[11px] text-gray-400 uppercase tracking-wider font-esports">Cola de Espera Activa</h4>
        <span className="text-[10px] text-gray-500 font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded">
          {sortedEntries.length} Jugadores en espera
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {sortedEntries.map((w, idx) => (
          <div
            key={w.id || w.player_id}
            className="bg-beyblade-card border border-white/5 hover:border-white/10 rounded-2xl p-4 flex justify-between items-center transition-all"
          >
            <div className="flex items-center gap-4">
              {/* Queue Position badge */}
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs ${
                idx === 0 
                  ? 'bg-beyblade-electricCyan text-beyblade-darker shadow-neon-cyan' 
                  : 'bg-white/5 text-gray-400 border border-white/5'
              }`}>
                {w.position}
              </div>

              <div>
                <div className="font-extrabold text-white text-xs">{w.player_name || 'Jugador'}</div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                  <Clock className="h-3 w-3" /> Registrado en lista de espera
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Promote button for position 1 */}
              <button
                onClick={() => onPromote(w.player_id)}
                className={`px-3 py-1.5 font-bold text-[10px] uppercase rounded-lg transition-all flex items-center gap-1 ${
                  idx === 0
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-neon-green'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400'
                }`}
                title="Promover al Torneo Principal"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                {idx === 0 ? 'Promover ahora' : 'Subir'}
              </button>

              <button
                onClick={() => onRemove(w.player_id)}
                className="bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-beyblade-electricRed hover:text-white border border-beyblade-electricRed/20 hover:border-transparent p-2 rounded-lg transition-all"
                title="Quitar de la Lista"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {sortedEntries.length === 0 && (
          <div className="bg-beyblade-darker/20 border border-white/5 border-dashed rounded-3xl p-8 text-center space-y-2">
            <CheckCircle className="h-8 w-8 text-emerald-500/40 mx-auto" />
            <h5 className="font-extrabold text-xs text-gray-400 uppercase">Sin jugadores en espera</h5>
            <p className="text-[11px] text-gray-500">
              Todos los participantes inscritos caben en el cupo principal del torneo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
