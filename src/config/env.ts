// Environment variables configuration helper
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  GEOCODING_PROVIDER: import.meta.env.VITE_GEOCODING_PROVIDER || 'nominatim',
  NOMINATIM_BASE_URL: import.meta.env.VITE_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BI5xG6wNqg1h_f0p_c5efS9d8f7g6h5j4k3l2m1n0o9p8q7r6s5t4u3v2w1x0y9z8a7b6c5d4e3f2g1h0',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Beyblade LATAM',
  APP_COUNTRY: import.meta.env.VITE_APP_COUNTRY || 'UY',
  DEFAULT_COUNTRY: import.meta.env.VITE_DEFAULT_COUNTRY || 'UY',
  DEFAULT_LAT: Number(import.meta.env.VITE_DEFAULT_LAT || '-34.9011'),
  DEFAULT_LNG: Number(import.meta.env.VITE_DEFAULT_LNG || '-56.1645'),
  ENABLE_PUSH: import.meta.env.VITE_ENABLE_PUSH !== 'false',
  ENABLE_WHATSAPP: import.meta.env.VITE_ENABLE_WHATSAPP !== 'false',
  ENABLE_MAPS: import.meta.env.VITE_ENABLE_MAPS !== 'false',
};

// Console warnings/assertions for missing critical keys in dev/production
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.error(
    'Error de configuración: Las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas. ' +
    'Por favor, configure su archivo .env.local para desarrollo local o defínalas en Vercel para producción.'
  );
}
