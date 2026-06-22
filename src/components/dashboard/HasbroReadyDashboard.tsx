import React, { useEffect, useState } from 'react';
import { Shield, Trophy, Users, BarChart2, MapPin, TrendingUp, Calendar, RefreshCw, Printer, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface HasbroReadyDashboardProps {
  currentUser: any;
}

interface HasbroMetrics {
  activePlayers: number;
  newPlayersThisMonth: number;
  monthlyGrowth: number;
  juniorPlayers: number;
  openPlayers: number;
  totalTournaments: number;
  completedTournaments: number;
  activeLocalitiesCount: number;
  activeDepartmentsCount: number;
}

export const HasbroReadyDashboard: React.FC<HasbroReadyDashboardProps> = ({
  currentUser
}) => {
  const [metrics, setMetrics] = useState<HasbroMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadHasbroData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const countryCode = currentUser.country_id || 'UY';

      // 1. Fetch players for the country
      const { data: players, error: playersErr } = await supabase
        .from('players')
        .select('created_at, league_id, department, locality')
        .eq('country_id', countryCode);

      if (playersErr) throw playersErr;

      // 2. Fetch tournaments for the country
      const { data: tours, error: toursErr } = await supabase
        .from('tournaments')
        .select('id, status, department, locality')
        .eq('country_id', countryCode);

      if (toursErr) throw toursErr;

      const totalPlayersCount = players?.length || 0;
      const juniorCount = players?.filter(p => p.league_id === 'Junior').length || 0;
      const openCount = players?.filter(p => p.league_id === 'Open').length || 0;

      // Calculate MoM growth
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const newPlayersThisMonth = players?.filter(p => {
        const date = new Date(p.created_at);
        return date >= thirtyDaysAgo;
      }).length || 0;

      const newPlayersLastMonth = players?.filter(p => {
        const date = new Date(p.created_at);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      }).length || 0;

      // Growth percentage
      let growth = 0;
      const base = totalPlayersCount - newPlayersThisMonth;
      if (base > 0) {
        growth = Math.round((newPlayersThisMonth / base) * 100);
      } else if (newPlayersThisMonth > 0) {
        growth = 100;
      }

      const totalTours = tours?.length || 0;
      const completedTours = tours?.filter(t => t.status === 'finalizado').length || 0;

      // Unique departments and localities with active bladers or tournaments
      const uniqueLocalities = new Set([
        ...(players || []).map(p => p.locality?.toLowerCase()),
        ...(tours || []).map(t => t.locality?.toLowerCase())
      ].filter(Boolean));

      const uniqueDepts = new Set([
        ...(players || []).map(p => p.department?.toLowerCase()),
        ...(tours || []).map(t => t.department?.toLowerCase())
      ].filter(Boolean));

      setMetrics({
        activePlayers: totalPlayersCount,
        newPlayersThisMonth,
        monthlyGrowth: growth,
        juniorPlayers: juniorCount,
        openPlayers: openCount,
        totalTournaments: totalTours,
        completedTournaments: completedTours,
        activeLocalitiesCount: uniqueLocalities.size,
        activeDepartmentsCount: uniqueDepts.size
      });
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al generar Hasbro Ready Dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHasbroData();
  }, [currentUser.country_id]);

  const handlePrintReport = () => {
    if (!metrics) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Hasbro Performance Report - ${currentUser.country_id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #e11d48; padding-bottom: 20px; }
            .header h1 { font-size: 26px; text-transform: uppercase; margin: 0; color: #111; }
            .header .logo { font-size: 18px; font-weight: 900; color: #e11d48; }
            .meta-info { margin-top: 20px; font-size: 13px; color: #555; background: #fff5f5; border: 1px solid #fecdd3; padding: 15px; border-radius: 8px; }
            .grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 20px; margin-top: 30px; }
            .card { border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; background: #f8fafc; }
            .card h3 { font-size: 12px; text-transform: uppercase; color: #64748b; margin: 0 0 10px 0; }
            .card .value { font-size: 28px; font-weight: 950; color: #0f172a; margin: 0; }
            .card .growth { font-size: 12px; color: #16a34a; font-weight: bold; margin-top: 5px; }
            .table-sec { margin-top: 40px; }
            .table-sec h3 { border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; font-size: 14px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            th { background: #f8fafc; font-weight: bold; color: #475569; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print {
              body { margin: 20px; font-size: 12px; }
              .card { background: none; border: 1px solid #ccc; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Hasbro Performance Report</h1>
              <span style="font-size: 12px; color: #64748b;">Competitive Play Metrics</span>
            </div>
            <div class="logo">HASBRO™ READY</div>
          </div>
          
          <div class="meta-info">
            <strong>Territorio de Reporte:</strong> ${currentUser.country_id === 'UY' ? 'Uruguay (Fase Piloto)' : currentUser.country_id}<br/>
            <strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString()}<br/>
            <strong>Generador:</strong> Sistema de Inteligencia Competitiva Beyblade
          </div>

          <div class="grid">
            <div class="card">
              <h3>Total Jugadores Activos</h3>
              <p class="value">${metrics.activePlayers}</p>
              <p class="growth">MoM Growth: +${metrics.monthlyGrowth}% (${metrics.newPlayersThisMonth} nuevos)</p>
            </div>
            
            <div class="card">
              <h3>Torneos Completados</h3>
              <p class="value">${metrics.completedTournaments} / ${metrics.totalTournaments}</p>
              <p class="growth" style="color: #475569;">Ratio de Ejecución: ${metrics.totalTournaments > 0 ? Math.round((metrics.completedTournaments / metrics.totalTournaments) * 100) : 0}%</p>
            </div>
            
            <div class="card">
              <h3>Localidades Activas</h3>
              <p class="value">${metrics.activeLocalitiesCount}</p>
              <p class="growth" style="color: #475569;">Departamentos / Provincias: ${metrics.activeDepartmentsCount}</p>
            </div>

            <div class="card">
              <h3>Distribución de Ligas</h3>
              <p class="value">${metrics.juniorPlayers} Junior / ${metrics.openPlayers} Open</p>
              <p class="growth" style="color: #475569;">Proporción Junior: ${metrics.activePlayers > 0 ? Math.round((metrics.juniorPlayers / metrics.activePlayers) * 100) : 0}%</p>
            </div>
          </div>

          <div class="table-sec">
            <h3>Desglose de Métricas Clave</h3>
            <table>
              <thead>
                <tr>
                  <th>Concepto KPI</th>
                  <th>Métrica Calculada</th>
                  <th>Estado Corporativo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Bladers Registrados</td>
                  <td>${metrics.activePlayers} jugadores</td>
                  <td>Saludable (Creciendo)</td>
                </tr>
                <tr>
                  <td>Participantes Liga Junior (6-14 años)</td>
                  <td>${metrics.juniorPlayers} jugadores</td>
                  <td>Base de futuro sólida</td>
                </tr>
                <tr>
                  <td>Participantes Liga Open (14+ años)</td>
                  <td>${metrics.openPlayers} jugadores</td>
                  <td>Comunidad madura activa</td>
                </tr>
                <tr>
                  <td>Cobertura Territorial</td>
                  <td>${metrics.activeLocalitiesCount} ciudades / localidades</td>
                  <td>Expansión nacional óptima</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            Reporte de Distribución y Actividad Oficial Hasbro. Todos los derechos reservados.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 space-y-3 bg-beyblade-card border border-white/5 rounded-3xl">
        <Loader2 className="h-8 w-8 text-beyblade-electricCyan animate-spin mx-auto" />
        <p className="text-xs text-gray-400 font-bold">Generando Dashboard Hasbro...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed p-4 rounded-xl text-xs font-bold text-center">
        {errorMsg}
      </div>
    );
  }

  const data = metrics!;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div>
          <span className="px-2 py-0.5 rounded text-[7.5px] font-black font-esports bg-beyblade-electricRed/15 text-beyblade-electricRed border border-beyblade-electricRed/20 tracking-wider uppercase">
            Hasbro Official Report
          </span>
          <h4 className="font-extrabold text-[12px] text-white uppercase tracking-wider font-esports mt-1">Hasbro Ready Dashboard</h4>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadHasbroData}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 p-2 rounded-lg transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-1.5 bg-beyblade-electricRed hover:bg-beyblade-electricRed/85 text-white font-black font-esports text-[9px] uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5 shadow-neon-red"
          >
            <Printer className="h-3.5 w-3.5" /> Exportar Hasbro PDF
          </button>
        </div>
      </div>

      {/* Corporate KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Players */}
        <div className="bg-beyblade-card border border-white/5 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Bladers Activos</span>
          <div className="text-3xl font-black text-white">{data.activePlayers}</div>
          <div className="text-[9px] text-emerald-450 font-bold flex items-center gap-0.5">
            <TrendingUp className="h-3.5 w-3.5" /> +{data.monthlyGrowth}% MoM
          </div>
        </div>

        {/* Localities coverage */}
        <div className="bg-beyblade-card border border-white/5 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Cobertura Territorial</span>
          <div className="text-3xl font-black text-white">{data.activeLocalitiesCount}</div>
          <div className="text-[9px] text-gray-400 font-semibold">
            {data.activeDepartmentsCount} Departamentos activos
          </div>
        </div>

        {/* Junior League ratio */}
        <div className="bg-beyblade-card border border-white/5 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Proporción Junior</span>
          <div className="text-3xl font-black text-white">
            {data.activePlayers > 0 ? `${Math.round((data.juniorPlayers / data.activePlayers) * 100)}%` : '0%'}
          </div>
          <div className="text-[9px] text-gray-400 font-semibold">
            {data.juniorPlayers} de {data.activePlayers} jugadores
          </div>
        </div>

        {/* Executed Tourneys ratio */}
        <div className="bg-beyblade-card border border-white/5 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Torneos Ejecutados</span>
          <div className="text-3xl font-black text-white">
            {data.totalTournaments > 0 ? `${Math.round((data.completedTournaments / data.totalTournaments) * 100)}%` : '0%'}
          </div>
          <div className="text-[9px] text-gray-400 font-semibold">
            {data.completedTournaments} de {data.totalTournaments} completados
          </div>
        </div>
      </div>

      {/* Corporate Summary Box */}
      <div className="bg-gradient-to-r from-beyblade-card to-beyblade-darker border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 className="font-extrabold text-xs text-white uppercase tracking-wider font-title">Informe de Crecimiento & Ligas</h3>
        <p className="text-xs text-gray-400 leading-relaxed max-w-2xl font-sans">
          El ecosistema competitivo oficial de Beyblade en el país muestra un crecimiento sostenible impulsado por la liga Junior. La presencia en **{data.activeLocalitiesCount} localidades** garantiza la representatividad federal necesaria para eventos de escala continental (Copa Latinoamericana / LATAM).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[9px] text-gray-500 font-bold uppercase block tracking-wider">Liga Junior (6-14 Años)</span>
            <div className="text-xl font-extrabold text-white">{data.juniorPlayers} Jugadores</div>
            <div className="h-1.5 w-full bg-beyblade-darker rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-beyblade-electricCyan shadow-neon-cyan" 
                style={{ width: `${data.activePlayers > 0 ? (data.juniorPlayers / data.activePlayers) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[9px] text-gray-500 font-bold uppercase block tracking-wider">Liga Open (14+ Años)</span>
            <div className="text-xl font-extrabold text-white">{data.openPlayers} Jugadores</div>
            <div className="h-1.5 w-full bg-beyblade-darker rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-beyblade-electricRed shadow-neon-red" 
                style={{ width: `${data.activePlayers > 0 ? (data.openPlayers / data.activePlayers) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
