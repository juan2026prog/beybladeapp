import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Filter, AlertCircle, Zap, Shield, Target, Flame, Search, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DbService } from '../services/dbService';
import type { Product } from '../services/dbService';

interface BeybladeStats {
  type: 'Ataque' | 'Defensa' | 'Resistencia' | 'Equilibrio';
}

const getBeybladeStats = (name: string): BeybladeStats => {
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
    return { type: 'Ataque' };
  }
  
  if (
    lowercaseName.includes('arrow') || 
    lowercaseName.includes('wizard') || 
    lowercaseName.includes('rod') || 
    lowercaseName.includes('viper') || 
    lowercaseName.includes('rudder') ||
    lowercaseName.includes('glide')
  ) {
    return { type: 'Resistencia' };
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
    return { type: 'Defensa' };
  }
  
  return { type: 'Equilibrio' };
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
      };
    case 'Defensa':
      return {
        label: 'Defensa',
        icon: <Shield className="h-3.5 w-3.5" />,
        badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]',
        color: 'from-blue-500 to-indigo-500',
        textColor: 'text-blue-400',
      };
    case 'Resistencia':
      return {
        label: 'Resistencia',
        icon: <Zap className="h-3.5 w-3.5" />,
        badgeClass: 'bg-amber-400/10 text-amber-400 border border-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.15)]',
        color: 'from-amber-400 to-yellow-500',
        textColor: 'text-amber-400',
      };
    case 'Equilibrio':
    default:
      return {
        label: 'Equilibrio',
        icon: <Target className="h-3.5 w-3.5" />,
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
        color: 'from-emerald-500 to-teal-500',
        textColor: 'text-emerald-400',
      };
  }
};

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  
  // Advanced filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedLine, setSelectedLine] = useState<string>('Todos');

  useEffect(() => {
    const fetchProducts = async () => {
      const list = await DbService.getProductsList();
      setProducts(list);
    };
    fetchProducts();
  }, []);

  // Mapped distinct lines for the filter select
  const uniqueLines = useMemo(() => {
    const lines = products.map(p => p.line).filter(Boolean);
    return ['Todos', ...Array.from(new Set(lines))];
  }, [products]);

  // Filtering products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Search Query (name, sku, line, type, category)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = (p.sku || '').toLowerCase().includes(query);
        const matchesLine = (p.line || '').toLowerCase().includes(query);
        const matchesType = (p.product_type || p.type || '').toLowerCase().includes(query);
        const matchesCategory = (p.product_category || '').toLowerCase().includes(query);
        
        if (!matchesName && !matchesSku && !matchesLine && !matchesType && !matchesCategory) {
          return false;
        }
      }

      // 2. Type filter
      if (selectedType !== 'Todos') {
        const type = p.product_type || p.type || '';
        if (type.toLowerCase() !== selectedType.toLowerCase()) return false;
      }

      // 3. Status filter
      if (selectedStatus !== 'Todos' && p.status !== selectedStatus) return false;

      // 4. Combat Category filter
      if (selectedCategory !== 'Todos') {
        const cat = p.product_category || '';
        if (cat.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      // 5. Line filter
      if (selectedLine !== 'Todos' && p.line !== selectedLine) return false;

      return true;
    });
  }, [products, searchQuery, selectedType, selectedStatus, selectedCategory, selectedLine]);

  // Spotlight Product
  const spotlightProduct = useMemo(() => {
    if (products.length === 0) return null;
    const prefered = products.find(
      p => ((p.product_type || p.type) === 'starter' || (p.product_type || p.type) === 'booster') && p.status === 'disponible'
    );
    return prefered || products[0];
  }, [products]);

  const spotlightCategory = useMemo(() => {
    if (!spotlightProduct) return 'Equilibrio';
    if (spotlightProduct.product_category) {
      const cat = spotlightProduct.product_category.toLowerCase();
      if (cat.includes('ataque')) return 'Ataque';
      if (cat.includes('defensa')) return 'Defensa';
      if (cat.includes('resistencia')) return 'Resistencia';
      return 'Equilibrio';
    }
    return getBeybladeStats(spotlightProduct.name).type;
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
    <div className="space-y-8 pb-12 text-left">
      {/* Header */}
      <div className="border-b border-white/5 pb-4 space-y-1">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider font-title flex items-center gap-2">
          <ShoppingBag className="h-7 w-7 text-beyblade-electricCyan text-glow-cyan" /> Catálogo de Productos
        </h1>
        <p className="text-xs text-gray-400">Gama oficial de Beyblade X distribuida por Hasbro. Telemetría de combate y especificaciones técnicas oficiales.</p>
      </div>

      {/* 1. Spotlight Product */}
      {spotlightProduct && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-[#080E18] border border-white/10 rounded-3xl overflow-hidden clip-cyber-card shadow-lg"
        >
          {/* Tech grid backgrounds */}
          <div className="absolute inset-0 tech-grid opacity-30 z-0"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-beyblade-electricCyan/5 rounded-full filter blur-[80px] pointer-events-none z-0"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-beyblade-electricRed/5 rounded-full filter blur-[80px] pointer-events-none z-0"></div>

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 z-10 items-center">
            
            {/* Info details */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-beyblade-electricCyan/15 text-beyblade-electricCyan border border-beyblade-electricCyan/30 px-3 py-1 rounded-md font-esports">
                    Beyblade Destacado
                  </span>
                  {spotlightProduct.sku && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-black/40 text-beyblade-electricCyan border border-beyblade-electricCyan/20 px-3 py-1 rounded-md font-mono">
                      SKU: {spotlightProduct.sku}
                    </span>
                  )}
                  <span className={`text-[9px] font-black px-3 py-1 rounded-md uppercase border font-esports tracking-wider ${getStatusBadge(spotlightProduct.status)}`}>
                    {spotlightProduct.status}
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wide font-title leading-tight">
                  {spotlightProduct.name}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-gray-400 font-extrabold uppercase font-esports tracking-widest">{spotlightProduct.line}</span>
                  <span className="text-gray-600">•</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-esports tracking-wider ${getCombatTypeDetails(spotlightCategory).badgeClass}`}>
                    {getCombatTypeDetails(spotlightCategory).icon}
                    {getCombatTypeDetails(spotlightCategory).label}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-sans max-w-xl">
                {spotlightProduct.short_description || spotlightProduct.description}
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to={`/products/${spotlightProduct.id}`}
                  className="px-6 py-3 bg-beyblade-electricCyan text-beyblade-darker font-black font-esports text-xs uppercase tracking-widest rounded-xl hover:bg-white hover:shadow-neon-cyan transition-all duration-300 flex items-center gap-2 group"
                >
                  Ver Ficha Completa
                </Link>
                <button
                  onClick={() => handleWhereToBuy(spotlightProduct.id)}
                  className="px-6 py-3 bg-white/5 border border-white/10 hover:border-beyblade-electricCyan/35 text-white hover:text-beyblade-electricCyan font-black font-esports text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" /> Dónde comprar en Uruguay
                </button>
              </div>
            </div>

            {/* Float holographic image */}
            <div className="lg:col-span-5 flex justify-center py-4">
              <div className="relative w-64 h-64 flex items-center justify-center">
                <div className="absolute inset-0 border border-dashed border-beyblade-electricCyan/20 rounded-full animate-orbit-cw"></div>
                <div className="absolute inset-4 border border-dashed border-beyblade-electricRed/15 rounded-full animate-orbit-ccw"></div>
                
                <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-beyblade-electricCyan/10 to-beyblade-electricRed/10 backdrop-blur-sm border border-white/5 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.1)] overflow-hidden p-2">
                  {spotlightProduct.main_image_url || spotlightProduct.image_url ? (
                    <img 
                      src={spotlightProduct.main_image_url || spotlightProduct.image_url} 
                      className="w-full h-full object-contain animate-float-p1" 
                      alt={spotlightProduct.name} 
                    />
                  ) : (
                    <ShoppingBag className="h-10 w-10 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

          </div>
        </motion.section>
      )}

      {/* 2. Advanced Filters */}
      <div className="bg-beyblade-card border border-white/5 rounded-3xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="text-xs font-black text-white uppercase tracking-widest font-esports flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-beyblade-electricCyan" /> Filtrar Catálogo
          </h3>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('Todos');
              setSelectedStatus('Todos');
              setSelectedCategory('Todos');
              setSelectedLine('Todos');
            }}
            className="text-[9px] font-black text-gray-500 hover:text-white uppercase font-esports tracking-widest"
          >
            Limpiar Filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
          {/* Search bar */}
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] text-gray-500 font-extrabold uppercase font-esports tracking-wide">Buscar</span>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre, SKU, Categoría..."
                className="w-full bg-beyblade-darker text-xs font-bold text-white border border-white/5 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-beyblade-electricCyan transition-colors"
              />
              <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-gray-500" />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-500 font-extrabold uppercase font-esports tracking-wide">Tipo</span>
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
              <option value="set">Sets Completos</option>
              <option value="accesorio">Accesorios</option>
            </select>
          </div>

          {/* Combat Category Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-500 font-extrabold uppercase font-esports tracking-wide">Categoría</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-beyblade-darker text-xs font-bold text-white border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-beyblade-electricCyan transition-colors cursor-pointer"
            >
              <option value="Todos">Todas las categorías</option>
              <option value="ataque">Ataque</option>
              <option value="defensa">Defensa</option>
              <option value="resistencia">Resistencia</option>
              <option value="equilibrio">Equilibrio / Balance</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-500 font-extrabold uppercase font-esports tracking-wide">Estado</span>
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

          {/* Line Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-500 font-extrabold uppercase font-esports tracking-wide">Línea</span>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="bg-beyblade-darker text-xs font-bold text-white border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-beyblade-electricCyan transition-colors cursor-pointer"
            >
              {uniqueLines.map(l => (
                <option key={l} value={l}>{l === 'Todos' ? 'Todas las líneas' : l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p, index) => {
              const productType = p.product_type || p.type || 'booster';
              const isBlade = productType === 'starter' || productType === 'booster';
              
              // Resolve category type
              let itemCategory = 'Equilibrio';
              if (p.product_category) {
                const cat = p.product_category.toLowerCase();
                if (cat.includes('ataque')) itemCategory = 'Ataque';
                else if (cat.includes('defensa')) itemCategory = 'Defensa';
                else if (cat.includes('resistencia')) itemCategory = 'Resistencia';
              } else {
                itemCategory = getBeybladeStats(p.name).type;
              }
              const combatDetails = isBlade ? getCombatTypeDetails(itemCategory as any) : null;
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                  key={p.id}
                  className="bg-beyblade-card border border-white/5 rounded-3xl p-5 hover:border-beyblade-electricCyan/20 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden clip-cyber-card shadow-md"
                >
                  <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none"></div>

                  <div className="space-y-4 z-10 text-left">
                    {/* Header: Type / Status */}
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-400 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5 font-esports tracking-wider">
                        {productType}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase font-esports tracking-wider ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </div>

                    {/* Circular Blueprint or Real Image */}
                    <div className="h-44 bg-beyblade-darker/60 rounded-2xl border border-white/5 relative flex items-center justify-center overflow-hidden p-3.5">
                      {p.main_image_url || p.image_url ? (
                        <img 
                          src={p.main_image_url || p.image_url} 
                          alt={p.name} 
                          loading="lazy"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500">
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${combatDetails ? combatDetails.color : 'from-beyblade-electricCyan to-beyblade-electricRed'} opacity-15 blur-md absolute`}></div>
                          <div className={`absolute inset-0 border border-dashed rounded-full group-hover:animate-orbit-cw ${combatDetails ? 'border-' + combatDetails.textColor + '/20' : 'border-white/5'}`}></div>
                          <ShoppingBag className="h-6 w-6 text-gray-500 z-10 group-hover:text-white transition-colors duration-300" />
                        </div>
                      )}
                      
                      {p.sku && (
                        <span className="absolute bottom-2.5 left-3 bg-black/75 px-2 py-0.5 rounded text-[8px] text-beyblade-electricCyan font-mono font-black border border-beyblade-electricCyan/20">
                          {p.sku}
                        </span>
                      )}
                      <span className="absolute bottom-2.5 right-3 text-[8px] text-gray-600 font-mono font-bold uppercase tracking-wider">
                        {p.line}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-white text-base group-hover:text-beyblade-electricCyan transition-colors line-clamp-1 uppercase tracking-wide">
                        {p.name}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-1.5">
                        {combatDetails && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase font-esports tracking-wide ${combatDetails.badgeClass}`}>
                            {combatDetails.icon}
                            {combatDetails.label}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-400 leading-relaxed pt-1 line-clamp-2 min-h-[32px] font-sans">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 z-10">
                    <Link
                      to={`/products/${p.id}`}
                      className="py-2 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker text-center rounded-xl text-[10px] font-black font-esports uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1 hover:scale-105 active:scale-95"
                    >
                      Ver detalles
                    </Link>
                    <button
                      onClick={() => handleWhereToBuy(p.id)}
                      className="py-2 bg-beyblade-card border border-white/10 hover:border-beyblade-electricCyan/35 text-white hover:text-beyblade-electricCyan text-center rounded-xl text-[10px] font-black font-esports uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1 hover:scale-105 active:scale-95"
                    >
                      <MapPin className="h-3.5 w-3.5" /> Comprar
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
              <p className="font-sans">No se encontraron productos para los filtros aplicados en el catálogo.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
