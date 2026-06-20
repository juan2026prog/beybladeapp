import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Filter, AlertCircle, ShoppingCart, Zap, Shield, Target, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DbService } from '../services/dbService';
import type { Product } from '../services/dbService';

interface BeybladeStats {
  type: 'Ataque' | 'Defensa' | 'Resistencia' | 'Equilibrio';
  attack: number;
  defense: number;
  stamina: number;
  balance: number;
}

// Deterministic stats generator based on product name/id
const getBeybladeStats = (name: string, id: string): BeybladeStats => {
  const lowercaseName = name.toLowerCase();
  
  if (
    lowercaseName.includes('dran') || 
    lowercaseName.includes('sword') || 
    lowercaseName.includes('buster') || 
    lowercaseName.includes('dagger') || 
    lowercaseName.includes('shark') || 
    lowercaseName.includes('keel') || 
    lowercaseName.includes('cobalt') || 
    lowercaseName.includes('phoenix') ||
    lowercaseName.includes('tyran') ||
    lowercaseName.includes('wing')
  ) {
    const seed = id ? id.charCodeAt(0) : 10;
    return {
      type: 'Ataque',
      attack: 75 + (seed % 20),
      defense: 20 + (seed % 15),
      stamina: 25 + (seed % 15),
      balance: 35 + (seed % 20),
    };
  }
  
  if (
    lowercaseName.includes('arrow') || 
    lowercaseName.includes('wizard') || 
    lowercaseName.includes('rod') || 
    lowercaseName.includes('viper') || 
    lowercaseName.includes('rudder') ||
    lowercaseName.includes('glide')
  ) {
    const seed = id ? id.charCodeAt(id.length - 1) : 12;
    return {
      type: 'Resistencia',
      attack: 20 + (seed % 15),
      defense: 30 + (seed % 15),
      stamina: 80 + (seed % 18),
      balance: 30 + (seed % 20),
    };
  }
  
  if (
    lowercaseName.includes('shield') || 
    lowercaseName.includes('knight') || 
    lowercaseName.includes('lance') || 
    lowercaseName.includes('leon') || 
    lowercaseName.includes('tail') || 
    lowercaseName.includes('shinobi') || 
    lowercaseName.includes('sphinx') ||
    lowercaseName.includes('claw')
  ) {
    const seed = id ? id.charCodeAt(Math.floor(id.length / 2)) : 8;
    return {
      type: 'Defensa',
      attack: 25 + (seed % 15),
      defense: 80 + (seed % 18),
      stamina: 25 + (seed % 15),
      balance: 40 + (seed % 15),
    };
  }
  
  // Default to Balance (Equilibrio)
  const seed = id ? id.length : 5;
  return {
    type: 'Equilibrio',
    attack: 50 + (seed % 20),
    defense: 45 + (seed % 20),
    stamina: 45 + (seed % 20),
    balance: 75 + (seed % 15),
  };
};

const getCombatTypeDetails = (type: 'Ataque' | 'Defensa' | 'Resistencia' | 'Equilibrio') => {
  switch (type) {
    case 'Ataque':
      return {
        label: 'Ataque',
        icon: <Flame className="h-3.5 w-3.5" />,
        badgeClass: 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]',
        color: 'from-red-500 to-amber-500',
        textColor: 'text-red-500',
        glowColor: 'rgba(239, 68, 68, 0.4)',
      };
    case 'Defensa':
      return {
        label: 'Defensa',
        icon: <Shield className="h-3.5 w-3.5" />,
        badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]',
        color: 'from-blue-500 to-indigo-500',
        textColor: 'text-blue-400',
        glowColor: 'rgba(59, 130, 246, 0.4)',
      };
    case 'Resistencia':
      return {
        label: 'Resistencia',
        icon: <Zap className="h-3.5 w-3.5" />,
        badgeClass: 'bg-amber-400/10 text-amber-400 border border-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.15)]',
        color: 'from-amber-400 to-yellow-500',
        textColor: 'text-amber-400',
        glowColor: 'rgba(251, 191, 36, 0.4)',
      };
    case 'Equilibrio':
    default:
      return {
        label: 'Equilibrio',
        icon: <Target className="h-3.5 w-3.5" />,
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
        color: 'from-emerald-500 to-teal-500',
        textColor: 'text-emerald-400',
        glowColor: 'rgba(16, 185, 129, 0.4)',
      };
  }
};

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');

  useEffect(() => {
    const fetchProducts = async () => {
      const list = await DbService.getProductsList();
      setProducts(list);
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedType !== 'Todos' && p.type !== selectedType) return false;
      if (selectedStatus !== 'Todos' && p.status !== selectedStatus) return false;
      return true;
    });
  }, [products, selectedType, selectedStatus]);

  // Find the protagonist product (prefer starter/booster and status = disponible)
  const spotlightProduct = useMemo(() => {
    if (products.length === 0) return null;
    const prefered = products.find(
      p => (p.type === 'starter' || p.type === 'booster') && p.status === 'disponible'
    );
    return prefered || products.find(p => p.type === 'starter' || p.type === 'booster') || products[0];
  }, [products]);

  const spotlightStats = useMemo(() => {
    if (!spotlightProduct) return null;
    return getBeybladeStats(spotlightProduct.name, spotlightProduct.id);
  }, [spotlightProduct]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponible':
        return 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 shadow-[0_0_8px_rgba(52,211,153,0.1)]';
      case 'proximo lanzamiento':
        return 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/20 shadow-[0_0_8px_rgba(0,240,255,0.1)]';
      case 'agotado':
      default:
        return 'bg-beyblade-electricRed/10 text-beyblade-electricRed border border-beyblade-electricRed/20 shadow-[0_0_8px_rgba(255,0,85,0.1)]';
    }
  };

  const handleWhereToBuy = (productId: string) => {
    navigate(`/stores?product=${productId}`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-white/5 pb-4 space-y-1">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider font-title flex items-center gap-2">
          <ShoppingBag className="h-7 w-7 text-beyblade-electricCyan text-glow-cyan" /> Catálogo de Productos
        </h1>
        <p className="text-xs text-gray-400">Gama oficial de Beyblade X distribuida por Hasbro. Telemetría de combate y especificaciones técnicas oficiales.</p>
      </div>

      {/* 1. Protagonist Product Spotlight */}
      {spotlightProduct && spotlightStats && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-[#080E18] border border-white/10 rounded-3xl overflow-hidden clip-cyber-card shadow-lg"
        >
          {/* Tech grid background with X-Line glows */}
          <div className="absolute inset-0 tech-grid opacity-30 z-0"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-beyblade-electricCyan/5 rounded-full filter blur-[80px] pointer-events-none z-0"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-beyblade-electricRed/5 rounded-full filter blur-[80px] pointer-events-none z-0"></div>

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 z-10 items-center">
            
            {/* Left Info: Stats & details */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-beyblade-electricCyan/15 text-beyblade-electricCyan border border-beyblade-electricCyan/30 px-3 py-1 rounded-md">
                    Beyblade Destacado
                  </span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase border ${getStatusBadge(spotlightProduct.status)}`}>
                    {spotlightProduct.status}
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wide font-title">
                  {spotlightProduct.name}
                </h2>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-extrabold uppercase font-esports tracking-widest">{spotlightProduct.line}</span>
                  <span className="text-gray-600">•</span>
                  {/* Combat Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-esports tracking-wider ${getCombatTypeDetails(spotlightStats.type).badgeClass}`}>
                    {getCombatTypeDetails(spotlightStats.type).icon}
                    {getCombatTypeDetails(spotlightStats.type).label}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-sans max-w-xl">
                {spotlightProduct.description}
              </p>

              {/* Stats Bars Block */}
              <div className="bg-[#040810]/70 border border-white/5 rounded-2xl p-5 space-y-3.5 max-w-xl">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-esports">Telemetría de Rendimiento</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Attack Stat */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400 font-esports">ATAQUE</span>
                      <span className="text-red-500 font-esports">{spotlightStats.attack}/100</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${spotlightStats.attack}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                      />
                    </div>
                  </div>

                  {/* Defense Stat */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400 font-esports">DEFENSA</span>
                      <span className="text-blue-400 font-esports">{spotlightStats.defense}/100</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${spotlightStats.defense}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                  </div>

                  {/* Stamina Stat */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400 font-esports">RESISTENCIA</span>
                      <span className="text-amber-400 font-esports">{spotlightStats.stamina}/100</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${spotlightStats.stamina}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      />
                    </div>
                  </div>

                  {/* Balance Stat */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400 font-esports">EQUILIBRIO</span>
                      <span className="text-emerald-400 font-esports">{spotlightStats.balance}/100</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${spotlightStats.balance}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleWhereToBuy(spotlightProduct.id)}
                  className="px-8 py-3 bg-beyblade-electricCyan text-beyblade-darker font-black font-esports text-xs uppercase tracking-widest rounded-xl hover:bg-white hover:shadow-neon-cyan transition-all duration-300 flex items-center gap-2 group"
                >
                  <ShoppingCart className="h-4 w-4" /> Dónde comprar en Uruguay
                </button>
              </div>
            </div>

            {/* Right: Floating blueprint hologram */}
            <div className="lg:col-span-5 flex justify-center py-6">
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Concentric rotating tech circles */}
                <div className="absolute inset-0 border border-dashed border-beyblade-electricCyan/20 rounded-full animate-orbit-cw"></div>
                <div className="absolute inset-4 border border-dashed border-beyblade-electricRed/15 rounded-full animate-orbit-ccw"></div>
                <div className="absolute inset-10 border border-double border-white/5 rounded-full"></div>
                
                {/* Glowing arena layout lines */}
                <svg className="absolute w-full h-full opacity-20" viewBox="0 0 100 100">
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#00F0FF" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#00F0FF" strokeWidth="0.5" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#FF0055" strokeWidth="0.5" />
                  <polygon points="50,15 80,65 20,65" fill="none" stroke="#00F0FF" strokeWidth="0.5" />
                </svg>

                {/* Center hologram core */}
                <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-beyblade-electricCyan/20 to-beyblade-electricRed/20 backdrop-blur-sm border-2 border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.15)] relative">
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#080E18] rounded-full"></div>
                  
                  {/* Rotating center emblem */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                    className="w-24 h-24 rounded-full border border-dashed border-white/20 flex items-center justify-center relative"
                  >
                    <div className="w-14 h-14 rounded-full bg-beyblade-darker/80 border border-white/10 flex items-center justify-center shadow-inner">
                      <ShoppingBag className="h-6 w-6 text-beyblade-electricCyan text-glow-cyan" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

          </div>
        </motion.section>
      )}

      {/* 2. Catalog Filters */}
      <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 space-y-4 shadow-lg">
        <h3 className="text-xs font-black text-white uppercase tracking-widest font-esports flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-beyblade-electricCyan" /> Filtrar Catálogo
        </h3>
        
        <div className="flex flex-wrap gap-4 text-xs">
          {/* Type Filter */}
          <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
            <span className="text-[10px] text-gray-500 font-extrabold uppercase font-esports tracking-wide">Tipo de Producto</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-beyblade-darker text-xs font-bold text-white border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-beyblade-electricCyan transition-colors cursor-pointer"
            >
              <option value="Todos">Todos los tipos</option>
              <option value="starter">Starters (Con Lanzador)</option>
              <option value="booster">Boosters (Solo Beyblade)</option>
              <option value="stadium">Estadios</option>
              <option value="launcher">Lanzadores</option>
              <option value="accesorio">Accesorios</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
            <span className="text-[10px] text-gray-500 font-extrabold uppercase font-esports tracking-wide">Estado de Disponibilidad</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-beyblade-darker text-xs font-bold text-white border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-beyblade-electricCyan transition-colors cursor-pointer"
            >
              <option value="Todos">Todos los estados</option>
              <option value="disponible">Disponibles</option>
              <option value="proximo lanzamiento">Próximos lanzamientos</option>
              <option value="agotado">Agotados</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p, index) => {
              const stats = getBeybladeStats(p.name, p.id);
              const isBlade = p.type === 'starter' || p.type === 'booster';
              const combatDetails = isBlade ? getCombatTypeDetails(stats.type) : null;
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                  key={p.id}
                  className="bg-beyblade-card border border-white/5 rounded-3xl p-5 hover:border-beyblade-electricCyan/20 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden clip-cyber-card"
                >
                  {/* Subtle Tech Grids behind */}
                  <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none"></div>

                  <div className="space-y-4 z-10">
                    {/* Header: Type / Status */}
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-400 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5 font-esports tracking-wider">
                        {p.type}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase font-esports tracking-wider ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </div>

                    {/* Circular Blueprint / Hologram Placeholder */}
                    <div className="h-44 bg-beyblade-darker/60 rounded-2xl border border-white/5 relative flex items-center justify-center overflow-hidden">
                      <div className="w-28 h-28 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500">
                        {/* Glow effect matching combat type */}
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${combatDetails ? combatDetails.color : 'from-beyblade-electricCyan to-beyblade-electricRed'} opacity-15 blur-md absolute`}></div>
                        
                        {/* Rotating Outer Ring */}
                        <div className={`absolute inset-0 border border-dashed rounded-full group-hover:animate-orbit-cw ${combatDetails ? 'border-' + combatDetails.textColor + '/20' : 'border-white/5'}`}></div>
                        
                        <ShoppingBag className="h-7 w-7 text-gray-500 z-10 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <span className="absolute bottom-2 right-3 text-[9px] text-gray-600 font-mono font-bold">{p.id}</span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-white text-base group-hover:text-beyblade-electricCyan transition-colors line-clamp-1 uppercase tracking-wide">
                          {p.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-400 font-black uppercase font-esports tracking-widest">{p.line}</span>
                        {combatDetails && (
                          <>
                            <span className="text-gray-700 text-xs">•</span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-black uppercase font-esports tracking-wide ${combatDetails.badgeClass}`}>
                              {combatDetails.icon}
                              {combatDetails.label}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-400 leading-relaxed pt-1.5 line-clamp-2 min-h-[32px]">
                        {p.description}
                      </p>
                    </div>

                    {/* Simple Stats telemetries inside product card (only for Beys) */}
                    {isBlade && (
                      <div className="bg-black/35 rounded-xl p-3 space-y-2 border border-white/5">
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-bold font-esports">
                          <div className="flex justify-between">
                            <span className="text-gray-500">ATK:</span>
                            <span className="text-red-500">{stats.attack}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">DEF:</span>
                            <span className="text-blue-400">{stats.defense}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">STM:</span>
                            <span className="text-amber-400">{stats.stamina}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">BAL:</span>
                            <span className="text-emerald-400">{stats.balance}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col gap-2 z-10">
                    <button
                      onClick={() => handleWhereToBuy(p.id)}
                      className="w-full py-2.5 bg-beyblade-electricCyan/10 hover:bg-beyblade-electricCyan text-beyblade-electricCyan hover:text-beyblade-darker border border-beyblade-electricCyan/20 rounded-xl text-xs font-black font-esports uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 shadow-[inset_0_0_12px_rgba(0,240,255,0.02)] hover:shadow-neon-cyan"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Dónde comprar
                    </button>
                  </div>

                </motion.div>
              );
            })
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full bg-beyblade-card border border-white/5 rounded-3xl p-12 text-center text-gray-400 text-sm flex flex-col items-center justify-center space-y-2"
            >
              <AlertCircle className="h-8 w-8 text-gray-600" />
              <p>No se encontraron productos para los filtros aplicados en el catálogo.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
