import React, { useEffect, useState } from 'react';
import { BarChart2, Trophy, Users, CheckCircle, RefreshCw, Loader2, Award, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { Tournament } from '../../services/dbService';

interface OrganizadorStatsTabProps {
  currentUser: any;
}

interface OrganizerMetrics {
  totalTournaments: number;
  completedTournaments: number;
  totalRegistrations: number;
  checkedInRegistrations: number;
  averageAttendance: number;
  uniquePlayersCount: number;
}

export const OrganizadorStatsTab: React.FC<OrganizadorStatsTabProps> = ({
  currentUser
}) => {
  const [metrics, setMetrics] = useState<OrganizerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadMetrics = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch tournaments owned by organizer
      const { data: tours, error: toursErr } = await supabase
        .from('tournaments')
        .select('id, status')
        .eq('organizer_id', currentUser.id);

      if (toursErr) throw toursErr;
      const tournamentIds = (tours || []).map(t => t.id);

      if (tournamentIds.length === 0) {
        setMetrics({
          totalTournaments: 0,
          completedTournaments: 0,
          totalRegistrations: 0,
          checkedInRegistrations: 0,
          averageAttendance: 0,
          uniquePlayersCount: 0
        });
        return;
      }

      // 2. Fetch registrations for those tournaments
      const { data: regs, error: regsErr } = await supabase
        .from('tournament_registrations')
        .select('player_id, checked_in, tournament_id')
        .in('tournament_id', tournamentIds);

      if (regsErr) throw regsErr;

      const totalTours = tours?.length || 0;
      const completedTours = tours?.filter(t => t.status === 'finalizado').length || 0;
      const totalRegs = regs?.length || 0;
      const checkedInRegs = regs?.filter(r => r.checked_in).length || 0;

      // Unique players set
      const uniquePlayers = new Set((regs || []).map(r => r.player_id));

      // Average attendance per completed tournament
      const avgAttendance = completedTours > 0 ? Number((checkedInRegs / completedTours).toFixed(1)) : 0;

      setMetrics({
        totalTournaments: totalTours,
        completedTournaments: completedTours,
        totalRegistrations: totalRegs,
        checkedInRegistrations: checkedInRegs,
        averageAttendance: avgAttendance,
        uniquePlayersCount: uniquePlayers.size
      });
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al calcular estadísticas del organizador.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [currentUser.id]);

  if (isLoading) {
    return (
      <div className="text-center py-12 space-y-3 bg-beyblade-card border border-white/5 rounded-3xl">
        <Loader2 className="h-8 w-8 text-beyblade-electricCyan animate-spin mx-auto" />
        <p className="text-xs text-gray-400 font-bold">Calculando estadísticas históricas...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed p-4 rounded-xl text-xs font-bold text-center">
        {errorMsg}
      </div>
    );
  }

  const data = metrics || {
    totalTournaments: 0,
    completedTournaments: 0,
    totalRegistrations: 0,
    checkedInRegistrations: 0,
    averageAttendance: 0,
    uniquePlayersCount: 0
  };

  const completionRate = data.totalTournaments > 0 
    ? Math.round((data.completedTournaments / data.totalTournaments) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div>
          <h4 className="font-extrabold text-[11px] text-gray-400 uppercase tracking-wider font-esports">Indicadores del Organizador</h4>
          <p className="text-xs text-gray-500">Métricas de rendimiento e impacto competitivo local</p>
        </div>
        <button
          onClick={loadMetrics}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 p-2 rounded-lg transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tournaments */}
        <div className="bg-beyblade-card border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-beyblade-electricCyan/15 text-beyblade-electricCyan border border-beyblade-electricCyan/20 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{data.totalTournaments}</div>
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Eventos Creados</div>
          </div>
        </div>

        {/* Completed Tournaments */}
        <div className="bg-beyblade-card border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-450 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{data.completedTournaments}</div>
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Eventos Finalizados</div>
          </div>
        </div>

        {/* Average Attendance */}
        <div className="bg-beyblade-card border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-beyblade-electricRed/15 text-beyblade-electricRed border border-beyblade-electricRed/20 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{data.averageAttendance}</div>
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Asistencia Promedio</div>
          </div>
        </div>

        {/* Unique Players */}
        <div className="bg-beyblade-card border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-purple-500/15 text-purple-450 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{data.uniquePlayersCount}</div>
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Jugadores Únicos</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Completion Rate */}
        <div className="lg:col-span-1 bg-beyblade-card border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-4">
          <h3 className="font-extrabold text-xs text-white uppercase tracking-wider font-title">Tasa de Finalización</h3>
          
          <div className="space-y-3.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-400">Eficiencia Operativa</span>
              <span className="text-beyblade-electricCyan">{completionRate}%</span>
            </div>
            
            <div className="h-2.5 w-full bg-beyblade-darker rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-beyblade-electricCyan shadow-neon-cyan transition-all duration-550" 
                style={{ width: `${completionRate}%` }}
              />
            </div>

            <p className="text-[10px] text-gray-500 leading-normal font-sans pt-1">
              Representa el porcentaje de torneos cerrados y publicados de forma oficial del total de torneos creados por ti.
            </p>
          </div>
        </div>

        {/* Right: Registration statistics detailed */}
        <div className="lg:col-span-2 bg-beyblade-card border border-white/5 rounded-3xl p-6 space-y-4">
          <h3 className="font-extrabold text-xs text-white uppercase tracking-wider font-title">Métricas de Participación</h3>
          
          <div className="space-y-4 text-xs font-medium">
            <div className="flex justify-between items-center bg-black/10 p-3 rounded-xl border border-white/5">
              <span className="text-gray-400">Total Inscripciones Solicitadas</span>
              <span className="text-white font-extrabold">{data.totalRegistrations}</span>
            </div>

            <div className="flex justify-between items-center bg-black/10 p-3 rounded-xl border border-white/5">
              <span className="text-gray-400">Total Check-Ins Realizados (Presentes)</span>
              <span className="text-emerald-400 font-extrabold">{data.checkedInRegistrations}</span>
            </div>

            <div className="flex justify-between items-center bg-black/10 p-3 rounded-xl border border-white/5">
              <span className="text-gray-400">Tasa de Presentismo Real</span>
              <span className="text-beyblade-electricCyan font-extrabold">
                {data.totalRegistrations > 0 
                  ? `${Math.round((data.checkedInRegistrations / data.totalRegistrations) * 100)}%` 
                  : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
