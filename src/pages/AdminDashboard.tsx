import React, { useEffect, useState } from 'react';
import { 
  Shield, Check, X, ToggleLeft, ToggleRight, Plus, 
  Trophy, Settings, CheckSquare, Camera,
  TrendingUp, BarChart2, Flag, Package, Map, Users,
  ShoppingBag, MapPin, AlertCircle, Film, Trash2,
  Calendar, Printer, Loader2, List
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { DbService } from '../services/dbService';
import { NotificationService } from '../services/notificationService';
import { QRScanner } from '../components/QRScanner';
import { RealQRScanner } from '../components/RealQRScanner';
import type { 
  ModuleConfig, Player, Tournament, 
  Organizer, Judge, Store as StoreType, StoreStock, Registration, Product, Journey, ProductMedia,
  Season, Bracket, BracketMatch, WaitlistEntry, AttendanceConfirmation
} from '../services/dbService';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import type { NormalizedLocation } from '../services/geocodingService';

export const AdminDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>({ id: 'usr-visitor', role: 'Visitante', email: '' });
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [activeLocalities, setActiveLocalities] = useState<{ id: number; department: string; name: string; active: boolean }[]>([]);

  // Tab states
  const [activeSuperTab, setActiveSuperTab] = useState<'analytics' | 'modules' | 'retail' | 'settings' | 'products'>('analytics');
  const [activeDistributorTab, setActiveDistributorTab] = useState<'certifications' | 'stats' | 'retail' | 'seasons'>('certifications');

  // Hero Banners and Settings states
  const [banners, setBanners] = useState<any[]>([]);
  const [settings, setSettings] = useState<{ [key: string]: string }>({ brand_title: '', brand_subtitle: '', brand_logo: '' });
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [isCreatingBanner, setIsCreatingBanner] = useState(false);

  // Products Management states
  const [selectedAdminProduct, setSelectedAdminProduct] = useState<Product | null>(null);
  const [productMediaList, setProductMediaList] = useState<ProductMedia[]>([]);
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [newMediaItem, setNewMediaItem] = useState<{
    media_type: 'image' | 'back_card' | 'video' | 'youtube' | 'pdf';
    title: string;
    url: string;
    sort_order: number;
    is_primary: boolean;
  }>({
    media_type: 'image',
    title: '',
    url: '',
    sort_order: 0,
    is_primary: false
  });
  const [adminProductSearch, setAdminProductSearch] = useState('');
  
  // Interactive Map states
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  
  // Global stocks state for dashboards
  const [allStocks, setAllStocks] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Simulated Email alerts
  const [emailToasts, setEmailToasts] = useState<{ id: string; to: string; subject: string; message: string }[]>([]);

  const triggerSimulatedEmail = (to: string, subject: string, message: string) => {
    const id = Math.random().toString();
    setEmailToasts(prev => [...prev, { id, to, subject, message }]);
    setTimeout(() => {
      setEmailToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  // Super Admin states
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);

  // Distribuidor states
  const [pendingTournaments, setPendingTournaments] = useState<Tournament[]>([]);

  // Store owner states
  const [myStore, setMyStore] = useState<StoreType | null>(null);
  const [storeStocks, setStoreStocks] = useState<(StoreStock & { productName: string })[]>([]);

  // Organizer states
  const [organizerTab, setOrganizerTab] = useState<'tournaments' | 'journeys' | 'seasons'>('tournaments');
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [newTourName, setNewTourName] = useState('');
  const [newTourLeague, setNewTourLeague] = useState<'Junior' | 'Open' | 'Ambas'>('Open');
  const [newTourLocation, setNewTourLocation] = useState<NormalizedLocation | null>(null);
  const [newTourDate, setNewTourDate] = useState('');
  const [newTourTime, setNewTourTime] = useState('');
  const [newTourSlots, setNewTourSlots] = useState(16);
  const [newTourFormat, setNewTourFormat] = useState<'Eliminación Directa' | 'Suizo' | 'Round Robin'>('Eliminación Directa');
  const [newTourDesc, setNewTourDesc] = useState('');
  const [newTourJudgeId, setNewTourJudgeId] = useState('');

  // Journey states
  const [isCreatingJourney, setIsCreatingJourney] = useState(false);
  const [newJourneyTitle, setNewJourneyTitle] = useState('');
  const [newJourneyDesc, setNewJourneyDesc] = useState('');
  const [newJourneyLocation, setNewJourneyLocation] = useState<NormalizedLocation | null>(null);
  const [newJourneyDate, setNewJourneyDate] = useState('');
  const [newJourneyTime, setNewJourneyTime] = useState('');
  const [journeys, setJourneys] = useState<Journey[]>([]);

  // Selected tournament for organizer results loading
  const [selectedManageTour, setSelectedManageTour] = useState<Tournament | null>(null);
  const [manageRegistrations, setManageRegistrations] = useState<Registration[]>([]);
  const [placements, setPlacements] = useState<{ [playerId: string]: number }>({});

  // Phase 3.0 Competitive states
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [newTourSeasonId, setNewTourSeasonId] = useState('');
  
  // Season form states for distributor
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonLeague, setNewSeasonLeague] = useState<'junior' | 'open'>('open');
  const [newSeasonStartDate, setNewSeasonStartDate] = useState('');
  const [newSeasonEndDate, setNewSeasonEndDate] = useState('');
  const [newSeasonDesc, setNewSeasonDesc] = useState('');

  // Adding date/tournament to season state
  const [addingDateSeasonId, setAddingDateSeasonId] = useState<string | null>(null);
  const [newFechaName, setNewFechaName] = useState('');
  const [newFechaDate, setNewFechaDate] = useState('');
  const [newFechaTime, setNewFechaTime] = useState('');
  const [newFechaLocation, setNewFechaLocation] = useState<NormalizedLocation | null>(null);
  const [newFechaDesc, setNewFechaDesc] = useState('');
  const [newFechaSlots, setNewFechaSlots] = useState(16);
  const [newFechaFormat, setNewFechaFormat] = useState<'Eliminación Directa' | 'Suizo' | 'Round Robin'>('Eliminación Directa');
  const [newFechaJudgeId, setNewFechaJudgeId] = useState('');
  const [newFechaOrganizerId, setNewFechaOrganizerId] = useState('');

  // Tournament details competitive states for organizer
  const [_tournamentBrackets, setTournamentBrackets] = useState<Bracket[]>([]);
  const [activeBracket, setActiveBracket] = useState<Bracket | null>(null);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [attendanceConfirmations, setAttendanceConfirmations] = useState<AttendanceConfirmation[]>([]);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [selectedMatchForScore, setSelectedMatchForScore] = useState<BracketMatch | null>(null);
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [organizerTournamentsTab, setOrganizerTournamentsTab] = useState<'acreditacion' | 'brackets'>('acreditacion');

  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // QR Check-in states & handlers
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [scannerMode, setScannerMode] = useState<'camera' | 'demo'>('camera');
  const [scanResult, setScanResult] = useState<any>(null);

  const handleQRScanSuccess = async (scannedData: any) => {
    // 1. Offline Check
    if (!navigator.onLine) {
      setScanResult({
        success: false,
        error: 'offline',
        message: 'No es posible validar QR sin conexión.'
      });
      return;
    }

    try {
      // 2. Validate QR format and query player on Supabase
      if (!scannedData || !scannedData.player_id) {
        setScanResult({
          success: false,
          error: 'invalid',
          message: '❌ Código QR inválido o corrupto.'
        });
        return;
      }

      // Check if player exists in Supabase
      const { data: player, error: playerErr } = await supabase
        .from('players')
        .select('id, first_name, last_name, league_id, qr_code_token')
        .eq('id', scannedData.player_id)
        .maybeSingle();

      if (playerErr || !player) {
        setScanResult({
          success: false,
          error: 'not_found',
          message: '❌ Jugador no encontrado. El BEY-ID no está registrado en el sistema.'
        });
        return;
      }

      // Check if the token matches (skip check if unknown / manual)
      if (scannedData.bey_id && scannedData.bey_id !== 'UNKNOWN' && player.qr_code_token !== scannedData.bey_id) {
        setScanResult({
          success: false,
          error: 'token_mismatch',
          message: '❌ Firma digital BEY-ID incorrecta o desactualizada.'
        });
        return;
      }

      // 3. Query all registrations for this player to check other tournaments
      const { data: allRegs, error: regErr } = await supabase
        .from('tournament_registrations')
        .select('*, tournaments(name)')
        .eq('player_id', player.id);

      if (regErr) throw regErr;

      // Find registration for CURRENT tournament
      const currentReg = allRegs?.find(r => r.tournament_id === selectedManageTour?.id);

      if (!currentReg) {
        // Is player registered in another tournament?
        const otherReg = allRegs && allRegs.length > 0 ? allRegs[0] : null;
        if (otherReg) {
          const otherTourName = (otherReg.tournaments as any)?.name || 'otro torneo';
          setScanResult({
            success: false,
            error: 'wrong_tournament',
            message: `❌ Jugador pertenece a otro torneo: "${otherTourName}".`
          });
        } else {
          setScanResult({
            success: false,
            error: 'not_registered',
            message: '❌ Jugador no inscripto en ningún torneo.'
          });
        }
        return;
      }

      // 4. Check if already checked in
      if (currentReg.checked_in) {
        setScanResult({
          success: false,
          warning: true,
          error: 'already_checked_in',
          nombre: `${player.first_name} ${player.last_name}`,
          message: '⚠️ Check-In ya registrado para este torneo.',
          regId: currentReg.id
        });
        return;
      }

      // 5. Successful validation
      setScanResult({
        success: true,
        nombre: `${player.first_name} ${player.last_name}`,
        player_id: player.id,
        bey_id: player.qr_code_token,
        league: player.league_id,
        regId: currentReg.id
      });

    } catch (err: any) {
      console.error('Error validating QR:', err);
      setScanResult({
        success: false,
        error: 'server_error',
        message: 'Error al conectar con el servidor para validar check-in.'
      });
    }
  };

  const handleConfirmQRCheckIn = async () => {
    if (!scanResult || !scanResult.regId) return;
    
    try {
      await DbService.updateCheckIn(scanResult.regId, true, 'qr');
      
      await DbService.createNotification(
        scanResult.player_id, 
        'Check-in Realizado', 
        `Tu participación en el torneo ha sido confirmada vía código QR.`, 
        'inscripcion'
      );

      // Trigger simulated email notification
      const player = players.find(p => p.id === scanResult.player_id);
      if (player) {
        triggerSimulatedEmail(
          player.email,
          '¡Check-in Acreditado vía QR! - Beyblade LATAM',
          `Hola ${player.first_name}, tu asistencia al torneo "${selectedManageTour?.name || 'Torneo Oficial'}" ha sido acreditada correctamente mediante código QR. ¡Prepárate para la arena, 3... 2... 1... Let it Rip!`
        );
      }

      setFeedback(`Check-In QR confirmado para ${scanResult.nombre}.`);
      setTimeout(() => setFeedback(''), 3000);
      
      if (selectedManageTour) {
        const regs = await DbService.getTournamentRegistrations(selectedManageTour.id);
        setManageRegistrations(regs);
      }

      setIsScanningQR(false);
      setScanResult(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al validar check-in QR.');
    }
  };

  const loadData = async () => {
    // Current user and configs from Supabase Auth session
    const { data: { session } } = await supabase.auth.getSession();
    let userProfile: any = { id: 'usr-visitor', role: 'Visitante', email: '' };

    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, country_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        let role = profile.role;
        // Intercept role if user is super_admin and view mode is active
        if (profile.role === 'super_admin') {
          const viewMode = sessionStorage.getItem('admin_view_mode');
          if (viewMode && viewMode !== 'super_admin') {
            role = viewMode;
          }
        }

        let mappedRole = 'Visitante';
        switch (role) {
          case 'super_admin': mappedRole = 'Super Admin'; break;
          case 'country_admin': mappedRole = 'Distribuidor País'; break;
          case 'organizer': mappedRole = 'Organizador'; break;
          case 'judge': mappedRole = 'Juez'; break;
          case 'store': mappedRole = 'Tienda'; break;
          case 'player': mappedRole = 'Jugador'; break;
          default: mappedRole = 'Visitante'; break;
        }

        userProfile = {
          id: session.user.id,
          role: mappedRole,
          realRole: profile.role,
          email: session.user.email || '',
          country_id: (profile as any).country_id || 'UY'
        };
      }
    }

    setCurrentUser(userProfile);
    const mods = await DbService.getModules();
    setModules(mods);

    // Load global product list
    const allProducts = await DbService.getProductsList();
    setProducts(allProducts);

    // Load global store stocks
    if (userProfile.role === 'Super Admin' || userProfile.role === 'Distribuidor País') {
      const { data: stocksData } = await supabase.from('store_stock').select('*');
      setAllStocks(stocksData || []);
    }

    if (userProfile.role === 'Super Admin') {
      try {
        const bannerList = await DbService.getHeroBanners();
        setBanners(bannerList);
        const siteSettings = await DbService.getSiteSettings();
        setSettings({
          brand_title: siteSettings.brand_title || '',
          brand_subtitle: siteSettings.brand_subtitle || '',
          brand_logo: siteSettings.brand_logo || ''
        });
      } catch (err) {
        console.error('Error loading banners/settings:', err);
      }
    }

    // Load Super Admin / Distribuidor stats
    const allPlayers = await DbService.getPlayersList();
    setPlayers(allPlayers);
    const allTours = await DbService.getTournamentsList();
    setTournaments(allTours);
    const allOrgs = await DbService.getOrganizersList();
    setOrganizers(allOrgs);
    const allStores = await DbService.getStoresList();
    setStores(allStores);
    const allJudges = await DbService.getJudgesList();
    setJudges(allJudges);

    // Pending Validation Tournaments for Distributor
    const pendingVal = await DbService.getPendingValidationResults();
    setPendingTournaments(pendingVal);

    // Load store specific profile
    if (userProfile.role === 'Tienda') {
      const storeProfile = allStores.find(s => s.id === userProfile.id);
      if (storeProfile) {
        setMyStore(storeProfile);
        const stocks = await DbService.getStoreStocksList(storeProfile.id);
        const enrichedStocks = allProducts.map(p => {
          const s = stocks.find(st => st.product_id === p.id);
          return {
            store_id: storeProfile.id,
            product_id: p.id,
            stock_status: s ? s.stock_status : ('Agotado' as const),
            productName: p.name
          };
        });
        setStoreStocks(enrichedStocks);
      }
    }
    const localList = await DbService.getLocalities();
    setActiveLocalities(localList);

    const journeysList = await DbService.getJourneys();
    setJourneys(journeysList);

    try {
      const seasonsList = await DbService.getSeasons();
      setSeasons(seasonsList);
    } catch (err) {
      console.error('Error fetching seasons:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------------
  // SUPER ADMIN ACTIONS
  // -------------------------------------------------------------
  const handleToggleModule = async (id: string, active: boolean) => {
    const updated = await DbService.updateModule(id, active);
    setModules(updated);
    setFeedback('Módulo configurado exitosamente.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleSelectAdminProduct = async (prod: Product) => {
    setSelectedAdminProduct(prod);
    try {
      const media = await DbService.getProductMedia(prod.id);
      setProductMediaList(media);
      setIsAddingMedia(false);
      setNewMediaItem({
        media_type: 'image',
        title: '',
        url: '',
        sort_order: (media.length > 0 ? Math.max(...media.map(m => m.sort_order || 0)) + 1 : 0),
        is_primary: false
      });
    } catch (err: any) {
      setErrorMsg('Error al cargar multimedia del producto.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  // -------------------------------------------------------------
  // DISTRIBUIDOR ACTIONS
  // -------------------------------------------------------------
  const handleStoreApprove = async (id: string, status: 'Aprobado' | 'Rechazado') => {
    await DbService.updateStoreStatus(id, status);
    loadData();
  };

  const handleOrganizerApprove = async (id: string, status: 'Aprobado' | 'Rechazado') => {
    await DbService.updateOrganizerStatus(id, status);
    loadData();
  };

  const handleJudgeApprove = async (id: string, status: 'Aprobado' | 'Rechazado') => {
    await DbService.updateJudgeStatus(id, status);
    loadData();
  };

  const handleValidateResults = async (tournamentId: string) => {
    try {
      const tour = tournaments.find(t => t.id === tournamentId);
      const tourResults = await DbService.getTournamentResults(tournamentId);

      await DbService.validateTournamentResults(tournamentId);

      // Trigger notification and simulated emails to all players in the tournament
      for (const res of tourResults) {
        const player = players.find(p => p.id === res.player_id);
        if (player) {
          // Send notification
          await NotificationService.notifyUser(res.player_id, 'points_awarded', {
            title: 'Puntos acreditados',
            message: `Se acreditaron ${res.points_awarded} puntos a tu ranking por "${tour?.name || 'Torneo Oficial'}".`,
            url: `/profile/${res.player_id}`,
            points: res.points_awarded,
            tournamentName: tour?.name
          });

          triggerSimulatedEmail(
            player.email,
            '¡Tus puntos del Ranking han sido acreditados! - Beyblade Uruguay',
            `Hola ${player.first_name}, los resultados de "${tour?.name || 'Torneo Oficial'}" han sido validados oficialmente por el distribuidor de tu país. Se han sumado +${res.points_awarded} puntos a tu cuenta de ranking. ¡Sigue luchando!`
          );
        }
      }

      setFeedback('Resultados validados oficialmente. Puntos acreditados al Ranking.');
      loadData();
      setTimeout(() => setFeedback(''), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al validar resultados.');
    }
  };

  // -------------------------------------------------------------
  // ORGANIZER ACTIONS
  // -------------------------------------------------------------
  const dispatchNotifications = async (
    type: 'new_tournament' | 'new_journey',
    title: string,
    message: string,
    url: string,
    countryId: string,
    _localityId: number,
    localityName: string
  ) => {
    try {
      const { data: allPrefs, error } = await supabase
        .from('notification_preferences')
        .select('*');

      if (error) throw error;
      if (!allPrefs) return { total: 0, inApp: 0, push: 0, whatsapp: 0 };

      const { data: allPlayers, error: playersErr } = await supabase
        .from('players')
        .select('id, locality, country_id');

      if (playersErr) throw playersErr;

      let inAppCount = 0;
      let pushCount = 0;
      let whatsappCount = 0;

      for (const pref of allPrefs) {
        const playerObj = allPlayers?.find(p => p.id === pref.user_id);
        if (!playerObj) continue;

        if (playerObj.country_id !== countryId) continue;

        if (pref.locality_only) {
          if (playerObj.locality.toLowerCase() !== localityName.toLowerCase()) {
            continue;
          }
        }

        const report = await NotificationService.notifyUser(pref.user_id, type, {
          title,
          message,
          url
        });

        if (report.inApp === 'sent') inAppCount++;
        if (report.push === 'sent') pushCount++;
        if (report.whatsapp === 'sent') whatsappCount++;
      }

      return {
        total: inAppCount + pushCount + whatsappCount,
        inApp: inAppCount,
        push: pushCount,
        whatsapp: whatsappCount
      };
    } catch (err) {
      console.error('Error dispatching notifications:', err);
      return { total: 0, inApp: 0, push: 0, whatsapp: 0 };
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedback('');

    const orgProfile = organizers.find(o => o.id === currentUser.id);
    if (!orgProfile || orgProfile.status !== 'Aprobado') {
      setErrorMsg('Tu acreditación de organizador debe ser Aprobada por el distribuidor nacional para poder crear torneos.');
      return;
    }

    if (!newTourName || !newTourLocation || !newTourDate || !newTourTime) {
      setErrorMsg('Completa los campos obligatorios del torneo y selecciona una ubicación válida.');
      return;
    }

    const selectedCountryCode = newTourLocation.country_code?.toUpperCase();
    const userCountryCode = (currentUser.country_id || 'UY').toUpperCase();

    if (selectedCountryCode && userCountryCode && selectedCountryCode !== userCountryCode) {
      setErrorMsg(`La ubicación seleccionada (${selectedCountryCode}) no corresponde a tu país de registro (${userCountryCode}).`);
      return;
    }

    try {
      const selectedJudge = judges.find(j => j.id === newTourJudgeId);
      await DbService.createTournament({
        name: newTourName,
        league_id: newTourLeague,
        country_id: selectedCountryCode || userCountryCode,
        department: newTourLocation.department || 'Montevideo',
        locality: newTourLocation.locality || 'Montevideo',
        address: newTourLocation.address || newTourLocation.full_address,
        date: newTourDate,
        time: newTourTime,
        slots_total: newTourSlots,
        format: newTourFormat,
        judge_id: newTourJudgeId || undefined,
        judge_name: selectedJudge ? selectedJudge.name : undefined,
        organizer_id: orgProfile.id,
        organizer_name: orgProfile.name,
        description: newTourDesc,
        status: 'publicado', // Automatically publish
        latitude: newTourLocation.latitude,
        longitude: newTourLocation.longitude,
        full_address: newTourLocation.full_address,
        geocoding_provider: newTourLocation.geocoding_provider,
        osm_place_id: newTourLocation.osm_place_id,
        osm_type: newTourLocation.osm_type,
        osm_class: newTourLocation.osm_class,
        osm_importance: newTourLocation.osm_importance,
        geocoded_at: new Date().toISOString(),
        season_id: newTourSeasonId || undefined
      });

      // Get locality_id for notifications
      const { data: locData } = await supabase
        .from('localities')
        .select('id')
        .eq('name', newTourLocation.locality || 'Montevideo')
        .maybeSingle();
      const locId = locData?.id || 1;

      // Dispatch notifications
      const notifReport = await dispatchNotifications(
        'new_tournament',
        'Nuevo torneo Beyblade',
        `Se publicó "${newTourName}" en ${newTourLocation.locality || 'tu localidad'}. Ya podés inscribirte.`,
        `/tournaments`,
        selectedCountryCode || userCountryCode,
        locId,
        newTourLocation.locality || 'Montevideo'
      );

      setFeedback(`Torneo creado y publicado oficialmente. Notificaciones -> Plataforma: ${notifReport.inApp}, Push: ${notifReport.push}, WhatsApp: ${notifReport.whatsapp}`);
      setIsCreatingTournament(false);
      
      // Reset form
      setNewTourName('');
      setNewTourLocation(null);
      setNewTourDate('');
      setNewTourTime('');
      setNewTourDesc('');
      setNewTourSeasonId('');

      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear torneo.');
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este torneo permanentemente? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      setErrorMsg('');
      setFeedback('');
      await DbService.deleteTournament(tournamentId);
      setFeedback('Torneo eliminado correctamente.');
      setSelectedManageTour(null);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar torneo.');
    }
  };

  const handleAddFechaToSeason = async (season: Season) => {
    setErrorMsg('');
    setFeedback('');

    if (!newFechaName || !newFechaLocation || !newFechaDate || !newFechaTime) {
      setErrorMsg('Completa los campos obligatorios para la fecha y selecciona una ubicación.');
      return;
    }

    const selectedCountryCode = newFechaLocation.country_code?.toUpperCase();
    const userCountryCode = (currentUser.country_id || 'UY').toUpperCase();

    if (selectedCountryCode && userCountryCode && selectedCountryCode !== userCountryCode) {
      setErrorMsg(`La ubicación seleccionada (${selectedCountryCode}) no corresponde a tu país de registro (${userCountryCode}).`);
      return;
    }

    try {
      const selectedJudge = judges.find(j => j.id === newFechaJudgeId);
      
      let mappedLeague: 'Junior' | 'Open' | 'Ambas' = 'Open';
      if (season.league_type === 'junior') {
        mappedLeague = 'Junior';
      } else if (season.league_type === 'open') {
        mappedLeague = 'Open';
      }

      const orgProfile = organizers.find(o => o.id === currentUser.id);
      
      // Determine final organizer ID to use
      let finalOrgId = '';
      let finalOrgName = '';

      if (currentUser.role === 'Organizador') {
        if (!orgProfile || orgProfile.status !== 'Aprobado') {
          throw new Error('Tu acreditación de organizador debe ser Aprobada por el distribuidor nacional para poder agregar fechas.');
        }
        finalOrgId = orgProfile.id;
        finalOrgName = orgProfile.name;
      } else {
        // For admins/distributors, use selected organizer and validate it is present
        const chosenOrg = organizers.find(o => o.id === newFechaOrganizerId);
        if (!chosenOrg) {
          throw new Error('Selecciona un organizador aprobado para esta fecha.');
        }
        finalOrgId = chosenOrg.id;
        finalOrgName = chosenOrg.name;
      }

      await DbService.createTournament({
        name: newFechaName,
        league_id: mappedLeague,
        country_id: selectedCountryCode || userCountryCode,
        department: newFechaLocation.department || 'Montevideo',
        locality: newFechaLocation.locality || 'Montevideo',
        address: newFechaLocation.address || newFechaLocation.full_address,
        date: newFechaDate,
        time: newFechaTime,
        slots_total: newFechaSlots,
        format: newFechaFormat,
        judge_id: newFechaJudgeId || undefined,
        judge_name: selectedJudge ? selectedJudge.name : undefined,
        organizer_id: finalOrgId,
        organizer_name: finalOrgName,
        description: newFechaDesc,
        status: 'publicado',
        latitude: newFechaLocation.latitude,
        longitude: newFechaLocation.longitude,
        full_address: newFechaLocation.full_address,
        geocoding_provider: newFechaLocation.geocoding_provider,
        osm_place_id: newFechaLocation.osm_place_id,
        osm_type: newFechaLocation.osm_type,
        osm_class: newFechaLocation.osm_class,
        osm_importance: newFechaLocation.osm_importance,
        geocoded_at: new Date().toISOString(),
        season_id: season.id
      });

      // Get locality_id for notifications
      const { data: locData } = await supabase
        .from('localities')
        .select('id')
        .eq('name', newFechaLocation.locality || 'Montevideo')
        .maybeSingle();
      const locId = locData?.id || 1;

      // Dispatch notifications
      await dispatchNotifications(
        'new_tournament',
        'Nueva fecha de Liga',
        `Se añadió la fecha "${newFechaName}" a la temporada "${season.name}".`,
        `/tournaments`,
        selectedCountryCode || userCountryCode,
        locId,
        newFechaLocation.locality || 'Montevideo'
      );

      setFeedback(`¡Fecha "${newFechaName}" agregada a la temporada "${season.name}" con éxito!`);
      setAddingDateSeasonId(null);
      
      // Reset form
      setNewFechaName('');
      setNewFechaDate('');
      setNewFechaTime('');
      setNewFechaLocation(null);
      setNewFechaDesc('');
      setNewFechaSlots(16);
      setNewFechaFormat('Eliminación Directa');
      setNewFechaJudgeId('');
      setNewFechaOrganizerId('');

      loadData();
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al agregar fecha.');
    }
  };

  const handleCreateJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedback('');

    const orgProfile = organizers.find(o => o.id === currentUser.id);
    if (!orgProfile || orgProfile.status !== 'Aprobado') {
      setErrorMsg('Tu acreditación de organizador debe ser Aprobada para crear jornadas.');
      return;
    }

    if (!newJourneyTitle || !newJourneyLocation || !newJourneyDate || !newJourneyTime) {
      setErrorMsg('Completa los campos obligatorios y selecciona una ubicación.');
      return;
    }

    const selectedCountryCode = newJourneyLocation.country_code?.toUpperCase();
    const userCountryCode = (currentUser.country_id || 'UY').toUpperCase();

    if (selectedCountryCode && userCountryCode && selectedCountryCode !== userCountryCode) {
      setErrorMsg(`La ubicación seleccionada (${selectedCountryCode}) no corresponde a tu país de registro (${userCountryCode}).`);
      return;
    }

    try {
      // Ensure territory exists
      const territory = await DbService.ensureTerritoryStructure(
        newJourneyLocation.country || 'Uruguay',
        newJourneyLocation.country_code || 'UY',
        newJourneyLocation.department || 'Montevideo',
        newJourneyLocation.locality || 'Montevideo',
        newJourneyLocation.latitude,
        newJourneyLocation.longitude,
        newJourneyLocation.osm_place_id,
        newJourneyLocation.osm_type
      );

      const startsAtIso = new Date(`${newJourneyDate}T${newJourneyTime}`).toISOString();
      await DbService.createJourney({
        title: newJourneyTitle,
        description: newJourneyDesc,
        country_id: selectedCountryCode || userCountryCode,
        department_id: territory.departmentId,
        locality_id: territory.localityId,
        address: newJourneyLocation.address || newJourneyLocation.full_address,
        latitude: newJourneyLocation.latitude || null,
        longitude: newJourneyLocation.longitude || null,
        starts_at: startsAtIso,
        status: 'publicado',
        created_by: currentUser.id
      });

      // Dispatch notifications
      const notifReport = await dispatchNotifications(
        'new_journey',
        'Nueva jornada Beyblade',
        `Se publicó "${newJourneyTitle}" en ${newJourneyLocation.locality || 'tu localidad'}. Te esperamos para jugar y aprender.`,
        `/academy`,
        selectedCountryCode || userCountryCode,
        territory.localityId,
        newJourneyLocation.locality || 'Montevideo'
      );

      setFeedback(`Jornada creada y publicada correctamente. Notificaciones -> Plataforma: ${notifReport.inApp}, Push: ${notifReport.push}, WhatsApp: ${notifReport.whatsapp}`);
      setIsCreatingJourney(false);
      
      // Reset form
      setNewJourneyTitle('');
      setNewJourneyDesc('');
      setNewJourneyLocation(null);
      setNewJourneyDate('');
      setNewJourneyTime('');

      loadData();
    } catch (err: any) {
      console.error('Error creating journey:', err);
      setErrorMsg(err.message || 'Error al crear jornada.');
    }
  };

  const refreshManageTournamentCompetitiveData = async (tourId: string) => {
    try {
      const waitlist = await DbService.getWaitlist(tourId);
      setWaitlistEntries(waitlist);

      const confirmations = await DbService.getAttendanceConfirmations(tourId);
      setAttendanceConfirmations(confirmations);

      const brackets = await DbService.getTournamentBrackets(tourId);
      setTournamentBrackets(brackets);
      
      if (brackets.length > 0) {
        const active = brackets.find(b => b.status === 'active') || brackets.find(b => b.status === 'completed') || brackets[0];
        setActiveBracket(active);
        const matches = await DbService.getBracketMatches(active.id!);
        setBracketMatches(matches);
      } else {
        setActiveBracket(null);
        setBracketMatches([]);
      }

      const regs = await DbService.getTournamentRegistrations(tourId);
      setManageRegistrations(regs);
    } catch (err) {
      console.error('Error refreshing competitive data:', err);
    }
  };

  const handleSelectManageTournament = async (tour: Tournament) => {
    setSelectedManageTour(tour);
    const regs = await DbService.getTournamentRegistrations(tour.id);
    setManageRegistrations(regs);
    
    // Preset placements with default positions
    const placeObj: { [playerId: string]: number } = {};
    regs.forEach((r, idx) => {
      placeObj[r.player_id] = idx + 1;
    });
    setPlacements(placeObj);

    setBracketLoading(true);
    await refreshManageTournamentCompetitiveData(tour.id);
    setBracketLoading(false);
  };

  const handleCheckInToggle = async (regId: string, checked: boolean) => {
    await DbService.updateCheckIn(regId, checked);
    if (selectedManageTour) {
      const regs = await DbService.getTournamentRegistrations(selectedManageTour.id);
      setManageRegistrations(regs);
      await refreshManageTournamentCompetitiveData(selectedManageTour.id);
    }
  };

  const handleGenerateBracket = async () => {
    if (!selectedManageTour) return;
    setBracketLoading(true);
    setErrorMsg('');
    setFeedback('');
    try {
      await DbService.generateTournamentBracket(selectedManageTour.id, currentUser.id);
      setFeedback('¡Bracket y sorteo de BYEs generados con éxito! Los competidores han sido notificados.');
      await refreshManageTournamentCompetitiveData(selectedManageTour.id);
      setTimeout(() => setFeedback(''), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar el bracket.');
    } finally {
      setBracketLoading(false);
    }
  };

  const handleSubmitBracketScore = async (matchId: string, winnerId: string, p1Score: number, p2Score: number) => {
    if (!selectedManageTour) return;
    setBracketLoading(true);
    setErrorMsg('');
    setFeedback('');
    try {
      await DbService.submitMatchResult(matchId, winnerId, p1Score, p2Score);
      setFeedback('Resultado del combate registrado correctamente. Brackets actualizados.');
      await refreshManageTournamentCompetitiveData(selectedManageTour.id);
      setSelectedMatchForScore(null);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar el resultado.');
    } finally {
      setBracketLoading(false);
    }
  };

  const handleUpdateAttendanceConfirmation = async (playerId: string, confirmed: boolean) => {
    if (!selectedManageTour) return;
    try {
      await DbService.setAttendanceConfirmation(selectedManageTour.id, playerId, confirmed);
      setFeedback(confirmed ? 'Asistencia confirmada.' : 'Asistencia rechazada y plaza liberada.');
      await refreshManageTournamentCompetitiveData(selectedManageTour.id);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar confirmación.');
    }
  };

  const handleSavePlacements = async () => {
    if (!selectedManageTour) return;
    
    const placementsList = Object.keys(placements).map(playerId => {
      const reg = manageRegistrations.find(r => r.player_id === playerId);
      return {
        player_id: playerId,
        player_name: reg ? reg.player_name || 'Jugador' : 'Jugador',
        position: Number(placements[playerId])
      };
    });

    await DbService.uploadTournamentResults(selectedManageTour.id, placementsList);
    setFeedback('Posiciones guardadas. Resultados enviados a validación de Distribuidor.');
    setSelectedManageTour(null);
    loadData();
    setTimeout(() => setFeedback(''), 3000);
  };

  // -------------------------------------------------------------
  // STORE ACTIONS
  // -------------------------------------------------------------
  const handleUpdateStock = async (prodId: string, status: StoreStock['stock_status']) => {
    if (!myStore) return;
    await DbService.updateStoreStockItem(myStore.id, prodId, status);
    loadData();
  };

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myStore) return;
    await DbService.updateStoreProfile(myStore);
    setFeedback('Perfil de tienda actualizado con éxito.');
    setTimeout(() => setFeedback(''), 3000);
  };


  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Dashboard Top bar info */}
      <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
            <Shield className="h-6 w-6 text-beyblade-electricRed" /> Panel de Control
          </h1>
          <p className="text-xs text-gray-400">
            Vista del rol: <span className="text-beyblade-electricCyan font-bold">{currentUser.role}</span>
          </p>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl flex items-center gap-2">
          <Check className="h-4.5 w-4.5 shrink-0" />
          {feedback}
        </div>
      )}

      {errorMsg && (
        <div className="bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 text-beyblade-electricRed text-xs p-3.5 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUPER ADMIN HASBRO PANEL */}
      {/* ========================================================================= */}
      {currentUser.role === 'Super Admin' && (
        <div className="space-y-8">
          {/* Impersonation Mode Control */}
          <div className="bg-gradient-to-br from-beyblade-card to-beyblade-darker border border-beyblade-electricCyan/30 rounded-3xl p-6 relative overflow-hidden clip-cyber-card shadow-lg">
            <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-beyblade-electricCyan/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-beyblade-electricCyan text-glow-cyan" />
                <h3 className="font-title text-base text-white uppercase tracking-wider">Fase Super Admin — Modo "Ver como" / Impersonación</h3>
              </div>
              
              <p className="text-xs text-gray-300 max-w-2xl leading-relaxed font-semibold">
                Prueba la interfaz de la plataforma bajo los diferentes perfiles. Este modo solo cambia la navegación y renderizado visual; tus permisos reales en Supabase no se alteran.
              </p>
              
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={() => {
                    sessionStorage.setItem('admin_view_mode', 'player');
                    window.location.href = `#/profile/${currentUser.id}`;
                    window.location.reload();
                  }}
                  className="px-4 py-2.5 bg-beyblade-darker hover:bg-beyblade-electricCyan hover:text-beyblade-darker border border-white/10 hover:border-beyblade-electricCyan rounded-xl text-xs font-black font-esports uppercase tracking-widest transition-all duration-300"
                >
                  Probar como Jugador
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('admin_view_mode', 'organizer');
                    window.location.reload();
                  }}
                  className="px-4 py-2.5 bg-beyblade-darker hover:bg-beyblade-electricCyan hover:text-beyblade-darker border border-white/10 hover:border-beyblade-electricCyan rounded-xl text-xs font-black font-esports uppercase tracking-widest transition-all duration-300"
                >
                  Probar como Organizador
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('admin_view_mode', 'store');
                    window.location.reload();
                  }}
                  className="px-4 py-2.5 bg-beyblade-darker hover:bg-beyblade-electricCyan hover:text-beyblade-darker border border-white/10 hover:border-beyblade-electricCyan rounded-xl text-xs font-black font-esports uppercase tracking-widest transition-all duration-300"
                >
                  Probar como Tienda
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('admin_view_mode', 'judge');
                    window.location.reload();
                  }}
                  className="px-4 py-2.5 bg-beyblade-darker hover:bg-beyblade-electricCyan hover:text-beyblade-darker border border-white/10 hover:border-beyblade-electricCyan rounded-xl text-xs font-black font-esports uppercase tracking-widest transition-all duration-300"
                >
                  Probar como Juez
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('admin_view_mode', 'country_admin');
                    window.location.reload();
                  }}
                  className="px-4 py-2.5 bg-beyblade-darker hover:bg-beyblade-electricCyan hover:text-beyblade-darker border border-white/10 hover:border-beyblade-electricCyan rounded-xl text-xs font-black font-esports uppercase tracking-widest transition-all duration-300"
                >
                  Probar como Distribuidor
                </button>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('admin_view_mode');
                    window.location.reload();
                  }}
                  className="px-4 py-2.5 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-white hover:text-white border border-beyblade-electricRed/30 rounded-xl text-xs font-black font-esports uppercase tracking-widest transition-all duration-300"
                >
                  Volver a Super Admin
                </button>
              </div>
              
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider font-esports">
                Este modo solo cambia la vista de navegación. No modifica permisos reales ni roles en Supabase.
              </div>
            </div>
          </div>

          {/* Sub-tab selection bar */}
          <div className="flex border-b border-white/5 pb-2">
            <button
              onClick={() => setActiveSuperTab('analytics')}
              className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                activeSuperTab === 'analytics'
                  ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" /> Analytics & KPIs
              </span>
            </button>
            <button
              onClick={() => setActiveSuperTab('modules')}
              className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                activeSuperTab === 'modules'
                  ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Control de Módulos
              </span>
            </button>
            <button
              onClick={() => setActiveSuperTab('retail')}
              className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                activeSuperTab === 'retail'
                  ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Retail & Stock
              </span>
            </button>
            <button
              onClick={() => setActiveSuperTab('settings')}
              className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                activeSuperTab === 'settings'
                  ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Personalización & Banners
              </span>
            </button>
            <button
              onClick={() => setActiveSuperTab('products')}
              className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                activeSuperTab === 'products'
                  ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Productos
              </span>
            </button>
          </div>

          {/* Tab 1: Analytics & KPIs */}
          {activeSuperTab === 'analytics' && (
            <div className="space-y-8">
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="bg-beyblade-card border border-white/5 p-5 rounded-2xl relative overflow-hidden clip-cyber-card hover:border-beyblade-electricCyan/20 transition-colors group shadow-lg"
                >
                  <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none"></div>
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Users className="h-12 w-12 text-beyblade-electricCyan" />
                  </div>
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest font-esports block">Jugadores Registrados</span>
                  <p className="text-3xl font-black text-white mt-2 font-title">{players.length}</p>
                  <span className="text-[9px] text-emerald-400 font-extrabold font-esports mt-1.5 block flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 animate-bounce" /> +15% este mes
                  </span>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-beyblade-electricCyan to-transparent opacity-30"></div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-beyblade-card border border-white/5 p-5 rounded-2xl relative overflow-hidden clip-cyber-card hover:border-beyblade-electricRed/20 transition-colors group shadow-lg"
                >
                  <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none"></div>
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Trophy className="h-12 w-12 text-beyblade-electricRed" />
                  </div>
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest font-esports block">Torneos Ejecutados</span>
                  <p className="text-3xl font-black text-white mt-2 font-title">{tournaments.length}</p>
                  <span className="text-[9px] text-gray-400 font-extrabold font-esports mt-1.5 block uppercase tracking-wide">
                    {tournaments.filter(t => t.status === 'finalizado').length} finalizados
                  </span>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-beyblade-electricRed to-transparent opacity-30"></div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="bg-beyblade-card border border-white/5 p-5 rounded-2xl relative overflow-hidden clip-cyber-card hover:border-beyblade-gold/20 transition-colors group shadow-lg"
                >
                  <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none"></div>
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <ShoppingBag className="h-12 w-12 text-beyblade-gold" />
                  </div>
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest font-esports block">Tiendas Certificadas</span>
                  <p className="text-3xl font-black text-white mt-2 font-title">{stores.length}</p>
                  <span className="text-[9px] text-beyblade-electricCyan font-extrabold font-esports mt-1.5 block uppercase tracking-wide">
                    {stores.filter(s => s.certification_status === 'Aprobado').length} activas
                  </span>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-beyblade-gold to-transparent opacity-30"></div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="bg-beyblade-card border border-white/5 p-5 rounded-2xl relative overflow-hidden clip-cyber-card hover:border-purple-500/20 transition-colors group shadow-lg"
                >
                  <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none"></div>
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <MapPin className="h-12 w-12 text-purple-500" />
                  </div>
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest font-esports block">Localidades Activas</span>
                  <p className="text-3xl font-black text-white mt-2 font-title">
                    {activeLocalities.filter(l => l.active).length}
                  </p>
                  <span className="text-[9px] text-gray-400 font-extrabold font-esports mt-1.5 block uppercase tracking-wide">
                    En {new Set(activeLocalities.map(l => l.department)).size} depts
                  </span>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-transparent opacity-30"></div>
                </motion.div>
              </div>

              {/* Growth Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Players Growth */}
                <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 space-y-4 clip-cyber-card relative">
                  <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none"></div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider font-title">Crecimiento de Competidores</h3>
                    <p className="text-[10px] text-gray-500 font-esports uppercase tracking-widest">Últimos 6 meses acumulados</p>
                  </div>
                  <div className="pt-2 relative">
                    <svg viewBox="0 0 500 200" className="w-full h-48 overflow-visible">
                      <defs>
                        <linearGradient id="cyan-glow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="glow-c" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      {/* Gridlines */}
                      <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255, 255, 255, 0.03)" />
                      <line x1="40" y1="65" x2="480" y2="65" stroke="rgba(255, 255, 255, 0.03)" />
                      <line x1="40" y1="110" x2="480" y2="110" stroke="rgba(255, 255, 255, 0.03)" />
                      <line x1="40" y1="155" x2="480" y2="155" stroke="rgba(255, 255, 255, 0.08)" />
                      
                      {/* Y-axis Labels */}
                      <text x="18" y="24" fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">350</text>
                      <text x="18" y="69" fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">200</text>
                      <text x="18" y="114" fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">100</text>
                      <text x="18" y="159" fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">0</text>

                      {/* Area Fill */}
                      <path d="M 50 155 L 50 137 C 50 137, 120 123, 130 123 L 210 107 L 290 79 L 370 59 L 450 31 L 450 155 Z" fill="url(#cyan-glow)" />

                      {/* Line Path with Glow Filter */}
                      <path d="M 50 137 L 130 123 L 210 107 L 290 79 L 370 59 L 450 31" fill="none" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-c)" />

                      {/* Dots */}
                      <circle cx="50" cy="137" r="4.5" fill="#00F0FF" stroke="#080E18" strokeWidth="1.5" />
                      <circle cx="130" cy="123" r="4.5" fill="#00F0FF" stroke="#080E18" strokeWidth="1.5" />
                      <circle cx="210" cy="107" r="4.5" fill="#00F0FF" stroke="#080E18" strokeWidth="1.5" />
                      <circle cx="290" cy="79" r="4.5" fill="#00F0FF" stroke="#080E18" strokeWidth="1.5" />
                      <circle cx="370" cy="59" r="4.5" fill="#00F0FF" stroke="#080E18" strokeWidth="1.5" />
                      <circle cx="450" cy="31" r="5" fill="#00F0FF" stroke="#080E18" strokeWidth="2" />

                      {/* Values */}
                      <text x="50" y="122" fill="#fff" fontSize="8" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">45</text>
                      <text x="130" y="108" fill="#fff" fontSize="8" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">80</text>
                      <text x="210" y="92" fill="#fff" fontSize="8" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">120</text>
                      <text x="290" y="64" fill="#fff" fontSize="8" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">190</text>
                      <text x="370" y="44" fill="#fff" fontSize="8" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">240</text>
                      <text x="450" y="16" fill="#00F0FF" fontSize="9" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">310</text>

                      {/* X-axis Labels */}
                      <text x="50" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">ENE</text>
                      <text x="130" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">FEB</text>
                      <text x="210" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">MAR</text>
                      <text x="290" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">ABR</text>
                      <text x="370" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">MAY</text>
                      <text x="450" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">JUN</text>
                    </svg>
                  </div>
                </div>

                {/* Chart 2: Tournaments Growth */}
                <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 space-y-4 clip-cyber-card relative">
                  <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none"></div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider font-title">Actividad de Torneos</h3>
                    <p className="text-[10px] text-gray-500 font-esports uppercase tracking-widest">Torneos oficiales por mes</p>
                  </div>
                  <div className="pt-2 relative">
                    <svg viewBox="0 0 500 200" className="w-full h-48 overflow-visible">
                      <defs>
                        <linearGradient id="red-glow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF0055" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#FF0055" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="glow-r" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      {/* Gridlines */}
                      <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255, 255, 255, 0.03)" />
                      <line x1="40" y1="65" x2="480" y2="65" stroke="rgba(255, 255, 255, 0.03)" />
                      <line x1="40" y1="110" x2="480" y2="110" stroke="rgba(255, 255, 255, 0.03)" />
                      <line x1="40" y1="155" x2="480" y2="155" stroke="rgba(255, 255, 255, 0.08)" />
                      
                      {/* Y-axis Labels */}
                      <text x="18" y="24" fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">40</text>
                      <text x="18" y="69" fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">25</text>
                      <text x="18" y="114" fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">10</text>
                      <text x="18" y="159" fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">0</text>

                      {/* Area Fill */}
                      <path d="M 50 155 L 50 143 C 50 143, 120 131, 130 131 L 210 119 L 290 101 L 370 79 L 450 58 L 450 155 Z" fill="url(#red-glow)" />

                      {/* Line Path with Glow Filter */}
                      <path d="M 50 143 L 130 131 L 210 119 L 290 101 L 370 79 L 450 58" fill="none" stroke="#FF0055" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-r)" />

                      {/* Dots */}
                      <circle cx="50" cy="143" r="4.5" fill="#FF0055" stroke="#080E18" strokeWidth="1.5" />
                      <circle cx="130" cy="131" r="4.5" fill="#FF0055" stroke="#080E18" strokeWidth="1.5" />
                      <circle cx="210" cy="119" r="4.5" fill="#FF0055" stroke="#080E18" strokeWidth="1.5" />
                      <circle cx="290" cy="101" r="4.5" fill="#FF0055" stroke="#080E18" strokeWidth="1.5" />
                      <circle cx="370" cy="79" r="4.5" fill="#FF0055" stroke="#080E18" strokeWidth="1.5" />
                      <circle cx="450" cy="58" r="5" fill="#FF0055" stroke="#080E18" strokeWidth="2" />

                      {/* Values */}
                      <text x="50" y="128" fill="#fff" fontSize="8" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">4</text>
                      <text x="130" y="116" fill="#fff" fontSize="8" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">8</text>
                      <text x="210" y="104" fill="#fff" fontSize="8" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">12</text>
                      <text x="290" y="86" fill="#fff" fontSize="8" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">18</text>
                      <text x="370" y="64" fill="#fff" fontSize="8" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">25</text>
                      <text x="450" y="43" fill="#FF0055" fontSize="9" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">32</text>

                      {/* X-axis Labels */}
                      <text x="50" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">ENE</text>
                      <text x="130" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">FEB</text>
                      <text x="210" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">MAR</text>
                      <text x="290" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">ABR</text>
                      <text x="370" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">MAY</text>
                      <text x="450" y="177" fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">JUN</text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Lists side-by-side (Top Localities, Top Countries, Demographics) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Top Localities */}
                <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 space-y-4 clip-cyber-card relative">
                  <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none"></div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider font-title flex items-center gap-1.5">
                    <MapPin className="h-4.5 w-4.5 text-beyblade-electricCyan text-glow-cyan" /> Top Localidades (UY)
                  </h3>
                  <div className="space-y-4 pt-2">
                    {[
                      { name: 'Montevideo', count: 180, percentage: 70 },
                      { name: 'Maldonado', count: 65, percentage: 25 },
                      { name: 'Las Piedras', count: 40, percentage: 15 },
                      { name: 'Salto', count: 25, percentage: 10 }
                    ].map((loc, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-white uppercase tracking-wide">{loc.name}</span>
                          <span className="text-beyblade-electricCyan font-esports">{loc.count} Jugadores</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2 border border-white/5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${loc.percentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className="bg-beyblade-electricCyan h-full rounded-full shadow-[0_0_8px_rgba(0,240,255,0.4)]" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Countries */}
                <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 space-y-4 clip-cyber-card relative">
                  <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none"></div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider font-title flex items-center gap-1.5">
                    <Flag className="h-4.5 w-4.5 text-beyblade-electricRed text-glow-red" /> Actividad por País
                  </h3>
                  <div className="space-y-4 pt-2">
                    {[
                      { name: 'Uruguay', code: 'UY', count: 310, percentage: 65 },
                      { name: 'Argentina', code: 'AR', count: 140, percentage: 30 },
                      { name: 'Brasil', code: 'BR', count: 90, percentage: 20 }
                    ].map((country, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-white uppercase tracking-wide">{country.name} ({country.code})</span>
                          <span className="text-beyblade-electricRed font-esports">{country.count} Competidores</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2 border border-white/5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${country.percentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className="bg-beyblade-electricRed h-full rounded-full shadow-[0_0_8px_rgba(255,0,85,0.4)]" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Demographics / League Splits */}
                <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 space-y-4 clip-cyber-card relative">
                  <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none"></div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider font-title flex items-center gap-1.5">
                    <Users className="h-4.5 w-4.5 text-beyblade-gold text-glow-gold" /> Demografía de Liga
                  </h3>
                  <div className="space-y-4 pt-2">
                    <div className="bg-beyblade-darker/60 border border-white/5 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden group">
                      <div className="z-10">
                        <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded font-esports">Liga Junior (6-14)</span>
                        <p className="text-2xl font-black text-white mt-1.5 font-title">
                          {players.filter(p => p.league_id === 'Junior').length || 48}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full border-4 border-amber-400/20 border-t-amber-400 flex items-center justify-center text-xs font-black text-amber-400 font-esports shadow-[0_0_10px_rgba(251,191,36,0.15)] z-10">
                        {Math.round(((players.filter(p => p.league_id === 'Junior').length || 48) / (players.length || 100)) * 100)}%
                      </div>
                    </div>
                    
                    <div className="bg-beyblade-darker/60 border border-white/5 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden group">
                      <div className="z-10">
                        <span className="text-[9px] text-beyblade-electricCyan font-black uppercase tracking-wider bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 px-2.5 py-0.5 rounded font-esports">Liga Open (14+)</span>
                        <p className="text-2xl font-black text-white mt-1.5 font-title">
                          {players.filter(p => p.league_id === 'Open').length || 52}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full border-4 border-beyblade-electricCyan/20 border-t-beyblade-electricCyan flex items-center justify-center text-xs font-black text-beyblade-electricCyan font-esports shadow-[0_0_10px_rgba(0,240,255,0.15)] z-10">
                        {Math.round(((players.filter(p => p.league_id === 'Open').length || 52) / (players.length || 100)) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Control de Módulos */}
          {activeSuperTab === 'modules' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Settings className="h-5.5 w-5.5 text-beyblade-electricCyan" />
                <h2 className="text-lg font-black text-white uppercase tracking-wide">Módulos Activables</h2>
              </div>
              
              <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {modules.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3.5 bg-beyblade-darker/60 rounded-2xl border border-white/5">
                    <div>
                      <h4 className="font-extrabold text-xs text-white">{m.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">{m.id}</p>
                    </div>
                    <button
                      onClick={() => handleToggleModule(m.id, !m.active)}
                      className="focus:outline-none transition-colors"
                    >
                      {m.active ? (
                        <ToggleRight className="h-9 w-9 text-beyblade-electricCyan cursor-pointer" />
                      ) : (
                        <ToggleLeft className="h-9 w-9 text-gray-600 cursor-pointer" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Retail & Stock */}
          {activeSuperTab === 'retail' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Package className="h-5.5 w-5.5 text-beyblade-gold" /> Inventario y Stock Minorista
                </h2>
                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-xs font-bold text-gray-400">
                  Global Hasbro Report
                </span>
              </div>

              {/* Stock KPI breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-beyblade-card border border-emerald-500/10 p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Productos Disponibles</span>
                    <p className="text-2xl font-black text-emerald-400 mt-1">
                      {allStocks.filter(s => s.stock_status === 'Disponible').length}
                    </p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="bg-beyblade-card border border-amber-500/10 p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Pocas Unidades (Low Stock)</span>
                    <p className="text-2xl font-black text-amber-500 mt-1">
                      {allStocks.filter(s => s.stock_status === 'Poco stock').length}
                    </p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                </div>
                <div className="bg-beyblade-card border border-beyblade-electricRed/10 p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Agotado (Out of Stock)</span>
                    <p className="text-2xl font-black text-beyblade-electricRed mt-1">
                      {allStocks.filter(s => s.stock_status === 'Agotado').length}
                    </p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-beyblade-electricRed animate-pulse"></span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Out of Stock alerts column */}
                <div className="lg:col-span-1 space-y-4">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Alertas de Inventario</h3>
                  <div className="space-y-2.5 max-h-96 overflow-y-auto no-scrollbar">
                    {allStocks.filter(s => s.stock_status === 'Agotado' || s.stock_status === 'Poco stock').map((stock, idx) => {
                      const store = stores.find(st => st.id === stock.store_id);
                      const prod = products.find(p => p.id === stock.product_id);
                      const isAgotado = stock.stock_status === 'Agotado';
                      return (
                        <div key={idx} className={`p-3.5 border rounded-xl flex gap-3 text-xs ${
                          isAgotado 
                            ? 'bg-beyblade-electricRed/5 border-beyblade-electricRed/25' 
                            : 'bg-amber-400/5 border-amber-400/25'
                        }`}>
                          <div className={`p-2 rounded-lg h-fit bg-black/40 ${isAgotado ? 'text-beyblade-electricRed' : 'text-amber-500'}`}>
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{prod?.name || 'Producto Oficial'}</p>
                            <p className="text-gray-400 text-[11px] mt-0.5">{store?.name || 'Tienda'}</p>
                            <p className="text-[9px] font-bold uppercase mt-1">
                              Estado: <span className={isAgotado ? 'text-beyblade-electricRed' : 'text-amber-400'}>{stock.stock_status}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {allStocks.filter(s => s.stock_status === 'Agotado' || s.stock_status === 'Poco stock').length === 0 && (
                      <p className="text-xs text-gray-500 italic py-4">No hay alertas de stock pendientes.</p>
                    )}
                  </div>
                </div>

                {/* Catalog of certified stores details */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Disponibilidad en Tiendas Certificadas</h3>
                  <div className="space-y-3.5">
                    {stores.map((store) => {
                      const storeStocksList = allStocks.filter(s => s.store_id === store.id);
                      const dispCount = storeStocksList.filter(s => s.stock_status === 'Disponible').length;
                      const pocoCount = storeStocksList.filter(s => s.stock_status === 'Poco stock').length;
                      const agotCount = storeStocksList.filter(s => s.stock_status === 'Agotado').length;
                      
                      return (
                        <div key={store.id} className="bg-beyblade-card border border-white/5 rounded-2xl p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-2">
                            <div>
                              <h4 className="font-extrabold text-white text-sm">{store.name}</h4>
                              <p className="text-xs text-gray-400">{store.address} • {store.locality}, {store.country_id}</p>
                            </div>
                            <div className="flex gap-2">
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded uppercase">{dispCount} Disponibles</span>
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black rounded uppercase">{pocoCount} Pocos</span>
                              <span className="px-2 py-0.5 bg-beyblade-electricRed/10 text-beyblade-electricRed text-[9px] font-black rounded uppercase">{agotCount} Agotados</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {storeStocksList.slice(0, 4).map((stock, sIdx) => {
                              const prod = products.find(p => p.id === stock.product_id);
                              return (
                                <div key={sIdx} className="bg-beyblade-darker/60 p-2.5 rounded-xl border border-white/5 flex justify-between items-center">
                                  <span className="font-bold text-white truncate max-w-[120px]">{prod?.name || 'Producto'}</span>
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                    stock.stock_status === 'Disponible' ? 'bg-emerald-500/10 text-emerald-400' :
                                    stock.stock_status === 'Poco stock' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-beyblade-electricRed/10 text-beyblade-electricRed'
                                  }`}>
                                    {stock.stock_status}
                                  </span>
                                </div>
                              );
                            })}
                            {storeStocksList.length === 0 && (
                              <p className="text-[11px] text-gray-500 italic col-span-2">Esta tienda no ha actualizado su inventario.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Branding & Hero Banners */}
          {activeSuperTab === 'settings' && (
            <div className="space-y-8 animate-fade-in text-left">
              {/* Branding Settings Section */}
              <div className="bg-beyblade-card border border-white/5 p-6 rounded-3xl space-y-4">
                <h3 className="font-title text-base text-white uppercase tracking-wider flex items-center gap-2">
                  <Settings className="h-5 w-5 text-beyblade-electricCyan" /> Personalización de Marca (Sidebar / Header / Logo)
                </h3>
                <p className="text-xs text-gray-400">
                  Modifica los textos principales y el logo que se muestran en el menú de navegación lateral y el cabezal de la aplicación.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Título de Marca</label>
                    <input
                      type="text"
                      value={settings.brand_title || ''}
                      onChange={(e) => setSettings({ ...settings, brand_title: e.target.value })}
                      placeholder="BEYBLADE X"
                      className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-beyblade-electricCyan focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Subtítulo de Marca</label>
                    <input
                      type="text"
                      value={settings.brand_subtitle || ''}
                      onChange={(e) => setSettings({ ...settings, brand_subtitle: e.target.value })}
                      placeholder="LIGA LATAM OFICIAL"
                      className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-beyblade-electricCyan focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Logo de Marca (URL o Archivo local)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={settings.brand_logo || ''}
                        onChange={(e) => setSettings({ ...settings, brand_logo: e.target.value })}
                        placeholder="https://... o selecciona un archivo para subir"
                        className="flex-grow bg-beyblade-darker border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-beyblade-electricCyan focus:outline-none"
                      />
                      <label className="cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black font-esports uppercase tracking-widest px-4 py-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap">
                        <Camera className="h-3.5 w-3.5" /> Subir Logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const originalBase64 = reader.result as string;
                                
                                // Create an image to inspect and process pixels via canvas
                                const img = new Image();
                                img.src = originalBase64;
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  canvas.width = img.width;
                                  canvas.height = img.height;
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    ctx.drawImage(img, 0, 0);
                                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                    const data = imageData.data;
                                    
                                    // Detect background type from corner (0,0)
                                    const r0 = data[0];
                                    const g0 = data[1];
                                    const b0 = data[2];
                                    const a0 = data[3];
                                    
                                    const isTransparent = a0 < 50;
                                    const isDarkBg = !isTransparent && (r0 * 0.299 + g0 * 0.587 + b0 * 0.114) < 128;
                                    
                                    for (let i = 0; i < data.length; i += 4) {
                                      const r = data[i];
                                      const g = data[i+1];
                                      const b = data[i+2];
                                      const a = data[i+3];
                                      
                                      if (isTransparent) {
                                        // If already transparent, make any visible pixel white
                                        if (a > 30) {
                                          data[i] = 255;
                                          data[i+1] = 255;
                                          data[i+2] = 255;
                                        }
                                      } else if (isDarkBg) {
                                        // Dark background: make dark pixels transparent, others white
                                        const brightness = r * 0.299 + g * 0.587 + b * 0.114;
                                        if (brightness < 60) {
                                          data[i+3] = 0; // Make transparent
                                        } else {
                                          data[i] = 255;
                                          data[i+1] = 255;
                                          data[i+2] = 255;
                                          data[i+3] = a; // Keep original alpha
                                        }
                                      } else {
                                        // Light background: make light pixels transparent, others white
                                        const brightness = r * 0.299 + g * 0.587 + b * 0.114;
                                        if (brightness > 195) {
                                          data[i+3] = 0; // Make transparent
                                        } else {
                                          data[i] = 255;
                                          data[i+1] = 255;
                                          data[i+2] = 255;
                                          data[i+3] = a; // Keep original alpha
                                        }
                                      }
                                    }
                                    ctx.putImageData(imageData, 0, 0);
                                    const processedBase64 = canvas.toDataURL('image/png');
                                    setSettings({ ...settings, brand_logo: processedBase64 });
                                  }
                                };
                                img.onerror = () => {
                                  setSettings({ ...settings, brand_logo: originalBase64 });
                                };
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {settings.brand_logo && (
                      <div className="mt-2 flex items-center gap-4 bg-black/30 p-3 rounded-2xl border border-white/5">
                        <img src={settings.brand_logo} className="h-12 w-auto object-contain rounded bg-black/50 p-1.5 border border-white/10" alt="Vista previa logo" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider font-esports">Logo Cargado</span>
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, brand_logo: '' })}
                            className="text-[9px] text-beyblade-electricRed font-bold hover:underline text-left"
                          >
                            Eliminar Logo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={async () => {
                      try {
                        await DbService.saveSiteSetting('brand_title', settings.brand_title || 'BEYBLADE X');
                        await DbService.saveSiteSetting('brand_subtitle', settings.brand_subtitle || 'LIGA LATAM OFICIAL');
                        await DbService.saveSiteSetting('brand_logo', settings.brand_logo || '');
                        setFeedback('¡Ajustes de marca actualizados! Recarga la página para visualizar los cambios.');
                        setTimeout(() => setFeedback(''), 3000);
                      } catch (err: any) {
                        setErrorMsg(err.message || 'Error al guardar ajustes.');
                      }
                    }}
                    className="px-5 py-2.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[10px] uppercase tracking-widest rounded-xl transition-all"
                  >
                    Guardar Marca
                  </button>
                </div>
              </div>

              {/* Banners Administration Section */}
              <div className="bg-beyblade-card border border-white/5 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="space-y-1">
                    <h3 className="font-title text-base text-white uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-beyblade-electricRed" /> Banners del Home (Hasta 5 Banners)
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Administra los banners promocionales rotativos de la página de inicio. Se mostrarán en un carrusel dinámico.
                    </p>
                  </div>
                  {banners.length < 5 && !isCreatingBanner && !editingBanner && (
                    <button
                      onClick={() => {
                        setEditingBanner({
                          badge: 'URUGUAY ECOSISTEMA CERTIFICADO',
                          title_l1: 'BEYBLADE X',
                          title_l2: 'URUGUAY',
                          subtitle: '¡Prepárate para el combate!',
                          cta_primary: 'Registrarme',
                          cta_primary_link: '/register',
                          cta_secondary: 'Ver Torneos',
                          cta_secondary_link: '/tournaments',
                          image_url: 'xtreme',
                          country_id: 'UY',
                          active: true
                        });
                        setIsCreatingBanner(true);
                      }}
                      className="px-4 py-2 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Nuevo Banner
                    </button>
                  )}
                </div>

                {/* Edit Form Modal/Card */}
                {(isCreatingBanner || editingBanner?.id) && editingBanner && (
                  <div className="bg-beyblade-darker/60 p-6 rounded-2xl border border-beyblade-electricCyan/20 space-y-4 animate-fade-in">
                    <h4 className="text-xs font-black text-beyblade-electricCyan uppercase tracking-widest font-esports border-b border-white/5 pb-2">
                      {isCreatingBanner ? '➕ Crear Nuevo Banner Hero' : '📝 Editar Banner Hero'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">Badge / Etiqueta Superior</label>
                        <input
                          type="text"
                          value={editingBanner.badge}
                          onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                          className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">Título Línea 1</label>
                        <input
                          type="text"
                          value={editingBanner.title_l1}
                          onChange={(e) => setEditingBanner({ ...editingBanner, title_l1: e.target.value })}
                          className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">Título Línea 2</label>
                        <input
                          type="text"
                          value={editingBanner.title_l2}
                          onChange={(e) => setEditingBanner({ ...editingBanner, title_l2: e.target.value })}
                          className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">CTA Principal (Texto)</label>
                        <input
                          type="text"
                          value={editingBanner.cta_primary || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, cta_primary: e.target.value })}
                          className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">CTA Principal (Enlace/Ruta)</label>
                        <input
                          type="text"
                          value={editingBanner.cta_primary_link || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, cta_primary_link: e.target.value })}
                          className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">CTA Secundario (Texto)</label>
                        <input
                          type="text"
                          value={editingBanner.cta_secondary || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, cta_secondary: e.target.value })}
                          className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">CTA Secundario (Enlace/Ruta)</label>
                        <input
                          type="text"
                          value={editingBanner.cta_secondary_link || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, cta_secondary_link: e.target.value })}
                          className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">Código País (ej. UY)</label>
                        <input
                          type="text"
                          value={editingBanner.country_id}
                          onChange={(e) => setEditingBanner({ ...editingBanner, country_id: e.target.value })}
                          className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">Imagen Derecha (URL o Archivo local)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingBanner.image_url || ''}
                            onChange={(e) => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                            placeholder="xtreme o url de imagen"
                            className="flex-grow bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                          />
                          <label className="cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9px] font-black font-esports uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all flex items-center gap-1 whitespace-nowrap">
                            <Camera className="h-3 w-3" /> Subir
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const base64String = reader.result as string;
                                    setEditingBanner({ ...editingBanner, image_url: base64String });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setEditingBanner({ ...editingBanner, image_url: 'xtreme' })}
                            className="text-[8px] bg-white/5 border border-white/10 hover:bg-white/10 px-2.5 py-1 rounded text-gray-300 font-bold uppercase tracking-wider"
                          >
                            Usar Engranaje 3D
                          </button>
                          {editingBanner.image_url && editingBanner.image_url !== 'xtreme' && (
                            <button
                              type="button"
                              onClick={() => setEditingBanner({ ...editingBanner, image_url: '' })}
                              className="text-[8px] bg-beyblade-electricRed/10 border border-beyblade-electricRed/20 hover:bg-beyblade-electricRed/20 px-2.5 py-1 rounded text-beyblade-electricRed font-bold uppercase tracking-wider"
                            >
                              Remover Imagen
                            </button>
                          )}
                        </div>
                        {editingBanner.image_url && editingBanner.image_url !== 'xtreme' && (
                          <div className="mt-2 flex items-center gap-3 bg-black/30 p-2 rounded-xl border border-white/5">
                            <img src={editingBanner.image_url} className="h-10 object-contain rounded bg-black/50 p-1 border border-white/10" alt="Preview Banner" />
                            <span className="text-[9px] text-emerald-400 font-black uppercase font-esports tracking-wider">Imagen Cargada</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Subtítulo / Párrafo Promocional</label>
                      <textarea
                        value={editingBanner.subtitle}
                        onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                        rows={2}
                        className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="banner_active_chk"
                        checked={editingBanner.active}
                        onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })}
                        className="rounded bg-beyblade-dark border border-white/10 text-beyblade-electricCyan focus:ring-0"
                      />
                      <label htmlFor="banner_active_chk" className="text-xs text-white font-bold cursor-pointer">
                        Publicar Banner (Estado Activo)
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          setEditingBanner(null);
                          setIsCreatingBanner(false);
                        }}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 font-black font-esports text-[9px] uppercase tracking-widest rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            if (!editingBanner.badge || !editingBanner.title_l1 || !editingBanner.title_l2 || !editingBanner.subtitle) {
                              throw new Error('Por favor completa todos los campos requeridos.');
                            }
                            await DbService.saveHeroBanner(editingBanner);
                            setFeedback('¡Banner guardado correctamente!');
                            setTimeout(() => setFeedback(''), 3000);
                            
                            // Reload banners
                            const bannerList = await DbService.getHeroBanners();
                            setBanners(bannerList);
                            
                            setEditingBanner(null);
                            setIsCreatingBanner(false);
                          } catch (err: any) {
                            setErrorMsg(err.message || 'Error al guardar banner.');
                            setTimeout(() => setErrorMsg(''), 4000);
                          }
                        }}
                        className="px-5 py-2.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[9px] uppercase tracking-widest rounded-xl transition-all"
                      >
                        Guardar Banner
                      </button>
                    </div>
                  </div>
                )}

                {/* Banner Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map((banner) => (
                    <div
                      key={banner.id}
                      className="bg-beyblade-darker/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 flex flex-col justify-between gap-4 transition-all duration-300 relative"
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${banner.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                          {banner.active ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className="bg-white/5 border border-white/10 text-gray-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                          {banner.country_id}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] text-beyblade-electricCyan font-black uppercase tracking-wider">{banner.badge}</span>
                        <h4 className="text-sm font-black text-white uppercase font-esports leading-tight">
                          {banner.title_l1} <span className="text-beyblade-electricRed">{banner.title_l2}</span>
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {banner.subtitle}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                        <button
                          onClick={() => {
                            setEditingBanner(banner);
                            setIsCreatingBanner(false);
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-black font-esports text-[8px] uppercase tracking-widest rounded-lg transition-all"
                        >
                          Editar
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('¿Seguro que deseas eliminar este banner?')) return;
                            try {
                              await DbService.deleteHeroBanner(banner.id);
                              setFeedback('Banner eliminado correctamente.');
                              setTimeout(() => setFeedback(''), 3000);
                              
                              const bannerList = await DbService.getHeroBanners();
                              setBanners(bannerList);
                            } catch (err: any) {
                              setErrorMsg(err.message || 'Error al eliminar banner.');
                            }
                          }}
                          className="px-3 py-1.5 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-white font-black font-esports text-[8px] uppercase tracking-widest rounded-lg transition-all"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}

                  {banners.length === 0 && !isCreatingBanner && (
                    <div className="bg-beyblade-darker/30 p-12 rounded-3xl border border-dashed border-white/5 text-center col-span-2 space-y-2">
                      <Trophy className="h-8 w-8 text-gray-500 mx-auto" />
                      <p className="text-xs text-gray-400 font-bold">No hay banners personalizados creados.</p>
                      <p className="text-[10px] text-gray-500">Se mostrará el banner por defecto del ecosistema de Uruguay.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Products & Multimedia Administration */}
          {activeSuperTab === 'products' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <ShoppingBag className="h-5.5 w-5.5 text-beyblade-electricCyan text-glow-cyan" /> Administración de Productos & Catálogo
                </h2>
                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-xs font-bold text-gray-400 font-mono">
                  Total: {products.length} Items
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left: Product List Selection */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase font-esports">Buscar en Inventario</label>
                    <input
                      type="text"
                      value={adminProductSearch}
                      onChange={(e) => setAdminProductSearch(e.target.value)}
                      placeholder="Nombre o SKU..."
                      className="w-full bg-beyblade-card border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-beyblade-electricCyan focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
                    {products
                      .filter(p => {
                        const q = adminProductSearch.toLowerCase();
                        return p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
                      })
                      .map((prod) => {
                        const isSelected = selectedAdminProduct?.id === prod.id;
                        return (
                          <button
                            key={prod.id}
                            onClick={() => handleSelectAdminProduct(prod)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center ${
                              isSelected 
                                ? 'bg-beyblade-electricCyan/10 border-beyblade-electricCyan shadow-[0_0_12px_rgba(0,240,255,0.05)]' 
                                : 'bg-beyblade-card border-white/5 hover:border-white/15'
                            }`}
                          >
                            <div className="space-y-1 truncate">
                              <h4 className="font-extrabold text-white text-xs uppercase tracking-wide truncate">{prod.name}</h4>
                              <p className="text-[9px] font-mono text-gray-400">ID: {prod.id}</p>
                              {prod.sku ? (
                                <span className="inline-block text-[8px] bg-black/40 text-beyblade-electricCyan font-mono font-bold px-1.5 py-0.5 rounded border border-beyblade-electricCyan/20">
                                  SKU: {prod.sku}
                                </span>
                              ) : (
                                <span className="inline-block text-[8px] bg-black/20 text-gray-500 font-mono px-1.5 py-0.5 rounded italic">
                                  Sin SKU
                                </span>
                              )}
                            </div>
                            <span className={`text-[8px] font-black uppercase font-esports px-2 py-0.5 rounded tracking-wider border ${
                              prod.status === 'disponible' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              prod.status === 'proximo lanzamiento' ? 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border-beyblade-electricCyan/20' :
                              'bg-beyblade-electricRed/10 text-beyblade-electricRed border-beyblade-electricRed/20'
                            }`}>
                              {prod.status}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Right: Product Editor Form & Multimedia */}
                <div className="lg:col-span-8">
                  {selectedAdminProduct ? (
                    <div className="space-y-6">
                      
                      {/* Editor section */}
                      <div className="bg-beyblade-card border border-white/5 p-6 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <h3 className="font-title text-sm text-white uppercase tracking-wider flex items-center gap-2">
                            <Settings className="h-4.5 w-4.5 text-beyblade-electricCyan" /> Ficha Técnica del Producto
                          </h3>
                          <span className="text-[9px] font-mono text-gray-500">ID: {selectedAdminProduct.id}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                          {/* SKU */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">SKU (Unico)</label>
                            <input
                              type="text"
                              value={selectedAdminProduct.sku || ''}
                              onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, sku: e.target.value })}
                              placeholder="BX-01"
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>

                          {/* Nombre */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Nombre del Beyblade</label>
                            <input
                              type="text"
                              value={selectedAdminProduct.name}
                              onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, name: e.target.value })}
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>

                          {/* Linea */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Línea de Producto</label>
                            <input
                              type="text"
                              value={selectedAdminProduct.line || ''}
                              onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, line: e.target.value })}
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>

                          {/* Tipo */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Tipo de Catálogo</label>
                            <select
                              value={selectedAdminProduct.product_type || selectedAdminProduct.type || 'booster'}
                              onChange={(e) => setSelectedAdminProduct({ 
                                ...selectedAdminProduct, 
                                product_type: e.target.value,
                                type: e.target.value as any
                              })}
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                            >
                              <option value="starter">Starter</option>
                              <option value="booster">Booster</option>
                              <option value="stadium">Stadium</option>
                              <option value="launcher">Launcher</option>
                              <option value="set">Set Completo</option>
                              <option value="accesorio">Accesorio</option>
                            </select>
                          </div>

                          {/* Categoria Combate */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Categoría de Combate</label>
                            <select
                              value={selectedAdminProduct.product_category || 'Equilibrio'}
                              onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, product_category: e.target.value })}
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                            >
                              <option value="Ataque">Ataque</option>
                              <option value="Defensa">Defensa</option>
                              <option value="Resistencia">Resistencia</option>
                              <option value="Equilibrio">Equilibrio / Balance</option>
                              <option value="Ninguno">Ninguno (Estadio / Accesorio)</option>
                            </select>
                          </div>

                          {/* Estado */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Estado de Stock</label>
                            <select
                              value={selectedAdminProduct.status}
                              onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, status: e.target.value as any })}
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                            >
                              <option value="disponible">Disponible</option>
                              <option value="proximo lanzamiento">Próximo lanzamiento</option>
                              <option value="agotado">Agotado</option>
                            </select>
                          </div>

                          {/* Blade Name */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Blade Name</label>
                            <input
                              type="text"
                              value={selectedAdminProduct.blade_name || ''}
                              onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, blade_name: e.target.value })}
                              placeholder="Sword Dran"
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>

                          {/* Ratchet Name */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Ratchet Name</label>
                            <input
                              type="text"
                              value={selectedAdminProduct.ratchet_name || ''}
                              onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, ratchet_name: e.target.value })}
                              placeholder="3-60"
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>

                          {/* Bit Name */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Bit Name</label>
                            <input
                              type="text"
                              value={selectedAdminProduct.bit_name || ''}
                              onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, bit_name: e.target.value })}
                              placeholder="Flat"
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Descriptions */}
                        <div className="space-y-3 text-left">
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Descripción Corta (Catálogo)</label>
                            <input
                              type="text"
                              value={selectedAdminProduct.short_description || selectedAdminProduct.description}
                              onChange={(e) => setSelectedAdminProduct({ 
                                ...selectedAdminProduct, 
                                short_description: e.target.value,
                                description: e.target.value 
                              })}
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Descripción Larga (Detalles)</label>
                            <textarea
                              value={selectedAdminProduct.long_description || ''}
                              onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, long_description: e.target.value })}
                              rows={3}
                              className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-sans"
                            />
                          </div>
                        </div>

                        {/* Save Product button */}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={async () => {
                              try {
                                if (!selectedAdminProduct.sku) {
                                  throw new Error('El SKU es obligatorio.');
                                }
                                await DbService.updateProductDetails(selectedAdminProduct);
                                setFeedback('¡Producto guardado exitosamente!');
                                setTimeout(() => setFeedback(''), 3000);
                                loadData();
                              } catch (err: any) {
                                setErrorMsg(err.message || 'Error al guardar detalles de producto.');
                                setTimeout(() => setErrorMsg(''), 4000);
                              }
                            }}
                            className="px-6 py-2.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[10px] uppercase tracking-widest rounded-xl transition-all"
                          >
                            Guardar Especificaciones
                          </button>
                        </div>
                      </div>

                      {/* MULTIMEDIA MANAGEMENT SECTION */}
                      <div className="bg-beyblade-card border border-white/5 p-6 rounded-3xl space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h3 className="font-title text-sm text-white uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="h-4.5 w-4.5 text-beyblade-electricRed" /> Galería & Material Multimedia
                          </h3>
                          {!isAddingMedia && (
                            <button
                              onClick={() => {
                                setIsAddingMedia(true);
                              }}
                              className="px-3.5 py-1.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[8px] uppercase tracking-widest rounded-lg transition-all flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" /> Agregar Media
                            </button>
                          )}
                        </div>

                        {/* Add Media Subform */}
                        {isAddingMedia && (
                          <div className="bg-beyblade-darker/60 p-5 rounded-2xl border border-beyblade-electricCyan/20 space-y-4 animate-fade-in text-left">
                            <h4 className="text-[10px] font-black text-beyblade-electricCyan uppercase tracking-widest font-esports">
                              ➕ Vincular Nuevo Elemento Multimedia
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {/* Media Type */}
                              <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 font-bold uppercase">Tipo de Elemento</label>
                                <select
                                  value={newMediaItem.media_type}
                                  onChange={(e) => setNewMediaItem({ 
                                    ...newMediaItem, 
                                    media_type: e.target.value as any,
                                    url: '' // Reset url
                                  })}
                                  className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                                >
                                  <option value="image">Imagen de Galería</option>
                                  <option value="back_card">Back Card Oficial</option>
                                  <option value="video">Video MP4 (Archivo/URL)</option>
                                  <option value="youtube">Enlace de YouTube</option>
                                  <option value="pdf">Documento PDF</option>
                                </select>
                              </div>

                              {/* Title */}
                              <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 font-bold uppercase">Título Descriptivo</label>
                                <input
                                  type="text"
                                  value={newMediaItem.title}
                                  onChange={(e) => setNewMediaItem({ ...newMediaItem, title: e.target.value })}
                                  placeholder="Ej: Vista de Caja, Test de Giro..."
                                  className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                />
                              </div>

                              {/* Sort Order */}
                              <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 font-bold uppercase">Orden (Sort Order)</label>
                                <input
                                  type="number"
                                  value={newMediaItem.sort_order}
                                  onChange={(e) => setNewMediaItem({ ...newMediaItem, sort_order: parseInt(e.target.value) || 0 })}
                                  className="w-full bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                />
                              </div>
                            </div>

                            {/* URL and File Input combined */}
                            <div className="space-y-1">
                              <label className="text-[9px] text-gray-500 font-bold uppercase">Contenido (URL o Archivo local)</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={newMediaItem.url}
                                  onChange={(e) => setNewMediaItem({ ...newMediaItem, url: e.target.value })}
                                  placeholder={
                                    newMediaItem.media_type === 'youtube' 
                                      ? "https://www.youtube.com/watch?v=..." 
                                      : "https://... o selecciona un archivo local"
                                  }
                                  className="flex-grow bg-beyblade-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                />
                                {newMediaItem.media_type !== 'youtube' && (
                                  <label className="cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9px] font-black font-esports uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap">
                                    <Camera className="h-3 w-3" /> Subir Archivo
                                    <input
                                      type="file"
                                      accept={
                                        newMediaItem.media_type === 'video' ? 'video/*' : 
                                        newMediaItem.media_type === 'pdf' ? 'application/pdf' : 
                                        'image/*'
                                      }
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            const base64String = reader.result as string;
                                            setNewMediaItem({ ...newMediaItem, url: base64String });
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>

                            {/* Primary image checkbox */}
                            {(newMediaItem.media_type === 'image') && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="new_media_primary_chk"
                                  checked={newMediaItem.is_primary}
                                  onChange={(e) => setNewMediaItem({ ...newMediaItem, is_primary: e.target.checked })}
                                  className="rounded bg-beyblade-dark border border-white/10 text-beyblade-electricCyan focus:ring-0 cursor-pointer"
                                />
                                <label htmlFor="new_media_primary_chk" className="text-xs text-white font-bold cursor-pointer select-none">
                                  Establecer como imagen principal del producto
                                </label>
                              </div>
                            )}

                            {/* Preview */}
                            {newMediaItem.url && (
                              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 max-w-sm flex items-center gap-3">
                                {newMediaItem.media_type === 'image' || newMediaItem.media_type === 'back_card' ? (
                                  <img src={newMediaItem.url} className="h-12 w-12 object-contain bg-black rounded p-0.5 border border-white/10" alt="Preview" />
                                ) : (
                                  <div className="p-2.5 bg-black/40 rounded text-beyblade-electricCyan">
                                    <Film className="h-5 w-5" />
                                  </div>
                                )}
                                <div className="truncate text-left font-sans">
                                  <p className="text-[9px] text-emerald-400 font-bold uppercase">Vista previa cargada</p>
                                  <p className="text-[8px] text-gray-500 truncate max-w-[200px]">{newMediaItem.url.substring(0, 60)}...</p>
                                </div>
                              </div>
                            )}

                            {/* Subform actions */}
                            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                              <button
                                onClick={() => setIsAddingMedia(false)}
                                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 font-black font-esports text-[8px] uppercase tracking-widest rounded-lg transition-all"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    if (!newMediaItem.url) {
                                      throw new Error('Debes subir un archivo o definir una dirección URL.');
                                    }
                                    
                                    // Save media
                                    await DbService.saveProductMedia({
                                      product_id: selectedAdminProduct.id,
                                      media_type: newMediaItem.media_type,
                                      title: newMediaItem.title || 'Multimedia',
                                      url: newMediaItem.url,
                                      sort_order: newMediaItem.sort_order,
                                      is_primary: newMediaItem.is_primary
                                    });

                                    // If set as primary, update the product's main image URL
                                    if (newMediaItem.is_primary && newMediaItem.media_type === 'image') {
                                      await DbService.updateProductDetails({
                                        id: selectedAdminProduct.id,
                                        main_image_url: newMediaItem.url
                                      });
                                    }

                                    setFeedback('¡Multimedia vinculada correctamente!');
                                    setTimeout(() => setFeedback(''), 3000);
                                    
                                    // Reload media list
                                    const media = await DbService.getProductMedia(selectedAdminProduct.id);
                                    setProductMediaList(media);
                                    setIsAddingMedia(false);
                                  } catch (err: any) {
                                    setErrorMsg(err.message || 'Error al guardar multimedia.');
                                    setTimeout(() => setErrorMsg(''), 4000);
                                  }
                                }}
                                className="px-4 py-2 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[8px] uppercase tracking-widest rounded-lg transition-all"
                              >
                                Guardar Item
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Media Items List Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Fallback Main Image slot in list if not empty */}
                          {selectedAdminProduct.main_image_url && (
                            <div className="bg-beyblade-darker/40 p-4 rounded-2xl border border-beyblade-electricCyan/25 flex items-center justify-between gap-3 relative">
                              <span className="absolute top-2.5 right-3 bg-beyblade-electricCyan/10 text-beyblade-electricCyan text-[6px] font-black font-esports border border-beyblade-electricCyan/20 px-1.5 py-0.5 rounded tracking-wider uppercase">Principal</span>
                              <div className="flex items-center gap-3">
                                <img src={selectedAdminProduct.main_image_url} className="h-10 w-10 object-contain bg-black rounded p-0.5" alt="Imagen Principal" />
                                <div className="truncate text-left">
                                  <h4 className="text-[10px] font-black text-white uppercase tracking-wider truncate font-esports">Imagen Principal</h4>
                                  <p className="text-[8px] text-gray-500 font-sans">Configurada en la Ficha</p>
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  if (!window.confirm('¿Seguro que deseas remover la imagen principal de la ficha?')) return;
                                  try {
                                    await DbService.updateProductDetails({
                                      id: selectedAdminProduct.id,
                                      main_image_url: ''
                                    });
                                    setSelectedAdminProduct({ ...selectedAdminProduct, main_image_url: '' });
                                    setFeedback('Imagen principal removida.');
                                    setTimeout(() => setFeedback(''), 3000);
                                  } catch (err: any) {
                                    setErrorMsg('Error al remover imagen principal.');
                                  }
                                }}
                                className="text-[8px] font-bold text-beyblade-electricRed hover:underline uppercase tracking-wider font-esports pr-1"
                              >
                                Remover
                              </button>
                            </div>
                          )}

                          {/* Loop through actual product media */}
                          {productMediaList.map((media) => (
                            <div key={media.id} className="bg-beyblade-darker/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-3 relative hover:border-white/10 transition-colors">
                              <span className="absolute top-2.5 right-3 bg-white/5 text-[6px] font-black font-esports border border-white/10 px-1.5 py-0.5 rounded tracking-wider uppercase">{media.media_type}</span>
                              <div className="flex items-center gap-3 truncate">
                                {media.media_type === 'image' || media.media_type === 'back_card' ? (
                                  <img src={media.url} className="h-10 w-10 object-contain bg-black rounded p-0.5 border border-white/5" alt="Thumbnail" />
                                ) : (
                                  <div className="p-2.5 bg-black rounded text-beyblade-electricCyan">
                                    <Film className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="truncate text-left font-sans">
                                  <h4 className="text-[10px] font-black text-white uppercase tracking-wider truncate font-esports">{media.title || 'Elemento'}</h4>
                                  <p className="text-[8px] text-gray-500">Orden: {media.sort_order || 0}</p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 items-end pr-1 font-esports">
                                <button
                                  onClick={async () => {
                                    if (!window.confirm('¿Seguro que deseas eliminar este elemento de la galería?')) return;
                                    try {
                                      if (media.id) {
                                        await DbService.deleteProductMedia(media.id);
                                        
                                        // Reload list
                                        const list = await DbService.getProductMedia(selectedAdminProduct.id);
                                        setProductMediaList(list);
                                        setFeedback('Multimedia eliminada.');
                                        setTimeout(() => setFeedback(''), 3000);
                                      }
                                    } catch (err: any) {
                                      setErrorMsg('Error al eliminar multimedia.');
                                    }
                                  }}
                                  className="text-[8px] font-bold text-beyblade-electricRed hover:underline uppercase tracking-wider"
                                >
                                  Eliminar
                                </button>
                                {media.media_type === 'image' && !media.is_primary && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        if (media.id) {
                                          // Update all media items to set is_primary to false
                                          for (const item of productMediaList) {
                                            if (item.id) {
                                              await DbService.saveProductMedia({
                                                ...item,
                                                is_primary: item.id === media.id
                                              });
                                            }
                                          }
                                          // Update product main_image_url
                                          await DbService.updateProductDetails({
                                            id: selectedAdminProduct.id,
                                            main_image_url: media.url
                                          });

                                          setFeedback('¡Imagen establecida como principal!');
                                          setTimeout(() => setFeedback(''), 3000);
                                          
                                          // Reload list
                                          const list = await DbService.getProductMedia(selectedAdminProduct.id);
                                          setProductMediaList(list);
                                          setSelectedAdminProduct({
                                            ...selectedAdminProduct,
                                            main_image_url: media.url
                                          });
                                        }
                                      } catch (err: any) {
                                        setErrorMsg('Error al actualizar imagen principal.');
                                      }
                                    }}
                                    className="text-[8px] font-bold text-beyblade-electricCyan hover:underline uppercase tracking-wider"
                                  >
                                    Hacer Principal
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {productMediaList.length === 0 && !selectedAdminProduct.main_image_url && (
                            <p className="text-[10px] text-gray-500 italic py-4 col-span-2 text-center font-sans">No hay archivos multimedia cargados para este producto.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-beyblade-card border border-white/5 rounded-3xl p-12 text-center text-gray-500 space-y-3">
                      <ShoppingBag className="h-8 w-8 text-gray-600 mx-auto" />
                      <h4 className="text-xs uppercase font-esports font-bold tracking-widest">Ningún Producto Seleccionado</h4>
                      <p className="text-[10px] text-gray-400 font-sans max-w-sm mx-auto leading-normal">
                        Selecciona uno de los productos de la lista de la izquierda para editar sus especificaciones técnicas y administrar sus fotos, ficha de Back Card, videos o manuales PDF.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DISTRIBUIDOR PAIS / HASBRO LOCAL REPRESENTATIVE */}
      {/* ========================================================================= */}
      {currentUser.role === 'Distribuidor País' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Sub-tab selection bar */}
          <div className="flex border-b border-white/5 pb-2">
            <button
              onClick={() => setActiveDistributorTab('certifications')}
              className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                activeDistributorTab === 'certifications'
                  ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" /> Acreditaciones y Validación
              </span>
            </button>
            <button
              onClick={() => setActiveDistributorTab('seasons')}
              className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                activeDistributorTab === 'seasons'
                  ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Temporadas y Ligas
              </span>
            </button>
            <button
              onClick={() => setActiveDistributorTab('stats')}
              className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                activeDistributorTab === 'stats'
                  ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Map className="h-4 w-4" /> Estadísticas Territoriales
              </span>
            </button>
            <button
              onClick={() => setActiveDistributorTab('retail')}
              className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                activeDistributorTab === 'retail'
                  ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Retail País
              </span>
            </button>
          </div>

          {/* Tab 1: Certifications & Validation */}
          {activeDistributorTab === 'certifications' && (
            <div className="space-y-8 animate-fade-in">
              {/* Validating Tournament Placements */}
              <div className="space-y-4">
                <h2 className="text-lg font-black text-white uppercase tracking-wide border-b border-white/5 pb-2">
                  Validación de Resultados ({pendingTournaments.filter(t => t.country_id === currentUser.country_id).length} Pendientes)
                </h2>
                {pendingTournaments.filter(t => t.country_id === currentUser.country_id).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingTournaments.filter(t => t.country_id === currentUser.country_id).map(t => (
                      <div key={t.id} className="bg-beyblade-card border border-white/5 rounded-2xl p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded uppercase">
                            Resultados Cargados
                          </span>
                          <h3 className="font-extrabold text-white text-sm">{t.name}</h3>
                          <p className="text-xs text-gray-400">{t.locality} • Liga {t.league_id}</p>
                        </div>
                        <button
                          onClick={() => handleValidateResults(t.id)}
                          className="w-full py-2.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/80 text-beyblade-darker font-extrabold text-xs uppercase rounded-xl transition-all shadow-neon-cyan"
                        >
                          Aprobar y Sumar al Ranking
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No hay resultados de torneos pendientes de validación en tu país.</p>
                )}
              </div>

              {/* Certifications approvals */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Store Certifications */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-white uppercase border-b border-white/5 pb-2">Tiendas en {currentUser.country_id}</h3>
                  <div className="space-y-3">
                    {stores.filter(s => s.country_id === currentUser.country_id).map(s => (
                      <div key={s.id} className="bg-beyblade-card border border-white/5 p-4 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <h4 className="font-bold text-white">{s.name}</h4>
                          <p className="text-gray-500">{s.locality} • {s.certification_status}</p>
                        </div>
                        {s.certification_status === 'Pendiente' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleStoreApprove(s.id, 'Aprobado')} className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all"><Check className="h-4 w-4" /></button>
                            <button onClick={() => handleStoreApprove(s.id, 'Rechazado')} className="p-1.5 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-beyblade-electricRed hover:text-white rounded-lg transition-all"><X className="h-4 w-4" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                    {stores.filter(s => s.country_id === currentUser.country_id).length === 0 && (
                      <p className="text-xs text-gray-500 italic">No hay tiendas registradas en tu país.</p>
                    )}
                  </div>
                </div>

                {/* Organizer Certifications */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-white uppercase border-b border-white/5 pb-2">Organizadores</h3>
                  <div className="space-y-3">
                    {organizers.filter(o => o.country_id === currentUser.country_id).map(o => (
                      <div key={o.id} className="bg-beyblade-card border border-white/5 p-4 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <h4 className="font-bold text-white">{o.name}</h4>
                          <p className="text-gray-500">{o.level} • {o.status}</p>
                        </div>
                        {o.status === 'Pendiente' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleOrganizerApprove(o.id, 'Aprobado')} className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all"><Check className="h-4 w-4" /></button>
                            <button onClick={() => handleOrganizerApprove(o.id, 'Rechazado')} className="p-1.5 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-beyblade-electricRed hover:text-white rounded-lg transition-all"><X className="h-4 w-4" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                    {organizers.filter(o => o.country_id === currentUser.country_id).length === 0 && (
                      <p className="text-xs text-gray-500 italic">No hay organizadores registrados en tu país.</p>
                    )}
                  </div>
                </div>

                {/* Judges Certifications */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-white uppercase border-b border-white/5 pb-2">Jueces</h3>
                  <div className="space-y-3">
                    {judges.filter(j => j.country_id === currentUser.country_id).map(j => (
                      <div key={j.id} className="bg-beyblade-card border border-white/5 p-4 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <h4 className="font-bold text-white">{j.name}</h4>
                          <p className="text-gray-500">Estado: {j.status}</p>
                        </div>
                        {j.status === 'Pendiente' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleJudgeApprove(j.id, 'Aprobado')} className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all"><Check className="h-4 w-4" /></button>
                            <button onClick={() => handleJudgeApprove(j.id, 'Rechazado')} className="p-1.5 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-beyblade-electricRed hover:text-white rounded-lg transition-all"><X className="h-4 w-4" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                    {judges.filter(j => j.country_id === currentUser.country_id).length === 0 && (
                      <p className="text-xs text-gray-500 italic">No hay jueces registrados en tu país.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab: Seasons & Leagues */}
          {activeDistributorTab === 'seasons' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-5.5 w-5.5 text-beyblade-electricCyan" /> Gestión de Temporadas y Ligas
                </h2>
                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-xs font-bold text-gray-400">
                  {seasons.filter(s => s.country_id === currentUser.country_id).length} Temporadas registradas
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Create Season Form */}
                <div className="bg-beyblade-card border border-white/5 p-6 rounded-3xl space-y-4">
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider font-title">Nueva Temporada</h3>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Nombre de Temporada</label>
                      <input
                        type="text"
                        value={newSeasonName}
                        onChange={(e) => setNewSeasonName(e.target.value)}
                        placeholder="Ej: Temporada Open Uruguay 2026"
                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Liga / Categoría</label>
                      <select
                        value={newSeasonLeague}
                        onChange={(e) => setNewSeasonLeague(e.target.value as any)}
                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                      >
                        <option value="open">Liga Open (14+)</option>
                        <option value="junior">Liga Junior (6-14)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">Fecha Inicio</label>
                        <input
                          type="date"
                          value={newSeasonStartDate}
                          onChange={(e) => setNewSeasonStartDate(e.target.value)}
                          className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">Fecha Fin (Opcional)</label>
                        <input
                          type="date"
                          value={newSeasonEndDate}
                          onChange={(e) => setNewSeasonEndDate(e.target.value)}
                          className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Descripción</label>
                      <textarea
                        value={newSeasonDesc}
                        onChange={(e) => setNewSeasonDesc(e.target.value)}
                        placeholder="Detalles de clasificación local, regional y nacional..."
                        rows={3}
                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (!newSeasonName || !newSeasonStartDate) {
                            throw new Error('Por favor completa los campos obligatorios (Nombre y Fecha de Inicio).');
                          }
                          await DbService.createSeason({
                            name: newSeasonName,
                            country_id: currentUser.country_id || 'UY',
                            league_type: newSeasonLeague,
                            start_date: newSeasonStartDate,
                            end_date: newSeasonEndDate || undefined,
                            description: newSeasonDesc,
                            status: 'draft'
                          });
                          setFeedback('¡Temporada creada como Borrador con éxito!');
                          setNewSeasonName('');
                          setNewSeasonStartDate('');
                          setNewSeasonEndDate('');
                          setNewSeasonDesc('');
                          loadData();
                          setTimeout(() => setFeedback(''), 3000);
                        } catch (err: any) {
                          setErrorMsg(err.message || 'Error al crear temporada.');
                          setTimeout(() => setErrorMsg(''), 4000);
                        }
                      }}
                      className="w-full py-2.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[9px] uppercase tracking-widest rounded-xl transition-all"
                    >
                      Crear Temporada
                    </button>
                  </div>
                </div>

                {/* Right: Seasons List */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Historial de Temporadas</h3>
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                    {seasons.filter(s => s.country_id === currentUser.country_id).map((season) => (
                      <div key={season.id} className="bg-beyblade-card border border-white/5 rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-white text-sm uppercase">{season.name}</h4>
                            <p className="text-xs text-gray-400">
                              Rango: {new Date(season.start_date).toLocaleDateString()} al {season.end_date ? new Date(season.end_date).toLocaleDateString() : 'Indefinido'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                              season.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : season.status === 'completed'
                                ? 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border-beyblade-electricCyan/20'
                                : 'bg-white/5 text-gray-500 border-white/10'
                            }`}>
                              {season.status === 'active' ? 'Activo' : season.status === 'completed' ? 'Finalizado' : 'Borrador'}
                            </span>
                            <span className="bg-white/5 border border-white/10 text-gray-400 text-[8px] font-bold px-1.5 py-0.5 rounded">
                              LIGA {season.league_type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {season.description && (
                          <p className="text-xs text-gray-400 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                            {season.description}
                          </p>
                        )}

                        {/* Fechas / Torneos of the season */}
                        {(() => {
                          const seasonTournaments = tournaments.filter(t => t.season_id === season.id);
                          return (
                            <div className="space-y-3 border-t border-white/5 pt-3">
                              <div className="flex justify-between items-center">
                                <h5 className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider font-esports">Fechas / Torneos</h5>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (addingDateSeasonId === season.id) {
                                      setAddingDateSeasonId(null);
                                    } else {
                                      setAddingDateSeasonId(season.id || null);
                                      setNewFechaName(`Fecha ${seasonTournaments.length + 1}`);
                                      setNewFechaDate('');
                                      setNewFechaTime('');
                                      setNewFechaLocation(null);
                                      setNewFechaDesc('');
                                      setNewFechaOrganizerId('');
                                      setNewFechaJudgeId('');
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-beyblade-electricCyan/10 hover:bg-beyblade-electricCyan hover:text-beyblade-darker border border-beyblade-electricCyan/20 hover:border-transparent text-beyblade-electricCyan font-black font-esports text-[8px] uppercase tracking-widest rounded transition-all"
                                >
                                  {addingDateSeasonId === season.id ? 'Cancelar' : '+ Agregar Fecha'}
                                </button>
                              </div>

                              {addingDateSeasonId === season.id && (
                                <div className="bg-black/30 border border-beyblade-electricCyan/20 p-4 rounded-xl space-y-3 mt-2 text-left">
                                  <h6 className="font-extrabold text-[9px] text-white uppercase tracking-wider font-title">Nueva Fecha para {season.name}</h6>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase">Nombre de la Fecha *</label>
                                      <input
                                        type="text"
                                        value={newFechaName}
                                        onChange={(e) => setNewFechaName(e.target.value)}
                                        placeholder="Ej: Fecha 1"
                                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase">Lugar *</label>
                                      <LocationAutocomplete
                                        countryCode={season.country_id}
                                        initialAddress=""
                                        onSelect={(loc) => setNewFechaLocation(loc)}
                                        placeholder="Busca el lugar..."
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase">Fecha *</label>
                                      <input
                                        type="date"
                                        value={newFechaDate}
                                        onChange={(e) => setNewFechaDate(e.target.value)}
                                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase">Hora *</label>
                                      <input
                                        type="time"
                                        value={newFechaTime}
                                        onChange={(e) => setNewFechaTime(e.target.value)}
                                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1 text-xs">
                                    <label className="text-[9px] text-gray-500 font-bold uppercase">Organizador del Evento *</label>
                                    <select
                                      value={newFechaOrganizerId}
                                      onChange={(e) => setNewFechaOrganizerId(e.target.value)}
                                      className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                                    >
                                      <option value="">Selecciona Organizador Aprobado</option>
                                      {organizers.filter(o => o.status === 'Aprobado' && o.country_id === season.country_id).map(o => (
                                        <option key={o.id} value={o.id}>{o.name || (o as any).profiles?.email || o.id}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1 text-xs">
                                    <label className="text-[9px] text-gray-500 font-bold uppercase">Descripción (Opcional)</label>
                                    <textarea
                                      value={newFechaDesc}
                                      onChange={(e) => setNewFechaDesc(e.target.value)}
                                      placeholder="Reglas, premios u otros detalles..."
                                      rows={2}
                                      className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setAddingDateSeasonId(null)}
                                      className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAddFechaToSeason(season)}
                                      className="px-4 py-1 bg-beyblade-electricCyan text-beyblade-darker font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all"
                                    >
                                      Guardar
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 gap-2 mt-2">
                                {seasonTournaments.map(t => (
                                  <div key={t.id} className="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs">
                                    <div>
                                      <div className="font-extrabold text-white uppercase">{t.name}</div>
                                      <div className="text-gray-400 text-[10px] font-semibold mt-0.5">
                                        {new Date(t.date).toLocaleDateString()} a las {t.time} • {t.locality}, {t.department}
                                      </div>
                                      {t.description && (
                                        <div className="text-gray-500 text-[10px] mt-1 font-sans italic line-clamp-1">{t.description}</div>
                                      )}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                      t.status === 'finalizado'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                        : t.status === 'en curso'
                                          ? 'bg-beyblade-electricRed/10 text-beyblade-electricRed border border-beyblade-electricRed/10 animate-pulse'
                                          : 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/10'
                                    }`}>
                                      {t.status === 'finalizado' ? 'Finalizado' : t.status === 'en curso' ? 'En Vivo' : 'Programado'}
                                    </span>
                                  </div>
                                ))}
                                {seasonTournaments.length === 0 && (
                                  <p className="text-[10px] text-gray-500 italic">No hay fechas agregadas a esta temporada.</p>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                          {season.status === 'draft' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await DbService.updateSeasonStatus(season.id!, 'active');
                                loadData();
                              }}
                              className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-white font-black font-esports text-[8px] uppercase tracking-widest rounded-lg transition-all"
                            >
                              Activar Temporada
                            </button>
                          )}
                          {season.status === 'active' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await DbService.updateSeasonStatus(season.id!, 'completed');
                                loadData();
                              }}
                              className="px-3.5 py-1.5 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-white font-black font-esports text-[8px] uppercase tracking-widest rounded-lg transition-all"
                            >
                              Finalizar Temporada
                            </button>
                          )}
                          {season.status === 'completed' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await DbService.updateSeasonStatus(season.id!, 'draft');
                                loadData();
                              }}
                              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 font-black font-esports text-[8px] uppercase tracking-widest rounded-lg transition-all"
                            >
                              Volver a Borrador
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {seasons.filter(s => s.country_id === currentUser.country_id).length === 0 && (
                      <p className="text-xs text-gray-500 italic py-6">No hay temporadas registradas para tu país.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Estadísticas Territoriales */}
          {activeDistributorTab === 'stats' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-white/5 pb-3">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Map className="h-4.5 w-4.5 text-beyblade-electricCyan" /> Mapa de Actividad Nacional ({currentUser.country_id})
                </h3>
                <p className="text-xs text-gray-400">Distribución territorial de ligas y competencia</p>
              </div>

              {currentUser.country_id === 'UY' ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                  {/* Interactive SVG map of Uruguay */}
                  <div className="lg:col-span-3 bg-beyblade-card border border-white/5 p-6 rounded-3xl flex items-center justify-center">
                    <svg viewBox="0 0 350 330" className="w-full max-w-sm h-auto overflow-visible select-none">
                      {/* Grid background */}
                      <g opacity="0.15">
                        <line x1="10" y1="50" x2="340" y2="50" stroke="#00F0FF" strokeWidth="0.5" />
                        <line x1="10" y1="100" x2="340" y2="100" stroke="#00F0FF" strokeWidth="0.5" />
                        <line x1="10" y1="150" x2="340" y2="150" stroke="#00F0FF" strokeWidth="0.5" />
                        <line x1="10" y1="200" x2="340" y2="200" stroke="#00F0FF" strokeWidth="0.5" />
                        <line x1="10" y1="250" x2="340" y2="250" stroke="#00F0FF" strokeWidth="0.5" />
                        <line x1="50" y1="10" x2="50" y2="320" stroke="#00F0FF" strokeWidth="0.5" />
                        <line x1="100" y1="10" x2="100" y2="320" stroke="#00F0FF" strokeWidth="0.5" />
                        <line x1="150" y1="10" x2="150" y2="320" stroke="#00F0FF" strokeWidth="0.5" />
                        <line x1="200" y1="10" x2="200" y2="320" stroke="#00F0FF" strokeWidth="0.5" />
                        <line x1="255" y1="10" x2="255" y2="320" stroke="#00F0FF" strokeWidth="0.5" />
                        <line x1="300" y1="10" x2="300" y2="320" stroke="#00F0FF" strokeWidth="0.5" />
                      </g>

                      {/* Department Polygons */}
                      {[
                        { name: 'Artigas', points: '180,20 230,20 220,50 170,40' },
                        { name: 'Salto', points: '130,50 180,50 170,100 120,95' },
                        { name: 'Rivera', points: '230,20 280,30 260,80 210,70' },
                        { name: 'Paysandú', points: '120,95 170,100 160,150 110,145' },
                        { name: 'Tacuarembó', points: '180,50 230,70 210,120 170,100' },
                        { name: 'Cerro Largo', points: '260,80 310,90 290,140 240,130' },
                        { name: 'Río Negro', points: '110,145 160,150 150,195 100,190' },
                        { name: 'Durazno', points: '160,150 210,155 200,200 150,195' },
                        { name: 'Treinta y Tres', points: '240,130 290,140 280,185 230,175' },
                        { name: 'Soriano', points: '90,190 140,195 130,240 80,235' },
                        { name: 'Flores', points: '140,195 170,195 160,230 130,230' },
                        { name: 'Florida', points: '170,195 210,200 200,245 160,240' },
                        { name: 'Lavalleja', points: '210,200 250,210 240,260 200,250' },
                        { name: 'Rocha', points: '260,230 300,240 280,290 240,280' },
                        { name: 'Colonia', points: '80,235 130,240 120,280 70,270' },
                        { name: 'San José', points: '130,240 160,245 150,285 120,280' },
                        { name: 'Canelones', points: '160,245 200,250 190,290 150,285' },
                        { name: 'Maldonado', points: '200,250 240,260 230,300 190,295' },
                        { name: 'Montevideo', points: '165,285 185,285 180,300 160,300' }
                      ].map((dept) => {
                        const isSelected = selectedDepartment?.toLowerCase() === dept.name.toLowerCase();
                        // Filter by country and locality/department
                        const pCount = players.filter(p => p.country_id === 'UY' && p.department?.toLowerCase() === dept.name.toLowerCase()).length;
                        const tCount = tournaments.filter(t => t.country_id === 'UY' && t.department?.toLowerCase() === dept.name.toLowerCase()).length;
                        const hasActivity = pCount > 0 || tCount > 0;

                        return (
                          <g key={dept.name} className="cursor-pointer" onClick={() => setSelectedDepartment(dept.name)}>
                            <polygon
                              points={dept.points}
                              className={`transition-all duration-300 ${
                                isSelected
                                  ? 'fill-beyblade-electricRed/30 stroke-beyblade-electricRed stroke-2'
                                  : hasActivity
                                    ? 'fill-beyblade-electricCyan/15 stroke-beyblade-electricCyan/60 hover:fill-beyblade-electricCyan/25'
                                    : 'fill-beyblade-darker/60 stroke-white/10 hover:fill-white/5'
                              }`}
                            />
                            {/* Selected Label tooltip overlay */}
                            {isSelected && (
                              <g className="pointer-events-none">
                                <rect
                                  x={Number(dept.points.split(' ')[0].split(',')[0]) - 10}
                                  y={Number(dept.points.split(' ')[0].split(',')[1]) - 18}
                                  width="65"
                                  height="15"
                                  rx="4"
                                  fill="#02050a"
                                  stroke="#00F0FF"
                                  strokeWidth="1"
                                />
                                <text
                                  x={Number(dept.points.split(' ')[0].split(',')[0]) + 22.5}
                                  y={Number(dept.points.split(' ')[0].split(',')[1]) - 7}
                                  fill="#fff"
                                  fontSize="7"
                                  fontWeight="black"
                                  textAnchor="middle"
                                >
                                  {dept.name}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Sidebar Detail of clicked department */}
                  <div className="lg:col-span-2 bg-beyblade-card border border-white/5 p-6 rounded-3xl space-y-5">
                    {selectedDepartment ? (
                      <div className="space-y-4">
                        <div className="border-b border-white/5 pb-2">
                          <h4 className="font-extrabold text-white text-base">{selectedDepartment}</h4>
                          <span className="text-[10px] text-gray-500 font-bold uppercase">Reporte Territorial Activo</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-beyblade-darker/60 border border-white/5 p-4 rounded-xl">
                            <span className="text-[9px] text-gray-500 font-bold uppercase">Jugadores</span>
                            <p className="text-xl font-black text-beyblade-electricCyan mt-1">
                              {players.filter(p => p.country_id === 'UY' && p.department?.toLowerCase() === selectedDepartment.toLowerCase()).length}
                            </p>
                          </div>
                          <div className="bg-beyblade-darker/60 border border-white/5 p-4 rounded-xl">
                            <span className="text-[9px] text-gray-500 font-bold uppercase">Torneos</span>
                            <p className="text-xl font-black text-beyblade-electricRed mt-1">
                              {tournaments.filter(t => t.country_id === 'UY' && t.department?.toLowerCase() === selectedDepartment.toLowerCase()).length}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Competidores Activos</span>
                          <div className="divide-y divide-white/5 max-h-40 overflow-y-auto no-scrollbar bg-beyblade-darker/30 border border-white/5 rounded-xl px-3">
                            {players
                              .filter(p => p.country_id === 'UY' && p.department?.toLowerCase() === selectedDepartment.toLowerCase())
                              .map((p, idx) => (
                                <div key={idx} className="py-2.5 flex justify-between text-xs">
                                  <span className="text-white font-bold">{p.first_name} {p.last_name}</span>
                                  <span className="text-gray-500 font-mono text-[10px]">Liga {p.league_id}</span>
                                </div>
                              ))}
                            {players.filter(p => p.country_id === 'UY' && p.department?.toLowerCase() === selectedDepartment.toLowerCase()).length === 0 && (
                              <p className="text-xs text-gray-500 italic py-4 text-center">No hay jugadores registrados en esta zona.</p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedDepartment(null)}
                          className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase rounded-xl transition-all"
                        >
                          Limpiar Filtro
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-3">
                        <Map className="h-8 w-8 text-gray-600 mx-auto" />
                        <p className="text-xs text-gray-400 font-bold uppercase">Selecciona una Zona</p>
                        <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                          Haz clic sobre un departamento del mapa interactivo de Uruguay para auditar las métricas de jugadores e historia de torneos correspondientes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-beyblade-card border border-white/5 p-8 rounded-3xl text-center text-gray-500 text-xs italic">
                  Mapa de calor y estadísticas por departamentos solo disponible para Uruguay (Piloto Principal).
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Retail País */}
          {activeDistributorTab === 'retail' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="h-4.5 w-4.5 text-beyblade-gold" /> Inventario de Tiendas ({currentUser.country_id})
                </h3>
              </div>

              {/* Inventory stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-beyblade-card border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Disponibles</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {allStocks.filter(s => {
                      const store = stores.find(st => st.id === s.store_id);
                      return s.stock_status === 'Disponible' && store?.country_id === currentUser.country_id;
                    }).length}
                  </p>
                </div>
                <div className="bg-beyblade-card border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Pocas Unidades</span>
                  <p className="text-2xl font-black text-amber-500 mt-1">
                    {allStocks.filter(s => {
                      const store = stores.find(st => st.id === s.store_id);
                      return s.stock_status === 'Poco stock' && store?.country_id === currentUser.country_id;
                    }).length}
                  </p>
                </div>
                <div className="bg-beyblade-card border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Agotado</span>
                  <p className="text-2xl font-black text-beyblade-electricRed mt-1">
                    {allStocks.filter(s => {
                      const store = stores.find(st => st.id === s.store_id);
                      return s.stock_status === 'Agotado' && store?.country_id === currentUser.country_id;
                    }).length}
                  </p>
                </div>
              </div>

              {/* Local retail list details */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Tiendas Certificadas y Disponibilidad</h3>
                <div className="space-y-3">
                  {stores.filter(st => st.country_id === currentUser.country_id).map((store) => {
                    const storeStocksList = allStocks.filter(s => s.store_id === store.id);
                    return (
                      <div key={store.id} className="bg-beyblade-card border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{store.name}</h4>
                          <p className="text-xs text-gray-400">{store.address} • {store.locality}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded uppercase">
                            {storeStocksList.filter(s => s.stock_status === 'Disponible').length} Disponibles
                          </span>
                          <span className="px-2 py-0.5 bg-beyblade-electricRed/10 text-beyblade-electricRed text-[9px] font-black rounded uppercase">
                            {storeStocksList.filter(s => s.stock_status === 'Agotado').length} Agotados
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {stores.filter(st => st.country_id === currentUser.country_id).length === 0 && (
                    <p className="text-xs text-gray-500 italic py-4 text-center">No hay locales registrados en tu país.</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORGANIZADOR CERTIFICADO PANEL */}
      {/* ========================================================================= */}
      {currentUser.role === 'Organizador' && (
        <div className="space-y-8">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setOrganizerTab('tournaments')}
                className={`text-lg font-black uppercase tracking-wide transition-all ${
                  organizerTab === 'tournaments' ? 'text-white border-b-2 border-beyblade-electricCyan pb-1' : 'text-gray-500 hover:text-white'
                }`}
              >
                Torneos Competitivos
              </button>
              <button
                type="button"
                onClick={() => setOrganizerTab('seasons')}
                className={`text-lg font-black uppercase tracking-wide transition-all ${
                  organizerTab === 'seasons' ? 'text-white border-b-2 border-beyblade-electricCyan pb-1' : 'text-gray-500 hover:text-white'
                }`}
              >
                Temporadas y Ligas
              </button>
              <button
                type="button"
                onClick={() => setOrganizerTab('journeys')}
                className={`text-lg font-black uppercase tracking-wide transition-all ${
                  organizerTab === 'journeys' ? 'text-white border-b-2 border-beyblade-electricCyan pb-1' : 'text-gray-500 hover:text-white'
                }`}
              >
                Jornadas Piloto
              </button>
            </div>
            
            {organizerTab === 'tournaments' ? (
              <button
                onClick={() => setIsCreatingTournament(!isCreatingTournament)}
                className="px-4 py-2 bg-beyblade-electricCyan text-beyblade-darker font-bold text-xs uppercase rounded-lg flex items-center gap-1 hover:bg-beyblade-electricCyan/80 transition-all"
              >
                <Plus className="h-4 w-4" /> {isCreatingTournament ? 'Cancelar' : 'Crear Torneo'}
              </button>
            ) : organizerTab === 'journeys' ? (
              <button
                onClick={() => setIsCreatingJourney(!isCreatingJourney)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs uppercase rounded-lg flex items-center gap-1 transition-all"
              >
                <Plus className="h-4 w-4" /> {isCreatingJourney ? 'Cancelar' : 'Crear Jornada'}
              </button>
            ) : null}
          </div>

          {/* Creation Form */}
          {organizerTab === 'tournaments' && isCreatingTournament && (
            <form onSubmit={handleCreateTournament} className="bg-beyblade-card border border-beyblade-electricCyan/30 p-6 rounded-3xl space-y-4 animate-slide-in">
              <h3 className="font-bold text-sm text-white uppercase tracking-wide">Crear Nuevo Torneo Competitivo</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Nombre del Torneo *</label>
                  <input
                    type="text"
                    required
                    value={newTourName}
                    onChange={(e) => setNewTourName(e.target.value)}
                    placeholder="Ej. Copa Invierno Montevideo"
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Liga Competitiva *</label>
                  <select
                    value={newTourLeague}
                    onChange={(e) => setNewTourLeague(e.target.value as any)}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                  >
                    <option value="Junior">Liga Junior (6-14)</option>
                    <option value="Open">Liga Open (14+)</option>
                    <option value="Ambas">Ambas Ligas</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Dirección / Ubicación del Torneo *</label>
                <LocationAutocomplete
                  countryCode={currentUser.country_id}
                  onSelect={(loc) => {
                    setErrorMsg('');
                    setNewTourLocation(loc);
                  }}
                  placeholder="Busca una dirección o lugar (ej: Montevideo Shopping, Av. 18 de Julio 1234...)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={newTourDate}
                    onChange={(e) => setNewTourDate(e.target.value)}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Hora *</label>
                  <input
                    type="time"
                    required
                    value={newTourTime}
                    onChange={(e) => setNewTourTime(e.target.value)}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Cupos Totales *</label>
                  <input
                    type="number"
                    required
                    value={newTourSlots}
                    onChange={(e) => setNewTourSlots(Number(e.target.value))}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Formato *</label>
                  <select
                    value={newTourFormat}
                    onChange={(e) => setNewTourFormat(e.target.value as any)}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                  >
                    <option value="Eliminación Directa">Eliminación Directa</option>
                    <option value="Suizo">Suizo</option>
                    <option value="Round Robin">Round Robin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Juez Asignado</label>
                  <select
                    value={newTourJudgeId}
                    onChange={(e) => setNewTourJudgeId(e.target.value)}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                  >
                    <option value="">Seleccionar Juez Aprobado</option>
                    {judges.filter(j => j.status === 'Aprobado').map(j => (
                      <option key={j.id} value={j.id}>{j.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Temporada Oficial</label>
                  <select
                    value={newTourSeasonId}
                    onChange={(e) => setNewTourSeasonId(e.target.value)}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                  >
                    <option value="">Seleccionar Temporada (Opcional)</option>
                    {seasons.filter(s => s.status === 'active').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.league_type.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Descripción</label>
                  <input
                    type="text"
                    value={newTourDesc}
                    onChange={(e) => setNewTourDesc(e.target.value)}
                    placeholder="Detalles sobre reglamento, premios..."
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-beyblade-electricCyan text-beyblade-darker font-extrabold text-xs uppercase rounded-xl shadow-neon-cyan hover:bg-beyblade-electricCyan/80 transition-all"
              >
                Crear y Publicar Torneo Oficial
              </button>
            </form>
          )}

          {/* List of my tournaments for management */}
          {organizerTab === 'tournaments' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tournaments Select list */}
            <div className="space-y-3 lg:col-span-1">
              <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider">Gestionar Eventos</h3>
              {tournaments.filter(t => t.organizer_id === currentUser.id).map(t => (
                <div
                  key={t.id}
                  onClick={() => handleSelectManageTournament(t)}
                  className={`bg-beyblade-card border p-4 rounded-xl cursor-pointer transition-all ${
                    selectedManageTour?.id === t.id ? 'border-beyblade-electricCyan' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <h4 className="font-extrabold text-white text-xs">{t.name}</h4>
                  <p className="text-[10px] text-gray-500 mt-1">Estado: {t.status} • Liga: {t.league_id}</p>
                </div>
              ))}
            </div>

            {/* Tournament Management Controls (Check-in & Placements loading) */}
            <div className="lg:col-span-2">
              {selectedManageTour ? (
                <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 space-y-6">
                  {/* Tournament Title & Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-white uppercase">{selectedManageTour.name}</h3>
                      <p className="text-xs text-gray-500">Módulo de Gestión Competitiva Oficial</p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {selectedManageTour.status !== 'finalizado' && (
                        <button
                          onClick={() => {
                            setIsScanningQR(true);
                            setScanResult(null);
                          }}
                          className="px-4 py-2.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/80 text-beyblade-darker font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-1.5 shadow-neon-cyan"
                        >
                          <Camera className="h-4 w-4" /> Acreditar por QR
                        </button>
                      )}
                      
                      {/* Print PDF Button */}
                      <button
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            const pList = manageRegistrations.filter(r => r.checked_in);
                            const wList = waitlistEntries;
                            const bMatches = bracketMatches;
                            const resultsText = selectedManageTour.status === 'finalizado' ? `
                              <div style="margin-top: 20px;">
                                <h3>Resultados Finales:</h3>
                                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                                  <thead>
                                    <tr style="border-bottom: 2px solid #333; text-align: left;">
                                      <th style="padding: 8px;">Posición</th>
                                      <th style="padding: 8px;">Jugador</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${pList.map((p, idx) => `
                                      <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 8px; font-weight: bold;">${idx + 1}º</td>
                                        <td style="padding: 8px;">${p.player_name}</td>
                                      </tr>
                                    `).join('')}
                                  </tbody>
                                </table>
                              </div>
                            ` : '';

                            const bracketsText = bMatches.length > 0 ? `
                              <div style="margin-top: 20px;">
                                <h3>Llave de Brackets (Enfrentamientos):</h3>
                                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                                  ${bMatches.map(m => `
                                    <div style="border: 1px solid #ccc; padding: 10px; border-radius: 8px; background: #fafafa;">
                                      <strong>Ronda ${m.round_number} - Combate ${m.match_number + 1}</strong><br/>
                                      ${m.player1_name || 'Pendiente'} (${m.player1_score}) vs 
                                      ${m.player2_name ? `${m.player2_name} (${m.player2_score})` : m.bye_assigned ? 'BYE (Pase directo)' : 'Pendiente'}
                                      ${m.winner_name ? `<br/><span style="color: green; font-weight: bold;">Ganador: ${m.winner_name}</span>` : ''}
                                    </div>
                                  `).join('')}
                                </div>
                              </div>
                            ` : '';

                            const waitlistText = wList.length > 0 ? `
                              <div style="margin-top: 20px;">
                                <h3>Lista de Espera (${wList.length} Jugadores):</h3>
                                <ul style="list-style-type: decimal; padding-left: 20px; margin-top: 10px;">
                                  ${wList.map(w => `<li>${w.player_name} (Posición ${w.position})</li>`).join('')}
                                </ul>
                              </div>
                            ` : '';

                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Reporte de Torneo: ${selectedManageTour.name}</title>
                                  <style>
                                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #222; margin: 40px; line-height: 1.5; }
                                    h1 { border-bottom: 2px solid #00F0FF; padding-bottom: 10px; font-size: 24px; text-transform: uppercase; color: #111; }
                                    .meta-info { margin-top: 10px; font-size: 13px; color: #555; background: #f0fdfa; border: 1px solid #99f6e4; padding: 12px; border-radius: 8px; }
                                    h3 { font-size: 16px; text-transform: uppercase; margin-bottom: 5px; color: #0f766e; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px;}
                                    @media print {
                                      body { margin: 20px; font-size: 12px; }
                                    }
                                  </style>
                                </head>
                                <body>
                                  <h1>Reporte Oficial de Competencia</h1>
                                  <div class="meta-info">
                                    <strong>Torneo:</strong> ${selectedManageTour.name}<br/>
                                    <strong>Organizador:</strong> ${selectedManageTour.organizer_name}<br/>
                                    <strong>Fecha/Hora:</strong> ${selectedManageTour.date} a las ${selectedManageTour.time}<br/>
                                    <strong>Ubicación:</strong> ${selectedManageTour.address}, ${selectedManageTour.locality}<br/>
                                    <strong>Formato:</strong> ${selectedManageTour.format}<br/>
                                    <strong>Estado:</strong> ${selectedManageTour.status.toUpperCase()}
                                  </div>
                                  
                                  <h3>Acreditados (${pList.length} Jugadores):</h3>
                                  <ul style="list-style-type: decimal; padding-left: 20px; margin-top: 10px;">
                                    ${pList.map(p => `<li>${p.player_name}</li>`).join('')}
                                  </ul>

                                  ${waitlistText}
                                  ${resultsText}
                                  ${bracketsText}

                                  <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 15px;">
                                    Generado automáticamente por la Plataforma Oficial Beyblade Uruguay / LATAM. Let it Rip!
                                  </div>
                                  <script>
                                    window.onload = function() { window.print(); }
                                  </script>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        }}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Printer className="h-4 w-4" /> Imprimir Reporte
                      </button>

                      <button
                        onClick={() => handleDeleteTournament(selectedManageTour.id)}
                        className="px-4 py-2.5 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed/20 border border-beyblade-electricRed/30 text-beyblade-electricRed font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar Torneo
                      </button>
                    </div>
                  </div>

                  {isScanningQR && (
                    <div className="space-y-4 p-4 bg-beyblade-darker/60 border border-white/5 rounded-2xl">
                      {/* Mode Toggle */}
                      <div className="flex bg-beyblade-darker p-1 rounded-xl border border-white/5 mb-4 self-start w-fit">
                        <button
                          type="button"
                          onClick={() => {
                            setScannerMode('camera');
                            setScanResult(null);
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-colors ${
                            scannerMode === 'camera' 
                              ? 'bg-beyblade-electricCyan text-beyblade-darker' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Cámara Real
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScannerMode('demo');
                            setScanResult(null);
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-colors ${
                            scannerMode === 'demo' 
                              ? 'bg-beyblade-electricCyan text-beyblade-darker' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Simulador Demo
                        </button>
                      </div>

                      {scannerMode === 'camera' ? (
                        <RealQRScanner 
                          onScanSuccess={handleQRScanSuccess}
                          onScanError={(msg) => {
                            setScanResult({
                              success: false,
                              error: 'scan_error',
                              message: msg
                            });
                          }}
                          onClose={() => {
                            setIsScanningQR(false);
                            setScanResult(null);
                          }}
                        />
                      ) : (
                        <QRScanner 
                          registrations={manageRegistrations}
                          onScanSuccess={handleQRScanSuccess}
                          onClose={() => {
                            setIsScanningQR(false);
                            setScanResult(null);
                          }}
                        />
                      )}
                      
                      {scanResult && (
                        <div className="bg-beyblade-dark border border-white/5 p-4 rounded-xl space-y-3 animate-slide-in">
                          {scanResult.success ? (
                            <div className="space-y-2 text-left">
                              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase">
                                <Check className="h-4.5 w-4.5" /> Jugador encontrado
                              </div>
                              <p className="text-xs text-gray-300">
                                Nombre: <strong className="text-white">{scanResult.nombre}</strong> <br />
                                Torneo: <strong className="text-white">{selectedManageTour.name}</strong> <br />
                                Estado: <span className="text-emerald-400 font-bold">Inscripto - Acreditación pendiente</span>
                              </p>
                              <button
                                onClick={handleConfirmQRCheckIn}
                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase rounded-xl transition-all"
                              >
                                [ Confirmar Check-In ]
                              </button>
                            </div>
                          ) : scanResult.warning ? (
                            <div className="space-y-2 text-left">
                              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase">
                                <AlertCircle className="h-4.5 w-4.5" /> Check-in ya registrado
                              </div>
                              <p className="text-xs text-gray-300">
                                El jugador <strong className="text-white">{scanResult.nombre}</strong> ya tiene su asistencia confirmada en la lista.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 text-left">
                              <div className="flex items-center gap-2 text-beyblade-electricRed font-extrabold text-xs uppercase">
                                <X className="h-4.5 w-4.5" /> Jugador no inscripto
                              </div>
                              <p className="text-xs text-gray-300">{scanResult.message}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-tab selection within tournament details */}
                  <div className="flex border-b border-white/5 pb-2">
                    <button
                      type="button"
                      onClick={() => setOrganizerTournamentsTab('acreditacion')}
                      className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                        organizerTournamentsTab === 'acreditacion'
                          ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Acreditación e Inscripción
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrganizerTournamentsTab('brackets')}
                      className={`px-4 py-2 font-bold text-xs uppercase border-b-2 transition-all ${
                        organizerTournamentsTab === 'brackets'
                          ? 'border-beyblade-electricCyan text-beyblade-electricCyan font-black'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" /> Fase Eliminatoria (Brackets)
                      </span>
                    </button>
                  </div>

                  {/* Sub-tab 1: Acreditacion e Inscripcion */}
                  {organizerTournamentsTab === 'acreditacion' && (
                    <div className="space-y-6 animate-fade-in text-left">
                      {/* Attendance Confirmations list */}
                      <div className="space-y-3">
                        <h4 className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5">
                          <CheckSquare className="h-4 w-4 text-beyblade-electricCyan" /> Confirmación de Asistencia (48hs Antes)
                        </h4>
                        <p className="text-[10px] text-gray-500">
                          Revisa la lista de confirmados y gestiona cancelaciones. Si un jugador declina asistencia, se liberará su plaza para la lista de espera.
                        </p>
                        <div className="divide-y divide-white/5 bg-beyblade-dark rounded-xl border border-white/5 overflow-hidden text-xs max-h-48 overflow-y-auto no-scrollbar">
                          {attendanceConfirmations.map((a) => (
                            <div key={a.id} className="p-3 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-white block">{a.player_name}</span>
                                <span className={`text-[8.5px] font-black uppercase ${
                                  a.confirmed === true ? 'text-emerald-400' :
                                  a.confirmed === false ? 'text-beyblade-electricRed' : 'text-gray-500'
                                }`}>
                                  {a.confirmed === true ? 'Asistencia Confirmada' :
                                   a.confirmed === false ? 'Cancelado / Liberado' : 'Pendiente de Respuesta'}
                                </span>
                              </div>
                              {a.confirmed !== false && (
                                <div className="flex gap-2">
                                  {a.confirmed !== true && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAttendanceConfirmation(a.player_id, true)}
                                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold text-[9px] uppercase rounded transition-all"
                                    >
                                      Confirmar
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateAttendanceConfirmation(a.player_id, false)}
                                    className="px-2.5 py-1 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-beyblade-electricRed hover:text-white font-bold text-[9px] uppercase rounded transition-all"
                                  >
                                    Declinar / Liberar
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          {attendanceConfirmations.length === 0 && (
                            <p className="text-[10px] text-gray-500 italic p-3 text-center">No hay confirmaciones de asistencia pendientes en este torneo.</p>
                          )}
                        </div>
                      </div>

                      {/* Waitlist list */}
                      <div className="space-y-3">
                        <h4 className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5">
                          <List className="h-4 w-4 text-beyblade-gold" /> Lista de Espera (Waitlist)
                        </h4>
                        <div className="divide-y divide-white/5 bg-beyblade-dark rounded-xl border border-white/5 overflow-hidden text-xs max-h-48 overflow-y-auto no-scrollbar">
                          {waitlistEntries.map((w) => (
                            <div key={w.id} className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-gray-400">#{w.position}</span>
                                <span className="font-bold text-white">{w.player_name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`¿Seguro que deseas remover a ${w.player_name} de la lista de espera?`)) {
                                    await DbService.leaveWaitlist(selectedManageTour.id, w.player_id);
                                    await refreshManageTournamentCompetitiveData(selectedManageTour.id);
                                  }
                                }}
                                className="px-2 py-1 bg-beyblade-electricRed/10 hover:bg-beyblade-electricRed text-white font-bold text-[9px] uppercase rounded transition-all"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                          {waitlistEntries.length === 0 && (
                            <p className="text-[10px] text-gray-500 italic p-3 text-center">La lista de espera está vacía.</p>
                          )}
                        </div>
                      </div>

                      {/* Checked In Present Players list */}
                      <div className="space-y-3">
                        <h4 className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5">
                          <CheckSquare className="h-4 w-4 text-emerald-400" /> Acreditación de Jugadores (Checked-in)
                        </h4>
                        <div className="divide-y divide-white/5 bg-beyblade-dark rounded-xl border border-white/5 overflow-hidden max-h-60 overflow-y-auto no-scrollbar">
                          {manageRegistrations.map((r) => (
                            <div key={r.id} className="p-3 flex items-center justify-between text-xs">
                              <span className="font-bold text-white">{r.player_name}</span>
                              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-400">
                                <input
                                  type="checkbox"
                                  checked={r.checked_in}
                                  onChange={(e) => handleCheckInToggle(r.id, e.target.checked)}
                                  className="rounded border-white/10 text-beyblade-electricCyan bg-beyblade-darker focus:ring-0"
                                />
                                Presente / Acreditado
                              </label>
                            </div>
                          ))}
                          {manageRegistrations.length === 0 && (
                            <p className="text-[10px] text-gray-500 italic p-3 text-center">No hay jugadores inscriptos en este torneo.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 2: Brackets / Eliminatoria */}
                  {organizerTournamentsTab === 'brackets' && (
                    <div className="space-y-6 animate-fade-in text-left">
                      {bracketLoading ? (
                        <div className="text-center py-12 space-y-3">
                          <Loader2 className="h-8 w-8 text-beyblade-electricCyan animate-spin mx-auto" />
                          <p className="text-xs text-gray-400 font-bold">Procesando estructura eliminatoria...</p>
                        </div>
                      ) : activeBracket ? (
                        <div className="space-y-6">
                          {/* Active Bracket Details */}
                          <div className="flex justify-between items-center bg-beyblade-dark/60 p-4 border border-white/5 rounded-2xl">
                            <div>
                              <span className="text-[9px] text-emerald-400 font-bold uppercase block">Fase Eliminatoria Activa</span>
                              <h4 className="text-xs font-black text-white uppercase tracking-wider font-esports">Bracket de Eliminación Simple</h4>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">Bracket ID: {activeBracket.id?.substring(0, 8)}</span>
                          </div>

                          {/* Bracket Matches Visual Tree Map */}
                          <div className="overflow-x-auto pb-4 no-scrollbar">
                            <div className="flex gap-8 min-w-[650px] items-stretch justify-start pt-2">
                              {(() => {
                                // Group matches by round
                                const roundsMap: { [round: number]: BracketMatch[] } = {};
                                bracketMatches.forEach(m => {
                                  if (!roundsMap[m.round_number]) roundsMap[m.round_number] = [];
                                  roundsMap[m.round_number].push(m);
                                });

                                const roundNumbers = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
                                
                                return roundNumbers.map((roundNum) => {
                                  const matchesInRound = roundsMap[roundNum];
                                  
                                  // Formatting round name
                                  let roundName = `Ronda ${roundNum}`;
                                  if (roundNum === roundNumbers.length) roundName = 'Gran Final';
                                  else if (roundNum === roundNumbers.length - 1) roundName = 'Semifinal';
                                  else if (roundNum === roundNumbers.length - 2) roundName = 'Cuartos de Final';
                                  else if (roundNum === roundNumbers.length - 3) roundName = 'Octavos de Final';

                                  return (
                                    <div key={roundNum} className="flex-1 flex flex-col justify-around gap-4 min-w-[200px]">
                                      <div className="text-center pb-2 border-b border-white/5">
                                        <span className="text-[9px] font-black uppercase text-beyblade-electricCyan font-esports tracking-widest">{roundName}</span>
                                      </div>
                                      
                                      <div className="flex flex-col justify-around h-full gap-4">
                                        {matchesInRound.map((m) => {
                                          const isCompleted = m.status === 'completed';
                                          const isSelected = selectedMatchForScore?.id === m.id;

                                          return (
                                            <div
                                              key={m.id}
                                              className={`bg-beyblade-darker/60 border rounded-2xl p-3 text-xs space-y-2 transition-all relative ${
                                                isCompleted 
                                                  ? 'border-white/5 opacity-80' 
                                                  : isSelected
                                                  ? 'border-beyblade-electricCyan ring-1 ring-beyblade-electricCyan'
                                                  : 'border-beyblade-electricCyan/25 hover:border-beyblade-electricCyan/50 cursor-pointer'
                                              }`}
                                              onClick={() => {
                                                if (!isCompleted && !m.bye_assigned && (m.player1_id || m.player2_id)) {
                                                  setSelectedMatchForScore(m);
                                                  setScoreP1(m.player1_score || 0);
                                                  setScoreP2(m.player2_score || 0);
                                                }
                                              }}
                                            >
                                              {/* Player 1 Card slot */}
                                              <div className="flex justify-between items-center">
                                                <span className={`font-bold truncate max-w-[120px] ${
                                                  isCompleted && m.winner_id === m.player1_id ? 'text-beyblade-electricCyan' : 'text-white'
                                                }`}>
                                                  {m.player1_name || 'Pendiente'}
                                                </span>
                                                <span className="font-mono font-black text-white">{m.player1_score}</span>
                                              </div>

                                              {/* Vs separator line */}
                                              <div className="h-[1px] bg-white/5 w-full"></div>

                                              {/* Player 2 Card slot */}
                                              <div className="flex justify-between items-center">
                                                {m.bye_assigned ? (
                                                  <span className="text-emerald-400/80 font-black uppercase text-[8px] font-esports tracking-wide">
                                                    [ BYE / Pase Directo ]
                                                  </span>
                                                ) : (
                                                  <span className={`font-bold truncate max-w-[120px] ${
                                                    isCompleted && m.winner_id === m.player2_id ? 'text-beyblade-electricCyan' : 'text-white'
                                                  }`}>
                                                    {m.player2_name || 'Pendiente'}
                                                  </span>
                                                )}
                                                <span className="font-mono font-black text-white">
                                                  {m.bye_assigned ? '-' : m.player2_score}
                                                </span>
                                              </div>

                                              {/* Winner Badge */}
                                              {isCompleted && m.winner_name && (
                                                <div className="text-[8px] font-black uppercase text-emerald-400 font-esports pt-1 flex items-center gap-0.5">
                                                  <Check className="h-3 w-3" /> Ganó {m.winner_name.split(' ')[0]}
                                                </div>
                                              )}

                                              {/* Inline score editor */}
                                              {isSelected && (
                                                <div className="bg-beyblade-dark p-3.5 rounded-xl border border-white/5 space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                                  <h5 className="text-[9px] font-black uppercase text-beyblade-electricCyan tracking-wider font-esports">Registrar Resultado</h5>
                                                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                                    <div>
                                                      <span className="text-[8px] text-gray-500 font-bold uppercase truncate block max-w-[80px]">{m.player1_name?.split(' ')[0]}</span>
                                                      <input
                                                        type="number"
                                                        value={scoreP1}
                                                        onChange={(e) => setScoreP1(Number(e.target.value))}
                                                        className="w-12 bg-beyblade-darker border border-white/10 rounded px-1.5 py-1 text-center font-bold text-white mt-1"
                                                      />
                                                    </div>
                                                    <div>
                                                      <span className="text-[8px] text-gray-500 font-bold uppercase truncate block max-w-[80px]">{m.player2_name?.split(' ')[0]}</span>
                                                      <input
                                                        type="number"
                                                        value={scoreP2}
                                                        onChange={(e) => setScoreP2(Number(e.target.value))}
                                                        className="w-12 bg-beyblade-darker border border-white/10 rounded px-1.5 py-1 text-center font-bold text-white mt-1"
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="flex gap-1.5 pt-1">
                                                    <button
                                                      type="button"
                                                      onClick={async () => {
                                                        const winId = scoreP1 > scoreP2 ? m.player1_id : m.player2_id;
                                                        if (winId) {
                                                          await handleSubmitBracketScore(m.id!, winId, scoreP1, scoreP2);
                                                        } else {
                                                          setErrorMsg('No se puede determinar un ganador. Empate no permitido.');
                                                        }
                                                      }}
                                                      className="flex-1 py-1.5 bg-beyblade-electricCyan text-beyblade-darker font-black font-esports text-[8.5px] uppercase tracking-wider rounded"
                                                    >
                                                      Guardar
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => setSelectedMatchForScore(null)}
                                                      className="px-2 py-1.5 bg-white/5 text-gray-400 font-bold text-[8.5px] uppercase rounded"
                                                    >
                                                      X
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Warning / Call to Action */}
                          <div className="bg-beyblade-dark border border-white/5 rounded-3xl p-6 space-y-4 text-center">
                            <Trophy className="h-10 w-10 text-beyblade-electricCyan mx-auto animate-pulse" />
                            <h4 className="font-extrabold text-white text-sm uppercase">Llave de Brackets Eliminatorios sin Generar</h4>
                            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                              Acredita a los jugadores presentes en la pestaña **"Acreditación e Inscripción"**. Una vez listos todos los checked-in, presiona el botón para realizar el sorteo automático de BYEs y generar el bracket eliminatorio oficial.
                            </p>
                            <button
                              type="button"
                              onClick={handleGenerateBracket}
                              className="px-6 py-2.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-neon-cyan"
                            >
                              Generar Brackets y Sorteo BYEs
                            </button>
                          </div>

                          {/* Fallback Legacy Manual Placements input */}
                          <div className="border-t border-white/5 pt-6 space-y-4">
                            <div className="flex flex-col gap-1">
                              <h4 className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5">
                                <Settings className="h-4 w-4" /> Fallback: Carga Manual de Resultados (Legacy)
                              </h4>
                              <p className="text-[10px] text-gray-500">
                                Utiliza esta sección si prefieres registrar las posiciones finales manualmente en lugar de generar un bracket interactivo.
                              </p>
                            </div>
                            
                            <div className="space-y-2 bg-beyblade-dark rounded-xl border border-white/5 p-4">
                              {manageRegistrations.filter(r => r.checked_in).map(r => (
                                <div key={r.id} className="flex justify-between items-center text-xs">
                                  <span className="text-white font-bold">{r.player_name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Puesto:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      value={placements[r.player_id] || ''}
                                      onChange={(e) => setPlacements({ ...placements, [r.player_id]: Number(e.target.value) })}
                                      className="w-16 bg-beyblade-darker border border-white/10 rounded-lg px-2 py-1 text-center font-bold text-white"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={handleSavePlacements}
                              className="w-full py-3 bg-beyblade-electricRed text-white font-extrabold text-xs uppercase rounded-xl shadow-neon-red hover:bg-beyblade-electricRed/80 transition-all"
                            >
                              Enviar Posiciones al Distribuidor
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-beyblade-card border border-white/5 rounded-3xl p-12 text-center text-gray-500 text-xs italic">
                  Selecciona un torneo de la izquierda para tomar asistencia o ingresar resultados.
                </div>
              )}
            </div>
          </div>
          )}

          {/* Journey Creation Form */}
          {organizerTab === 'journeys' && isCreatingJourney && (
            <form onSubmit={handleCreateJourney} className="bg-beyblade-card border border-purple-500/30 p-6 rounded-3xl space-y-4 animate-slide-in">
              <h3 className="font-bold text-sm text-white uppercase tracking-wide">Crear Nueva Jornada de Entrenamiento / Taller</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">Título de la Jornada *</label>
                  <input
                    type="text"
                    required
                    value={newJourneyTitle}
                    onChange={(e) => setNewJourneyTitle(e.target.value)}
                    placeholder="Ej. Taller de Lanzamientos y Customización"
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Fecha *</label>
                    <input
                      type="date"
                      required
                      value={newJourneyDate}
                      onChange={(e) => setNewJourneyDate(e.target.value)}
                      className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Hora *</label>
                    <input
                      type="time"
                      required
                      value={newJourneyTime}
                      onChange={(e) => setNewJourneyTime(e.target.value)}
                      className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Dirección / Ubicación de la Jornada *</label>
                <LocationAutocomplete
                  countryCode={currentUser.country_id}
                  onSelect={(loc) => {
                    setErrorMsg('');
                    setNewJourneyLocation(loc);
                  }}
                  placeholder="Busca la plaza, parque o club (ej: Parque Rodó, Club Fénix...)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Descripción de la Jornada</label>
                <textarea
                  value={newJourneyDesc}
                  onChange={(e) => setNewJourneyDesc(e.target.value)}
                  placeholder="Detalla de qué trata la jornada: traer estadios, repuestos, libre para todas las edades, etc."
                  rows={3}
                  className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-xs uppercase rounded-xl transition-all shadow-lg hover:shadow-purple-500/20"
              >
                Crear y Publicar Jornada Oficial
              </button>
            </form>
          )}

          {/* Journeys List */}
          {organizerTab === 'journeys' && (
            <div className="space-y-4">
              <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider">Jornadas Creadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {journeys.filter(j => j.created_by === currentUser.id).map(j => (
                  <div key={j.id} className="bg-beyblade-card border border-white/5 p-5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-black rounded uppercase">
                        Jornada
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold">
                        {new Date(j.starts_at).toLocaleDateString()} {new Date(j.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-white text-sm">{j.title}</h4>
                    {j.description && <p className="text-xs text-gray-400 line-clamp-2">{j.description}</p>}
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-purple-450 shrink-0" />
                      <span className="truncate">{j.address}</span>
                    </div>
                  </div>
                ))}
                {journeys.filter(j => j.created_by === currentUser.id).length === 0 && (
                  <p className="text-xs text-gray-500 italic py-6 col-span-full text-center">No has creado jornadas aún.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Seasons & Leagues for Organizers */}
          {organizerTab === 'seasons' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-5.5 w-5.5 text-beyblade-electricCyan" /> Gestión de Temporadas y Ligas
                </h2>
                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-xs font-bold text-gray-400">
                  {seasons.filter(s => s.country_id === currentUser.country_id).length} Temporadas registradas
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Create Season Form */}
                <div className="bg-beyblade-card border border-white/5 p-6 rounded-3xl space-y-4">
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider font-title">Nueva Temporada</h3>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Nombre de Temporada</label>
                      <input
                        type="text"
                        value={newSeasonName}
                        onChange={(e) => setNewSeasonName(e.target.value)}
                        placeholder="Ej: Temporada Open Uruguay 2026"
                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Liga / Categoría</label>
                      <select
                        value={newSeasonLeague}
                        onChange={(e) => setNewSeasonLeague(e.target.value as any)}
                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                      >
                        <option value="junior">Liga Junior</option>
                        <option value="open">Liga Open</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">Inicio</label>
                        <input
                          type="date"
                          value={newSeasonStartDate}
                          onChange={(e) => setNewSeasonStartDate(e.target.value)}
                          className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase">Fin (Opcional)</label>
                        <input
                          type="date"
                          value={newSeasonEndDate}
                          onChange={(e) => setNewSeasonEndDate(e.target.value)}
                          className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase">Descripción</label>
                      <textarea
                        value={newSeasonDesc}
                        onChange={(e) => setNewSeasonDesc(e.target.value)}
                        placeholder="Detalles de clasificación local, regional y nacional..."
                        rows={3}
                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (!newSeasonName || !newSeasonStartDate) {
                            throw new Error('Por favor completa los campos obligatorios (Nombre y Fecha de Inicio).');
                          }
                          await DbService.createSeason({
                            name: newSeasonName,
                            country_id: currentUser.country_id || 'UY',
                            league_type: newSeasonLeague,
                            start_date: newSeasonStartDate,
                            end_date: newSeasonEndDate || undefined,
                            description: newSeasonDesc,
                            status: 'draft'
                          });
                          setFeedback('¡Temporada creada como Borrador con éxito!');
                          setNewSeasonName('');
                          setNewSeasonStartDate('');
                          setNewSeasonEndDate('');
                          setNewSeasonDesc('');
                          loadData();
                          setTimeout(() => setFeedback(''), 3000);
                        } catch (err: any) {
                          setErrorMsg(err.message || 'Error al crear temporada.');
                          setTimeout(() => setErrorMsg(''), 4000);
                        }
                      }}
                      className="w-full py-2.5 bg-beyblade-electricCyan hover:bg-beyblade-electricCyan/85 text-beyblade-darker font-black font-esports text-[9px] uppercase tracking-widest rounded-xl transition-all"
                    >
                      Crear Temporada
                    </button>
                  </div>
                </div>

                {/* Right: Seasons List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seasons.filter(s => s.country_id === currentUser.country_id).map((season) => (
                      <div key={season.id} className="bg-beyblade-card border border-white/5 rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-white text-sm uppercase">{season.name}</h4>
                            <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                              Rango: {new Date(season.start_date).toLocaleDateString()} al {season.end_date ? new Date(season.end_date).toLocaleDateString() : 'Indefinido'}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black font-esports uppercase tracking-widest ${
                            season.status === 'active' 
                              ? 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/20' 
                              : season.status === 'completed'
                                ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                                : 'bg-gray-400/10 text-gray-400 border border-gray-400/20'
                          }`}>
                            {season.status === 'active' ? 'Activo' : season.status === 'completed' ? 'Finalizado' : 'Borrador'}
                          </span>
                        </div>
                        <div className="text-[9px] text-gray-400 font-bold font-esports tracking-wider">
                          LIGA {season.league_type.toUpperCase()}
                        </div>
                        {season.description && (
                          <p className="text-xs text-gray-400 border-t border-white/5 pt-2 leading-relaxed">
                            {season.description}
                          </p>
                        )}

                        {/* Fechas / Torneos of the season */}
                        {(() => {
                          const seasonTournaments = tournaments.filter(t => t.season_id === season.id);
                          return (
                            <div className="space-y-3 border-t border-white/5 pt-3">
                              <div className="flex justify-between items-center">
                                <h5 className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider font-esports">Fechas / Torneos</h5>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (addingDateSeasonId === season.id) {
                                      setAddingDateSeasonId(null);
                                    } else {
                                      setAddingDateSeasonId(season.id || null);
                                      setNewFechaName(`Fecha ${seasonTournaments.length + 1}`);
                                      setNewFechaDate('');
                                      setNewFechaTime('');
                                      setNewFechaLocation(null);
                                      setNewFechaDesc('');
                                      setNewFechaOrganizerId('');
                                      setNewFechaJudgeId('');
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-beyblade-electricCyan/10 hover:bg-beyblade-electricCyan hover:text-beyblade-darker border border-beyblade-electricCyan/20 hover:border-transparent text-beyblade-electricCyan font-black font-esports text-[8px] uppercase tracking-widest rounded transition-all"
                                >
                                  {addingDateSeasonId === season.id ? 'Cancelar' : '+ Agregar Fecha'}
                                </button>
                              </div>

                              {addingDateSeasonId === season.id && (
                                <div className="bg-black/30 border border-beyblade-electricCyan/20 p-4 rounded-xl space-y-3 mt-2 text-left">
                                  <h6 className="font-extrabold text-[9px] text-white uppercase tracking-wider font-title">Nueva Fecha para {season.name}</h6>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase">Nombre de la Fecha *</label>
                                      <input
                                        type="text"
                                        value={newFechaName}
                                        onChange={(e) => setNewFechaName(e.target.value)}
                                        placeholder="Ej: Fecha 1"
                                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase">Lugar *</label>
                                      <LocationAutocomplete
                                        countryCode={season.country_id}
                                        initialAddress=""
                                        onSelect={(loc) => setNewFechaLocation(loc)}
                                        placeholder="Busca el lugar..."
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase">Fecha *</label>
                                      <input
                                        type="date"
                                        value={newFechaDate}
                                        onChange={(e) => setNewFechaDate(e.target.value)}
                                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase">Hora *</label>
                                      <input
                                        type="time"
                                        value={newFechaTime}
                                        onChange={(e) => setNewFechaTime(e.target.value)}
                                        className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1 text-xs">
                                    <label className="text-[9px] text-gray-500 font-bold uppercase">Descripción (Opcional)</label>
                                    <textarea
                                      value={newFechaDesc}
                                      onChange={(e) => setNewFechaDesc(e.target.value)}
                                      placeholder="Reglas, premios u otros detalles..."
                                      rows={2}
                                      className="w-full bg-beyblade-darker border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setAddingDateSeasonId(null)}
                                      className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAddFechaToSeason(season)}
                                      className="px-4 py-1 bg-beyblade-electricCyan text-beyblade-darker font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all"
                                    >
                                      Guardar
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 gap-2 mt-2">
                                {seasonTournaments.map(t => (
                                  <div key={t.id} className="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs">
                                    <div>
                                      <div className="font-extrabold text-white uppercase">{t.name}</div>
                                      <div className="text-gray-400 text-[10px] font-semibold mt-0.5">
                                        {new Date(t.date).toLocaleDateString()} a las {t.time} • {t.locality}, {t.department}
                                      </div>
                                      {t.description && (
                                        <div className="text-gray-500 text-[10px] mt-1 font-sans italic line-clamp-1">{t.description}</div>
                                      )}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                      t.status === 'finalizado'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                        : t.status === 'en curso'
                                          ? 'bg-beyblade-electricRed/10 text-beyblade-electricRed border border-beyblade-electricRed/10 animate-pulse'
                                          : 'bg-beyblade-electricCyan/10 text-beyblade-electricCyan border border-beyblade-electricCyan/10'
                                    }`}>
                                      {t.status === 'finalizado' ? 'Finalizado' : t.status === 'en curso' ? 'En Vivo' : 'Programado'}
                                    </span>
                                  </div>
                                ))}
                                {seasonTournaments.length === 0 && (
                                  <p className="text-[10px] text-gray-500 italic">No hay fechas agregadas a esta temporada.</p>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                        <div className="flex gap-2 pt-1 border-t border-white/5">
                          {season.status === 'draft' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await DbService.updateSeasonStatus(season.id!, 'active');
                                loadData();
                              }}
                              className="px-3 py-1.5 bg-beyblade-electricCyan/10 hover:bg-beyblade-electricCyan text-beyblade-electricCyan hover:text-beyblade-darker border border-beyblade-electricCyan/20 hover:border-transparent font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all"
                            >
                              Activar
                            </button>
                          )}
                          {season.status === 'active' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await DbService.updateSeasonStatus(season.id!, 'completed');
                                loadData();
                              }}
                              className="px-3 py-1.5 bg-emerald-400/10 hover:bg-emerald-400 text-emerald-400 hover:text-beyblade-darker border border-emerald-400/20 hover:border-transparent font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all"
                            >
                              Finalizar
                            </button>
                          )}
                          {season.status === 'completed' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await DbService.updateSeasonStatus(season.id!, 'draft');
                                loadData();
                              }}
                              className="px-3 py-1.5 bg-gray-400/10 hover:bg-gray-400 text-gray-400 hover:text-beyblade-darker border border-gray-400/20 hover:border-transparent font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all"
                            >
                              Volver a Borrador
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {seasons.filter(s => s.country_id === currentUser.country_id).length === 0 && (
                      <p className="text-xs text-gray-500 italic py-6 col-span-full text-center">No hay temporadas o ligas registradas en tu país.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TIENDA CERTIFICADA PANEL */}
      {/* ========================================================================= */}
      {currentUser.role === 'Tienda' && myStore && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Update shop profile */}
            <form onSubmit={handleSaveStoreProfile} className="bg-beyblade-card border border-white/5 rounded-3xl p-6 space-y-4 lg:col-span-1">
              <h3 className="font-extrabold text-sm text-white uppercase border-b border-white/5 pb-2">Información del Local</h3>
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase">Nombre Comercial</label>
                  <input
                    type="text"
                    value={myStore.name}
                    onChange={(e) => setMyStore({ ...myStore, name: e.target.value })}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2 px-3 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase">Dirección Física (Buscar Ubicación) *</label>
                  <LocationAutocomplete
                    countryCode={myStore.country_id}
                    initialAddress={myStore.full_address || myStore.address}
                    initialCoords={myStore.latitude && myStore.longitude ? { lat: myStore.latitude, lng: myStore.longitude } : undefined}
                    onSelect={(loc) => {
                      const selectedCountry = loc.country_code?.toUpperCase();
                      const storeCountry = myStore.country_id?.toUpperCase();
                      
                      if (selectedCountry && storeCountry && selectedCountry !== storeCountry) {
                        setErrorMsg(`La ubicación seleccionada (${selectedCountry}) no corresponde al país de la tienda (${storeCountry}).`);
                        return;
                      }
                      
                      setErrorMsg('');
                      setMyStore({
                        ...myStore,
                        address: loc.address || loc.full_address,
                        full_address: loc.full_address,
                        department: loc.department || myStore.department,
                        locality: loc.locality || myStore.locality,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        geocoding_provider: loc.geocoding_provider,
                        osm_place_id: loc.osm_place_id,
                        osm_type: loc.osm_type,
                        osm_class: loc.osm_class,
                        osm_importance: loc.osm_importance,
                        geocoded_at: new Date().toISOString()
                      });
                    }}
                    placeholder="Busca la ubicación oficial de tu tienda..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase">Horario de Atención</label>
                  <input
                    type="text"
                    value={myStore.hours}
                    onChange={(e) => setMyStore({ ...myStore, hours: e.target.value })}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2 px-3 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase">Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={myStore.phone || ''}
                    onChange={(e) => setMyStore({ ...myStore, phone: e.target.value })}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2 px-3 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase">Enlace Web</label>
                  <input
                    type="text"
                    value={myStore.web_url || ''}
                    onChange={(e) => setMyStore({ ...myStore, web_url: e.target.value })}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2 px-3 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase">Instagram</label>
                  <input
                    type="text"
                    value={myStore.instagram || ''}
                    onChange={(e) => setMyStore({ ...myStore, instagram: e.target.value })}
                    className="w-full bg-beyblade-dark border border-white/10 rounded-xl py-2 px-3 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-beyblade-electricCyan text-beyblade-darker font-bold text-xs uppercase rounded-xl transition-all"
              >
                Guardar Cambios
              </button>
            </form>

            {/* Inventory stock manager */}
            <div className="bg-beyblade-card border border-white/5 rounded-3xl p-6 lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-sm text-white uppercase border-b border-white/5 pb-2">Control de Stock Oficial</h3>
              <div className="divide-y divide-white/5 text-xs">
                {storeStocks.map(stock => (
                  <div key={stock.product_id} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h4 className="font-extrabold text-white">{stock.productName}</h4>
                      <p className="text-gray-500 font-mono text-[9px]">{stock.product_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Disponibilidad:</span>
                      <select
                        value={stock.stock_status}
                        onChange={(e) => handleUpdateStock(stock.product_id, e.target.value as any)}
                        className="bg-beyblade-dark border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        <option value="Disponible">Disponible</option>
                        <option value="Poco stock">Poco stock</option>
                        <option value="Agotado">Agotado</option>
                        <option value="Proximamente">Próximamente</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISITANTE / JUGADOR FALLBACK DASHBOARD INFO */}
      {/* ========================================================================= */}
      {(currentUser.role === 'Jugador' || currentUser.role === 'Visitante') && (
        <div className="max-w-md mx-auto bg-beyblade-card border border-white/5 rounded-3xl p-8 text-center space-y-4">
          <Settings className="h-12 w-12 text-beyblade-electricCyan mx-auto" />
          <h2 className="text-xl font-bold text-white uppercase">Acceso Restringido</h2>
          <p className="text-sm text-gray-400">
            Esta sección contiene configuraciones, aprobaciones e inscripciones para Super Admins, Distribuidores Autorizados, Organizadores Certificados y Retailers.
          </p>
          <div className="p-3 bg-beyblade-dark text-[11px] text-beyblade-electricCyan rounded-xl border border-beyblade-electricCyan/25">
            Los permisos y accesos del sistema dependen exclusivamente de tu rol configurado en Supabase Auth (`beyblade.profiles.role`).
          </div>
        </div>
      )}

      {/* Simulated Email Notification Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {emailToasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-beyblade-darker/95 border-2 border-beyblade-electricCyan shadow-[0_0_15px_rgba(0,240,255,0.3)] p-4 rounded-2xl pointer-events-auto animate-slide-in space-y-2"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-[10px] font-black uppercase text-beyblade-electricCyan tracking-wider">📧 Correo Simulado</span>
              <button 
                onClick={() => setEmailToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-[9px] text-gray-500 hover:text-white uppercase font-bold"
              >
                Cerrar
              </button>
            </div>
            <div className="text-[11px] space-y-1">
              <p className="text-gray-400">
                Para: <strong className="text-white">{toast.to}</strong>
              </p>
              <p className="text-white font-bold">
                Asunto: {toast.subject}
              </p>
              <p className="text-gray-400 leading-relaxed pt-1">
                {toast.message}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
