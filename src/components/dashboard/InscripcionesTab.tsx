import React, { useState } from 'react';
import { Search, User, Filter, Check, X, ShieldAlert, Award, RefreshCw, Calendar } from 'lucide-react';
import type { Registration } from '../../services/dbService';

interface InscripcionesTabProps {
  registrations: Registration[];
  waitlistIds: string[]; // List of player IDs in waitlist
  onApprove: (regId: string) => void;
  onCancel: (regId: string) => void;
  onMoveToWaitlist: (playerId: string) => void;
  onConfirmCheckIn: (regId: string, checked: boolean) => void;
  onViewCareer: (playerId: string) => void;
}

export const InscripcionesTab: React.FC<InscripcionesTabProps> = ({
  registrations,
  waitlistIds,
  onApprove,
  onCancel,
  onMoveToWaitlist,
  onConfirmCheckIn,
  onViewCareer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [leagueFilter, setLeagueFilter] = useState<'all' | 'Junior' | 'Open'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmado' | 'pendiente' | 'waitlist' | 'rechazado'>('all');

  const getRegistrationStatus = (reg: Registration) => {
    if (waitlistIds.includes(reg.player_id)) {
      return 'waitlist';
    }
    return reg.confirmed_status || 'pendiente';
  };

  const filteredRegistrations = registrations.filter(reg => {
    const status = getRegistrationStatus(reg);
    
    // Search filter
    const matchesSearch = 
      reg.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.player_bey_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.player_id.toLowerCase().includes(searchTerm.toLowerCase());

    // League filter
    const matchesLeague = leagueFilter === 'all' || reg.player_league_id === leagueFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesLeague && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Confirmado</span>;
      case 'pendiente':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Pendiente</span>;
      case 'waitlist':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Lista Espera</span>;
      case 'rechazado':
        return <span className="bg-beyblade-electricRed/10 text-beyblade-electricRed border border-beyblade-electricRed/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Cancelado</span>;
      default:
        return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Desconocido</span>;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-beyblade-darker/40 p-4 rounded-2xl border border-white/5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre, Apellido o BEY-ID..."
            className="w-full bg-beyblade-dark border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-beyblade-electricCyan"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-beyblade-dark border border-white/10 rounded-xl px-2.5 py-1.5">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Liga:</span>
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value as any)}
              className="bg-transparent font-bold text-white cursor-pointer focus:outline-none"
            >
              <option value="all">Todas</option>
              <option value="Junior">Junior</option>
              <option value="Open">Open</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-beyblade-dark border border-white/10 rounded-xl px-2.5 py-1.5">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-bold text-white cursor-pointer focus:outline-none"
            >
              <option value="all">Todos</option>
              <option value="confirmado">Confirmado</option>
              <option value="pendiente">Pendiente</option>
              <option value="waitlist">Lista Espera</option>
              <option value="rechazado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-beyblade-darker/35 border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[9px] text-gray-500 font-bold uppercase tracking-wider bg-black/10">
                <th className="py-3 px-4">Jugador</th>
                <th className="py-3 px-4">BEY-ID</th>
                <th className="py-3 px-4">Liga</th>
                <th className="py-3 px-4">Registro</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRegistrations.map((reg) => {
                const status = getRegistrationStatus(reg);
                return (
                  <tr key={reg.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-white/5 p-1.5 rounded-lg border border-white/5 text-gray-400">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-white">{reg.player_name}</div>
                          <div className="text-[10px] text-gray-500">{reg.player_email || 'Sin correo'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-beyblade-electricCyan font-bold uppercase">
                      {reg.player_bey_id || reg.player_id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-400">
                      LIGA {reg.player_league_id?.toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {reg.created_at ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-600" />
                          {new Date(reg.created_at).toLocaleDateString()}
                        </span>
                      ) : 'Manual'}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusLabel(status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {status === 'pendiente' && (
                          <button
                            onClick={() => onApprove(reg.id)}
                            className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-beyblade-darker border border-emerald-500/20 hover:border-transparent p-1.5 rounded-lg transition-all"
                            title="Aprobar Inscripción"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {status !== 'rechazado' && (
                          <button
                            onClick={() => onCancel(reg.id)}
                            className="bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-beyblade-electricRed hover:text-white border border-beyblade-electricRed/20 hover:border-transparent p-1.5 rounded-lg transition-all"
                            title="Cancelar Inscripción"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {status === 'confirmado' && (
                          <button
                            onClick={() => onMoveToWaitlist(reg.player_id)}
                            className="bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/20 hover:border-transparent p-1.5 rounded-lg transition-all"
                            title="Mover a Lista de Espera"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {status === 'confirmado' && !reg.checked_in && (
                          <button
                            onClick={() => onConfirmCheckIn(reg.id, true)}
                            className="bg-beyblade-electricCyan/10 hover:bg-beyblade-electricCyan text-beyblade-electricCyan hover:text-beyblade-darker border border-beyblade-electricCyan/20 hover:border-transparent px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase transition-all"
                          >
                            Check-In
                          </button>
                        )}

                        {reg.checked_in && (
                          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider px-2 py-1">✔ Presente</span>
                        )}

                        <button
                          onClick={() => onViewCareer(reg.player_id)}
                          className="bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white p-1.5 rounded-lg transition-all"
                          title="Ver Perfil / Carrera"
                        >
                          <Award className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500 italic">
                    No se encontraron inscripciones registradas.
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
