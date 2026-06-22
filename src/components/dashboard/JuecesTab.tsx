import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Award, Star, RefreshCw, AlertCircle } from 'lucide-react';
import type { Judge, Tournament } from '../../services/dbService';
import { DbService } from '../../services/dbService';
import { supabase } from '../../lib/supabaseClient';

interface JuecesTabProps {
  tournament: Tournament;
  judges: Judge[];
  currentUser: any;
}

export const JuecesTab: React.FC<JuecesTabProps> = ({
  tournament,
  judges,
  currentUser
}) => {
  const [enrichedJudges, setEnrichedJudges] = useState<(Judge & { certification?: string; activeTable?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadJudgesData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch judges certifications directly from table
      const { data: certData, error: certErr } = await supabase
        .from('judges')
        .select('id, certification');
      
      if (certErr) throw certErr;

      // 2. Fetch active assignments in tournament tables
      const { data: activeTables, error: tablesErr } = await supabase
        .from('tournament_tables')
        .select('judge_id, table_number')
        .eq('tournament_id', tournament.id);

      if (tablesErr) throw tablesErr;

      const enriched = judges.map(j => {
        const cert = certData?.find(c => c.id === j.id)?.certification || 'Básico';
        const assignedTable = activeTables?.find(t => t.judge_id === j.id)?.table_number;
        return {
          ...j,
          certification: cert,
          activeTable: assignedTable
        };
      });

      setEnrichedJudges(enriched);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al enriquecer información de jueces.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJudgesData();
  }, [tournament.id, judges]);

  const handleUpdateCertification = async (judgeId: string, level: string) => {
    setIsUpdating(judgeId);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('judges')
        .update({ certification: level })
        .eq('id', judgeId);

      if (error) throw error;
      
      await DbService.addAuditLog(
        tournament.id,
        'update_judge_certification',
        `Juez ${enrichedJudges.find(j => j.id === judgeId)?.name} promovido a certificación "${level}"`,
        currentUser.id
      );

      await loadJudgesData();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al actualizar certificación del juez.');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div>
          <h4 className="font-extrabold text-[11px] text-gray-400 uppercase tracking-wider font-esports">Panel de Jueces y Staff</h4>
          <p className="text-xs text-gray-500">Administra los rangos de certificación y supervisa la asignación en mesas</p>
        </div>
        <button
          onClick={loadJudgesData}
          disabled={isLoading}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 p-2 rounded-lg transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {errorMsg && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrichedJudges.map((j) => {
          const isProcessing = isUpdating === j.id;

          return (
            <div
              key={j.id}
              className="bg-beyblade-card border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3">
                  {/* Status avatar icon */}
                  <div className="bg-beyblade-darker/60 border border-white/5 h-11 w-11 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-beyblade-electricCyan" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs uppercase">{j.name || 'Juez Oficial'}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{j.locality_name} • {j.country_id}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/20 text-[8.5px] font-black uppercase px-2 py-0.5 rounded tracking-wide font-esports">
                        Rango: {j.certification}
                      </span>
                      {j.activeTable !== undefined && (
                        <span className="bg-beyblade-electricRed/10 text-beyblade-electricRed border border-beyblade-electricRed/20 text-[8.5px] font-black uppercase px-2 py-0.5 rounded tracking-wide font-esports animate-pulse">
                          Mesa {j.activeTable}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${
                  j.status === 'Aprobado' 
                    ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                    : j.status === 'Pendiente'
                    ? 'bg-amber-500/10 text-amber-450 border-amber-500/20'
                    : 'bg-beyblade-electricRed/10 text-beyblade-electricRed border-beyblade-electricRed/20'
                }`}>
                  {j.status === 'Aprobado' ? 'Activo' : j.status}
                </span>
              </div>

              {j.status === 'Aprobado' && (
                <div className="border-t border-white/5 pt-3.5 text-xs space-y-2">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Certificar Nivel de Juez</span>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {['Básico', 'Oficial', 'Nacional', 'Internacional'].map((level) => {
                      const isCurrent = j.certification === level;
                      return (
                        <button
                          key={level}
                          onClick={() => handleUpdateCertification(j.id, level)}
                          disabled={isCurrent || isProcessing}
                          className={`px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg border transition-all ${
                            isCurrent
                              ? 'bg-beyblade-electricCyan text-beyblade-darker border-transparent font-black shadow-neon-cyan'
                              : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5 hover:text-white'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {enrichedJudges.length === 0 && (
          <div className="bg-beyblade-darker/20 border border-white/5 border-dashed rounded-3xl p-8 text-center space-y-2 col-span-full">
            <ShieldAlert className="h-8 w-8 text-gray-600 mx-auto" />
            <h5 className="font-extrabold text-xs text-gray-400 uppercase">Sin Jueces Acreditados</h5>
            <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
              No hay jueces de tu país registrados y aprobados para arbitrar en el torneo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
