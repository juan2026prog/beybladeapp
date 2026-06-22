import React, { useEffect, useState } from 'react';
import { LayoutGrid, Check, X, Shield, Users, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import type { Tournament, BracketMatch, Judge, TournamentTable } from '../../services/dbService';
import { DbService } from '../../services/dbService';

interface MesasTabProps {
  tournament: Tournament;
  bracketMatches: BracketMatch[];
  judges: Judge[];
  currentUser: any;
}

export const MesasTab: React.FC<MesasTabProps> = ({
  tournament,
  bracketMatches,
  judges,
  currentUser
}) => {
  const [tables, setTables] = useState<TournamentTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [assigningTableId, setAssigningTableId] = useState<string | null>(null);
  
  // Selection states for assignment
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedJudgeId, setSelectedJudgeId] = useState('');

  const fetchTables = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // First, initialize tables if they don't exist
      await DbService.initializeTournamentTables(tournament.id);
      // Fetch them
      const list = await DbService.getTournamentTables(tournament.id);
      setTables(list);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al cargar las mesas de juego.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [tournament.id]);

  const handleUpdateStatus = async (tableId: string, status: 'libre' | 'en_combate' | 'finalizada') => {
    setIsSaving(tableId);
    setErrorMsg('');
    try {
      await DbService.updateTournamentTableStatus(tableId, status);
      await DbService.addAuditLog(
        tournament.id,
        'update_table_status',
        `Estado de mesa actualizado a "${status}"`,
        currentUser.id
      );
      // Reload tables
      const list = await DbService.getTournamentTables(tournament.id);
      setTables(list);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al actualizar estado de la mesa.');
    } finally {
      setIsSaving(null);
    }
  };

  const handleAssignMatchAndJudge = async (tableId: string) => {
    if (!selectedMatchId) {
      setErrorMsg('Debe seleccionar un combate para asignar.');
      return;
    }
    
    setIsSaving(tableId);
    setErrorMsg('');
    try {
      const matchId = selectedMatchId;
      const judgeId = selectedJudgeId || null;

      await DbService.assignMatchToTable(tableId, matchId, judgeId);
      
      // Update match status to in_progress
      await DbService.updateBracketMatchStatus(matchId, 'in_progress');

      const matchObj = bracketMatches.find(m => m.id === matchId);
      const judgeObj = judges.find(j => j.id === judgeId);
      const details = `Mesa asignada al combate: ${matchObj?.player1_name || 'Jugador 1'} vs ${matchObj?.player2_name || 'Jugador 2'}` +
        (judgeObj ? ` con el Juez ${judgeObj.name}` : '');
      
      await DbService.addAuditLog(
        tournament.id,
        'assign_table',
        details,
        currentUser.id
      );

      setAssigningTableId(null);
      setSelectedMatchId('');
      setSelectedJudgeId('');
      
      // Reload tables
      const list = await DbService.getTournamentTables(tournament.id);
      setTables(list);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al asignar combate a la mesa.');
    } finally {
      setIsSaving(null);
    }
  };

  const handleFreeTable = async (table: TournamentTable) => {
    setIsSaving(table.id!);
    setErrorMsg('');
    try {
      await DbService.assignMatchToTable(table.id!, null, null);
      await DbService.addAuditLog(
        tournament.id,
        'free_table',
        `Mesa ${table.table_number} liberada manualmente.`,
        currentUser.id
      );
      // Reload tables
      const list = await DbService.getTournamentTables(tournament.id);
      setTables(list);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al liberar mesa.');
    } finally {
      setIsSaving(null);
    }
  };

  // Get active matches that can be assigned (status not completed and both players are set)
  // Also filter out matches that are already assigned to another table
  const assignedMatchIds = tables.map(t => t.match_id).filter(id => id !== null && id !== undefined) as string[];
  const playableMatches = bracketMatches.filter(m => 
    m.status !== 'completed' && 
    m.player1_id && 
    m.player2_id && 
    !m.bye_assigned &&
    !assignedMatchIds.includes(m.id!)
  );

  const getTableStatusBadge = (status: string) => {
    switch (status) {
      case 'en_combate':
        return <span className="bg-beyblade-electricRed/15 text-beyblade-electricRed border border-beyblade-electricRed/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider animate-pulse">En Combate</span>;
      case 'finalizada':
        return <span className="bg-beyblade-gold/15 text-beyblade-gold border border-beyblade-gold/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Finalizada</span>;
      case 'libre':
      default:
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Libre</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div>
          <h4 className="font-extrabold text-[11px] text-gray-400 uppercase tracking-wider font-esports">Control de Mesas (1-5)</h4>
          <p className="text-xs text-gray-500">Asigna combates de brackets y jueces certificados a las mesas de juego</p>
        </div>
        <button
          onClick={fetchTables}
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

      {isLoading ? (
        <div className="text-center py-12 space-y-3 bg-beyblade-card border border-white/5 rounded-3xl">
          <Loader2 className="h-8 w-8 text-beyblade-electricCyan animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-bold">Cargando Mesas de Arena...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tables.map((t) => {
            const isAssigning = assigningTableId === t.id;
            const isProcessing = isSaving === t.id;

            return (
              <div
                key={t.id}
                className={`bg-beyblade-card border rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                  t.status === 'en_combate'
                    ? 'border-beyblade-electricRed/30 shadow-[0_0_15px_rgba(240,0,50,0.05)]'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Abstract background grid decoration */}
                <div className="absolute top-0 right-0 h-24 w-24 bg-white/[0.01] rounded-full -mr-6 -mt-6 border border-white/[0.02]" />

                {/* Top: Header Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider">Mesa de Arena</span>
                    <h3 className="font-extrabold text-white text-base font-title">MESA {t.table_number}</h3>
                  </div>
                  <div>{getTableStatusBadge(t.status)}</div>
                </div>

                {/* Mid: Content detail */}
                <div className="bg-black/20 border border-white/5 rounded-2xl p-3.5 space-y-3 text-xs">
                  {t.match_id ? (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Combate Asignado</span>
                        <div className="font-extrabold text-white flex justify-between items-center bg-beyblade-darker/60 px-2.5 py-1.5 rounded-lg border border-white/5">
                          <span className="truncate">{t.player1_name || 'Jugador 1'}</span>
                          <span className="text-gray-500 font-mono text-[9px] px-1 bg-white/5 rounded mx-1">VS</span>
                          <span className="truncate">{t.player2_name || 'Jugador 2'}</span>
                        </div>
                      </div>
                      
                      {t.round_number !== undefined && (
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>Ronda {t.round_number}</span>
                          <span>Combate #{t.match_number !== undefined ? t.match_number + 1 : ''}</span>
                        </div>
                      )}

                      <div className="h-[1px] bg-white/5 w-full"></div>

                      <div className="space-y-1">
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Juez de Mesa</span>
                        <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                          <Shield className="h-3.5 w-3.5 text-beyblade-electricCyan shrink-0" />
                          <span>{t.judge_name || 'Sin Juez Asignado'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 italic space-y-1">
                      <LayoutGrid className="h-5 w-5 mx-auto opacity-30 mb-1" />
                      <p className="text-[10px]">Arena disponible para combates</p>
                    </div>
                  )}

                  {/* Assignment Select Form */}
                  {isAssigning && (
                    <div className="space-y-2.5 pt-2 border-t border-white/5">
                      <div className="space-y-1">
                        <label className="text-[8px] text-gray-500 font-bold uppercase block">Seleccionar Combate *</label>
                        <select
                          value={selectedMatchId}
                          onChange={(e) => setSelectedMatchId(e.target.value)}
                          className="w-full bg-beyblade-darker border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                        >
                          <option value="">-- Cruces Disponibles --</option>
                          {playableMatches.map(m => (
                            <option key={m.id} value={m.id}>
                              R{m.round_number} M{m.match_number + 1}: {m.player1_name} vs {m.player2_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] text-gray-500 font-bold uppercase block">Asignar Juez Certificado</label>
                        <select
                          value={selectedJudgeId}
                          onChange={(e) => setSelectedJudgeId(e.target.value)}
                          className="w-full bg-beyblade-darker border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                        >
                          <option value="">-- Juez Opcional --</option>
                          {judges.filter(j => j.status === 'Aprobado').map(j => (
                            <option key={j.id} value={j.id}>{j.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningTableId(null);
                            setSelectedMatchId('');
                            setSelectedJudgeId('');
                          }}
                          className="w-1/2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-[9px] uppercase rounded-lg transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssignMatchAndJudge(t.id!)}
                          className="w-1/2 py-1.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          Asignar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bot: Actions */}
                {!isAssigning && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {t.match_id ? (
                      <>
                        <button
                          onClick={() => handleFreeTable(t)}
                          disabled={isProcessing !== null}
                          className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <X className="h-3 w-3" /> Liberar Mesa
                        </button>
                        
                        {t.status === 'en_combate' && (
                          <button
                            onClick={() => handleUpdateStatus(t.id!, 'finalizada')}
                            disabled={isProcessing !== null}
                            className="flex-1 py-1.5 bg-beyblade-gold/10 hover:bg-beyblade-gold text-beyblade-gold hover:text-beyblade-darker border border-beyblade-gold/20 hover:border-transparent font-bold text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            Finalizar Combate
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setAssigningTableId(t.id!);
                          setSelectedMatchId('');
                          setSelectedJudgeId('');
                        }}
                        disabled={isProcessing !== null || playableMatches.length === 0}
                        className={`w-full py-2 font-black font-esports text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1 ${
                          playableMatches.length === 0
                            ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                            : 'bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker shadow-neon-cyan'
                        }`}
                      >
                        {playableMatches.length === 0 ? 'Sin combates para asignar' : 'Asignar Combate'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
