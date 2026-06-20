import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Step 1: Sign up in Supabase Auth (which triggers database profiles sync)
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpErr) throw signUpErr;

        if (data.user && data.session) {
          // Autologged in
          setMessage('Cuenta creada con éxito. Redirigiendo...');
          checkPlayerProfile(data.user.id);
        } else {
          setMessage('¡Registro exitoso! Por favor inicia sesión con tus credenciales.');
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        // Login
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) throw signInErr;

        if (data.user) {
          checkPlayerProfile(data.user.id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const checkPlayerProfile = async (userId: string) => {
    try {
      // Check if player profile exists in the isolated schema
      const { data: player, error: playerErr } = await supabase
        .from('players')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (playerErr) throw playerErr;

      // If player row does not exist, redirect to complete step 2 (Register)
      if (!player && profile?.role === 'Visitante') {
        navigate('/register');
      } else if (profile?.role && profile.role !== 'Visitante' && profile.role !== 'Jugador') {
        navigate('/admin');
      } else {
        navigate('/');
      }
      
      // Force refresh layout state
      window.location.reload();
    } catch (err) {
      console.error('Error checking player profile:', err);
      navigate('/');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Escribe tu correo para recuperar la contraseña.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetErr) throw resetErr;
      setMessage('Se ha enviado un enlace de recuperación a tu correo.');
    } catch (err: any) {
      setError(err.message || 'Error al enviar recuperación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-beyblade-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-lg">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-beyblade-electricCyan/10 text-beyblade-electricCyan rounded-2xl">
          <Shield className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-wide">
          {isSignUp ? 'Crear Cuenta Oficial' : 'Ingreso Competitivo'}
        </h2>
        <p className="text-xs text-gray-400">
          {isSignUp ? 'Paso 1: Registra tus credenciales de acceso' : 'Accede a torneos, rankings e inventarios oficiales'}
        </p>
      </div>

      {error && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed text-xs p-3.5 rounded-xl">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl">
          {message}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-bold uppercase">Correo Electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-beyblade-electricCyan"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs text-gray-400 font-bold uppercase">Contraseña</label>
            {!isSignUp && (
              <button 
                type="button" 
                onClick={handleResetPassword}
                className="text-[10px] text-beyblade-electricCyan hover:underline font-bold uppercase"
              >
                ¿La olvidaste?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 caracteres"
              className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-beyblade-electricCyan"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-beyblade-electricCyan disabled:bg-gray-700 text-beyblade-darker font-extrabold text-xs uppercase rounded-xl transition-all shadow-neon-cyan flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-beyblade-darker border-t-transparent rounded-full animate-spin"></span>
          ) : isSignUp ? (
            <>
              Registrar Cuenta <UserPlus className="h-4 w-4" />
            </>
          ) : (
            <>
              Iniciar Sesión <LogIn className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Tabs / Switch between signup and login */}
      <div className="text-center pt-2">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setMessage('');
          }}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {isSignUp ? (
            <span>¿Ya tienes cuenta? <strong className="text-beyblade-electricCyan hover:underline">Inicia Sesión aquí</strong></span>
          ) : (
            <span>¿No tienes cuenta? <strong className="text-beyblade-electricCyan hover:underline">Regístrate aquí</strong></span>
          )}
        </button>
      </div>
    </div>
  );
};
