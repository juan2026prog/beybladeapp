import React, { useEffect, useState } from 'react';
import { Settings, Save, Smartphone, Check, AlertTriangle, Bell, SmartphoneCharging } from 'lucide-react';
import { DbService } from '../services/dbService';
import type { NotificationPreferences as PrefsType } from '../services/dbService';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NotificationPreferencesProps {
  userId: string;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ userId }) => {
  const [prefs, setPrefs] = useState<PrefsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const {
    pushSupported,
    isSubscribed,
    loading: pushLoading,
    subscribeUser,
    unsubscribeUser
  } = usePushNotifications(userId);

  // Load preferences from DB
  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await DbService.getNotificationPreferences(userId);
      setPrefs(data);
    } catch (err: any) {
      console.error('Error loading preferences:', err);
      setError('No se pudieron cargar tus preferencias de notificación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadPreferences();
    }
  }, [userId]);

  // Synchronize push state between DB and PWA manager
  useEffect(() => {
    if (prefs && prefs.push_enabled !== isSubscribed) {
      setPrefs(prev => prev ? { ...prev, push_enabled: isSubscribed } : null);
    }
  }, [isSubscribed]);

  const handleToggle = (key: keyof PrefsType) => {
    if (!prefs) return;
    setPrefs({
      ...prefs,
      [key]: !prefs[key]
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!prefs) return;
    setPrefs({
      ...prefs,
      whatsapp_phone: e.target.value
    });
  };

  const handlePushToggle = async () => {
    if (!pushSupported) return;
    try {
      setError('');
      setSuccess('');
      if (isSubscribed) {
        await unsubscribeUser();
        setSuccess('Notificaciones Push desactivadas en este dispositivo.');
      } else {
        await subscribeUser();
        setSuccess('¡Notificaciones Push activadas con éxito!');
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al modificar permisos de Push.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefs) return;

    setError('');
    setSuccess('');
    setSaving(true);

    // Validations for WhatsApp opt-in
    const hasWhatsappActive = 
      prefs.new_tournament_whatsapp || 
      prefs.new_journey_whatsapp || 
      prefs.points_awarded_whatsapp;

    if (hasWhatsappActive) {
      if (!prefs.whatsapp_phone || prefs.whatsapp_phone.trim() === '') {
        setError('Debes ingresar un número de teléfono para activar alertas por WhatsApp.');
        setSaving(false);
        return;
      }
      if (!prefs.whatsapp_opt_in) {
        setError('Debes autorizar el Opt-In de WhatsApp para activar este canal.');
        setSaving(false);
        return;
      }
    }

    try {
      const updated = await DbService.updateNotificationPreferences(userId, prefs);
      setPrefs(updated);
      setSuccess('Preferencias de notificación guardadas correctamente.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error saving notification preferences:', err);
      setError('Error al guardar preferencias en la base de datos.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center py-10 space-y-3">
        <SmartphoneCharging className="h-7 w-7 text-beyblade-electricCyan animate-bounce" />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cargando preferencias...</p>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 text-center text-gray-500 text-xs">
        No se pudieron inicializar las preferencias de notificación.
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-beyblade-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-12 -left-12 w-28 h-28 bg-beyblade-electricCyan/5 rounded-full blur-2xl"></div>

      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <Settings className="h-4.5 w-4.5 text-beyblade-electricCyan animate-[spin_5s_linear_infinite]" /> Preferencias de Notificación
        </h3>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/80 text-beyblade-darker font-black text-xs uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-lg hover:shadow-beyblade-electricCyan/20 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {/* Notices alerts */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl flex items-center gap-2 animate-fade-in">
          <Check className="h-4 w-4 shrink-0" />
          <span className="font-bold">{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed text-xs p-3.5 rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Main preferences matrix table */}
      <div className="space-y-4">
        <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">
          Configuración por Tipo de Evento y Canal
        </p>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[450px]">
            <thead>
              <tr className="border-b border-white/5 text-[9px] text-gray-400 font-black uppercase tracking-wider">
                <th className="py-2.5">Tipo de Notificación</th>
                <th className="py-2.5 text-center">Plataforma (In-App)</th>
                <th className="py-2.5 text-center">Push (PWA)</th>
                <th className="py-2.5 text-center">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-white">
              {/* Row 1: New Tournament */}
              <tr>
                <td className="py-4 font-bold">
                  <div>Nuevo Torneo</div>
                  <div className="text-[10px] text-gray-400 font-normal mt-0.5">Aviso al publicarse un torneo.</div>
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs.new_tournament_in_app}
                    onChange={() => handleToggle('new_tournament_in_app')}
                    className="h-4 w-4 rounded bg-beyblade-dark border-white/10 text-beyblade-electricCyan focus:ring-beyblade-electricCyan"
                  />
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs.new_tournament_push}
                    onChange={() => handleToggle('new_tournament_push')}
                    className="h-4 w-4 rounded bg-beyblade-dark border-white/10 text-beyblade-electricCyan focus:ring-beyblade-electricCyan"
                  />
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs.new_tournament_whatsapp}
                    onChange={() => handleToggle('new_tournament_whatsapp')}
                    className="h-4 w-4 rounded bg-beyblade-dark border-white/10 text-beyblade-electricCyan focus:ring-beyblade-electricCyan"
                  />
                </td>
              </tr>

              {/* Row 2: New Journey */}
              <tr>
                <td className="py-4 font-bold">
                  <div>Nueva Jornada</div>
                  <div className="text-[10px] text-gray-400 font-normal mt-0.5">Talleres, entrenamientos y eventos libres.</div>
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs.new_journey_in_app}
                    onChange={() => handleToggle('new_journey_in_app')}
                    className="h-4 w-4 rounded bg-beyblade-dark border-white/10 text-beyblade-electricCyan focus:ring-beyblade-electricCyan"
                  />
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs.new_journey_push}
                    onChange={() => handleToggle('new_journey_push')}
                    className="h-4 w-4 rounded bg-beyblade-dark border-white/10 text-beyblade-electricCyan focus:ring-beyblade-electricCyan"
                  />
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs.new_journey_whatsapp}
                    onChange={() => handleToggle('new_journey_whatsapp')}
                    className="h-4 w-4 rounded bg-beyblade-dark border-white/10 text-beyblade-electricCyan focus:ring-beyblade-electricCyan"
                  />
                </td>
              </tr>

              {/* Row 3: Points Awarded */}
              <tr>
                <td className="py-4 font-bold">
                  <div>Puntos Acreditados</div>
                  <div className="text-[10px] text-gray-400 font-normal mt-0.5">Aviso al sumarse puntos de ranking validados.</div>
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs.points_awarded_in_app}
                    onChange={() => handleToggle('points_awarded_in_app')}
                    className="h-4 w-4 rounded bg-beyblade-dark border-white/10 text-beyblade-electricCyan focus:ring-beyblade-electricCyan"
                  />
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs.points_awarded_push}
                    onChange={() => handleToggle('points_awarded_push')}
                    className="h-4 w-4 rounded bg-beyblade-dark border-white/10 text-beyblade-electricCyan focus:ring-beyblade-electricCyan"
                  />
                </td>
                <td className="py-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs.points_awarded_whatsapp}
                    onChange={() => handleToggle('points_awarded_whatsapp')}
                    className="h-4 w-4 rounded bg-beyblade-dark border-white/10 text-beyblade-electricCyan focus:ring-beyblade-electricCyan"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
        {/* Device Push Switch */}
        <div className="bg-beyblade-darker/55 border border-white/5 rounded-2xl p-4 space-y-3">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
            <Smartphone className="h-4 w-4 text-beyblade-electricCyan" /> Notificaciones Push PWA
          </h4>
          
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Activa las alertas del navegador para recibir avisos de torneos y ranking en tiempo real en la pantalla de inicio de tu celular o computadora.
          </p>

          {!pushSupported ? (
            <div className="text-[10px] text-beyblade-electricRed bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 p-2 rounded-lg font-bold">
              Tu navegador o PWA instalada no soporta notificaciones push.
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePushToggle}
              disabled={pushLoading}
              className={`w-full py-2 px-3 font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                isSubscribed 
                  ? 'bg-beyblade-electricRed/10 text-beyblade-electricRed border border-beyblade-electricRed/20 hover:bg-beyblade-electricRed/20'
                  : 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/20 hover:bg-beyblade-electricCyan/20'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              {pushLoading ? 'Procesando...' : (isSubscribed ? 'Desactivar Push' : 'Activar notificaciones push en este dispositivo')}
            </button>
          )}
        </div>

        {/* WhatsApp Setup */}
        <div className="bg-beyblade-darker/55 border border-white/5 rounded-2xl p-4 space-y-3">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.805 1.452 5.423.003 9.834-4.385 9.837-9.802.002-2.624-1.017-5.092-2.87-6.948C16.51 1.997 14.048.979 11.43.979 6.009.979 1.6 5.367 1.597 10.785c-.001 1.702.457 3.36 1.324 4.82l-.997 3.646 3.73-.978z"/>
            </svg>
            Alertas por WhatsApp
          </h4>
          
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-bold uppercase">Celular de WhatsApp</label>
              <input
                type="tel"
                value={prefs.whatsapp_phone || ''}
                onChange={handlePhoneChange}
                placeholder="Ej. +59899123456"
                className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-beyblade-electricCyan"
              />
            </div>

            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.whatsapp_opt_in}
                onChange={() => handleToggle('whatsapp_opt_in')}
                className="h-4.5 w-4.5 rounded bg-beyblade-dark border-white/10 text-beyblade-electricCyan focus:ring-beyblade-electricCyan mt-0.5 shrink-0"
              />
              <span className="text-[10px] text-gray-400 leading-tight">
                Autorizo recibir avisos de Beyblade Uruguay por WhatsApp sobre torneos, jornadas y puntos.
              </span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Locality settings */}
      <div className="bg-beyblade-darker/30 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="space-y-0.5">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wide">Filtro Geográfico Local</h4>
          <p className="text-[10px] text-gray-400 leading-normal">Recibir solo torneos y jornadas de tu departamento/provincia para evitar alertas spam.</p>
        </div>
        <button
          type="button"
          onClick={() => handleToggle('locality_only')}
          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all ${
            prefs.locality_only 
              ? 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border-beyblade-electricCyan/35'
              : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
          }`}
        >
          {prefs.locality_only ? 'Activo (Filtro por Zona)' : 'Inactivo (Todo el País)'}
        </button>
      </div>
    </form>
  );
};
