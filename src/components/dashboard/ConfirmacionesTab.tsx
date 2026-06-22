import React from 'react';
import { Send, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import type { Registration } from '../../services/dbService';

interface ConfirmacionesTabProps {
  registrations: Registration[];
  onSendRecordatorios: () => void;
  onUpdateConfirmationStatus: (regId: string, status: 'confirmado' | 'rechazado') => void;
}

export const ConfirmacionesTab: React.FC<ConfirmacionesTabProps> = ({
  registrations,
  onSendRecordatorios,
  onUpdateConfirmationStatus
}) => {
  const pendingConfirmations = registrations.filter(r => r.confirmed_status === 'pendiente' || !r.confirmed_status);
  const confirmedCount = registrations.filter(r => r.confirmed_status === 'confirmado').length;
  const rejectedCount = registrations.filter(r => r.confirmed_status === 'rechazado').length;
  const pendingCount = pendingConfirmations.length;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Broadcast panel */}
      <div className="bg-gradient-to-r from-beyblade-card to-beyblade-darker border border-white/5 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">Confirmaciones 48hs Antes</h4>
          <p className="text-xs text-gray-500 max-w-xl">
            Envía una alerta transaccional (notificación In-App, Push y WhatsApp) a los competidores con asistencia pendiente pidiendo que validen su presencia en el evento.
          </p>
        </div>
        <button
          onClick={onSendRecordatorios}
          disabled={pendingCount === 0}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
            pendingCount === 0
              ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
              : 'bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker shadow-neon-cyan'
          }`}
        >
          <Send className="h-4 w-4" /> Enviar Alerta Masiva ({pendingCount})
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xl font-black text-white">{confirmedCount}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Asistencias Confirmadas</div>
          </div>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-amber-400 shrink-0" />
          <div>
            <div className="text-xl font-black text-white">{pendingCount}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pendientes de Confirmar</div>
          </div>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <XCircle className="h-8 w-8 text-beyblade-electricRed shrink-0" />
          <div>
            <div className="text-xl font-black text-white">{rejectedCount}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Declinados / Cancelados</div>
          </div>
        </div>
      </div>

      {/* List of Pending Confirmations */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-[11px] text-gray-400 uppercase tracking-wider font-esports">Pendientes de Asistencia</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingConfirmations.map((reg) => (
            <div key={reg.id} className="bg-beyblade-card border border-white/5 rounded-2xl p-4 flex justify-between items-center text-xs">
              <div>
                <div className="font-extrabold text-white">{reg.player_name}</div>
                <div className="text-[9px] font-mono text-beyblade-electricCyan uppercase mt-0.5">{reg.player_bey_id || reg.player_id.substring(0, 8)}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateConfirmationStatus(reg.id, 'confirmado')}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-beyblade-darker border border-emerald-500/20 hover:border-transparent font-bold text-[10px] uppercase rounded-lg transition-all"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => onUpdateConfirmationStatus(reg.id, 'rechazado')}
                  className="px-3 py-1.5 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-beyblade-electricRed hover:text-white border border-beyblade-electricRed/20 hover:border-transparent font-bold text-[10px] uppercase rounded-lg transition-all"
                >
                  Declinar
                </button>
              </div>
            </div>
          ))}
          {pendingConfirmations.length === 0 && (
            <p className="col-span-full text-center text-gray-500 italic py-4 text-xs">No hay confirmaciones de asistencia pendientes en este momento.</p>
          )}
        </div>
      </div>
    </div>
  );
};
