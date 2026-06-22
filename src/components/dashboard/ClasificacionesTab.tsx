import React, { useState } from 'react';
import { Award, Check, Save } from 'lucide-react';
import type { Tournament } from '../../services/dbService';
import { DbService } from '../../services/dbService';

interface ClasificacionesTabProps {
  tournament: Tournament;
  onSaved: () => void;
}

export const ClasificacionesTab: React.FC<ClasificacionesTabProps> = ({
  tournament,
  onSaved
}) => {
  const [qualifiesRegional, setQualifiesRegional] = useState(tournament.qualifies_regional || false);
  const [qualifiesNacional, setQualifiesNacional] = useState(tournament.qualifies_nacional || false);
  const [qualifiesLatam, setQualifiesLatam] = useState(tournament.qualifies_latam || false);
  const [qualifiesTopX, setQualifiesTopX] = useState(tournament.qualifies_top_x || 8);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg('');
    setErr('');

    try {
      await DbService.updateTournamentQualifiers(tournament.id, {
        qualifies_regional: qualifiesRegional,
        qualifies_nacional: qualifiesNacional,
        qualifies_latam: qualifiesLatam,
        qualifies_top_x: Number(qualifiesTopX)
      });
      setMsg('Configuración de clasificaciones guardada con éxito.');
      setTimeout(() => setMsg(''), 3000);
      onSaved();
    } catch (e: any) {
      setErr(e.message || 'Error al guardar clasificaciones.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in text-left max-w-lg">
      <div className="space-y-1.5 border-b border-white/5 pb-2">
        <h4 className="font-extrabold text-[11px] text-gray-400 uppercase tracking-wider font-esports">Configuración de Clasificaciones</h4>
        <p className="text-xs text-gray-500">
          Define si este torneo otorga pases directos de clasificación a ligas de rango superior y cuántos puestos de la tabla final clasifican.
        </p>
      </div>

      {msg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="h-4.5 w-4.5" /> {msg}
        </div>
      )}

      {err && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed p-3.5 rounded-xl text-xs font-bold">
          {err}
        </div>
      )}

      <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 space-y-4">
        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Destino de Clasificación</label>
          
          <label className="flex items-center gap-3 bg-beyblade-darker/40 p-3 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <input
              type="checkbox"
              checked={qualifiesRegional}
              onChange={(e) => setQualifiesRegional(e.target.checked)}
              className="accent-beyblade-electricCyan h-4 w-4"
            />
            <div>
              <div className="font-bold text-white text-xs">Clasifica a Torneo Regional</div>
              <div className="text-[10px] text-gray-500">Los ganadores clasifican a la copa de su región geográfica.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 bg-beyblade-darker/40 p-3 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <input
              type="checkbox"
              checked={qualifiesNacional}
              onChange={(e) => setQualifiesNacional(e.target.checked)}
              className="accent-beyblade-electricCyan h-4 w-4"
            />
            <div>
              <div className="font-bold text-white text-xs">Clasifica a Torneo Nacional</div>
              <div className="text-[10px] text-gray-500">Los ganadores aseguran un cupo en la gran final del Campeonato Nacional.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 bg-beyblade-darker/40 p-3 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <input
              type="checkbox"
              checked={qualifiesLatam}
              onChange={(e) => setQualifiesLatam(e.target.checked)}
              className="accent-beyblade-electricCyan h-4 w-4"
            />
            <div>
              <div className="font-bold text-white text-xs">Clasifica a Torneo Latinoamericano (LATAM)</div>
              <div className="text-[10px] text-gray-500">Pase directo al campeonato internacional oficial de Beyblade LATAM.</div>
            </div>
          </label>
        </div>

        {/* Top X Select */}
        <div className="space-y-1.5 text-xs">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">¿Quiénes clasifican?</label>
          <div className="flex items-center gap-3">
            <select
              value={qualifiesTopX}
              onChange={(e) => setQualifiesTopX(Number(e.target.value))}
              className="bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer focus:outline-none focus:border-beyblade-electricCyan"
            >
              <option value={1}>Solo Campeón (Top 1)</option>
              <option value={2}>Finalistas (Top 2)</option>
              <option value={4}>Semifinalistas (Top 4)</option>
              <option value={8}>Cuartofinalistas (Top 8)</option>
              <option value={16}>Top 16</option>
            </select>
            <span className="text-[11px] text-gray-400">
              Los primeros <strong>{qualifiesTopX}</strong> competidores de la tabla final obtendrán el estatus clasificado.
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full py-3 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 disabled:bg-white/5 text-beyblade-darker disabled:text-gray-500 font-black font-esports text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-neon-cyan"
      >
        <Save className="h-4 w-4" /> {isSaving ? 'Guardando...' : 'Guardar Configuración'}
      </button>
    </form>
  );
};
