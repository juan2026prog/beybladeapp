import React from 'react';
import { Calendar, Clock, MapPin, Award, Shield, Users, CheckCircle, Hourglass, Camera, Play, Send } from 'lucide-react';
import type { Tournament, Registration } from '../../services/dbService';

interface ProximoEventoProps {
  tournament: Tournament | null;
  registrations: Registration[];
  waitlistCount: number;
  onViewTournament: () => void;
  onOpenQRCheckIn: () => void;
  onViewBracket: () => void;
  onSendCommunication: () => void;
}

export const ProximoEvento: React.FC<ProximoEventoProps> = ({
  tournament,
  registrations,
  waitlistCount,
  onViewTournament,
  onOpenQRCheckIn,
  onViewBracket,
  onSendCommunication
}) => {
  if (!tournament) {
    return (
      <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 text-center space-y-2">
        <Calendar className="h-8 w-8 text-gray-500 mx-auto" />
        <h4 className="font-extrabold text-sm text-gray-400 uppercase">Sin eventos programados</h4>
        <p className="text-xs text-gray-500">No tienes torneos activos o próximos programados.</p>
      </div>
    );
  }

  const inscriptos = registrations.length;
  const confirmados = registrations.filter(r => r.confirmed_status === 'confirmado' || r.checked_in).length;
  const checkIns = registrations.filter(r => r.checked_in).length;

  return (
    <div className="bg-gradient-to-r from-beyblade-card to-beyblade-darker border border-beyblade-electricCyan/20 rounded-3xl p-6 space-y-4 animate-fade-in relative overflow-hidden">
      {/* Abstract background glow */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-beyblade-electricCyan/5 blur-3xl rounded-full -mr-10 -mt-10" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="px-2 py-0.5 rounded text-[8px] font-black font-esports uppercase tracking-widest bg-beyblade-electricCyan/15 text-beyblade-electricCyan border border-beyblade-electricCyan/20">
            Próximo Evento Oficial
          </span>
          <h3 className="font-black text-white text-base uppercase mt-1.5 font-title tracking-wide">{tournament.name}</h3>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-[11px] text-gray-400 font-medium">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-500" /> {new Date(tournament.date).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-500" /> {tournament.time}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-500" /> {tournament.locality}, {tournament.department}</span>
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-gray-500" /> Liga {tournament.league_id.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className={`px-2.5 py-0.5 rounded text-[8px] font-black font-esports uppercase tracking-wider ${
            tournament.status === 'en curso'
              ? 'bg-beyblade-electricRed/10 text-beyblade-electricRed border border-beyblade-electricRed/20 animate-pulse'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {tournament.status === 'en curso' ? 'En Vivo' : 'Publicado'}
          </span>
          <span className="text-[10px] text-gray-500 font-bold mt-1.5">
            Cupo: {tournament.slots_available} / {tournament.slots_total} disponibles
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-black/20 border border-white/5 rounded-2xl p-3 text-center space-y-1">
          <Users className="h-4.5 w-4.5 text-beyblade-electricCyan mx-auto" />
          <div className="text-lg font-black text-white">{inscriptos}</div>
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Inscriptos</div>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-2xl p-3 text-center space-y-1">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-400 mx-auto" />
          <div className="text-lg font-black text-white">{confirmados}</div>
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Confirmados</div>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-2xl p-3 text-center space-y-1">
          <Hourglass className="h-4.5 w-4.5 text-amber-400 mx-auto" />
          <div className="text-lg font-black text-white">{waitlistCount}</div>
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Lista Espera</div>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-2xl p-3 text-center space-y-1">
          <Camera className="h-4.5 w-4.5 text-purple-400 mx-auto" />
          <div className="text-lg font-black text-white">{checkIns}</div>
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Check-Ins</div>
        </div>
      </div>

      {/* Quick actions buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={onViewTournament}
          className="flex-1 min-w-[120px] px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <Award className="h-3.5 w-3.5 text-gray-400" /> Ver Torneo
        </button>

        <button
          onClick={onOpenQRCheckIn}
          className="flex-1 min-w-[120px] px-3.5 py-2 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-neon-cyan"
        >
          <Camera className="h-3.5 w-3.5" /> Acreditación QR
        </button>

        <button
          onClick={onViewBracket}
          className="flex-1 min-w-[120px] px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <Play className="h-3.5 w-3.5 text-gray-400" /> Ver Bracket
        </button>

        <button
          onClick={onSendCommunication}
          className="flex-1 min-w-[120px] px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5 text-gray-400" /> Comunicar
        </button>
      </div>
    </div>
  );
};
