import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, AlertCircle, RefreshCw, Volume2, VolumeX } from 'lucide-react';

interface RealQRScannerProps {
  onScanSuccess: (playerData: { player_id: string; bey_id: string; nombre: string; hash_validation: string }) => void;
  onScanError: (errorMsg: string) => void;
  onClose: () => void;
}

export const RealQRScanner: React.FC<RealQRScannerProps> = ({ onScanSuccess, onScanError, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('environment');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');

  // Load cameras list and check permission
  useEffect(() => {
    const initScanner = async () => {
      try {
        const hasCam = await QrScanner.hasCamera();
        if (!hasCam) {
          setHasPermission(false);
          return;
        }

        // List cameras
        const devs = await QrScanner.listCameras(true);
        setCameras(devs);
      } catch (err) {
        console.error('Error listing cameras:', err);
        setHasPermission(false);
      }
    };
    initScanner();
  }, []);

  // Control camera scan cycle
  useEffect(() => {
    if (!videoRef.current || hasPermission === false) return;

    setScanStatus('scanning');
    
    // Create new QrScanner
    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        handleScanResult(result.data);
      },
      {
        preferredCamera: selectedCameraId,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5
      }
    );

    scannerRef.current = scanner;

    scanner.start()
      .then(() => {
        setHasPermission(true);
      })
      .catch((err) => {
        console.error('Error starting camera scan:', err);
        if (err === 'Camera permission denied' || (err instanceof Error && err.message.includes('permission'))) {
          setHasPermission(false);
        } else {
          setScanStatus('error');
        }
      });

    return () => {
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [hasPermission, selectedCameraId]);

  // Handle scanned text
  const handleScanResult = (text: string) => {
    try {
      // Decode QR JSON
      const parsed = JSON.parse(text);
      if (parsed.player_id && parsed.bey_id && parsed.nombre) {
        setScanStatus('success');
        
        // Haptic feedback (Vibration)
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }

        // Sound feedback
        if (!isMuted) {
          playSuccessBeep();
        }

        onScanSuccess({
          player_id: parsed.player_id,
          bey_id: parsed.bey_id,
          nombre: parsed.nombre,
          hash_validation: parsed.hash_validation || ''
        });
      } else {
        onScanError('El código QR escaneado no es un BEY-ID válido.');
      }
    } catch (err) {
      // Fallback if not JSON: try raw string token
      if (text && text.trim().length > 10) {
        onScanSuccess({
          player_id: text.trim(),
          bey_id: 'UNKNOWN',
          nombre: 'Token Manual',
          hash_validation: ''
        });
      } else {
        onScanError('Código QR no reconocido. Formato de BEY-ID incorrecto.');
      }
    }
  };

  // Sound generator
  const playSuccessBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('AudioContext not allowed or supported:', e);
    }
  };

  return (
    <div className="bg-beyblade-darker border border-white/5 rounded-3xl p-6 space-y-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <Camera className="h-4.5 w-4.5 text-beyblade-electricCyan" /> Cámara Escáner QR Real
        </h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 hover:text-white transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button 
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-white font-bold uppercase transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Permissions or general errors */}
      {hasPermission === false && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed text-xs p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Permiso de Cámara Denegado o Sin Dispositivo</p>
            <p className="text-gray-400">Por favor, habilita los permisos de cámara en la configuración de tu navegador o conecta una cámara web para poder escanear códigos QR.</p>
          </div>
        </div>
      )}

      {/* Selector de cámara si hay múltiples */}
      {cameras.length > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-bold uppercase">Cámara:</span>
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="bg-beyblade-card text-white border border-white/10 rounded-lg px-2 py-1 focus:outline-none flex-1 max-w-xs"
          >
            <option value="environment">Cámara Trasera (Default)</option>
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.label || `Cámara ${cam.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Viewfinder Frame */}
      <div className="aspect-video w-full rounded-2xl bg-black border border-white/10 relative flex flex-col items-center justify-center overflow-hidden">
        {hasPermission !== false && (
          <video 
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
        )}

        {/* HUD Elements */}
        <div className="absolute inset-8 border border-dashed border-beyblade-electricCyan/20 rounded-xl pointer-events-none"></div>
        <div className="absolute top-6 left-6 w-6 h-6 border-t-4 border-l-4 border-beyblade-electricCyan rounded-tl pointer-events-none"></div>
        <div className="absolute top-6 right-6 w-6 h-6 border-t-4 border-r-4 border-beyblade-electricCyan rounded-tr pointer-events-none"></div>
        <div className="absolute bottom-6 left-6 w-6 h-6 border-b-4 border-l-4 border-beyblade-electricCyan rounded-bl pointer-events-none"></div>
        <div className="absolute bottom-6 right-6 w-6 h-6 border-b-4 border-r-4 border-beyblade-electricCyan rounded-br pointer-events-none"></div>

        {/* Scan Status Overlays */}
        {scanStatus === 'success' && (
          <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none animate-pulse">
            <span className="bg-emerald-500 text-beyblade-darker font-black text-xs px-3 py-1.5 rounded-full uppercase tracking-wider">¡Código Escaneado!</span>
          </div>
        )}

        {scanStatus === 'error' && (
          <div className="absolute inset-0 bg-beyblade-electricRed/25 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center pointer-events-none">
            <RefreshCw className="h-8 w-8 text-white animate-spin mb-2" />
            <span className="text-white font-extrabold text-xs uppercase">Error de Inicialización</span>
          </div>
        )}

        {hasPermission === null && (
          <div className="text-center space-y-3 z-10">
            <RefreshCw className="h-8 w-8 text-beyblade-electricCyan animate-spin mx-auto" />
            <p className="text-xs text-beyblade-electricCyan font-bold uppercase tracking-widest">Iniciando Cámara...</p>
          </div>
        )}

        {/* Laser scanner line effect */}
        {scanStatus === 'scanning' && (
          <div className="absolute left-0 right-0 h-0.5 bg-beyblade-electricCyan/60 shadow-neon-cyan top-1/2 -translate-y-1/2 animate-[pulse_1.5s_infinite]"></div>
        )}
      </div>
    </div>
  );
};
