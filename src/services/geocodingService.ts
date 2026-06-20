// Geocoding service for Beyblade LATAM / Uruguay PWA
// Uses OpenStreetMap Nominatim by default, configurable via env variables.

export interface NormalizedLocation {
  latitude: number;
  longitude: number;
  full_address: string;
  country: string;
  country_code: string; // e.g. "UY", "AR"
  department: string; // State / Province / Department
  locality: string; // City / Town / Village / Suburb
  address: string; // Street name + house number
  postcode: string;
  osm_place_id: string;
  osm_type: string;
  osm_class: string;
  osm_importance: number;
  geocoding_provider: string;
}

const PROVIDER = import.meta.env.VITE_GEOCODING_PROVIDER || 'nominatim';
const BASE_URL = import.meta.env.VITE_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';

// Nominatim Policy requires a descriptive User-Agent
const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'BeybladeLATAMPWA/1.0 (contact@beyblade.latam)'
};

export class GeocodingService {
  
  /**
   * Searches for an address or place using Nominatim
   * @param query Search query
   * @param countryCode Optional 2-letter country code (e.g. "uy", "ar") to filter results
   */
  public static async searchAddress(query: string, countryCode?: string): Promise<NormalizedLocation[]> {
    if (!query || query.trim().length < 3) return [];
    
    try {
      const url = new URL(`${BASE_URL}/search`);
      url.searchParams.append('q', query);
      url.searchParams.append('format', 'json');
      url.searchParams.append('addressdetails', '1');
      url.searchParams.append('limit', '5');
      
      if (countryCode) {
        url.searchParams.append('countrycodes', countryCode.toLowerCase());
      }
      
      const response = await fetch(url.toString(), { headers: HEADERS });
      if (!response.ok) {
        throw new Error(`Geocoding error: ${response.statusText}`);
      }
      
      const results = await response.json();
      if (!Array.isArray(results)) return [];
      
      return results.map(res => this.normalizeLocationData(res));
    } catch (error) {
      console.error('Error in searchAddress:', error);
      return [];
    }
  }

  /**
   * Reverse geocodes coordinates to address details
   */
  public static async reverseGeocode(lat: number, lng: number): Promise<NormalizedLocation | null> {
    try {
      const url = new URL(`${BASE_URL}/reverse`);
      url.searchParams.append('lat', lat.toString());
      url.searchParams.append('lon', lng.toString());
      url.searchParams.append('format', 'json');
      url.searchParams.append('addressdetails', '1');
      
      const response = await fetch(url.toString(), { headers: HEADERS });
      if (!response.ok) {
        throw new Error(`Reverse geocoding error: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result || result.error) return null;
      
      return this.normalizeLocationData(result);
    } catch (error) {
      console.error('Error in reverseGeocode:', error);
      return null;
    }
  }

  /**
   * Normalizes Nominatim raw output into our unified format
   */
  public static normalizeLocationData(result: any): NormalizedLocation {
    const address = result.address || {};
    
    const country = this.getCountryFromResult(result);
    const country_code = (address.country_code || '').toUpperCase();
    const department = this.getRegionFromResult(result);
    const locality = this.getLocalityFromResult(result);
    
    // Address formatting: Road + House number, or fallback
    let formattedAddress = '';
    if (address.road) {
      formattedAddress = address.road;
      if (address.house_number) {
        formattedAddress += ` ${address.house_number}`;
      }
    } else {
      // Fallback: use first segments of display_name
      const parts = (result.display_name || '').split(',');
      formattedAddress = parts[0] || 'Dirección no especificada';
    }

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      full_address: result.display_name || '',
      country,
      country_code,
      department,
      locality,
      address: formattedAddress,
      postcode: address.postcode || '',
      osm_place_id: result.place_id?.toString() || '',
      osm_type: result.osm_type || '',
      osm_class: result.class || result.type || '',
      osm_importance: parseFloat(result.importance || '0'),
      geocoding_provider: PROVIDER
    };
  }

  public static getCountryFromResult(result: any): string {
    const address = result.address || {};
    return address.country || '';
  }

  public static getRegionFromResult(result: any): string {
    const address = result.address || {};
    // Extract region/department/state
    return address.state || address.region || address.province || address.county || '';
  }

  public static getLocalityFromResult(result: any): string {
    const address = result.address || {};
    // Extract city/town/village/locality
    return address.city || address.town || address.village || address.municipality || address.suburb || address.hamlet || address.neighbourhood || '';
  }
}
