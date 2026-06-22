import React, { useState } from 'react';
import { Send, Check, AlertCircle, FileText, Smartphone, MessageSquare, Megaphone, Loader2 } from 'lucide-react';
import type { Tournament } from '../../services/dbService';
import { DbService } from '../../services/dbService';

interface ComunicacionesTabProps {
  tournament: Tournament;
  currentUser: any;
}

interface Template {
  id: string;
  name: string;
  title: string;
  message: string;
}

export const ComunicacionesTab: React.FC<ComunicacionesTabProps> = ({
  tournament,
  currentUser
}) => {
  const [target, setTarget] = useState<'participantes' | 'junior' | 'open' | 'todos'>('participantes');
  const [channel, setChannel] = useState<'in_app' | 'push' | 'whatsapp' | 'todos_canales'>('in_app');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const templates: Template[] = [
    {
      id: 'custom',
      name: '✏ Comunicado Personalizado',
      title: '',
      message: ''
    },
    {
      id: 'confirmation_48h',
      name: '📢 Confirmación Asistencia (48hs Antes)',
      title: '¡Confirma tu asistencia al torneo!',
      message: `Hola, te recordamos validar tu asistencia para "${tournament.name}". Si no confirmas tu presencia antes de las próximas 24 horas, tu cupo será reasignado a la lista de espera.`
    },
    {
      id: 'welcome',
      name: '🏆 Bienvenida al Torneo',
      title: '¡Todo listo para la batalla!',
      message: `Te damos la bienvenida oficial a "${tournament.name}". El evento iniciará puntualmente el ${new Date(tournament.date).toLocaleDateString()} a las ${tournament.time} en ${tournament.address}. ¡Trae tus mejores Beyblades!`
    },
    {
      id: 'results_published',
      name: '📊 Resultados del Evento Publicados',
      title: 'Marcadores finales cargados',
      message: `Se han publicado los brackets y resultados finales del torneo "${tournament.name}". Entra a la aplicación y revisa tu posición en la tabla de ranking oficial.`
    }
  ];

  const handleSelectTemplate = (temp: Template) => {
    setTitle(temp.title);
    setMessage(temp.message);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      setErrorMsg('Por favor completa el título y el cuerpo del mensaje.');
      return;
    }

    setIsSending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const count = await DbService.sendMassAnnouncement(
        target,
        title,
        message,
        channel,
        tournament.id,
        currentUser.country_id
      );

      await DbService.addAuditLog(
        tournament.id,
        'send_communication',
        `Comunicación masiva enviada a ${count} jugadores via canal "${channel}" (${target})`,
        currentUser.id
      );

      setSuccessMsg(`¡Comunicación enviada con éxito a ${count} jugadores!`);
      setTitle('');
      setMessage('');
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al despachar la comunicación.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="space-y-6 animate-fade-in text-left max-w-xl">
      <div className="space-y-1 pb-2 border-b border-white/5">
        <h4 className="font-extrabold text-[11px] text-gray-400 uppercase tracking-wider font-esports">Comunicaciones Masivas</h4>
        <p className="text-xs text-gray-500">
          Envía notificaciones de forma masiva a los jugadores del torneo o a ligas completas a nivel nacional.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="h-4.5 w-4.5" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" /> {errorMsg}
        </div>
      )}

      {/* Templates Panel Selector */}
      <div className="space-y-2">
        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Plantillas Predefinidas</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {templates.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTemplate(t)}
              className="bg-beyblade-card border border-white/5 hover:border-beyblade-electricCyan/45 text-left p-3.5 rounded-xl hover:bg-white/[0.01] transition-all flex items-center gap-2"
            >
              <FileText className="h-4 w-4 text-beyblade-electricCyan shrink-0" />
              <span className="font-bold text-white leading-tight truncate">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 space-y-4">
        {/* Destination & Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Destinatarios</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as any)}
              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white cursor-pointer"
            >
              <option value="participantes">Participantes del Torneo ({tournament.name})</option>
              <option value="junior">Liga Junior a Nivel Nacional ({currentUser.country_id})</option>
              <option value="open">Liga Open a Nivel Nacional ({currentUser.country_id})</option>
              <option value="todos">Todos los Jugadores del País ({currentUser.country_id})</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Canal de Envío</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white cursor-pointer"
            >
              <option value="in_app">Notificación In-App (Real)</option>
              <option value="push">Push Notification (Alerta Móvil Simulado)</option>
              <option value="whatsapp">Mensaje WhatsApp (Simulado)</option>
              <option value="todos_canales">Todos los Canales</option>
            </select>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3.5">
          <div className="space-y-1 text-xs">
            <label className="text-[10px] text-gray-500 font-bold uppercase block">Título del Mensaje</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Cambio de horarios en mesa..."
              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-beyblade-electricCyan"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-[10px] text-gray-500 font-bold uppercase block">Cuerpo del Mensaje</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe el mensaje aquí..."
              rows={4}
              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-beyblade-electricCyan font-sans"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSending}
        className="w-full py-3 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 disabled:bg-white/5 text-beyblade-darker disabled:text-gray-500 font-black font-esports text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-neon-cyan"
      >
        {isSending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Despachando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Despachar Notificación Masiva
          </>
        )}
      </button>

      {/* Simulators Information */}
      {(channel === 'push' || channel === 'whatsapp' || channel === 'todos_canales') && (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-3.5 text-[10px] text-gray-550 leading-relaxed font-sans space-y-1.5">
          <div className="font-bold text-gray-400 flex items-center gap-1">
            <Smartphone className="h-3.5 w-3.5 text-beyblade-electricCyan" /> Envío de Canales Externos
          </div>
          <p>
            Al seleccionar **Push** o **WhatsApp**, se simulará el envío disparando una alerta transaccional en pantalla a los destinatarios y se guardará el registro en `notification_delivery_logs`. El envío real requiere configurar llaves de pasarela de mensajería comercial.
          </p>
        </div>
      )}
    </form>
  );
};
