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
  season_id?: string;
  max_players?: number;
  waitlist_enabled?: boolean;
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
        geocoded_at: tournamentData.geocoded_at || null,
        season_id: tournamentData.season_id || null,
        max_players: tournamentData.max_players || tournamentData.slots_total || 32,
        waitlist_enabled: tournamentData.waitlist_enabled !== undefined ? tournamentData.waitlist_enabled : true
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

  public static async deleteTournament(id: string): Promise<void> {
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
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

  public static async cancelTournamentRegistration(tournamentId: string, playerId: string): Promise<void> {
    // 1. Fetch registration
    const { data: reg, error: fetchErr } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!reg) return;

    // 2. Delete registration
    const { error: delErr } = await supabase
      .from('tournament_registrations')
      .delete()
      .eq('id', reg.id);
    
    if (delErr) throw delErr;

    // 3. Update slots available
    const { data: tour } = await supabase.from('tournaments').select('slots_available, waitlist_enabled').eq('id', tournamentId).single();
    if (tour) {
      await supabase.from('tournaments').update({ slots_available: tour.slots_available + 1 }).eq('id', tournamentId);
      
      // 4. Promote next from waitlist if enabled
      if (tour.waitlist_enabled) {
        await this.promoteFromWaitlist(tournamentId);
      }
    }
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

  public static async getSeasonRankings(seasonId: string): Promise<RankingEntry[]> {
    // 1. Fetch tournaments belonging to this season
    const { data: tournaments, error: tErr } = await supabase
      .from('tournaments')
      .select('id')
      .eq('season_id', seasonId);
    
    if (tErr) throw tErr;
    if (!tournaments || tournaments.length === 0) return [];
    
    const tournamentIds = tournaments.map(t => t.id);

    // 2. Fetch validated results for these tournaments
    const { data: results, error: resErr } = await supabase
      .from('tournament_results')
      .select('*, players(first_name, last_name, league_id, country_id, locality)')
      .eq('validated_by_distributor', true)
      .in('tournament_id', tournamentIds);

    if (resErr) throw resErr;

    // 3. Aggregate points client-side
    const playerMap: { [id: string]: RankingEntry } = {};
    for (const r of (results || [])) {
      const p = r.players as any;
      if (!p) continue;
      
      const playerId = r.player_id;
      const playerName = `${p.first_name} ${p.last_name}`;
      
      if (!playerMap[playerId]) {
        playerMap[playerId] = {
          player_id: playerId,
          player_name: playerName,
          league_id: p.league_id,
          country_id: p.country_id,
          locality: p.locality,
          total_points: 0,
          tournaments_played: 0
        };
      }
      playerMap[playerId].total_points += r.points_awarded;
      playerMap[playerId].tournaments_played += 1;
    }

    return Object.values(playerMap).sort((a, b) => b.total_points - a.total_points);
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

  // -------------------------------------------------------------
  // SEASONS
  // -------------------------------------------------------------
  public static async getSeasons(): Promise<Season[]> {
    const { data, error } = await supabase.from('seasons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  public static async createSeason(season: Omit<Season, 'id' | 'created_at'>): Promise<Season> {
    const { data, error } = await supabase.from('seasons').insert(season).select().single();
    if (error) throw error;
    return data;
  }

  public static async updateSeasonStatus(id: string, status: Season['status']): Promise<void> {
    const { error } = await supabase.from('seasons').update({ status }).eq('id', id);
    if (error) throw error;
  }

  // -------------------------------------------------------------
  // WAITLIST
  // -------------------------------------------------------------
  public static async getWaitlist(tournamentId: string): Promise<WaitlistEntry[]> {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*, players(first_name, last_name)')
      .eq('tournament_id', tournamentId)
      .order('position', { ascending: true });
    if (error) throw error;
    return (data || []).map(w => ({
      ...w,
      player_name: w.players ? `${w.players.first_name} ${w.players.last_name}` : 'Jugador'
    }));
  }

  public static async joinWaitlist(tournamentId: string, playerId: string): Promise<void> {
    // Get next position
    const { data: currentWaitlist, error: listErr } = await supabase
      .from('waitlist')
      .select('position')
      .eq('tournament_id', tournamentId)
      .order('position', { ascending: false })
      .limit(1);
    
    if (listErr) throw listErr;
    const nextPos = currentWaitlist && currentWaitlist.length > 0 ? currentWaitlist[0].position + 1 : 1;

    const { error } = await supabase.from('waitlist').insert({
      tournament_id: tournamentId,
      player_id: playerId,
      position: nextPos
    });
    if (error) throw error;
  }

  public static async leaveWaitlist(tournamentId: string, playerId: string): Promise<void> {
    // 1. Get leaving entry position
    const { data: entry, error: getErr } = await supabase
      .from('waitlist')
      .select('position')
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)
      .maybeSingle();
    
    if (getErr) throw getErr;
    if (!entry) return;

    const pos = entry.position;

    // 2. Delete entry
    const { error: delErr } = await supabase
      .from('waitlist')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId);
    
    if (delErr) throw delErr;

    // 3. Shift positions for entries after this
    const { error: shiftErr } = await supabase
      .rpc('shift_waitlist_positions', {
        t_id: tournamentId,
        from_pos: pos
      });
    
    // Fallback if RPC is not defined: do it client side
    if (shiftErr) {
      const { data: subsequent } = await supabase
        .from('waitlist')
        .select('*')
        .eq('tournament_id', tournamentId)
        .gt('position', pos)
        .order('position', { ascending: true });
      
      if (subsequent) {
        for (const sub of subsequent) {
          await supabase
            .from('waitlist')
            .update({ position: sub.position - 1 })
            .eq('id', sub.id);
        }
      }
    }
  }

  public static async promoteFromWaitlist(tournamentId: string): Promise<void> {
    // 1. Fetch first waitlist entry
    const { data: firstEntry, error: fetchErr } = await supabase
      .from('waitlist')
      .select('*, players(first_name, last_name, email)')
      .eq('tournament_id', tournamentId)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!firstEntry) return;

    // 2. Insert into registrations
    const { error: insErr } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: tournamentId,
        player_id: firstEntry.player_id,
        checked_in: false
      });
    
    if (insErr) throw insErr;

    // 3. Delete from waitlist and shift others
    await this.leaveWaitlist(tournamentId, firstEntry.player_id);

    // 4. Update slots_available
    const { data: tour } = await supabase.from('tournaments').select('slots_available, name').eq('id', tournamentId).single();
    if (tour && tour.slots_available > 0) {
      await supabase.from('tournaments').update({ slots_available: tour.slots_available - 1 }).eq('id', tournamentId);
    }

    // 5. Send promotion notification
    try {
      const { NotificationService } = await import('./notificationService');
      await NotificationService.notifyUser(firstEntry.player_id, 'waitlist_promoted', {
        title: '¡Promovido al torneo principal!',
        message: `Saliste de la lista de espera y ya estás inscrito en "${tour?.name || 'Torneo Oficial'}".`,
        url: `/tournaments`
      });
    } catch (notifErr) {
      console.error('Error dispatching waitlist promotion notification:', notifErr);
    }
  }

  // -------------------------------------------------------------
  // ATTENDANCE CONFIRMATIONS
  // -------------------------------------------------------------
  public static async getAttendanceConfirmations(tournamentId: string): Promise<AttendanceConfirmation[]> {
    const { data, error } = await supabase
      .from('attendance_confirmations')
      .select('*, players(first_name, last_name)')
      .eq('tournament_id', tournamentId);
    if (error) throw error;
    return (data || []).map(a => ({
      ...a,
      player_name: a.players ? `${a.players.first_name} ${a.players.last_name}` : 'Jugador'
    }));
  }

  public static async setAttendanceConfirmation(tournamentId: string, playerId: string, confirmed: boolean): Promise<void> {
    const { error } = await supabase
      .from('attendance_confirmations')
      .upsert({
        tournament_id: tournamentId,
        player_id: playerId,
        confirmed,
        confirmed_at: new Date().toISOString()
      }, { onConflict: 'tournament_id,player_id' });
    
    if (error) throw error;

    // If declined (confirmed = false), cancel registration and promote next
    if (!confirmed) {
      // 1. Fetch registration to make sure they are registered
      const { data: reg } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)
        .maybeSingle();

      if (reg) {
        // 2. Remove registration
        await supabase
          .from('tournament_registrations')
          .delete()
          .eq('tournament_id', tournamentId)
          .eq('player_id', playerId);

        // 3. Update slots available
        const { data: tour } = await supabase.from('tournaments').select('slots_available, waitlist_enabled').eq('id', tournamentId).single();
        if (tour) {
          await supabase.from('tournaments').update({ slots_available: tour.slots_available + 1 }).eq('id', tournamentId);
          
          // 4. Promote next from waitlist if enabled
          if (tour.waitlist_enabled) {
            await this.promoteFromWaitlist(tournamentId);
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // PLAYER STATISTICS
  // -------------------------------------------------------------
  public static async getPlayerStatistics(playerId: string): Promise<PlayerStatistics | null> {
    const { data, error } = await supabase
      .from('player_statistics')
      .select('*')
      .eq('player_id', playerId)
      .maybeSingle();
    
    if (error) throw error;
    return data || null;
  }

  // -------------------------------------------------------------
  // BRACKETS
  // -------------------------------------------------------------
  public static async getTournamentBrackets(tournamentId: string): Promise<Bracket[]> {
    const { data, error } = await supabase
      .from('brackets')
      .select('*')
      .eq('tournament_id', tournamentId);
    if (error) throw error;
    return data || [];
  }

  public static async getBracketMatches(bracketId: string): Promise<BracketMatch[]> {
    const { data, error } = await supabase
      .from('bracket_matches')
      .select('*, p1:player1_id(first_name, last_name), p2:player2_id(first_name, last_name), w:winner_id(first_name, last_name)')
      .eq('bracket_id', bracketId)
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true });
    
    if (error) throw error;

    return (data || []).map(m => {
      const p1Data = (m as any).p1;
      const p2Data = (m as any).p2;
      const wData = (m as any).w;
      return {
        ...m,
        player1_name: p1Data ? `${p1Data.first_name} ${p1Data.last_name}` : undefined,
        player2_name: p2Data ? `${p2Data.first_name} ${p2Data.last_name}` : undefined,
        winner_name: wData ? `${wData.first_name} ${wData.last_name}` : undefined
      };
    });
  }

  public static async generateTournamentBracket(tournamentId: string, generatedById: string): Promise<Bracket> {
    // 1. Fetch checked-in players
    const { data: checkedInRegs, error: regsErr } = await supabase
      .from('tournament_registrations')
      .select('player_id, players(first_name, last_name)')
      .eq('tournament_id', tournamentId)
      .eq('checked_in', true);

    if (regsErr) throw regsErr;
    if (!checkedInRegs || checkedInRegs.length < 2) {
      throw new Error('Debe haber al menos 2 jugadores acreditados (checked-in) para poder generar el bracket.');
    }

    const playersList = checkedInRegs.map(r => r.player_id);
    const N = playersList.length;

    // 2. Calculate next power of 2
    let P = 2;
    while (P < N) {
      P *= 2;
    }

    // 3. Create bracket record
    const { data: bracket, error: bracketErr } = await supabase
      .from('brackets')
      .insert({
        tournament_id: tournamentId,
        type: 'single_elimination',
        status: 'active'
      })
      .select()
      .single();

    if (bracketErr) throw bracketErr;

    // 4. Generate match nodes bottom-up (tree structure)
    const k = Math.log2(P);
    const matchesMap: { [key: string]: string } = {};

    for (let r = k; r >= 1; r--) {
      const matchCountInRound = Math.pow(2, k - r);
      for (let m = 0; m < matchCountInRound; m++) {
        let nextMatchId: string | null = null;
        let nextMatchSlot: number | null = null;
        if (r < k) {
          const parentMatchNum = Math.floor(m / 2);
          const parentKey = `${r + 1}_${parentMatchNum}`;
          nextMatchId = matchesMap[parentKey] || null;
          nextMatchSlot = m % 2 === 0 ? 1 : 2;
        }

        const { data: insertedMatch, error: matchErr } = await supabase
          .from('bracket_matches')
          .insert({
            bracket_id: bracket.id,
            round_number: r,
            match_number: m,
            player1_id: null,
            player2_id: null,
            winner_id: null,
            player1_score: 0,
            player2_score: 0,
            bye_assigned: false,
            next_match_id: nextMatchId,
            next_match_player_slot: nextMatchSlot,
            status: 'pending'
          })
          .select('id')
          .single();

        if (matchErr) throw matchErr;
        matchesMap[`${r}_${m}`] = insertedMatch.id;
      }
    }

    // 5. Shuffle and BYEs
    const seed = Math.random().toString(36).substring(7);
    const shuffled = [...playersList].sort(() => Math.random() - 0.5);

    const B = P - N;
    const BYEPlayers = shuffled.slice(0, B);
    const playingPlayers = shuffled.slice(B);

    for (const player of BYEPlayers) {
      await supabase.from('bye_draw_logs').insert({
        tournament_id: tournamentId,
        player_id: player,
        generated_by: generatedById,
        seed_used: seed
      });
    }

    const round1Count = P / 2;
    for (let m = 0; m < round1Count; m++) {
      const matchId = matchesMap[`1_${m}`];
      if (m < B) {
        const player = BYEPlayers[m];
        await supabase
          .from('bracket_matches')
          .update({
            player1_id: player,
            player2_id: null,
            winner_id: player,
            bye_assigned: true,
            status: 'completed'
          })
          .eq('id', matchId);

        const nextMatchKey = `2_${Math.floor(m / 2)}`;
        const nextMatchId = matchesMap[nextMatchKey];
        const nextSlot = m % 2 === 0 ? 'player1_id' : 'player2_id';
        await supabase
          .from('bracket_matches')
          .update({ [nextSlot]: player })
          .eq('id', nextMatchId);
      } else {
        const playingIndex = m - B;
        const p1 = playingPlayers[2 * playingIndex];
        const p2 = playingPlayers[2 * playingIndex + 1];
        await supabase
          .from('bracket_matches')
          .update({
            player1_id: p1,
            player2_id: p2,
            bye_assigned: false,
            status: 'pending'
          })
          .eq('id', matchId);
      }
    }

    try {
      const { data: tour } = await supabase.from('tournaments').select('name').eq('id', tournamentId).single();
      const { NotificationService } = await import('./notificationService');
      for (const player of playersList) {
        const isBye = BYEPlayers.includes(player);
        await NotificationService.notifyUser(player, isBye ? 'bye_assigned' : 'bracket_published', {
          title: isBye ? 'Tenes BYE en Round 1' : 'Bracket del torneo publicado',
          message: isBye 
            ? `Recibiste un pase libre (BYE) para la primera ronda en "${tour?.name}". Pasas directo a la ronda 2.` 
            : `El bracket de cruces oficial de "${tour?.name}" ha sido publicado. ¡Revisa tu primer combate!`,
          url: `/tournaments`
        });
      }
    } catch (notifErr) {
      console.error('Error dispatching bracket notifications:', notifErr);
    }

    return bracket;
  }

  public static async submitMatchResult(matchId: string, winnerId: string, p1Score: number, p2Score: number): Promise<void> {
    const { data: match, error: fetchErr } = await supabase
      .from('bracket_matches')
      .select('*, brackets(tournament_id)')
      .eq('id', matchId)
      .single();

    if (fetchErr) throw fetchErr;

    const { error: updErr } = await supabase
      .from('bracket_matches')
      .update({
        winner_id: winnerId,
        player1_score: p1Score,
        player2_score: p2Score,
        status: 'completed'
      })
      .eq('id', matchId);

    if (updErr) throw updErr;

    if (match.next_match_id) {
      const nextSlot = match.next_match_player_slot === 1 ? 'player1_id' : 'player2_id';
      await supabase
        .from('bracket_matches')
        .update({ [nextSlot]: winnerId })
        .eq('id', match.next_match_id);
    } else {
      await supabase
        .from('brackets')
        .update({ status: 'completed' })
        .eq('id', match.bracket_id);
    }
  }
}

export interface Season {
  id?: string;
  name: string;
  country_id: string;
  league_type: 'junior' | 'open';
  start_date: string;
  end_date: string;
  description?: string;
  status: 'draft' | 'active' | 'completed';
  created_at?: string;
}

export interface Bracket {
  id?: string;
  tournament_id: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  status: 'draft' | 'active' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface BracketMatch {
  id?: string;
  bracket_id: string;
  round_number: number;
  match_number: number;
  player1_id?: string | null;
  player2_id?: string | null;
  winner_id?: string | null;
  player1_score: number;
  player2_score: number;
  bye_assigned: boolean;
  next_match_id?: string | null;
  next_match_player_slot?: 1 | 2 | null;
  status: 'pending' | 'completed';
  created_at?: string;
  player1_name?: string;
  player2_name?: string;
  winner_name?: string;
}

export interface ByeDrawLog {
  id?: string;
  tournament_id: string;
  player_id: string;
  player_name?: string;
  generated_at?: string;
  generated_by?: string;
  seed_used: string;
}

export interface WaitlistEntry {
  id?: string;
  tournament_id: string;
  player_id: string;
  player_name?: string;
  position: number;
  created_at?: string;
}

export interface AttendanceConfirmation {
  id?: string;
  tournament_id: string;
  player_id: string;
  confirmed: boolean | null;
  confirmed_at?: string;
  created_at?: string;
  player_name?: string;
}

export interface PlayerStatistics {
  player_id: string;
  tournaments_played: number;
  wins: number;
  losses: number;
  podiums_first: number;
  podiums_second: number;
  podiums_third: number;
  podiums_fourth: number;
  points_total: number;
  win_rate?: number;
  updated_at?: string;
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

