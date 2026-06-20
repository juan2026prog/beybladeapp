import React, { useState } from 'react';
import { Camera, AlertCircle, RefreshCw, QrCode } from 'lucide-react';
import type { Registration } from '../services/dbService';

interface QRScannerProps {
  registrations: Registration[];
  onScanSuccess: (playerData: { player_id: string; bey_id: string; nombre: string; hash_validation: string }) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ registrations, onScanSuccess, onClose }) => {
  const [manualInput, setManualInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulateScan = (reg: Registration) => {
    setIsProcessing(true);
    setErrorMsg('');
    
    setTimeout(() => {
      // Create mock scanned QR data corresponding to the selected registered player
      const mockQrData = {
        player_id: reg.player_id,
        bey_id: `QR_${reg.player_name?.replace(' ', '_').toUpperCase()}_7777`,
        nombre: reg.player_name || 'Jugador Oficial',
        hash_validation: `BEY-QR-${reg.player_id.substring(0, 8)}`
      };
      
      onScanSuccess(mockQrData);
      setIsProcessing(false);
    }, 1200);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!manualInput.trim()) {
      setErrorMsg('Ingresa un código o JSON válido.');
      return;
    }

    try {
      // Support pasting raw JSON from QR
      const parsed = JSON.parse(manualInput);
      if (parsed.player_id && parsed.bey_id && parsed.nombre) {
        onScanSuccess({
          player_id: parsed.player_id,
          bey_id: parsed.bey_id,
          nombre: parsed.nombre,
          hash_validation: parsed.hash_validation || ''
        });
      } else {
        setErrorMsg('El JSON no contiene los campos obligatorios del BEY-ID.');
      }
    } catch (err) {
      // Fallback: try to match by QR code token string directly
      const token = manualInput.trim();
      const matchedReg = registrations.find(r => r.id === token || r.player_id === token);
      
      if (matchedReg) {
        onScanSuccess({
          player_id: matchedReg.player_id,
          bey_id: token,
          nombre: matchedReg.player_name || 'Jugador',
          hash_validation: `BEY-${token}`
        });
      } else {
        setErrorMsg('Formato inválido. Inserta el JSON del QR o un ID de jugador registrado.');
      }
    }
  };

  return (
    <div className="bg-beyblade-darker border border-white/5 rounded-3xl p-6 space-y-6 relative overflow-hidden">
      {/* Viewfinder Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <Camera className="h-4.5 w-4.5 text-beyblade-electricCyan" /> Acreditación Escáner QR
        </h3>
        <button 
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-white font-bold uppercase transition-colors"
        >
          Cerrar
        </button>
      </div>

      {errorMsg && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Visual Camera Viewfinder Mockup */}
      <div className="aspect-video w-full rounded-2xl bg-black border border-white/10 relative flex flex-col items-center justify-center overflow-hidden">
        {/* Scanning lines / corners */}
        <div className="absolute inset-8 border border-dashed border-beyblade-electricCyan/20 rounded-xl"></div>
        <div className="absolute top-6 left-6 w-6 h-6 border-t-4 border-l-4 border-beyblade-electricCyan rounded-tl"></div>
        <div className="absolute top-6 right-6 w-6 h-6 border-t-4 border-r-4 border-beyblade-electricCyan rounded-tr"></div>
        <div className="absolute bottom-6 left-6 w-6 h-6 border-b-4 border-l-4 border-beyblade-electricCyan rounded-bl"></div>
        <div className="absolute bottom-6 right-6 w-6 h-6 border-b-4 border-r-4 border-beyblade-electricCyan rounded-br"></div>

        {isProcessing ? (
          <div className="text-center space-y-3 z-10">
            <RefreshCw className="h-8 w-8 text-beyblade-electricCyan animate-spin mx-auto" />
            <p className="text-xs text-beyblade-electricCyan font-bold uppercase tracking-widest">Procesando BEY-ID...</p>
          </div>
        ) : (
          <div className="text-center space-y-3 z-10 px-6">
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
              <QrCode className="h-6 w-6" />
            </div>
            <p className="text-xs text-gray-400">Simulador de cámara activo</p>
            <p className="text-[10px] text-gray-500 max-w-xs mx-auto">Selecciona abajo un jugador inscripto para simular su escaneo o ingresa el código QR manualmente.</p>
          </div>
        )}

        {/* Laser scanner line effect */}
        <div className="absolute left-0 right-0 h-0.5 bg-beyblade-electricCyan/60 shadow-neon-cyan top-1/2 -translate-y-1/2 animate-[pulse_1.5s_infinite]"></div>
      </div>

      {/* Simulator Actions */}
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Simulador de Escaneo (Hasbro Demo)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar">
            {registrations.map(r => (
              <button
                key={r.id}
                type="button"
                disabled={isProcessing}
                onClick={() => handleSimulateScan(r)}
                className="p-2.5 bg-beyblade-card hover:bg-beyblade-electricCyan/10 border border-white/5 hover:border-beyblade-electricCyan/30 rounded-xl text-left transition-all text-xs font-semibold text-white flex justify-between items-center group disabled:opacity-50"
              >
                <span className="truncate">{r.player_name}</span>
                <span className="text-[9px] text-beyblade-electricCyan font-mono group-hover:underline">Simular</span>
              </button>
            ))}
            {registrations.length === 0 && (
              <p className="text-xs text-gray-500 italic col-span-2 text-center py-2">No hay jugadores inscriptos en este torneo.</p>
            )}
          </div>
        </div>

        {/* Manual input form */}
        <form onSubmit={handleManualSubmit} className="space-y-2 border-t border-white/5 pt-4">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Ingreso Manual de Código QR</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Pega el JSON del QR o código de check-in..."
              className="flex-1 bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-beyblade-electricCyan"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/80 text-beyblade-darker font-bold text-xs uppercase rounded-xl transition-colors shrink-0"
            >
              Cargar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
