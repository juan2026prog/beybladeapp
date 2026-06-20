import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Info, Trophy, Award, ShoppingBag, Calendar } from 'lucide-react';
import { DbService } from '../services/dbService';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const list = await DbService.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Fetch periodically every 30 seconds for simulation effect
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await DbService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await DbService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleActionClick = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    handleMarkAsRead(id);
    setIsOpen(false);
    navigate(url);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'torneo':
      case 'new_tournament':
        return <Trophy className="h-4 w-4 text-amber-400" />;
      case 'inscripcion':
        return <Check className="h-4 w-4 text-emerald-400" />;
      case 'resultados':
      case 'puntos':
      case 'points_awarded':
        return <Award className="h-4 w-4 text-beyblade-electricCyan" />;
      case 'tiendas':
        return <ShoppingBag className="h-4 w-4 text-pink-500" />;
      case 'new_journey':
        return <Calendar className="h-4 w-4 text-purple-400" />;
      case 'lanzamiento':
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-beyblade-dark hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all relative"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-beyblade-electricRed text-white font-black text-[9px] rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop click closer */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 mt-2.5 w-80 bg-beyblade-card border border-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-slide-in">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Notificaciones</h4>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-beyblade-electricCyan hover:underline font-bold uppercase"
                >
                  Marcar todo leído
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto no-scrollbar space-y-2">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id)}
                    className={`p-3 rounded-xl border transition-all text-left flex gap-3 cursor-pointer ${
                      n.is_read 
                        ? 'bg-beyblade-darker/30 border-white/5 opacity-60 hover:opacity-100' 
                        : 'bg-beyblade-dark border-beyblade-electricCyan/20 hover:border-beyblade-electricCyan/40'
                    }`}
                  >
                    <div className="p-2 bg-black/40 rounded-lg h-fit shrink-0">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-bold text-white text-xs leading-tight truncate">{n.title}</p>
                      <p className="text-[11px] text-gray-400 leading-normal break-words">{n.message}</p>
                      <p className="text-[9px] text-gray-500 font-semibold uppercase pt-0.5">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {/* Action Button */}
                      {n.url && (
                        <button
                          onClick={(e) => handleActionClick(e, n.url, n.id)}
                          className="mt-2 w-full py-1.5 px-2.5 bg-beyblade-electricCyan/10 hover:bg-beyblade-electricCyan text-beyblade-electricCyan hover:text-beyblade-darker border border-beyblade-electricCyan/25 text-[9px] font-black uppercase rounded-lg transition-all text-center block"
                        >
                          {n.type === 'torneo' || n.type === 'new_tournament' ? 'Ver torneo' : 
                           n.type === 'new_journey' ? 'Ver jornada' : 
                           n.type === 'points_awarded' || n.type === 'resultados' || n.type === 'puntos' ? 'Ver ranking' : 'Ver perfil'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 space-y-1">
                  <p className="text-xs text-gray-400 font-semibold">Bandeja vacía</p>
                  <p className="text-[10px] text-gray-500">No tienes notificaciones pendientes.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
