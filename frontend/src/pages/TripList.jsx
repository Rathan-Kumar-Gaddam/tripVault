import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  User, 
  Settings, 
  Compass, 
  Wallet, 
  Users, 
  ArrowRight,
  Sparkles, 
  Plane, 
  X, 
  RefreshCw, 
  Search, 
  Bell, 
  Target, 
  Crown, 
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TripListSkeleton } from '../components/SkeletonLoader';

const PRESET_DESTINATIONS = [
  { name: '🏖️ Goa Beach', currency: '₹', budget: 25000 },
  { name: '🏔️ Manali Trek', currency: '₹', budget: 20000 },
  { name: '🌴 Bali Getaway', currency: '$', budget: 1200 },
  { name: '🏙️ Dubai Tour', currency: 'AED', budget: 5000 },
  { name: '✈️ Europe Eurotrip', currency: '€', budget: 2500 },
  { name: '🍣 Tokyo Adventure', currency: '¥', budget: 200000 },
  { name: '🏕️ Ladakh Roadtrip', currency: '₹', budget: 35000 },
];

const CURRENCIES = [
  { code: '₹', label: '₹ INR (India)' },
  { code: '$', label: '$ USD (United States)' },
  { code: '€', label: '€ EUR (Europe)' },
  { code: '£', label: '£ GBP (United Kingdom)' },
  { code: 'AED', label: 'AED (UAE Dirham)' },
  { code: '¥', label: '¥ JPY (Japan)' },
  { code: '฿', label: '฿ THB (Thailand)' },
  { code: 'CAD $', label: 'CAD $ (Canada)' },
  { code: 'AUD $', label: 'AUD $ (Australia)' },
];

// Helper to extract emoji or destination icon
const getTripIcon = (name = '') => {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;
  const match = name.match(emojiRegex);
  if (match) return match[0];
  const lower = name.toLowerCase();
  if (lower.includes('beach') || lower.includes('goa') || lower.includes('island')) return '🏖️';
  if (lower.includes('trek') || lower.includes('mountain') || lower.includes('hill') || lower.includes('manali')) return '🏔️';
  if (lower.includes('road') || lower.includes('trip') || lower.includes('drive') || lower.includes('ladakh')) return '🚗';
  if (lower.includes('camp') || lower.includes('forest')) return '🏕️';
  if (lower.includes('flight') || lower.includes('europe') || lower.includes('euro')) return '✈️';
  return '🗺️';
};

export default function TripsList() {
  const { user, trips, fetchTrips, createTrip, deleteTrip, isLoading } = useTripStore();
  const [showForm, setShowForm] = useState(false);
  const [tripName, setTripName] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [tripBudget, setTripBudget] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'admin' | 'needs_action'
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchTrips();
      toast.success('Trips synchronized! 🔄');
    } catch (e) {
      toast.error('Failed to sync trips.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isCreating) return;

    if (!tripName.trim()) {
      toast.error('Please enter a trip destination name');
      return;
    }

    try {
      setIsCreating(true);
      const payload = {
        name: tripName.trim(),
        currency,
      };
      if (Number(tripBudget) > 0) {
        payload.budget = Number(tripBudget);
      }
      
      const newTrip = await createTrip(payload);
      setShowForm(false);
      setTripName('');
      setTripBudget('');
      toast.success('New trip vault unlocked! 🚀');
      if (newTrip?._id) {
        navigate(`/trip/${newTrip._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create trip');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (tripToDelete) {
      try {
        setIsDeleting(true);
        await deleteTrip(tripToDelete);
        setTripToDelete(null); 
        toast.success('Trip vault permanently removed 🗑️');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete trip.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Portfolio Totals
  const totalVaultBalance = useMemo(() => {
    return trips.reduce((acc, t) => acc + (t.totalVault || 0), 0);
  }, [trips]);

  const totalCompanions = useMemo(() => {
    return trips.reduce((acc, t) => acc + (t.members?.length || 0), 0);
  }, [trips]);

  const totalPendingNotifications = useMemo(() => {
    return trips.reduce((acc, t) => acc + (t.pendingRequestsCount || 0), 0);
  }, [trips]);

  // Filtered trips list based on search and active tab
  const filteredTrips = useMemo(() => {
    return (trips || []).filter((t) => {
      // 1. Search filter
      const matchesSearch = !searchQuery.trim() || t.name?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Tab filter
      if (activeFilter === 'admin') {
        return t.members?.some(m => (m.user?._id || m.user)?.toString() === user?._id?.toString() && m.role === 'admin');
      }
      if (activeFilter === 'needs_action') {
        return (t.pendingRequestsCount || 0) > 0;
      }
      return true;
    });
  }, [trips, searchQuery, activeFilter, user?._id]);

  if (isLoading && trips.length === 0) {
    return <TripListSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 md:p-8 lg:p-10 pb-32">
      
      {/* ========================================================================= */}
      {/* 1. TOP MODERN HEADER                                                      */}
      {/* ========================================================================= */}
      <header className="flex justify-between items-center mb-6 sm:mb-8">
        <div className="flex items-center gap-3.5 min-w-0">
          <button 
            onClick={() => navigate('/profile')} 
            className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-extrabold text-lg overflow-hidden shadow-lg shadow-indigo-500/25 active:scale-95 transition-all border-2 border-white shrink-0 hover:ring-4 hover:ring-indigo-500/15"
            title="My Profile & Settings"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />
            )}
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading truncate">
                TripVault
              </h1>
              <Sparkles size={18} className="text-amber-400 shrink-0" />
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold truncate">
              Welcome back, <strong className="text-slate-800 font-bold">{user?.name?.split(' ')[0] || 'Traveler'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Total Pending Actions Notification Pill */}
          {totalPendingNotifications > 0 && (
            <div 
              onClick={() => setActiveFilter('needs_action')}
              className="cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 sm:px-3.5 py-2 rounded-2xl text-xs font-black shadow-md shadow-rose-500/20 active:scale-95 transition-all animate-pulse"
              title={`${totalPendingNotifications} action(s) need your response across vaults`}
            >
              <Bell size={14} className="fill-white" />
              <span>{totalPendingNotifications} {totalPendingNotifications === 1 ? 'Action' : 'Actions'}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-11 h-11 bg-white border border-slate-200/90 rounded-2xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-sm flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
            title="Sync All Trips"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          <button 
            onClick={() => navigate('/profile')} 
            title="Settings" 
            className="w-11 h-11 bg-white border border-slate-200/90 rounded-2xl text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm flex items-center justify-center active:scale-95 transition-all"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FUTURISTIC SHOWCASE HERO CARD                                          */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-[2.5rem] p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xl shadow-slate-950/20 border border-slate-800 relative overflow-hidden">
        {/* Glow ambient background orbs */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <Compass size={13} className="text-indigo-400" />
              <span>Multi-Vault Portfolio</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-heading mt-1">
              {trips.length} {trips.length === 1 ? 'Trip Active' : 'Trips Active'}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
              Live split ledgers, instant settlements, and automated peer vaults
            </p>
          </div>

          {/* Quick Launch "Plan Trip" Button */}
          <button
            onClick={() => setShowForm(true)}
            className="self-start md:self-auto bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl shadow-indigo-500/30 flex items-center gap-2.5 active:scale-95 transition-all group"
          >
            <div className="p-1.5 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
              <Plus size={16} strokeWidth={3} />
            </div>
            <span>New Trip Vault</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Hero Stat Chips */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Wallet size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Vaults</span>
              <strong className="text-white text-sm font-black">{trips.length} Destinations</strong>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Users size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Travelers</span>
              <strong className="text-white text-sm font-black">{totalCompanions} Companions</strong>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center gap-3 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Globe size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Currencies</span>
              <strong className="text-white text-sm font-black">Multi-Currency Ready</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH & FILTER TABS BAR                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips by destination or title..."
            className="w-full p-3.5 pl-11 pr-10 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeFilter === 'all' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Trips ({trips.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('admin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'admin' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <Crown size={13} />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('needs_action')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'needs_action' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
            }`}
          >
            <Bell size={13} />
            <span>Actions ({totalPendingNotifications})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. RESPONSIVE MODAL DIALOG FOR TRIP VAULT CREATION                        */}
      {/* ========================================================================= */}
      {showForm && (
        <div 
          onClick={() => setShowForm(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 duration-300"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-slate-50/90 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                  <Plane size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 font-heading">
                    Create New Trip Vault
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Set up a shared group ledger with custom currency & budget
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={isCreating}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all disabled:opacity-50"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreate} className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex flex-col gap-4">
              {/* Quick preset destination chips */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
                  Popular Presets (Tap to Autofill):
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {PRESET_DESTINATIONS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => { 
                        setTripName(preset.name); 
                        setCurrency(preset.currency); 
                        setTripBudget(preset.budget?.toString() || '');
                      }}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 whitespace-nowrap active:scale-95 transition-all shadow-xs"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 px-1">
                    Trip Name / Destination
                  </label>
                  <input 
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder="e.g. 🏖️ Goa Summer 2026" 
                    required 
                    autoFocus
                    disabled={isCreating}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 px-1">
                      Vault Currency
                    </label>
                    <select 
                      value={currency} 
                      onChange={(e) => setCurrency(e.target.value)}
                      disabled={isCreating}
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-extrabold text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-70 cursor-pointer"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 px-1">
                      Budget Target (Optional)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      step="100"
                      value={tripBudget}
                      onChange={(e) => setTripBudget(e.target.value)}
                      placeholder="e.g. 50000" 
                      disabled={isCreating}
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70" 
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  disabled={isCreating}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl hover:bg-slate-200 active:scale-95 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating || !tripName.trim()}
                  className="flex-2 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-indigo-600/25 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Vault...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Vault & Unlock</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODERN TRIPS CARDS RESPONSIVE GRID                                     */}
      {/* ========================================================================= */}
      <div>
        {filteredTrips.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-10 sm:p-14 text-center shadow-sm mt-4 animate-in fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500/15 via-purple-500/20 to-pink-500/15 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-inner">
              <Compass size={36} className="text-indigo-600 animate-bounce" />
            </div>
            
            <h3 className="font-extrabold text-slate-900 text-xl sm:text-2xl mb-1.5 font-heading">
              {searchQuery ? 'No Matching Trips Found' : 'No Active Trips Yet'}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
              {searchQuery 
                ? `No trips matched "${searchQuery}". Try searching for a different destination or clear your filter.` 
                : 'Create your first shared trip vault or ask a friend to add you to their trip to start logging shared expenses.'
              }
            </p>

            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')} 
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                Clear Search Filter
              </button>
            ) : (
              <button 
                onClick={() => setShowForm(true)} 
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/25 active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <Plus size={16} strokeWidth={3} />
                <span>Create Your First Trip Vault</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrips.map((trip) => {
              const isAdmin = trip.members?.some(m => (m.user?._id || m.user)?.toString() === user?._id?.toString() && m.role === 'admin');
              const memberCount = trip.members?.length || 0;
              const tripEmoji = getTripIcon(trip.name);
              const tripCurrency = trip.currency || '₹';
              const totalVault = trip.totalVault || 0;
              const hasBudget = trip.budget && trip.budget > 0;
              const budgetPercent = hasBudget ? Math.min(100, Math.round((totalVault / trip.budget) * 100)) : null;

              return (
                <div 
                  key={trip._id} 
                  className="bg-white rounded-[2.2rem] p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 border border-slate-200/80 hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden hover:-translate-y-1"
                >
                  {/* Subtle top ambient color accent */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>

                  <div>
                    {/* Top Row: Destination Icon + Badges + Admin Delete */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/80 flex items-center justify-center text-2xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          {tripEmoji}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 
                            onClick={() => navigate(`/trip/${trip._id}`)}
                            className="font-black text-lg sm:text-xl text-slate-900 truncate font-heading group-hover:text-indigo-600 transition-colors cursor-pointer"
                            title={trip.name}
                          >
                            {trip.name}
                          </h3>

                          {/* Meta Tags: Admin, Actions Required */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {isAdmin ? (
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Crown size={10} className="fill-indigo-600" />
                                <span>ADMIN</span>
                              </span>
                            ) : (
                              <span className="bg-slate-50 text-slate-500 border border-slate-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                MEMBER
                              </span>
                            )}

                            {trip.pendingRequestsCount > 0 && (
                              <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                                <Bell size={10} className="fill-rose-600" />
                                <span>{trip.pendingRequestsCount} {trip.pendingRequestsCount === 1 ? 'Action' : 'Actions'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin Delete Action */}
                      {isAdmin && (
                        <button 
                          onClick={() => setTripToDelete(trip._id)} 
                          disabled={isDeleting}
                          title="Delete Trip Vault"
                          className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-transparent hover:border-rose-100 transition-all active:scale-90 shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Mid Section: Spend / Balance Card */}
                    <div 
                      onClick={() => navigate(`/trip/${trip._id}`)}
                      className="cursor-pointer bg-slate-50/80 hover:bg-indigo-50/40 p-4 rounded-2xl border border-slate-100 transition-all mb-4"
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Vault Spend
                        </span>
                        <div className="text-right">
                          <span className="text-lg sm:text-xl font-black text-slate-900 font-heading">
                            {tripCurrency}{totalVault.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Budget Tracker Progress Meter (if budget set) */}
                      {hasBudget && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                            <span>Budget: {tripCurrency}{trip.budget.toLocaleString()}</span>
                            <span className={budgetPercent > 90 ? 'text-rose-600' : 'text-indigo-600'}>
                              {budgetPercent}% used
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                budgetPercent > 90 ? 'bg-rose-500' : budgetPercent > 70 ? 'bg-amber-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${budgetPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Row: Companion Avatar Cluster & Enter Vault */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center -space-x-2.5 overflow-hidden py-1">
                      {trip.members?.slice(0, 4).map((member, idx) => (
                        <div 
                          key={member.user?._id || idx}
                          className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-black overflow-hidden shadow-sm hover:z-10 hover:scale-110 transition-transform cursor-pointer"
                          title={member.user?.name || 'Companion'}
                        >
                          {member.user?.avatar ? (
                            <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
                          ) : (
                            member.user?.name?.charAt(0).toUpperCase() || '?'
                          )}
                        </div>
                      ))}
                      {memberCount > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                          +{memberCount - 4}
                        </div>
                      )}
                      <span className="text-[11px] font-bold text-slate-400 ml-3.5">
                        {memberCount} {memberCount === 1 ? 'traveler' : 'travelers'}
                      </span>
                    </div>

                    <button 
                      onClick={() => navigate(`/trip/${trip._id}`)}
                      className="flex items-center gap-1.5 text-xs font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-4 py-2.5 rounded-xl shadow-xs active:scale-95 transition-all group/btn"
                    >
                      <span>Open</span>
                      <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. DELETE CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      {tripToDelete && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={28} />
            </div>
            
            <h3 className="text-lg font-extrabold text-center text-slate-900 mb-1.5 font-heading">
              Delete Trip Vault?
            </h3>
            
            <p className="text-xs text-center text-slate-500 mb-6">
              This will permanently delete this trip, all its transactions, and all member balances. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setTripToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 active:scale-95 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-2xl text-xs shadow-lg shadow-rose-600/25 hover:bg-rose-700 active:scale-95 transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Vault'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}