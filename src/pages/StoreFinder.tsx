import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MapPin, Phone, Clock, Globe, CheckCircle, AlertCircle, Navigation, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { DbService } from '../services/dbService';
import type { Store, Product, StoreStock } from '../services/dbService';
import { OpenMap } from '../components/OpenMap';
import type { MapMarker } from '../components/OpenMap';
import { calculateDistanceKm, formatDistance } from '../utils/distance';

export const StoreFinder: React.FC = () => {
  const location = useLocation();
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<StoreStock[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // Filters
  const [localityFilter, setLocalityFilter] = useState('Todos');
  const [productFilter, setProductFilter] = useState('Todos');
  const [allStocksForProduct, setAllStocksForProduct] = useState<StoreStock[]>([]);

  // Geolocation & Distance Sorting State
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([-34.9011, -56.1645]);
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    const fetchData = async () => {
      const allStores = await DbService.getStoresList();
      const approvedStores = allStores.filter(s => s.certification_status === 'Aprobado');
      setStores(approvedStores);
      
      // Parse query params for store deep-linking
      const queryParams = new URLSearchParams(location.search);
      const storeId = queryParams.get('store');
      
      let defaultSelected: Store | null = null;
      if (storeId) {
        const found = approvedStores.find(s => s.id === storeId);
        if (found) {
          defaultSelected = found;
        }
      }
      
      if (!defaultSelected && approvedStores.length > 0) {
        defaultSelected = approvedStores[0];
      }
      
      if (defaultSelected) {
        setSelectedStore(defaultSelected);
        if (defaultSelected.latitude && defaultSelected.longitude) {
          setMapCenter([Number(defaultSelected.latitude), Number(defaultSelected.longitude)]);
          setMapZoom(14);
        }
        const storeStock = await DbService.getStoreStocksList(defaultSelected.id);
        setStocks(storeStock);
      }

      const allProducts = await DbService.getProductsList();
      setProducts(allProducts);
    };
    fetchData();
  }, [location.search]);

  // Handle URL change for product filter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const prodId = queryParams.get('product');
    if (prodId) {
      setProductFilter(prodId);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchStocksForProduct = async () => {
      if (productFilter !== 'Todos') {
        const { data, error } = await supabase
          .from('store_stock')
          .select('*')
          .eq('product_id', productFilter);
        if (!error && data) {
          setAllStocksForProduct(data as StoreStock[]);
        }
      } else {
        setAllStocksForProduct([]);
      }
    };
    fetchStocksForProduct();
  }, [productFilter]);

  const handleSelectStore = async (store: Store) => {
    setSelectedStore(store);
    if (store.latitude && store.longitude) {
      setMapCenter([Number(store.latitude), Number(store.longitude)]);
      setMapZoom(14);
    }
    const storeStock = await DbService.getStoreStocksList(store.id);
    setStocks(storeStock);
  };

  const getProductStockStatus = (productId: string) => {
    const s = stocks.find(stock => stock.product_id === productId);
    return s ? s.stock_status : 'Agotado';
  };

  const getStockBadgeClass = (status: string) => {
    switch (status) {
      case 'Disponible':
        return 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20';
      case 'Poco stock':
        return 'bg-amber-400/10 text-amber-400 border border-amber-400/20';
      case 'Proximamente':
        return 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/20';
      case 'Agotado':
      default:
        return 'bg-beyblade-electricRed/10 text-beyblade-electricRed border border-beyblade-electricRed/20';
    }
  };

  // Get user geolocation
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalización no soportada por tu navegador.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords([latitude, longitude]);
        setSortByDistance(true);
        setMapCenter([latitude, longitude]);
        setMapZoom(13);
        setGeoLoading(false);
      },
      (error) => {
        console.error('GPS Geolocation Error:', error);
        setGeoError('No se pudo acceder a tu ubicación. Comprueba tus permisos.');
        setGeoLoading(false);
      }
    );
  };

  // Filter and sort stores based on locality, product stock, and distance
  const filteredStores = stores
    .filter(s => {
      if (localityFilter !== 'Todos' && s.locality.toLowerCase() !== localityFilter.toLowerCase()) return false;
      if (productFilter !== 'Todos') {
        const productStock = allStocksForProduct.find(st => st.store_id === s.id);
        if (!productStock || productStock.stock_status === 'Agotado') return false;
      }
      return true;
    })
    .map(s => {
      let distance = Infinity;
      if (userCoords && s.latitude && s.longitude) {
        distance = calculateDistanceKm(userCoords[0], userCoords[1], Number(s.latitude), Number(s.longitude));
      }
      return { ...s, distance };
    });

  if (sortByDistance && userCoords) {
    filteredStores.sort((a, b) => a.distance - b.distance);
  }

  // Map markers mapping
  const mapMarkers: MapMarker[] = filteredStores
    .filter(s => s.latitude && s.longitude)
    .map(s => ({
      id: s.id,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      type: 'tienda',
      data: s
    }));

  if (userCoords) {
    mapMarkers.push({
      id: 'user-gps',
      latitude: userCoords[0],
      longitude: userCoords[1],
      type: 'user',
      data: {}
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/5 pb-4 space-y-1">
        <h1 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
          <MapPin className="h-6 w-6 text-beyblade-electricCyan" /> Tiendas Certificadas
        </h1>
        <p className="text-xs text-gray-400">Encuentra distribuidores y locales avalados por Hasbro con stock oficial de Beyblade X.</p>
      </div>

      {/* Geolocation Alerts */}
      {geoError && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed text-xs p-3 rounded-xl">
          {geoError}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-beyblade-card p-4 rounded-2xl border border-white/5 text-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold uppercase">Localidad:</span>
            <select
              value={localityFilter}
              onChange={(e) => setLocalityFilter(e.target.value)}
              className="bg-beyblade-dark text-xs font-bold text-white border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="Todos">Todas las Localidades</option>
              <option value="Montevideo">Montevideo</option>
              <option value="Maldonado">Maldonado</option>
              <option value="Canelones">Canelones</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold uppercase">Filtrar por Producto:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="bg-beyblade-dark text-xs font-bold text-white border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none max-w-xs"
            >
              <option value="Todos">Cualquier Producto</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGeolocate}
          disabled={geoLoading}
          className="flex items-center gap-2 bg-beyblade-dark hover:bg-white/5 border border-white/10 hover:border-beyblade-electricCyan text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-beyblade-electricCyan" />
          ) : (
            <Navigation className="h-4 w-4 text-beyblade-electricCyan" />
          )}
          Usar mi ubicación
        </button>
      </div>

      {/* Grid Layout: Map, Directory, Stock Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column: List of Stores & Visual Map */}
        <div className="space-y-6 lg:col-span-1">
          {/* Leaflet Map Preview */}
          <div className="bg-beyblade-card border border-white/5 rounded-3xl p-4 overflow-hidden relative">
            <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 text-left">Mapa de Distribución</h3>
            <OpenMap
              center={mapCenter}
              zoom={mapZoom}
              markers={mapMarkers}
              onViewDetails={(id) => {
                const found = stores.find(s => s.id === id);
                if (found) handleSelectStore(found);
              }}
              height="180px"
            />
          </div>

          {/* Stores Directory List */}
          <div className="space-y-4">
            <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider text-left">Tiendas Certificadas ({filteredStores.length})</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {filteredStores.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleSelectStore(s)}
                  className={`bg-beyblade-card border p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                    selectedStore?.id === s.id 
                      ? 'border-beyblade-electricCyan shadow-neon-cyan/10 translate-x-1' 
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-extrabold text-sm text-white">{s.name}</h4>
                      <span className="shrink-0 text-[8px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-2 w-2" /> Certificada
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-start gap-1.5 leading-tight">
                      <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                      <span>{s.locality}, {s.address}</span>
                    </p>
                    
                    {s.distance !== Infinity && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-beyblade-electricCyan font-black bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 px-2 py-0.5 rounded-lg mt-1">
                        <Navigation className="h-2.5 w-2.5 shrink-0" /> {formatDistance(s.distance)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Selected Store Details & Stock */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStore ? (
            <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 animate-fade-in">
              {/* Store Intro */}
              <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 text-left">
                  <h2 className="text-2xl font-black text-white uppercase">{selectedStore.name}</h2>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-beyblade-electricCyan" /> {selectedStore.address}, {selectedStore.locality}</p>
                </div>

                {/* Contact and media shortcuts */}
                <div className="flex gap-2">
                  {selectedStore.web_url && (
                    <a 
                      href={selectedStore.web_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2.5 bg-beyblade-dark hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                    >
                      <Globe className="h-4.5 w-4.5" />
                    </a>
                  )}
                  {selectedStore.instagram && (
                    <a 
                      href={`https://instagram.com/${selectedStore.instagram.replace('@', '')}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2.5 bg-beyblade-dark hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all flex items-center justify-center"
                    >
                      <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              {/* Working hours & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-400">
                <div className="bg-beyblade-dark p-3.5 rounded-xl border border-white/5 flex items-center gap-2.5 text-left">
                  <Clock className="h-4.5 w-4.5 text-beyblade-electricCyan shrink-0" />
                  <div>
                    <p className="font-bold text-[10px] text-gray-500 uppercase">Horarios de Atención</p>
                    <p className="text-white mt-0.5">{selectedStore.hours}</p>
                  </div>
                </div>
                <div className="bg-beyblade-dark p-3.5 rounded-xl border border-white/5 flex items-center gap-2.5 text-left">
                  <Phone className="h-4.5 w-4.5 text-beyblade-electricCyan shrink-0" />
                  <div>
                    <p className="font-bold text-[10px] text-gray-500 uppercase">Teléfono / Pedidos</p>
                    <p className="text-white mt-0.5">{selectedStore.phone || 'No disponible'}</p>
                  </div>
                </div>
              </div>

              {/* Products Inventory Stock Table */}
              <div className="space-y-4 text-left">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Disponibilidad de Productos Beyblade X</h3>
                
                <div className="bg-beyblade-darker/60 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
                  {products.map(p => {
                    const status = getProductStockStatus(p.id);
                    return (
                      <div key={p.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-white text-sm">{p.name}</h4>
                            <span className="text-[9px] text-gray-500 font-mono font-bold">({p.id})</span>
                          </div>
                          <p className="text-xs text-gray-400">{p.type} • {p.line}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase ${getStockBadgeClass(status)}`}>
                            {status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-beyblade-card border border-white/5 rounded-3xl p-12 text-center text-gray-400 text-sm h-full flex flex-col items-center justify-center space-y-3">
              <AlertCircle className="h-10 w-10 text-gray-600" />
              <p>No se encontraron tiendas certificadas aprobadas con stock en esta localidad.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
