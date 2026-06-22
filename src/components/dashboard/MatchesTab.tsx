import React, { useState } from 'react';
import { Trophy, Check, Play, Save, Loader2, AlertCircle } from 'lucide-react';
import type { Tournament, Bracket, BracketMatch } from '../../services/dbService';
import { DbService } from '../../services/dbService';
import { supabase } from '../../lib/supabaseClient';

interface MatchesTabProps {
  tournament: Tournament;
  activeBracket: Bracket | null;
  bracketMatches: BracketMatch[];
  isLoading: boolean;
  onGenerateBracket: () => void;
  onRefresh: () => void;
  currentUser: any;
}

export const MatchesTab: React.FC<MatchesTabProps> = ({
  tournament,
  activeBracket,
  bracketMatches,
  isLoading,
  onGenerateBracket,
  onRefresh,
  currentUser
}) => {
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (isLoading) {
    return (
      <div className="text-center py-12 space-y-3 bg-beyblade-card border border-white/5 rounded-3xl">
        <Loader2 className="h-8 w-8 text-beyblade-electricCyan animate-spin mx-auto" />
        <p className="text-xs text-gray-400 font-bold">Cargando llaves y enfrentamientos...</p>
      </div>
    );
  }

  if (!activeBracket) {
    return (
      <div className="bg-beyblade-card border border-white/5 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto text-left">
        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
          <Trophy className="h-6 w-6 text-beyblade-gold" />
          <div>
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">Generar Bracket Eliminatorio</h4>
            <p className="text-xs text-gray-500">Inicia el sorteo oficial y la llave de cruces</p>
          </div>
        </div>
        
        <p className="text-xs text-gray-400 leading-relaxed">
          Para generar la llave de eliminación directa, primero debes acreditar (Check-In) a todos los competidores presentes desde la pestaña de Inscripciones. Se requiere un mínimo de 2 jugadores acreditados.
        </p>

        <button
          onClick={onGenerateBracket}
          className="w-full py-3 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-neon-cyan flex items-center justify-center gap-2"
        >
          <Trophy className="h-4.5 w-4.5" /> Generar Cruces del Torneo
        </button>
      </div>
    );
  }

  // Group matches by round_number
  const roundsMap: { [round: number]: BracketMatch[] } = {};
  bracketMatches.forEach(m => {
    if (!roundsMap[m.round_number]) roundsMap[m.round_number] = [];
    roundsMap[m.round_number].push(m);
  });

  const roundNumbers = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);

  const getRoundName = (roundNum: number) => {
    const totalRounds = roundNumbers.length;
    if (roundNum === totalRounds) return 'Gran Final';
    if (roundNum === totalRounds - 1) return 'Semifinales';
    if (roundNum === totalRounds - 2) return 'Cuartos de Final';
    if (roundNum === totalRounds - 3) return 'Octavos de Final';
    return `Ronda ${roundNum}`;
  };

  const handleStartCombat = async (matchId: string) => {
    try {
      setErrorMsg('');
      await DbService.updateBracketMatchStatus(matchId, 'in_progress');
      await DbService.addAuditLog(
        tournament.id,
        'start_combat',
        `Combate iniciado para el match ID ${matchId.substring(0, 8)}`,
        currentUser.id
      );
      onRefresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al iniciar combate.');
    }
  };

  const handleSaveResult = async (match: BracketMatch) => {
    if (!match.player1_id || !match.player2_id) return;
    
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Determine winner based on score
      let winnerId = '';
      if (scoreP1 > scoreP2) {
        winnerId = match.player1_id;
      } else if (scoreP2 > scoreP1) {
        winnerId = match.player2_id;
      } else {
        throw new Error('Debe haber un ganador. Los puntajes de combate no pueden ser iguales.');
      }

      await DbService.submitMatchResult(match.id!, winnerId, scoreP1, scoreP2);
      
      const winnerName = winnerId === match.player1_id ? match.player1_name : match.player2_name;
      await DbService.addAuditLog(
        tournament.id,
        'report_score',
        `Resultado cargado: ${match.player1_name} (${scoreP1}) vs ${match.player2_name} (${scoreP2}). Ganador: ${winnerName}`,
        currentUser.id
      );

      // Clean up table assignment if this match was assigned to a table
      const { data: assignedTable } = await supabase
        .from('tournament_tables')
        .select('id, table_number')
        .eq('match_id', match.id)
        .maybeSingle();

      if (assignedTable) {
        await DbService.updateTournamentTableStatus(assignedTable.id, 'libre', null);
        await DbService.addAuditLog(
          tournament.id,
          'table_freed',
          `Mesa ${assignedTable.table_number} liberada automáticamente al finalizar combate.`,
          currentUser.id
        );
      }

      setSuccessMsg('Resultado cargado y propagado correctamente.');
      setSelectedMatch(null);
      onRefresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al guardar resultado del combate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div>
          <h4 className="font-extrabold text-[11px] text-gray-400 uppercase tracking-wider font-esports">Árbol de Enfrentamientos (Bracket)</h4>
          <p className="text-xs text-gray-500">Visualiza las rondas y actualiza los marcadores en tiempo real</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-[10px] uppercase rounded-lg transition-all"
        >
          Sincronizar
        </button>
      </div>

      {errorMsg && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" /> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="h-4.5 w-4.5" /> {successMsg}
        </div>
      )}

      {/* Bracket Rounds Layout */}
      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-8 min-w-[700px] items-stretch justify-start pt-2">
          {roundNumbers.map((roundNum) => {
            const matches = roundsMap[roundNum];
            return (
              <div key={roundNum} className="flex-1 flex flex-col gap-4 min-w-[220px]">
                <div className="text-center pb-2 border-b border-white/5 bg-black/10 rounded-t-xl py-1">
                  <span className="text-[10px] font-black uppercase text-beyblade-electricCyan font-esports tracking-wider">
                    {getRoundName(roundNum)}
                  </span>
                </div>

                <div className="flex flex-col justify-around h-full gap-4">
                  {matches.map((m) => {
                    const isCompleted = m.status === 'completed';
                    const isInProgress = m.status === 'in_progress';
                    const isSelected = selectedMatch?.id === m.id;
                    const canPlay = m.player1_id && m.player2_id;

                    return (
                      <div
                        key={m.id}
                        className={`bg-beyblade-card border rounded-2xl p-3.5 text-xs space-y-2.5 transition-all relative ${
                          isCompleted
                            ? 'border-white/5 opacity-70'
                            : isSelected
                            ? 'border-beyblade-electricCyan ring-1 ring-beyblade-electricCyan'
                            : isInProgress
                            ? 'border-beyblade-electricRed animate-pulse shadow-[0_0_10px_rgba(240,0,50,0.15)]'
                            : canPlay
                            ? 'border-white/10 hover:border-beyblade-electricCyan/50 cursor-pointer'
                            : 'border-white/5 opacity-50'
                        }`}
                        onClick={() => {
                          if (!isCompleted && !m.bye_assigned && canPlay) {
                            setSelectedMatch(m);
                            setScoreP1(m.player1_score || 0);
                            setScoreP2(m.player2_score || 0);
                          }
                        }}
                      >
                        {/* Player 1 Slot */}
                        <div className="flex justify-between items-center">
                          <span className={`font-extrabold truncate max-w-[130px] ${
                            isCompleted && m.winner_id === m.player1_id ? 'text-beyblade-electricCyan' : 'text-white'
                          }`}>
                            {m.player1_name || 'Pendiente'}
                          </span>
                          <span className="font-mono font-black text-white">{m.player1_score}</span>
                        </div>

                        <div className="h-[1px] bg-white/5 w-full"></div>

                        {/* Player 2 Slot */}
                        <div className="flex justify-between items-center">
                          {m.bye_assigned ? (
                            <span className="text-emerald-450 font-black uppercase text-[8px] font-esports tracking-wide">
                              [ BYE / Pase Directo ]
                            </span>
                          ) : (
                            <span className={`font-extrabold truncate max-w-[130px] ${
                              isCompleted && m.winner_id === m.player2_id ? 'text-beyblade-electricCyan' : 'text-white'
                            }`}>
                              {m.player2_name || 'Pendiente'}
                            </span>
                          )}
                          <span className="font-mono font-black text-white">
                            {m.bye_assigned ? '-' : m.player2_score}
                          </span>
                        </div>

                        {/* State & Winner Badge */}
                        {isCompleted && m.winner_name && (
                          <div className="text-[8px] font-black uppercase text-emerald-400 font-esports pt-1 flex items-center gap-0.5 border-t border-white/5 mt-1.5">
                            <Check className="h-3 w-3" /> Ganó {m.winner_name.split(' ')[0]}
                          </div>
                        )}

                        {isInProgress && (
                          <div className="text-[8px] font-black uppercase text-beyblade-electricRed font-esports pt-1 flex items-center gap-1 border-t border-white/5 mt-1.5">
                            <Play className="h-3 w-3 animate-ping" /> En combate...
                          </div>
                        )}

                        {/* Combat control triggers */}
                        {!isCompleted && !m.bye_assigned && canPlay && !isSelected && (
                          <div className="pt-2 flex gap-1.5" onClick={e => e.stopPropagation()}>
                            {!isInProgress && (
                              <button
                                onClick={() => handleStartCombat(m.id!)}
                                className="w-full py-1 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-beyblade-electricRed hover:text-white border border-beyblade-electricRed/20 hover:border-transparent font-bold text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1"
                              >
                                <Play className="h-3 w-3" /> Iniciar Combate
                              </button>
                            )}
                          </div>
                        )}

                        {/* Result registration form (Inline overlay when clicked) */}
                        {isSelected && (
                          <div className="bg-beyblade-darker border border-white/10 p-3 rounded-xl space-y-3 mt-2" onClick={(e) => e.stopPropagation()}>
                            <h5 className="text-[9px] font-black uppercase text-beyblade-electricCyan tracking-wider font-esports">Registrar Marcador</h5>
                            
                            <div className="grid grid-cols-2 gap-3 text-center text-xs">
                              <div className="space-y-1">
                                <span className="text-[8px] text-gray-500 font-bold uppercase truncate block max-w-[90px] mx-auto">{m.player1_name?.split(' ')[0]}</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  value={scoreP1}
                                  onChange={(e) => setScoreP1(Number(e.target.value))}
                                  className="w-full bg-beyblade-dark border border-white/10 rounded-lg py-1.5 text-center text-white font-mono font-black focus:outline-none focus:border-beyblade-electricCyan"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] text-gray-500 font-bold uppercase truncate block max-w-[90px] mx-auto">{m.player2_name?.split(' ')[0]}</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  value={scoreP2}
                                  onChange={(e) => setScoreP2(Number(e.target.value))}
                                  className="w-full bg-beyblade-dark border border-white/10 rounded-lg py-1.5 text-center text-white font-mono font-black focus:outline-none focus:border-beyblade-electricCyan"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedMatch(null)}
                                className="w-1/2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-bold text-[9px] uppercase rounded-lg transition-all"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveResult(m)}
                                disabled={isSubmitting}
                                className="w-1/2 py-1.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1 shadow-neon-cyan"
                              >
                                <Save className="h-3 w-3" /> Guardar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
