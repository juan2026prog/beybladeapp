import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, QrCode, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { DbService } from '../services/dbService';
import type { Player } from '../services/dbService';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  // Session state
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [countryId, setCountryId] = useState('UY');
  const [department, setDepartment] = useState('Montevideo');
  const [locality, setLocality] = useState('Montevideo');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  
  // Dynamic validation states
  const [assignedLeague, setAssignedLeague] = useState<'Junior' | 'Open' | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredPlayer, setRegisteredPlayer] = useState<Player | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!currentSession) {
        navigate('/login');
      } else {
        setSession(currentSession);
        setEmail(currentSession.user.email || '');
      }
      setLoadingSession(false);
    });
  }, [navigate]);

  // Calculate age and assign league dynamically on birthdate change
  const handleBirthDateChange = (dateStr: string) => {
    setBirthDate(dateStr);
    if (!dateStr) {
      setAge(null);
      setAssignedLeague(null);
      return;
    }

    const birth = new Date(dateStr);
    const today = new Date();
    let computedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      computedAge--;
    }

    setAge(computedAge);

    if (computedAge >= 6 && computedAge < 14) {
      setAssignedLeague('Junior');
    } else if (computedAge >= 14) {
      setAssignedLeague('Open');
    } else {
      setAssignedLeague(null); // Too young
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!session?.user) {
      setError('Inicia sesión para completar tu perfil de jugador.');
      return;
    }

    if (!firstName || !lastName || !birthDate || !email) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (age === null || age < 6) {
      setError('La edad mínima para registrarse es de 6 años.');
      return;
    }

    if (age !== null && age < 18 && (!tutorName || !tutorPhone)) {
      setError('Los jugadores menores de 18 años requieren un tutor responsable y su teléfono.');
      return;
    }

    try {
      const playerDetails: Omit<Player, 'qr_code_token' | 'created_at'> = {
        id: session.user.id, // Binds player profile to the authenticated User ID
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
        country_id: countryId,
        department,
        locality,
        email,
        phone: phone || undefined,
        tutor_name: (age !== null && age < 18) ? tutorName : undefined,
        tutor_phone: (age !== null && age < 18) ? tutorPhone : undefined,
        league_id: assignedLeague as 'Junior' | 'Open'
      };

      const result = await DbService.registerPlayer(playerDetails);
      setRegisteredPlayer(result);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error al registrar jugador en la base de datos.');
    }
  };

  if (loadingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-beyblade-electricCyan border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">Verificando sesión oficial de Hasbro...</p>
      </div>
    );
  }

  if (isSubmitted && registeredPlayer) {
    return (
      <div className="max-w-md mx-auto bg-beyblade-card border border-beyblade-electricCyan/30 rounded-3xl p-8 text-center space-y-6 shadow-neon-cyan/20 animate-fade-in">
        <div className="mx-auto p-4 bg-beyblade-electricCyan/10 text-beyblade-electricCyan rounded-full w-fit">
          <CheckCircle className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-wide">¡Perfil Guardado!</h2>
          <p className="text-xs text-gray-400">Paso 2 completado. Ficha competitiva guardada en Supabase.</p>
        </div>

        {/* QR Card */}
        <div className="bg-beyblade-dark border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="mx-auto w-40 h-40 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
            <div className="w-full h-full border-4 border-beyblade-dark flex flex-col items-center justify-center p-2 relative">
              <QrCode className="h-full w-full text-beyblade-dark" />
              <div className="absolute inset-0 bg-beyblade-dark/5 flex items-center justify-center">
                <span className="bg-beyblade-electricCyan text-beyblade-darker font-black text-[9px] px-1 rounded uppercase tracking-wider">
                  BEY-ID
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-extrabold text-white text-lg">{registeredPlayer.first_name} {registeredPlayer.last_name}</h3>
            <p className="text-xs text-beyblade-electricCyan font-bold uppercase">Liga {registeredPlayer.league_id}</p>
            <p className="text-[10px] text-gray-500 font-semibold uppercase mt-1">ID: {registeredPlayer.qr_code_token}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => {
              navigate(`/profile/${registeredPlayer.id}`);
              window.location.reload();
            }}
            className="w-full py-3 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/80 text-beyblade-darker font-bold rounded-xl transition-all"
          >
            Ver Mi Perfil QR <ArrowRight className="inline h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-beyblade-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="border-b border-white/5 pb-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white uppercase tracking-wide">
            Ficha del Competidor (Paso 2)
          </h2>
          <span className="text-[10px] font-bold text-beyblade-electricCyan bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 px-2 py-0.5 rounded uppercase">
            Cuenta: {email.split('@')[0]}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Completa los datos de competidor para tu carnet digital de torneos Beyblade X.
        </p>
      </div>

      {error && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase">Nombre *</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej. Lucas"
                className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-beyblade-electricCyan"
              />
            </div>
          </div>

          {/* Apellido */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase">Apellido *</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. Pérez"
                className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-beyblade-electricCyan"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fecha Nacimiento */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase">Fecha de Nacimiento *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-beyblade-electricCyan"
              />
            </div>
          </div>

          {/* Asignación de Liga Automática */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase">Liga Asignada (Auto)</label>
            <div className="w-full bg-beyblade-dark/50 border border-white/5 rounded-xl py-3 px-4 h-12 flex items-center justify-between text-sm">
              {assignedLeague ? (
                <>
                  <span className="font-extrabold text-white">Liga {assignedLeague}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                    assignedLeague === 'Junior' 
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                      : 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/20'
                  }`}>
                    {age} años • {assignedLeague === 'Junior' ? '6-14' : '14+'}
                  </span>
                </>
              ) : (
                <span className="text-gray-500 italic">Ingresa fecha de nacimiento</span>
              )}
            </div>
          </div>
        </div>

        {/* Tutor Responsable for Minors */}
        {age !== null && age < 18 && (
          <div className="bg-beyblade-dark border border-amber-400/20 rounded-2xl p-5 space-y-4 animate-slide-in">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Shield className="h-4.5 w-4.5 text-amber-400" />
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Tutor Responsable Obligatorio</h4>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Los jugadores menores de 18 años requieren el consentimiento y datos de contacto de un tutor responsable.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Nombre Completo del Tutor *</label>
                <input
                  type="text"
                  required
                  value={tutorName}
                  onChange={(e) => setTutorName(e.target.value)}
                  placeholder="Ej. Sandra Silva"
                  className="w-full bg-beyblade-darker border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Teléfono del Tutor *</label>
                <input
                  type="tel"
                  required
                  value={tutorPhone}
                  onChange={(e) => setTutorPhone(e.target.value)}
                  placeholder="Ej. 099555666"
                  className="w-full bg-beyblade-darker border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Territorio */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase">País *</label>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-3 px-3 text-sm text-white focus:outline-none"
            >
              <option value="UY">Uruguay</option>
              <option value="AR">Argentina</option>
              <option value="BR">Brasil</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase">Departamento *</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-3 px-3 text-sm text-white focus:outline-none"
            >
              <option value="Montevideo">Montevideo</option>
              <option value="Maldonado">Maldonado</option>
              <option value="Canelones">Canelones</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase">Localidad *</label>
            <select
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-3 px-3 text-sm text-white focus:outline-none"
            >
              <option value="Montevideo">Montevideo</option>
              {department === 'Maldonado' && <option value="Maldonado">Maldonado</option>}
              {department === 'Canelones' && <option value="Las Piedras">Las Piedras</option>}
            </select>
          </div>
        </div>

        {/* Contacto & Email prefilled */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase">Email (Pre-llenado)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-600" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-beyblade-dark/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase">Teléfono Móvil (Opcional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 099123456"
                className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/80 text-beyblade-darker font-extrabold text-sm uppercase rounded-xl transition-all shadow-neon-cyan"
        >
          Guardar Competidor y Generar QR
        </button>
      </form>
    </div>
  );
};
