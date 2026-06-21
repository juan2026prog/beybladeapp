import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, ArrowLeft, Shield, Zap, Target, Flame, 
  MapPin, Calendar, Film, Info, Layout, ExternalLink, Download, Maximize2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { DbService } from '../services/dbService';
import type { Product, ProductMedia } from '../services/dbService';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [mediaItems, setMediaItems] = useState<ProductMedia[]>([]);
  const [activeMedia, setActiveMedia] = useState<ProductMedia | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'components' | 'backcard' | 'videos' | 'stores'>('info');
  const [storeStocks, setStoreStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreenBackCard, setIsFullscreenBackCard] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadProductData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Product details
        const prod = await DbService.getProductDetails(id);
        if (!prod) {
          setError('El producto no existe o no fue encontrado.');
          setLoading(false);
          return;
        }
        setProduct(prod);

        // 2. Fetch Product media
        const media = await DbService.getProductMedia(id);
        setMediaItems(media);
        
        // Find primary or first media item
        const primary = media.find(m => m.is_primary) || media[0] || null;
        setActiveMedia(primary);

        // 3. Fetch Store stocks for this product
        const { data: stocks, error: stockErr } = await supabase
          .from('store_stock')
          .select('*, stores:store_id(*)')
          .eq('product_id', id);
        
        if (stockErr) console.error('Error fetching stock stores:', stockErr);
        else setStoreStocks(stocks || []);

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading product detail:', err);
        setError(err.message || 'Error al conectar con la base de datos.');
        setLoading(false);
      }
    };
    loadProductData();
  }, [id]);

  // Combat Type configuration
  const combatType = useMemo(() => {
    if (!product) return null;
    const cat = product.product_category || '';
    if (cat.toLowerCase().includes('ataque')) return 'Ataque';
    if (cat.toLowerCase().includes('defensa')) return 'Defensa';
    if (cat.toLowerCase().includes('resistencia')) return 'Resistencia';
    if (cat.toLowerCase().includes('equilibrio') || cat.toLowerCase().includes('balance')) return 'Equilibrio';
    return null;
  }, [product]);

  const combatDetails = useMemo(() => {
    if (!combatType) return null;
    switch (combatType) {
      case 'Ataque':
        return {
          label: 'Ataque',
          icon: <Flame className="h-4 w-4" />,
          badgeClass: 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]',
          color: 'from-red-500 to-amber-500',
          textColor: 'text-red-500'
        };
      case 'Defensa':
        return {
          label: 'Defensa',
          icon: <Shield className="h-4 w-4" />,
          badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]',
          color: 'from-blue-500 to-indigo-500',
          textColor: 'text-blue-400'
        };
      case 'Resistencia':
        return {
          label: 'Resistencia',
          icon: <Zap className="h-4 w-4" />,
          badgeClass: 'bg-amber-400/10 text-amber-400 border border-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.15)]',
          color: 'from-amber-400 to-yellow-500',
          textColor: 'text-amber-400'
        };
      case 'Equilibrio':
      default:
        return {
          label: 'Equilibrio',
          icon: <Target className="h-4 w-4" />,
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
          color: 'from-emerald-500 to-teal-500',
          textColor: 'text-emerald-400'
        };
    }
  }, [combatType]);

  // Image display logic
  const primaryImageUrl = useMemo(() => {
    if (!product) return '';
    return product.main_image_url || product.image_url || '';
  }, [product]);

  // Helper to extract YouTube ID
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-beyblade-electricCyan animate-spin"></div>
        </div>
        <p className="text-[10px] font-black text-beyblade-electricCyan uppercase tracking-widest animate-pulse">Analizando Producto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-beyblade-electricRed mx-auto" />
        <h2 className="text-xl font-black text-white uppercase tracking-wider">Error de Carga</h2>
        <p className="text-gray-400 text-xs">{error || 'El producto seleccionado no está disponible.'}</p>
        <Link 
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-black font-esports uppercase tracking-widest transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Catálogo
        </Link>
      </div>
    );
  }

  // Active view visual setup
  const activeMediaUrl = activeMedia ? activeMedia.url : primaryImageUrl;
  const activeMediaType = activeMedia ? activeMedia.media_type : 'image';

  return (
    <div className="space-y-8 pb-12 text-left">
      {/* Back Button */}
      <div>
        <Link 
          to="/products"
          className="inline-flex items-center gap-2 text-[10px] font-black font-esports uppercase tracking-widest text-gray-400 hover:text-beyblade-electricCyan transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al Catálogo
        </Link>
      </div>

      {/* Main product presentation block */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Media Gallery (1:1 Aspect box + thumbnails) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square bg-[#040810] border border-white/5 rounded-3xl overflow-hidden flex items-center justify-center shadow-lg group">
            {/* Hologram effects background */}
            <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none"></div>
            
            {/* Rendering active media */}
            {activeMediaType === 'image' || activeMediaType === 'back_card' ? (
              activeMediaUrl ? (
                <img 
                  src={activeMediaUrl} 
                  alt={product.name} 
                  loading="lazy" 
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="text-center text-gray-600">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-2 opacity-30" />
                  <span className="text-[10px] uppercase font-esports font-bold tracking-widest">Sin Imagen</span>
                </div>
              )
            ) : activeMediaType === 'video' ? (
              <video 
                src={activeMediaUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain bg-black" 
              />
            ) : activeMediaType === 'youtube' ? (
              <iframe 
                src={getYouTubeEmbedUrl(activeMediaUrl)}
                title="Product Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full bg-black border-none"
              ></iframe>
            ) : activeMediaType === 'pdf' ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                <Layout className="h-16 w-16 text-beyblade-electricCyan text-glow-cyan" />
                <p className="font-extrabold text-sm text-white uppercase tracking-wider">Documento PDF Adjunto</p>
                <a 
                  href={activeMediaUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-6 py-3 bg-beyblade-electricCyan text-beyblade-darker font-black font-esports text-xs uppercase tracking-widest rounded-xl hover:bg-white hover:shadow-neon-cyan transition-all flex items-center gap-2"
                >
                  <Download className="h-4 w-4" /> Descargar / Ver PDF
                </a>
              </div>
            ) : null}

            {/* Back Card specific fullscreen viewer button */}
            {activeMediaType === 'back_card' && activeMediaUrl && (
              <button 
                onClick={() => setIsFullscreenBackCard(true)}
                className="absolute top-4 right-4 p-2.5 bg-black/70 hover:bg-beyblade-electricCyan hover:text-beyblade-darker text-white rounded-xl border border-white/10 hover:border-transparent transition-all shadow-md flex items-center gap-1.5 text-[9px] font-black uppercase font-esports tracking-wider"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Pantalla Completa
              </button>
            )}
          </div>

          {/* Thumbnails Row */}
          {mediaItems.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {/* Primary fallback thumbnail if not present in list */}
              {mediaItems.filter(m => m.url === primaryImageUrl).length === 0 && primaryImageUrl && (
                <button
                  onClick={() => setActiveMedia(null)}
                  className={`w-16 h-16 rounded-xl border overflow-hidden flex items-center justify-center bg-black/40 p-1.5 transition-all ${
                    activeMedia === null ? 'border-beyblade-electricCyan shadow-[0_0_8px_#00F0FF]' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <img src={primaryImageUrl} className="w-full h-full object-contain" alt="Frontal" />
                </button>
              )}

              {/* Loop through list */}
              {mediaItems.map((media) => {
                const isSelected = activeMedia?.id === media.id;
                return (
                  <button
                    key={media.id}
                    onClick={() => setActiveMedia(media)}
                    className={`w-16 h-16 rounded-xl border overflow-hidden flex flex-col items-center justify-center bg-black/40 relative transition-all ${
                      isSelected ? 'border-beyblade-electricCyan shadow-[0_0_8px_#00F0FF]' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {media.media_type === 'image' || media.media_type === 'back_card' ? (
                      <img src={media.url} className="w-full h-full object-contain p-1" alt={media.title || 'Foto'} />
                    ) : media.media_type === 'video' ? (
                      <div className="flex flex-col items-center justify-center text-center p-1">
                        <Film className="h-6 w-6 text-beyblade-electricCyan" />
                        <span className="text-[7px] font-black uppercase font-esports text-gray-400">MP4</span>
                      </div>
                    ) : media.media_type === 'youtube' ? (
                      <div className="flex flex-col items-center justify-center text-center p-1">
                        <Film className="h-6 w-6 text-beyblade-electricRed" />
                        <span className="text-[7px] font-black uppercase font-esports text-gray-400">YOUTUBE</span>
                      </div>
                    ) : media.media_type === 'pdf' ? (
                      <div className="flex flex-col items-center justify-center text-center p-1">
                        <Layout className="h-6 w-6 text-beyblade-gold" />
                        <span className="text-[7px] font-black uppercase font-esports text-gray-400">PDF</span>
                      </div>
                    ) : null}

                    {/* Small tag badge for Back Cards */}
                    {media.media_type === 'back_card' && (
                      <span className="absolute bottom-0.5 right-0.5 bg-beyblade-electricRed text-[5px] font-black px-0.5 rounded text-white tracking-widest uppercase">BC</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Product Info */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-md font-esports">
                {product.line}
              </span>
              
              {/* Product SKU */}
              <span className="text-[9px] font-black uppercase tracking-widest bg-black/40 text-beyblade-electricCyan border border-beyblade-electricCyan/30 px-2.5 py-1 rounded-md font-mono">
                SKU: {product.sku || 'SKU PRÓXIMAMENTE'}
              </span>

              {/* Status Badge */}
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase font-esports tracking-wider border ${
                product.status === 'disponible' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                product.status === 'proximo lanzamiento' ? 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border-beyblade-electricCyan/20' :
                'bg-beyblade-electricRed/10 text-beyblade-electricRed border-beyblade-electricRed/20'
              }`}>
                {product.status}
              </span>

              {/* Category combat type badge */}
              {combatDetails && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black uppercase font-esports tracking-wider ${combatDetails.badgeClass}`}>
                  {combatDetails.icon}
                  {combatDetails.label}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wide font-title leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Short Description */}
          <p className="text-gray-300 text-xs md:text-sm leading-relaxed border-l-2 border-beyblade-electricCyan/45 pl-4 font-sans">
            {product.short_description || product.description}
          </p>

          {/* Primary CTA */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/stores?product=${product.id}`)}
              className="px-8 py-3.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-xs uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2 shadow-neon-cyan"
            >
              <MapPin className="h-4 w-4" /> Dónde comprar en Uruguay
            </button>
          </div>
        </div>

      </section>

      {/* Tabs Menu Navigation */}
      <div className="border-b border-white/5 flex flex-wrap gap-1 md:gap-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-3 font-bold text-xs uppercase transition-all border-b-2 ${
            activeTab === 'info' 
              ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Descripción
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={`px-4 py-3 font-bold text-xs uppercase transition-all border-b-2 ${
            activeTab === 'components' 
              ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Componentes
        </button>
        <button
          onClick={() => setActiveTab('backcard')}
          className={`px-4 py-3 font-bold text-xs uppercase transition-all border-b-2 ${
            activeTab === 'backcard' 
              ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Back Card Oficial
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-3 font-bold text-xs uppercase transition-all border-b-2 ${
            activeTab === 'videos' 
              ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`px-4 py-3 font-bold text-xs uppercase transition-all border-b-2 ${
            activeTab === 'stores' 
              ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Disponibilidad ({storeStocks.filter(s => s.stock_status === 'Disponible' || s.stock_status === 'Poco stock').length})
        </button>
      </div>

      {/* Tabs Content */}
      <div className="py-4">
        <AnimatePresence mode="wait">
          {/* Tab 1: Description */}
          {activeTab === 'info' && (
            <motion.div
              key="info-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-beyblade-card border border-white/5 p-6 rounded-3xl space-y-4">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Info className="h-4.5 w-4.5 text-beyblade-electricCyan" /> Descripción Completa
                </h3>
                <p className="text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-line font-sans">
                  {product.long_description || product.description}
                </p>
                {product.release_date && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-white/5 font-sans">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Fecha de Lanzamiento Oficial: <strong>{new Date(product.release_date).toLocaleDateString('es-UY', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 2: Components */}
          {activeTab === 'components' && (
            <motion.div
              key="components-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Blade Component */}
              <div className="bg-beyblade-card border border-white/5 p-6 rounded-3xl text-center space-y-3 relative overflow-hidden clip-cyber-card">
                <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none"></div>
                <span className="text-[10px] text-gray-500 font-extrabold uppercase font-esports tracking-widest block">BLADE</span>
                <p className="text-base font-black text-white uppercase font-esports">{product.blade_name || 'No especificado'}</p>
                <div className="h-1 bg-gradient-to-r from-beyblade-electricCyan to-transparent w-16 mx-auto rounded-full"></div>
              </div>

              {/* Ratchet Component */}
              <div className="bg-beyblade-card border border-white/5 p-6 rounded-3xl text-center space-y-3 relative overflow-hidden clip-cyber-card">
                <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none"></div>
                <span className="text-[10px] text-gray-500 font-extrabold uppercase font-esports tracking-widest block">RATCHET</span>
                <p className="text-base font-black text-white uppercase font-esports">{product.ratchet_name || 'No especificado'}</p>
                <div className="h-1 bg-gradient-to-r from-beyblade-electricRed to-transparent w-16 mx-auto rounded-full"></div>
              </div>

              {/* Bit Component */}
              <div className="bg-beyblade-card border border-white/5 p-6 rounded-3xl text-center space-y-3 relative overflow-hidden clip-cyber-card">
                <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none"></div>
                <span className="text-[10px] text-gray-500 font-extrabold uppercase font-esports tracking-widest block">BIT</span>
                <p className="text-base font-black text-white uppercase font-esports">{product.bit_name || 'No especificado'}</p>
                <div className="h-1 bg-gradient-to-r from-beyblade-gold to-transparent w-16 mx-auto rounded-full"></div>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Back Card */}
          {activeTab === 'backcard' && (
            <motion.div
              key="backcard-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 text-center"
            >
              {mediaItems.some(m => m.media_type === 'back_card') ? (
                mediaItems.filter(m => m.media_type === 'back_card').map((media) => (
                  <div key={media.id} className="bg-beyblade-card border border-white/5 p-6 rounded-3xl max-w-xl mx-auto space-y-4">
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center justify-center gap-2">
                      <Layout className="h-4.5 w-4.5 text-beyblade-electricRed animate-pulse" /> Back Card de Combate Oficial
                    </h3>
                    <div className="relative border border-white/5 rounded-2xl overflow-hidden bg-black/40 aspect-[4/3] flex items-center justify-center group">
                      <img 
                        src={media.url} 
                        alt="Back Card Oficial" 
                        loading="lazy"
                        className="w-full h-full object-contain cursor-zoom-in"
                        onClick={() => setIsFullscreenBackCard(true)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="px-4 py-2 bg-beyblade-electricCyan text-beyblade-darker font-black font-esports text-[9px] uppercase tracking-widest rounded-xl">Ampliar Imagen</span>
                      </div>
                    </div>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setIsFullscreenBackCard(true)}
                        className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black font-esports text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Maximize2 className="h-3.5 w-3.5" /> Pantalla Completa
                      </button>
                      <a
                        href={media.url}
                        download={`${product.name}_backcard.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" /> Descargar Ficha
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-beyblade-card border border-white/5 p-12 rounded-3xl text-center text-gray-500 max-w-xl mx-auto space-y-2">
                  <AlertCircle className="h-8 w-8 text-gray-600 mx-auto" />
                  <p className="text-xs uppercase font-esports font-bold tracking-widest">Back Card no disponible</p>
                  <p className="text-[10px] text-gray-400 leading-normal font-sans">El equipo técnico de Hasbro o administradores locales no han cargado la ficha de telemetría de esta pieza aún.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 4: Videos */}
          {activeTab === 'videos' && (
            <motion.div
              key="videos-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {mediaItems.some(m => m.media_type === 'video' || m.media_type === 'youtube') ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mediaItems
                    .filter(m => m.media_type === 'video' || m.media_type === 'youtube')
                    .map((media) => (
                      <div key={media.id} className="bg-beyblade-card border border-white/5 p-4 rounded-3xl space-y-3 text-left">
                        <h4 className="font-extrabold text-xs text-white uppercase tracking-wider truncate flex items-center gap-1.5">
                          <Film className="h-4 w-4 text-beyblade-electricCyan" /> {media.title || 'Video de Combate'}
                        </h4>
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/5">
                          {media.media_type === 'video' ? (
                            <video src={media.url} controls className="w-full h-full object-contain" />
                          ) : (
                            <iframe 
                              src={getYouTubeEmbedUrl(media.url)}
                              title={media.title || 'YouTube Video'}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full border-none"
                            ></iframe>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-beyblade-card border border-white/5 p-12 rounded-3xl text-center text-gray-500 max-w-xl mx-auto space-y-2">
                  <AlertCircle className="h-8 w-8 text-gray-600 mx-auto" />
                  <p className="text-xs uppercase font-esports font-bold tracking-widest">No hay videos de telemetría</p>
                  <p className="text-[10px] text-gray-400 leading-normal font-sans">No hay grabaciones de pruebas o demostraciones 3D cargadas para este artículo.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 5: Stores / Stock */}
          {activeTab === 'stores' && (
            <motion.div
              key="stores-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storeStocks
                  .filter(s => s.stock_status !== 'Agotado')
                  .map((stock) => {
                    const store = stock.stores;
                    if (!store) return null;
                    return (
                      <div key={stock.store_id} className="bg-beyblade-card border border-white/5 p-5 rounded-2xl flex flex-col justify-between gap-3 hover:border-beyblade-electricCyan/10 transition-colors text-left">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-white text-sm uppercase tracking-wide">{store.name}</h4>
                          <p className="text-xs text-gray-400 flex items-center gap-1 font-sans">
                            <MapPin className="h-3.5 w-3.5 text-gray-500" />
                            {store.address} • {store.locality}
                          </p>
                        </div>
                        <div className="flex justify-between items-center border-t border-white/5 pt-2.5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase font-esports tracking-wider ${
                            stock.stock_status === 'Disponible' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {stock.stock_status}
                          </span>
                          <button
                            onClick={() => navigate(`/stores`)}
                            className="text-[9px] font-black font-esports uppercase tracking-widest text-beyblade-electricCyan hover:underline flex items-center gap-1"
                          >
                            Ver en el Mapa <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {storeStocks.filter(s => s.stock_status !== 'Agotado').length === 0 && (
                  <div className="col-span-2 bg-beyblade-card border border-white/5 p-12 rounded-3xl text-center text-gray-500 space-y-2">
                    <AlertCircle className="h-8 w-8 text-gray-600 mx-auto" />
                    <p className="text-xs uppercase font-esports font-bold tracking-widest text-beyblade-electricRed">Agotado en todas las tiendas</p>
                    <p className="text-[10px] text-gray-400 leading-normal font-sans">Actualmente este producto no cuenta con unidades disponibles en ninguna de nuestras tiendas físicas certificadas en Uruguay.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Back Card Modal */}
      {isFullscreenBackCard && mediaItems.some(m => m.media_type === 'back_card') && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setIsFullscreenBackCard(false)}
        >
          <div className="max-w-4xl max-h-[90vh] w-full h-full relative flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsFullscreenBackCard(false)}
              className="absolute -top-12 right-0 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/15 text-white text-xs font-black font-esports uppercase tracking-widest rounded-xl transition-all"
            >
              Cerrar
            </button>
            {mediaItems
              .filter(m => m.media_type === 'back_card')
              .map((media) => (
                <img 
                  key={media.id}
                  src={media.url} 
                  alt="Back Card Ampliada" 
                  className="max-w-full max-h-full object-contain drop-shadow-[0_0_30px_rgba(255,0,0,0.15)]" 
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
