import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Trophy, Award, MapPin, ShoppingBag, BookOpen, 
  Newspaper, Shield, User, Users, Menu, X, Wifi, WifiOff, RefreshCw, LogIn, LogOut, Map
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { DbService } from '../services/dbService';
import { NotificationBell } from '../components/NotificationBell';
import type { ModuleConfig } from '../services/dbService';

interface UserSessionProfile {
  id: string;
  email: string;
  role: 'super_admin' | 'country_admin' | 'organizer' | 'judge' | 'store' | 'player' | 'Visitante';
  realRole?: string;
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserSessionProfile | null>(null);
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPlayerProfile, setHasPlayerProfile] = useState(false);

  const getRoleDisplayName = (r: string) => {
    switch (r) {
      case 'super_admin': return 'Super Admin';
      case 'country_admin': return 'Distribuidor País';
      case 'organizer': return 'Organizador';
      case 'judge': return 'Juez';
      case 'store': return 'Tienda';
      case 'player': return 'Jugador';
      default: return r;
    }
  };

  const fetchSessionProfile = async (userId: string, email: string) => {
    try {
      // Query profiles in isolated schema
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      // Check if they completed step 2 (player record)
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      setHasPlayerProfile(Boolean(player));

      if (!error && profile) {
        let role = profile.role;
        const viewMode = sessionStorage.getItem('admin_view_mode');
        if (profile.role === 'super_admin' && viewMode) {
          role = viewMode as any;
        }
        setCurrentUser({ id: userId, email, role, realRole: profile.role });
      } else {
        setCurrentUser({ id: userId, email, role: 'Visitante', realRole: 'Visitante' });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setCurrentUser({ id: userId, email, role: 'Visitante', realRole: 'Visitante' });
    }
  };

  useEffect(() => {
    // 1. Fetch modules config
    const fetchConfigs = async () => {
      const mods = await DbService.getModules();
      setModules(mods);
    };
    fetchConfigs();

    // 2. Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchSessionProfile(session.user.id, session.user.email || '');
      } else {
        setCurrentUser(null);
      }
    });

    // 3. Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchSessionProfile(session.user.id, session.user.email || '');
      } else {
        setCurrentUser(null);
        setHasPlayerProfile(false);
      }
    });

    // 4. Network listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    setIsRefreshing(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setHasPlayerProfile(false);
    setIsRefreshing(false);
    navigate('/login');
  };

  const isModuleActive = (id: string) => {
    return modules.find(m => m.id === id)?.active !== false;
  };

  // Roles permission check
  const userRole = currentUser?.role || 'Visitante';
  const showAdminTab = userRole === 'super_admin' || userRole === 'country_admin' || userRole === 'organizer' || userRole === 'store' || userRole === 'judge';

  // Navigation Items
  const navItems = [
    { label: 'Inicio', path: '/', icon: Home, show: true },
    { label: 'Mapa Oficial', path: '/map', icon: Map, show: true },
    { label: 'Torneos', path: '/tournaments', icon: Trophy, show: true },
    { label: 'Rankings', path: '/rankings', icon: Award, show: isModuleActive('rankings_national') },
    { label: 'Dónde comprar', path: '/stores', icon: MapPin, show: isModuleActive('stores') },
    { label: 'Productos', path: '/products', icon: ShoppingBag, show: isModuleActive('products') },
    { label: 'Academia', path: '/academy', icon: BookOpen, show: isModuleActive('tutorials') },
    { label: 'Noticias', path: '/news', icon: Newspaper, show: isModuleActive('news') },
    { label: 'Equipos', path: '/teams', icon: Users, show: isModuleActive('teams') },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-beyblade-darker text-gray-100 pb-20 md:pb-0 md:pl-64">
      {/* Sidebar for Desktop */}
      <aside className="fixed inset-y-0 left-0 hidden md:flex flex-col w-64 bg-beyblade-card border-r border-white/5 z-30 tech-grid overflow-hidden">
        {/* Neon glowing vertical boundary line */}
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-beyblade-electricCyan/40 via-white/5 to-beyblade-electricRed/40 z-10" />

        {/* Ambient bottom red glow in sidebar */}
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-beyblade-electricRed/5 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
          <Link to="/" className="flex flex-col group">
            <span className="font-title text-xl text-transparent bg-clip-text bg-gradient-to-r from-beyblade-electricCyan via-white to-beyblade-electricRed tracking-widest uppercase drop-shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              BEYBLADE X
            </span>
            <span className="text-[9px] text-beyblade-electricCyan font-esports font-bold tracking-widest uppercase mt-0.5">
              LIGA LATAM OFICIAL
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar relative z-10">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold font-esports uppercase tracking-wider text-xs transition-all duration-300 relative overflow-hidden border border-transparent ${
                  isActive 
                    ? 'bg-gradient-to-r from-beyblade-electricCyan/15 to-transparent text-beyblade-electricCyan border-beyblade-electricCyan/20 shadow-[0_0_15px_rgba(0,240,255,0.08)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/5'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="desktopActiveIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-beyblade-electricCyan shadow-[0_0_8px_#00F0FF]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`h-4.5 w-4.5 transition-transform duration-300 ${isActive ? 'text-beyblade-electricCyan scale-110' : 'group-hover:scale-110'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Admin footer */}
        <div className="p-4 border-t border-white/5 space-y-2 bg-beyblade-darker/50 relative z-10">
          {showAdminTab && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold font-esports text-xs uppercase tracking-wider transition-all duration-300 ${
                location.pathname.startsWith('/admin')
                  ? 'bg-beyblade-electricRed/25 text-beyblade-electricRed border border-beyblade-electricRed/40 shadow-[0_0_15px_rgba(255,0,85,0.1)]'
                  : 'text-beyblade-electricRed hover:bg-beyblade-electricRed/10 border border-transparent'
              }`}
            >
              <Shield className="h-4.5 w-4.5" />
              Panel de Control
            </Link>
          )}

          {currentUser ? (
            <>
              {hasPlayerProfile ? (
                <Link
                  to={`/profile/${currentUser.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm font-medium"
                >
                  <User className="h-5 w-5 text-beyblade-electricCyan" />
                  Mi Perfil QR
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm font-medium"
                >
                  <User className="h-5 w-5 text-beyblade-electricCyan" />
                  Completar Registro
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium text-left"
              >
                <LogOut className="h-5 w-5 text-beyblade-electricRed" />
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-beyblade-electricCyan/15 text-beyblade-electricCyan border border-beyblade-electricCyan/30 text-sm font-bold justify-center"
            >
              <LogIn className="h-5 w-5" />
              Iniciar Sesión
            </Link>
          )}
        </div>
      </aside>

      {/* Header (Top) */}
      <header className="sticky top-0 bg-beyblade-card/90 backdrop-blur-md border-b border-white/5 z-20 px-4 py-3 flex items-center justify-between">
        {/* Mobile menu trigger */}
        <div className="flex items-center gap-3 md:hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link to="/" className="font-title text-base text-transparent bg-clip-text bg-gradient-to-r from-beyblade-electricCyan via-white to-beyblade-electricRed tracking-widest drop-shadow-[0_0_8px_rgba(0,240,255,0.2)]">
            BEYBLADE X
          </Link>
        </div>

        {/* Network and Refresh Indicators */}
        <div className="flex items-center gap-4 ml-auto md:ml-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5">
            {isOnline ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-extrabold font-esports uppercase tracking-wider">
                <Wifi className="h-3 w-3" /> Conectado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-beyblade-electricRed font-extrabold font-esports uppercase tracking-wider animate-pulse">
                <WifiOff className="h-3 w-3" /> Sin Red
              </span>
            )}
          </div>
          {isRefreshing && (
            <RefreshCw className="h-4 w-4 text-beyblade-electricCyan animate-spin" />
          )}
        </div>

        {/* Session Status indicator */}
        <div className="flex items-center gap-3 ml-auto text-xs text-gray-400">
          {currentUser && <NotificationBell />}
          {currentUser ? (
            <span className="bg-beyblade-dark/80 px-2.5 py-1.5 rounded-lg border border-white/5 text-[9px] font-esports font-bold uppercase tracking-wider text-gray-300">
              ID: <strong className="text-beyblade-electricCyan">{currentUser.email.split('@')[0]}</strong>
            </span>
          ) : (
            <Link to="/login" className="text-beyblade-electricCyan hover:underline font-bold font-esports uppercase tracking-widest text-[9px]">
              Ingreso
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Drawer Menu (Slide out) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/85 z-40 md:hidden animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="w-72 max-w-[80vw] h-full bg-beyblade-card border-r border-white/10 p-6 flex flex-col gap-6 tech-grid relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glowing vertical boundary */}
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-beyblade-electricCyan/30 via-white/5 to-beyblade-electricRed/30" />

            <div className="flex items-center justify-between relative z-10">
              <span className="font-title text-transparent bg-clip-text bg-gradient-to-r from-beyblade-electricCyan via-white to-beyblade-electricRed tracking-widest uppercase">
                BEYBLADE X
              </span>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <nav className="flex flex-col gap-1.5 overflow-y-auto no-scrollbar relative z-10">
              {navItems.filter(item => item.show).map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold font-esports uppercase tracking-wider text-xs border border-transparent transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-beyblade-electricCyan/15 to-transparent text-beyblade-electricCyan border-beyblade-electricCyan/20 shadow-[0_0_15px_rgba(0,240,255,0.08)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-white/5 pt-4 space-y-2">
              {showAdminTab && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 bg-beyblade-electricRed/10 border border-beyblade-electricRed/30 text-beyblade-electricRed rounded-lg font-bold text-sm"
                >
                  <Shield className="h-5 w-5" />
                  Panel de Control
                </Link>
              )}
              {currentUser ? (
                <>
                  {hasPlayerProfile ? (
                    <Link
                      to={`/profile/${currentUser.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 bg-white/5 text-white rounded-lg font-medium text-sm"
                    >
                      <User className="h-5 w-5 text-beyblade-electricCyan" />
                      Mi Perfil QR
                    </Link>
                  ) : (
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 bg-white/5 text-white rounded-lg font-medium text-sm"
                    >
                      <User className="h-5 w-5 text-beyblade-electricCyan" />
                      Completar Registro
                    </Link>
                  )}
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold text-left"
                  >
                    <LogOut className="h-5 w-5 text-beyblade-electricRed" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 bg-beyblade-electricCyan text-beyblade-darker rounded-lg font-bold text-sm justify-center"
                >
                  <LogIn className="h-5 w-5" />
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {currentUser?.realRole === 'super_admin' && sessionStorage.getItem('admin_view_mode') && (
          <div className="mb-6 bg-beyblade-electricRed/10 border border-beyblade-electricRed/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-beyblade-electricRed animate-pulse" />
              <div className="text-left">
                <p className="text-xs font-black text-white uppercase tracking-wider font-esports">
                  Modo de Vista Activo: <span className="text-beyblade-electricRed">{getRoleDisplayName(sessionStorage.getItem('admin_view_mode') || '')}</span>
                </p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  Este modo solo cambia la vista de navegación. No modifica permisos reales ni roles en Supabase.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('admin_view_mode');
                window.location.reload();
              }}
              className="px-4 py-2 bg-beyblade-electricRed hover:bg-beyblade-electricRed/85 text-white font-black font-esports text-[10px] uppercase tracking-widest rounded-xl transition-all shrink-0"
            >
              Volver a Super Admin
            </button>
          </div>
        )}
        {children}
      </main>

      {/* Bottom Nav Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-beyblade-card/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 z-30 md:hidden shadow-[0_-4px_15px_rgba(0,240,255,0.05)]">
        {navItems.filter(item => item.show).slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-all ${
                isActive ? 'text-beyblade-electricCyan drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] scale-105' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="h-4.5 w-4.5 mb-0.5" />
              <span className="text-[8px] font-bold font-esports uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
        {showAdminTab ? (
          <Link
            to="/admin"
            className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-all ${
              location.pathname.startsWith('/admin') ? 'text-beyblade-electricRed drop-shadow-[0_0_8px_rgba(255,0,85,0.4)] scale-105' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="h-4.5 w-4.5 mb-0.5" />
            <span className="text-[8px] font-bold font-esports uppercase tracking-widest">Admin</span>
          </Link>
        ) : (
          <Link
            to={currentUser ? (hasPlayerProfile ? `/profile/${currentUser.id}` : '/register') : '/login'}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-all ${
              location.pathname === '/register' || location.pathname.startsWith('/profile') || location.pathname === '/login' ? 'text-beyblade-electricCyan drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] scale-105' : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="h-4.5 w-4.5 mb-0.5" />
            <span className="text-[8px] font-bold font-esports uppercase tracking-widest">Perfil</span>
          </Link>
        )}
      </nav>
    </div>
  );
};
