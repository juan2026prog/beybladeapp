import { supabase } from '../lib/supabaseClient';

// Types representing our data models
export interface Profile {
  id: string;
  role: 'super_admin' | 'country_admin' | 'organizer' | 'judge' | 'store' | 'player' | 'Visitante';
  email: string;
}

export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  country_id: string;
  department: string;
  locality: string;
  email: string;
  phone?: string;
  tutor_name?: string;
  tutor_phone?: string;
  league_id: 'Junior' | 'Open';
  qr_code_token: string;
  created_at: string;
}

export interface Organizer {
  id: string;
  name: string;
  level: 'Organizador Local' | 'Organizador Regional' | 'Organizador Nacional';
  status: 'Pendiente' | 'Aprobado' | 'Suspendido' | 'Rechazado';
  locality_id: number;
  locality_name: string;
  store_affiliation?: string;
  country_id: string;
}

export interface Judge {
  id: string;
  name: string;
  status: 'Pendiente' | 'Aprobado' | 'Suspendido' | 'Rechazado';
  locality_id: number;
  locality_name: string;
  country_id: string;
}

export interface Store {
  id: string;
  name: string;
  logo_url?: string;
  country_id: string;
  department: string;
  locality: string;
  address: string;
  hours: string;
  phone?: string;
  web_url?: string;
  instagram?: string;
  certification_status: 'Pendiente' | 'Aprobado' | 'Suspendido' | 'Rechazado';
  latitude?: number;
  longitude?: number;
  full_address?: string;
  geocoding_provider?: string;
  osm_place_id?: string;
  osm_type?: string;
  osm_class?: string;
  osm_importance?: number;
  geocoded_at?: string;
}

export interface Product {
  id: string;
  name: string;
  line: string;
  image_url?: string;
  description: string;
  type: 'starter' | 'booster' | 'stadium' | 'launcher' | 'accesorio';
  release_date: string;
  status: 'disponible' | 'proximo lanzamiento' | 'agotado';
  sku?: string;
  main_image_url?: string;
  short_description?: string;
  long_description?: string;
  product_category?: 'Ataque' | 'Defensa' | 'Resistencia' | 'Equilibrio' | string;
  product_type?: 'starter' | 'booster' | 'stadium' | 'launcher' | 'set' | string;
  blade_name?: string;
  ratchet_name?: string;
  bit_name?: string;
}

export interface ProductMedia {
  id?: string;
  product_id: string;
  media_type: 'image' | 'back_card' | 'video' | 'youtube' | 'pdf';
  title?: string;
  url: string;
  thumbnail_url?: string;
  sort_order?: number;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HeroBanner {
  id?: string;
  badge: string;
  title_l1: string;
  title_l2: string;
  subtitle: string;
  cta_primary?: string;
  cta_primary_link?: string;
  cta_secondary?: string;
  cta_secondary_link?: string;
  image_url?: string;
  country_id: string;
  active: boolean;
  created_at?: string;
}

export interface StoreStock {
  store_id: string;
  product_id: string;
  stock_status: 'Disponible' | 'Poco stock' | 'Agotado' | 'Proximamente';
}

export interface Tournament {
  id: string;
  name: string;
  league_id: 'Junior' | 'Open' | 'Ambas';
  country_id: string;
  department: string;
  locality: string;
  address: string;
  date: string;
  time: string;
  slots_total: number;
  slots_available: number;
  format: 'Eliminación Directa' | 'Suizo' | 'Round Robin';
  judge_id?: string;
  judge_name?: string;
  organizer_id: string;
  organizer_name: string;
  description?: string;
  banner_url?: string;
  status: 'borrador' | 'publicado' | 'en curso' | 'finalizado';
  latitude?: number;
  longitude?: number;
  full_address?: string;
  geocoding_provider?: string;
  osm_place_id?: string;
  osm_type?: string;
  osm_class?: string;
  osm_importance?: number;
  geocoded_at?: string;
}

export interface Registration {
  id: string;
  tournament_id: string;
  player_id: string;
  checked_in: boolean;
  player_name?: string;
}

export interface TournamentResult {
  id: string;
  tournament_id: string;
  player_id: string;
  player_name?: string;
  position: number;
  points_awarded: number;
  validated_by_distributor: boolean;
}

export interface RankingEntry {
  player_id: string;
  player_name: string;
  league_id: 'Junior' | 'Open';
  country_id: string;
  locality: string;
  total_points: number;
  tournaments_played: number;
}

export interface ModuleConfig {
  id: string;
  name: string;
  active: boolean;
}

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  country_id?: string;
  created_at: string;
}

export interface TutorialItem {
  id: number;
  title: string;
  category: 'Cómo Jugar' | 'Reglas Oficiales' | 'Estrategias' | 'Guías de Lanzamiento';
  content: string;
  video_url?: string;
  min_age: number;
}

export class DbService {
  
  // -------------------------------------------------------------
  // CONFIG MODULES
  // -------------------------------------------------------------
  public static async getModules(): Promise<ModuleConfig[]> {
    const { data, error } = await supabase.from('modules_config').select('id, name, active');
    if (error) throw error;
    return data || [];
  }

  public static async updateModule(id: string, active: boolean): Promise<ModuleConfig[]> {
    const { error } = await supabase.from('modules_config').update({ active }).eq('id', id);
    if (error) throw error;
    return this.getModules();
  }

  // -------------------------------------------------------------
  // PROFILES AND SESSIONS
  // -------------------------------------------------------------
  public static async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('id, role, email, country_id');
    if (error) throw error;
    return data || [];
  }

  public static async updateProfileRole(id: string, role: Profile['role']): Promise<void> {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;

    // Automate subprofile details insertions based on roles
    if (role === 'organizer') {
      const { data: existing } = await supabase.from('organizers').select('id').eq('id', id).maybeSingle();
      if (!existing) {
        await supabase.from('organizers').insert({
          id,
          level: 'Organizador Local',
          status: 'Pendiente'
        });
      }
    } else if (role === 'judge') {
      const { data: existing } = await supabase.from('judges').select('id').eq('id', id).maybeSingle();
      if (!existing) {
        await supabase.from('judges').insert({
          id,
          status: 'Pendiente'
        });
      }
    } else if (role === 'store') {
      const { data: existing } = await supabase.from('stores').select('id').eq('id', id).maybeSingle();
      if (!existing) {
        await supabase.from('stores').insert({
          id,
          name: 'Tienda Beyblade Certificada',
          country_id: 'UY',
          department: 'Montevideo',
          locality: 'Montevideo',
          address: 'Dirección Comercial',
          hours: 'Lunes a Viernes 10-18hs',
          certification_status: 'Pendiente'
        });
      }
    }
  }

  // Helper placeholder for backward-compatibility compilation
  public static getCurrentUser(): Profile {
    return { id: 'usr-visitor', role: 'Visitante', email: '' };
  }

  // -------------------------------------------------------------
  // PLAYERS (STEP 2 OF REGISTRATION)
  // -------------------------------------------------------------
  public static async getPlayersList(): Promise<Player[]> {
    const { data, error } = await supabase.from('players').select('id, first_name, last_name, birth_date, country_id, department, locality, email, phone, tutor_name, tutor_phone, league_id, qr_code_token, created_at');
    if (error) throw error;
    return data || [];
  }

  public static async getPlayerById(id: string): Promise<Player | undefined> {
    const { data, error } = await supabase.from('players').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || undefined;
  }

  public static async registerPlayer(playerData: Omit<Player, 'qr_code_token' | 'created_at'>): Promise<Player> {
    const token = `QR_${playerData.first_name.toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
    
    // 1. Insert in players table
    const { data, error } = await supabase
      .from('players')
      .insert({
        id: playerData.id,
        first_name: playerData.first_name,
        last_name: playerData.last_name,
        birth_date: playerData.birth_date,
        country_id: playerData.country_id,
        department: playerData.department,
        locality: playerData.locality,
        email: playerData.email,
        phone: playerData.phone,
        tutor_name: playerData.tutor_name,
        tutor_phone: playerData.tutor_phone,
        league_id: playerData.league_id,
        qr_code_token: token
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Set profile role to 'player'
    await supabase.from('profiles').update({ role: 'player' }).eq('id', playerData.id);

    return data as Player;
  }

  // -------------------------------------------------------------
  // ORGANIZERS & JUDGES
  // -------------------------------------------------------------
  public static async getOrganizersList(): Promise<Organizer[]> {
    const { data, error } = await supabase.from('organizers').select('id, level, status, locality_id, store_affiliation, country_id, profiles(email), localities(name)');
    if (error) throw error;
    
    return (data || []).map(o => ({
      id: o.id,
      name: (o.profiles as any)?.email?.split('@')[0] || 'Organizador',
      level: o.level,
      status: o.status,
      locality_id: o.locality_id || 1,
      locality_name: (o.localities as any)?.name || 'Montevideo',
      store_affiliation: o.store_affiliation || undefined,
      country_id: o.country_id || 'UY'
    }));
  }

  public static async updateOrganizerStatus(id: string, status: Organizer['status'], level?: Organizer['level']): Promise<void> {
    const payload: any = { status };
    if (level) payload.level = level;
    
    const { error } = await supabase.from('organizers').update(payload).eq('id', id);
    if (error) throw error;

    // Elevate role in profiles if approved
    if (status === 'Aprobado') {
      await supabase.from('profiles').update({ role: 'organizer' }).eq('id', id);
    }
  }

  public static async getJudgesList(): Promise<Judge[]> {
    const { data, error } = await supabase.from('judges').select('id, status, locality_id, country_id, profiles(email), localities(name)');
    if (error) throw error;
    
    return (data || []).map(j => ({
      id: j.id,
      name: (j.profiles as any)?.email?.split('@')[0] || 'Juez',
      status: j.status,
      locality_id: j.locality_id || 1,
      locality_name: (j.localities as any)?.name || 'Montevideo',
      country_id: j.country_id || 'UY'
    }));
  }

  public static async updateJudgeStatus(id: string, status: Judge['status']): Promise<void> {
    const { error } = await supabase.from('judges').update({ status }).eq('id', id);
    if (error) throw error;

    if (status === 'Aprobado') {
      await supabase.from('profiles').update({ role: 'judge' }).eq('id', id);
    }
  }

  // -------------------------------------------------------------
  // STORES CERTIFIED
  // -------------------------------------------------------------
  public static async getStoresList(): Promise<Store[]> {
    const { data, error } = await supabase.from('stores').select('id, name, logo_url, country_id, department, locality, address, hours, phone, web_url, instagram, certification_status, latitude, longitude, full_address, geocoding_provider, osm_place_id, osm_type, osm_class, osm_importance, geocoded_at');
    if (error) throw error;
    return data || [];
  }

  public static async getStoreById(id: string): Promise<Store | undefined> {
    const { data, error } = await supabase.from('stores').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || undefined;
  }

  public static async updateStoreProfile(storeData: Store): Promise<void> {
    // Ensure the territory structure exists (auto-creation of country, dept, locality)
    if (storeData.country_id && storeData.department && storeData.locality) {
      try {
        await this.ensureTerritoryStructure(
          storeData.country_id === 'UY' ? 'Uruguay' : storeData.country_id === 'AR' ? 'Argentina' : storeData.country_id === 'BR' ? 'Brasil' : 'Otro',
          storeData.country_id,
          storeData.department,
          storeData.locality,
          storeData.latitude,
          storeData.longitude,
          storeData.osm_place_id,
          storeData.osm_class
        );
      } catch (err) {
        console.error('Error auto-creating territory structure:', err);
      }
    }

    const { error } = await supabase
      .from('stores')
      .update({
        name: storeData.name,
        logo_url: storeData.logo_url,
        country_id: storeData.country_id,
        department: storeData.department,
        locality: storeData.locality,
        address: storeData.address,
        hours: storeData.hours,
        phone: storeData.phone,
        web_url: storeData.web_url,
        instagram: storeData.instagram,
        latitude: storeData.latitude || null,
        longitude: storeData.longitude || null,
        full_address: storeData.full_address || null,
        geocoding_provider: storeData.geocoding_provider || null,
        osm_place_id: storeData.osm_place_id || null,
        osm_type: storeData.osm_type || null,
        osm_class: storeData.osm_class || null,
        osm_importance: storeData.osm_importance || null,
        geocoded_at: storeData.geocoded_at || null
      })
      .eq('id', storeData.id);
    if (error) throw error;
  }

  public static async updateStoreStatus(id: string, status: Store['certification_status']): Promise<void> {
    const { error } = await supabase.from('stores').update({ certification_status: status }).eq('id', id);
    if (error) throw error;

    if (status === 'Aprobado') {
      await supabase.from('profiles').update({ role: 'store' }).eq('id', id);
    }
  }

  // -------------------------------------------------------------
  // STOCK CONTROL
  // -------------------------------------------------------------
  public static async getStoreStocksList(storeId: string): Promise<StoreStock[]> {
    const { data, error } = await supabase.from('store_stock').select('*').eq('store_id', storeId);
    if (error) throw error;
    return data || [];
  }

  public static async updateStoreStockItem(storeId: string, productId: string, status: StoreStock['stock_status']): Promise<void> {
    const { error } = await supabase.from('store_stock').upsert({
      store_id: storeId,
      product_id: productId,
      stock_status: status
    }, { onConflict: 'store_id,product_id' });
    
    if (error) throw error;
  }

  // -------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------
  public static async getProductsList(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return data || [];
  }

  public static async getProductDetails(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || undefined;
  }

  // --- PRODUCT MULTIMEDIA CRUD ---
  public static async getProductMedia(productId: string): Promise<ProductMedia[]> {
    const { data, error } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  public static async saveProductMedia(media: Omit<ProductMedia, 'created_at' | 'updated_at'>): Promise<void> {
    if (media.id) {
      const { error } = await supabase
        .from('product_media')
        .update(media)
        .eq('id', media.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('product_media')
        .insert(media);
      if (error) throw error;
    }
  }

  public static async deleteProductMedia(mediaId: string): Promise<void> {
    const { error } = await supabase
      .from('product_media')
      .delete()
      .eq('id', mediaId);
    if (error) throw error;
  }

  public static async updateProductDetails(product: Partial<Product> & { id: string }): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update(product)
      .eq('id', product.id);
    if (error) throw error;
  }

  // -------------------------------------------------------------
  // TOURNAMENTS
  // -------------------------------------------------------------
  public static async getTournamentsList(): Promise<Tournament[]> {
    const { data, error } = await supabase.from('tournaments').select('*');
    if (error) throw error;
    return data || [];
  }

  public static async getTournamentById(id: string): Promise<Tournament | undefined> {
    const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || undefined;
  }

  public static async createTournament(tournamentData: Omit<Tournament, 'id' | 'slots_available' | 'created_at'>): Promise<Tournament> {
    // Ensure the territory structure exists (auto-creation of country, dept, locality)
    if (tournamentData.country_id && tournamentData.department && tournamentData.locality) {
      try {
        await this.ensureTerritoryStructure(
          tournamentData.country_id === 'UY' ? 'Uruguay' : tournamentData.country_id === 'AR' ? 'Argentina' : tournamentData.country_id === 'BR' ? 'Brasil' : 'Otro',
          tournamentData.country_id,
          tournamentData.department,
          tournamentData.locality,
          tournamentData.latitude,
          tournamentData.longitude,
          tournamentData.osm_place_id,
          tournamentData.osm_class
        );
      } catch (err) {
        console.error('Error auto-creating territory structure:', err);
      }
    }

    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name: tournamentData.name,
        league_id: tournamentData.league_id,
        country_id: tournamentData.country_id,
        department: tournamentData.department,
        locality: tournamentData.locality,
        address: tournamentData.address,
        date: tournamentData.date,
        time: tournamentData.time,
        slots_total: tournamentData.slots_total,
        slots_available: tournamentData.slots_total,
        format: tournamentData.format,
        judge_id: tournamentData.judge_id || null,
        organizer_id: tournamentData.organizer_id,
        description: tournamentData.description || null,
        banner_url: tournamentData.banner_url || null,
        status: tournamentData.status,
        latitude: tournamentData.latitude || null,
        longitude: tournamentData.longitude || null,
        full_address: tournamentData.full_address || null,
        geocoding_provider: tournamentData.geocoding_provider || null,
        osm_place_id: tournamentData.osm_place_id || null,
        osm_type: tournamentData.osm_type || null,
        osm_class: tournamentData.osm_class || null,
        osm_importance: tournamentData.osm_importance || null,
        geocoded_at: tournamentData.geocoded_at || null
      })
      .select()
      .single();

    if (error) throw error;
    return data as Tournament;
  }

  public static async updateTournamentStatus(id: string, status: Tournament['status']): Promise<void> {
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', id);
    if (error) throw error;
  }

  // CALL ATOMIC CONCURRENCY RPC FOR TOURNAMENT REGISTRATION
  public static async registerForTournament(tournamentId: string, playerId: string, _playerName: string): Promise<void> {
    const { error } = await supabase.rpc('register_player_to_tournament', {
      t_id: tournamentId,
      p_id: playerId
    });
    
    if (error) throw error;
  }

  public static async getTournamentRegistrations(tournamentId: string): Promise<Registration[]> {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('*, players(first_name, last_name)')
      .eq('tournament_id', tournamentId);
      
    if (error) throw error;
    
    return (data || []).map(r => ({
      id: r.id,
      tournament_id: r.tournament_id,
      player_id: r.player_id,
      checked_in: r.checked_in,
      player_name: r.players ? `${(r.players as any).first_name} ${(r.players as any).last_name}` : 'Jugador'
    }));
  }

  public static async updateCheckIn(registrationId: string, checked_in: boolean, method: 'manual' | 'qr' = 'manual'): Promise<void> {
    const { error } = await supabase
      .from('tournament_registrations')
      .update({ 
        checked_in,
        check_in_method: checked_in ? method : null,
        check_in_timestamp: checked_in ? new Date().toISOString() : null
      })
      .eq('id', registrationId);
      
    if (error) throw error;
  }

  // -------------------------------------------------------------
  // TOURNAMENT RESULTS
  // -------------------------------------------------------------
  public static async uploadTournamentResults(tournamentId: string, placements: { player_id: string; player_name: string; position: number }[]): Promise<void> {
    // 1. Delete previous placements for this tournament
    const { error: delErr } = await supabase.from('tournament_results').delete().eq('tournament_id', tournamentId);
    if (delErr) throw delErr;

    // 2. Build rows
    const resultsData = placements.map(p => {
      let points = 1;
      if (p.position === 1) points = 5;
      else if (p.position === 2) points = 4;
      else if (p.position === 3) points = 3;
      else if (p.position === 4) points = 2;

      return {
        tournament_id: tournamentId,
        player_id: p.player_id,
        position: p.position,
        points_awarded: points,
        validated_by_distributor: false
      };
    });

    // 3. Insert new ones
    const { error: insErr } = await supabase.from('tournament_results').insert(resultsData);
    if (insErr) throw insErr;

    // 4. Update tournament status to finished
    await this.updateTournamentStatus(tournamentId, 'finalizado');
  }

  public static async getTournamentResults(tournamentId: string): Promise<TournamentResult[]> {
    const { data, error } = await supabase
      .from('tournament_results')
      .select('*, players(first_name, last_name)')
      .eq('tournament_id', tournamentId);
      
    if (error) throw error;

    return (data || []).map(r => ({
      id: r.id.toString(),
      tournament_id: r.tournament_id,
      player_id: r.player_id,
      position: r.position,
      points_awarded: r.points_awarded,
      validated_by_distributor: r.validated_by_distributor,
      player_name: r.players ? `${(r.players as any).first_name} ${(r.players as any).last_name}` : 'Jugador'
    }));
  }

  public static async getPlayerResults(playerId: string): Promise<TournamentResult[]> {
    const { data, error } = await supabase
      .from('tournament_results')
      .select('*, players(first_name, last_name)')
      .eq('player_id', playerId);
      
    if (error) throw error;

    return (data || []).map(r => ({
      id: r.id.toString(),
      tournament_id: r.tournament_id,
      player_id: r.player_id,
      position: r.position,
      points_awarded: r.points_awarded,
      validated_by_distributor: r.validated_by_distributor,
      player_name: r.players ? `${(r.players as any).first_name} ${(r.players as any).last_name}` : 'Jugador'
    }));
  }

  public static async getPendingValidationResults(): Promise<Tournament[]> {
    const { data, error } = await supabase
      .from('tournament_results')
      .select('tournament_id')
      .eq('validated_by_distributor', false);
      
    if (error) throw error;
    
    const pendingIds = Array.from(new Set((data || []).map(r => r.tournament_id)));
    if (pendingIds.length === 0) return [];
    
    const { data: tournaments, error: tourErr } = await supabase
      .from('tournaments')
      .select('*')
      .in('id', pendingIds);
      
    if (tourErr) throw tourErr;
    return tournaments || [];
  }

  public static async validateTournamentResults(tournamentId: string): Promise<void> {
    // This updates the status, database triggers handle automatic points injections
    const { error } = await supabase
      .from('tournament_results')
      .update({ 
        validated_by_distributor: true,
        validated_at: new Date().toISOString()
      })
      .eq('tournament_id', tournamentId);

    if (error) throw error;
  }

  // -------------------------------------------------------------
  // RANKINGS LEADERBOARD
  // -------------------------------------------------------------
  public static async getRankingsList(): Promise<RankingEntry[]> {
    const { data, error } = await supabase
      .from('rankings')
      .select('*, players(first_name, last_name)')
      .order('total_points', { ascending: false });
      
    if (error) throw error;

    return (data || []).map(r => ({
      player_id: r.player_id,
      player_name: r.players ? `${(r.players as any).first_name} ${(r.players as any).last_name}` : 'Jugador',
      league_id: r.league_id,
      country_id: r.country_id,
      locality: r.locality,
      total_points: r.total_points,
      tournaments_played: r.tournaments_played
    }));
  }

  // -------------------------------------------------------------
  // LOCALITIES ACTIVATION AND TERRITORY
  // -------------------------------------------------------------
  /**
   * Helper to ensure country, department, and locality exist, auto-creating them if necessary
   */
  public static async ensureTerritoryStructure(
    countryName: string,
    countryCode: string,
    departmentName: string,
    localityName: string,
    latitude?: number,
    longitude?: number,
    osmPlaceId?: string,
    boundaryType?: string
  ): Promise<{ countryId: string; departmentId: number; localityId: number }> {
    const cleanCountryCode = (countryCode || 'UY').toUpperCase();
    const cleanCountryName = countryName || (cleanCountryCode === 'UY' ? 'Uruguay' : cleanCountryCode === 'AR' ? 'Argentina' : 'Otro País');
    const cleanDeptName = (departmentName || 'General').trim();
    const cleanLocName = (localityName || 'General').trim();

    // 1. Ensure Country exists
    let { data: country } = await supabase
      .from('countries')
      .select('id')
      .eq('id', cleanCountryCode)
      .maybeSingle();

    if (!country) {
      const { data: newCountry, error: err } = await supabase
        .from('countries')
        .insert({ id: cleanCountryCode, name: cleanCountryName })
        .select('id')
        .single();
      if (err) throw err;
      country = newCountry;
    }

    // 2. Ensure Department exists
    let { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('name', cleanDeptName)
      .maybeSingle();

    if (!department) {
      const { data: newDept, error: err } = await supabase
        .from('departments')
        .insert({ 
          country_id: cleanCountryCode, 
          name: cleanDeptName 
        })
        .select('id')
        .single();
      if (err) throw err;
      department = newDept;
    }

    // 3. Ensure Locality exists
    let { data: locality } = await supabase
      .from('localities')
      .select('id')
      .eq('name', cleanLocName)
      .maybeSingle();

    if (!locality) {
      const { data: newLoc, error: err } = await supabase
        .from('localities')
        .insert({
          department_id: department!.id,
          name: cleanLocName,
          active: false,
          auto_created: true,
          latitude: latitude || null,
          longitude: longitude || null,
          osm_place_id: osmPlaceId || null,
          boundary_type: boundaryType || null,
          country_id: cleanCountryCode
        })
        .select('id')
        .single();
      if (err) throw err;
      locality = newLoc;
    }

    return {
      countryId: cleanCountryCode,
      departmentId: department!.id,
      localityId: locality!.id
    };
  }

  public static async getLocalities(): Promise<{ id: number; department: string; name: string; active: boolean; latitude?: number; longitude?: number }[]> {
    // 1. Fetch organizers approved
    const { data: organizers } = await supabase.from('organizers').select('locality_id').eq('status', 'Aprobado');
    const approvedLocalitiesIds = Array.from(new Set((organizers || []).map(o => o.locality_id).filter(id => id !== null)));

    // 2. Fetch stores certified
    const { data: stores } = await supabase.from('stores').select('locality').eq('certification_status', 'Aprobado');
    const approvedStoresLocalities = Array.from(new Set((stores || []).map(s => s.locality.toLowerCase())));

    // 3. Fetch tournaments published
    const { data: tournaments } = await supabase.from('tournaments').select('locality').in('status', ['publicado', 'en curso', 'finalizado']);
    const activeTournamentsLocalities = Array.from(new Set((tournaments || []).map(t => t.locality.toLowerCase())));

    // 4. Fetch localities list
    const { data: localities } = await supabase.from('localities').select('id, name, latitude, longitude, departments(name)');
    
    return (localities || []).map(l => {
      const hasApprovedOrganizer = approvedLocalitiesIds.includes(l.id);
      const hasCertifiedStore = approvedStoresLocalities.includes(l.name.toLowerCase());
      const hasEvents = activeTournamentsLocalities.includes(l.name.toLowerCase());
      
      const isActive = hasApprovedOrganizer || hasCertifiedStore || hasEvents;
      
      return {
        id: l.id,
        name: l.name,
        department: (l.departments as any)?.name || 'Uruguay',
        active: isActive,
        latitude: l.latitude || undefined,
        longitude: l.longitude || undefined
      };
    });
  }

  // -------------------------------------------------------------
  // NEWS FEED
  // -------------------------------------------------------------
  public static async getNews(): Promise<NewsItem[]> {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }

  public static async addNews(newsItem: Omit<NewsItem, 'id' | 'created_at'>): Promise<NewsItem> {
    const { data, error } = await supabase
      .from('news')
      .insert({
        title: newsItem.title,
        content: newsItem.content,
        image_url: newsItem.image_url || null,
        country_id: newsItem.country_id || null
      })
      .select()
      .single();

    if (error) throw error;
    return data as NewsItem;
  }

  // -------------------------------------------------------------
  // TUTORIALS
  // -------------------------------------------------------------
  public static async getTutorials(): Promise<TutorialItem[]> {
    const { data, error } = await supabase.from('tutorials').select('*');
    if (error) throw error;
    return data || [];
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  public static async getNotifications(): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }

  public static async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
  }

  public static async markAllNotificationsAsRead(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id);
    if (error) throw error;
  }

  public static async createNotification(
    userId: string, 
    title: string, 
    message: string, 
    type: 'torneo' | 'inscripcion' | 'resultados' | 'puntos' | 'tiendas' | 'lanzamiento' | 'new_tournament' | 'new_journey' | 'points_awarded',
    url?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        url: url || null
      });
    if (error) throw error;
  }

  // -------------------------------------------------------------
  // NOTIFICATION PREFERENCES & JOURNEYS
  // -------------------------------------------------------------
  public static async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as NotificationPreferences;

    // If it doesn't exist, try to insert defaults
    const { data: profile } = await supabase
      .from('profiles')
      .select('country_id')
      .eq('id', userId)
      .maybeSingle();

    const { data: newPrefs, error: insertErr } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        country_id: profile?.country_id || 'UY',
        new_tournament_in_app: true,
        new_tournament_push: false,
        new_tournament_whatsapp: false,
        new_journey_in_app: true,
        new_journey_push: false,
        new_journey_whatsapp: false,
        points_awarded_in_app: true,
        points_awarded_push: false,
        points_awarded_whatsapp: false,
        locality_only: true
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      console.warn('Failed to auto-insert preferences, fallback to memory default:', insertErr);
      return {
        user_id: userId,
        new_tournament_in_app: true,
        new_tournament_push: false,
        new_tournament_whatsapp: false,
        new_journey_in_app: true,
        new_journey_push: false,
        new_journey_whatsapp: false,
        points_awarded_in_app: true,
        points_awarded_push: false,
        points_awarded_whatsapp: false,
        locality_only: true,
        whatsapp_opt_in: false,
        whatsapp_verified: false,
        push_enabled: false
      };
    }
    return newPrefs as NotificationPreferences;
  }

  public static async updateNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update({
        ...prefs,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as NotificationPreferences;
  }

  public static async createJourney(journey: Omit<Journey, 'id' | 'created_at'>): Promise<Journey> {
    const { data, error } = await supabase
      .from('journeys')
      .insert(journey)
      .select()
      .single();

    if (error) throw error;
    return data as Journey;
  }

  public static async getJourneys(): Promise<Journey[]> {
    const { data, error } = await supabase
      .from('journeys')
      .select('*')
      .order('starts_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // --- HERO BANNERS MANAGEMENT ---
  public static async getHeroBanners(): Promise<HeroBanner[]> {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  public static async saveHeroBanner(banner: Omit<HeroBanner, 'created_at'>): Promise<void> {
    if (banner.id) {
      const { error } = await supabase
        .from('hero_banners')
        .update(banner)
        .eq('id', banner.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('hero_banners')
        .insert(banner);
      if (error) throw error;
    }
  }

  public static async deleteHeroBanner(id: string): Promise<void> {
    const { error } = await supabase
      .from('hero_banners')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // --- SITE SETTINGS ---
  public static async getSiteSettings(): Promise<{ [key: string]: string }> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*');
    if (error) throw error;
    
    const settings: { [key: string]: string } = {};
    (data || []).forEach(s => {
      settings[s.key] = s.value;
    });
    return settings;
  }

  public static async saveSiteSetting(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value });
    if (error) throw error;
  }
}

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  new_tournament_in_app: boolean;
  new_tournament_push: boolean;
  new_tournament_whatsapp: boolean;
  new_journey_in_app: boolean;
  new_journey_push: boolean;
  new_journey_whatsapp: boolean;
  points_awarded_in_app: boolean;
  points_awarded_push: boolean;
  points_awarded_whatsapp: boolean;
  locality_only: boolean;
  country_id?: string | null;
  locality_id?: number | null;
  whatsapp_phone?: string | null;
  whatsapp_opt_in: boolean;
  whatsapp_verified: boolean;
  push_enabled: boolean;
  push_subscription?: any | null;
  created_at?: string;
  updated_at?: string;
}

export interface Journey {
  id?: string;
  title: string;
  description?: string;
  country_id?: string | null;
  department_id?: number | null;
  locality_id?: number | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  starts_at: string;
  status: string;
  created_by?: string;
  created_at?: string;
}

