import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import {
  Plus,
  Trash2,
  AlertTriangle,
  User,
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
  Globe,
  LogOut,
  LayoutGrid,
  List,
  ArrowDownUp,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TripListSkeleton } from '../components/SkeletonLoader';
import CustomSelect from '../components/CustomSelect';
import CreateTripModal from '../components/CreateTripModal';

// Categorized destination presets with smart themes & budgets
const PRESET_CATEGORIES = [
  { id: 'all', label: '🌟 All Presets' },
  { id: 'beach', label: '🏖️ Beach & Islands' },
  { id: 'mountain', label: '🏔️ Mountain & Treks' },
  { id: 'city', label: '🏙️ City Breaks' },
  { id: 'roadtrip', label: '🚗 Road Trips' },
  { id: 'intl', label: '✈️ International' },
];

const PRESET_DESTINATIONS = [
  { name: '🏖️ Goa Beach Getaway', category: 'beach', currency: '₹', budget: 25000, desc: 'Sun, sand, seaside shacks & shared parties' },
  { name: '🌴 Bali Tropical Escape', category: 'beach', currency: '$', budget: 1200, desc: 'Villas, surfing, beach clubs & temple tours' },
  { name: '🌊 Maldives Island Retreat', category: 'beach', currency: '$', budget: 2000, desc: 'Overwater bungalows & ocean dining' },
  { name: '🏔️ Manali Himalayan Trek', category: 'mountain', currency: '₹', budget: 20000, desc: 'Snow peaks, cafes, rafting & mountain trails' },
  { name: '🏕️ Ladakh High Passes', category: 'mountain', currency: '₹', budget: 35000, desc: 'Epic mountain passes, monasteries & stargazing' },
  { name: '🌲 Swiss Alps Ski & Tour', category: 'mountain', currency: '€', budget: 2200, desc: 'Scenic trains, chalets & alpine slopes' },
  { name: '🏙️ Dubai Skyline Tour', category: 'city', currency: 'AED', budget: 5000, desc: 'Desert safaris, mega malls & luxury dining' },
  { name: '🍣 Tokyo Neon Adventure', category: 'city', currency: '¥', budget: 200000, desc: 'Ramen crawls, Shibuya nights & cultural temples' },
  { name: '🍕 Rome & Amalfi Coast', category: 'intl', currency: '€', budget: 2500, desc: 'Historic streets, pasta tours & coastal views' },
  { name: '🚗 West Coast Roadtrip', category: 'roadtrip', currency: '$', budget: 1500, desc: 'Coastal highways, scenic lookouts & diners' },
  { name: '☕ Coorg Plantation Trail', category: 'roadtrip', currency: '₹', budget: 15000, desc: 'Coffee estates, waterfalls & misty bonfires' },
];

const CURRENCIES = [
  { code: '₹', label: '₹ INR (Indian Rupee)' },
  { code: '$', label: '$ USD (US Dollar)' },
  { code: '€', label: '€ EUR (Euro)' },
  { code: '£', label: '£ GBP (British Pound)' },
  { code: 'AED', label: 'AED (UAE Dirham)' },
  { code: '¥', label: '¥ JPY (Japanese Yen)' },
  { code: '฿', label: '฿ THB (Thai Baht)' },
  { code: 'CAD $', label: 'CAD $ (Canadian Dollar)' },
  { code: 'AUD $', label: 'AUD $ (Australian Dollar)' },
];

const BUDGET_PRESETS = [15000, 30000, 50000, 100000];

// Dynamic Destination Visual Classifier
const getTripTheme = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('beach') || lower.includes('goa') || lower.includes('bali') || lower.includes('island') || lower.includes('maldives') || lower.includes('sea') || lower.includes('ocean')) {
    return {
      emoji: '🏖️',
      gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
      tag: 'Coastal',
      accentColor: '#06b6d4',
    };
  }
  if (lower.includes('trek') || lower.includes('mountain') || lower.includes('manali') || lower.includes('ladakh') || lower.includes('himalaya') || lower.includes('alps') || lower.includes('camp') || lower.includes('hill')) {
    return {
      emoji: '🏔️',
      gradient: 'from-emerald-500 via-teal-500 to-sky-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      tag: 'Expedition',
      accentColor: '#10b981',
    };
  }
  if (lower.includes('road') || lower.includes('trip') || lower.includes('drive') || lower.includes('car') || lower.includes('bike') || lower.includes('safari')) {
    return {
      emoji: '🚗',
      gradient: 'from-amber-500 via-orange-500 to-rose-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      tag: 'Roadtrip',
      accentColor: '#f59e0b',
    };
  }
  if (lower.includes('tokyo') || lower.includes('dubai') || lower.includes('city') || lower.includes('york') || lower.includes('london') || lower.includes('paris') || lower.includes('rome') || lower.includes('singapore')) {
    return {
      emoji: '🏙️',
      gradient: 'from-purple-500 via-indigo-500 to-pink-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
      tag: 'Metropolis',
      accentColor: '#8b5cf6',
    };
  }
  if (lower.includes('flight') || lower.includes('euro') || lower.includes('intl') || lower.includes('tour')) {
    return {
      emoji: '✈️',
      gradient: 'from-indigo-600 via-blue-600 to-purple-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      tag: 'International',
      accentColor: '#6366f1',
    };
  }
  return {
    emoji: '🗺️',
    gradient: 'from-indigo-600 via-purple-600 to-indigo-900',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200/80',
    tag: 'Trip Vault',
    accentColor: '#4f46e5',
  };
};

export default function TripsList() {
  const { user, trips, fetchTrips, createTrip, deleteTrip, leaveTrip, isLoading } = useTripStore();
  const navigate = useNavigate();

  // Control State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'admin' | 'needs_action' | 'with_budget'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'spend_desc' | 'budget_pct_desc' | 'name_asc' | 'companions_desc'
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('tv_view_mode') || 'grid'); // 'grid' | 'list'

  // Creation Studio State
  const [showForm, setShowForm] = useState(false);
  const [selectedPresetCat, setSelectedPresetCat] = useState('all');
  const [tripName, setTripName] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [tripBudget, setTripBudget] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Sync & Action States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tripToLeave, setTripToLeave] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleToggleView = (mode) => {
    setViewMode(mode);
    localStorage.setItem('tv_view_mode', mode);
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchTrips();
      toast.success('All vaults synchronized! 🔄');
    } catch (e) {
      toast.error('Failed to sync trips.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateTripVault = async (payload) => {
    const newTrip = await createTrip(payload);
    toast.success('Trip vault created & unlocked! 🚀');
    if (newTrip?._id) {
      navigate(`/trip/${newTrip._id}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (tripToDelete) {
      try {
        setIsDeleting(true);
        await deleteTrip(tripToDelete);
        setTripToDelete(null);
        toast.success('Trip vault permanently deleted 🗑️');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete trip.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleConfirmLeave = async () => {
    if (tripToLeave) {
      try {
        setIsLeaving(true);
        await leaveTrip(tripToLeave);
        setTripToLeave(null);
        toast.success('Successfully left the trip vault 🚪');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to leave trip.');
      } finally {
        setIsLeaving(false);
      }
    }
  };

  // Portfolio Totals & Statistics
  const { totalVaultBalance, totalCompanions, totalPendingNotifications, adminTripsCount, budgetTrackedCount } = useMemo(() => {
    let balance = 0;
    let companions = 0;
    let notifications = 0;
    let adminCount = 0;
    let budgetCount = 0;

    (trips || []).forEach((t) => {
      balance += t.totalVault || 0;
      companions += t.members?.length || 0;
      notifications += t.pendingRequestsCount || 0;
      if (t.members?.some(m => (m.user?._id || m.user)?.toString() === user?._id?.toString() && m.role === 'admin')) {
        adminCount += 1;
      }
      if (t.budget && t.budget > 0) {
        budgetCount += 1;
      }
    });

    return {
      totalVaultBalance: balance,
      totalCompanions: companions,
      totalPendingNotifications: notifications,
      adminTripsCount: adminCount,
      budgetTrackedCount: budgetCount,
    };
  }, [trips, user?._id]);

  // Greeting based on user's current local hour
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Filtered & Sorted trips
  const processedTrips = useMemo(() => {
    let result = (trips || []).filter((t) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = t.name?.toLowerCase().includes(query);
        const matchMembers = t.members?.some(m => (m.user?.name || '').toLowerCase().includes(query));
        if (!matchName && !matchMembers) return false;
      }

      // 2. Tab filter
      if (activeFilter === 'admin') {
        return t.members?.some(m => (m.user?._id || m.user)?.toString() === user?._id?.toString() && m.role === 'admin');
      }
      if (activeFilter === 'needs_action') {
        return (t.pendingRequestsCount || 0) > 0;
      }
      if (activeFilter === 'with_budget') {
        return (t.budget || 0) > 0;
      }
      return true;
    });

    // 3. Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'spend_desc') {
        return (b.totalVault || 0) - (a.totalVault || 0);
      }
      if (sortBy === 'budget_pct_desc') {
        const pctA = a.budget ? (a.totalVault || 0) / a.budget : 0;
        const pctB = b.budget ? (b.totalVault || 0) / b.budget : 0;
        return pctB - pctA;
      }
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'companions_desc') {
        return (b.members?.length || 0) - (a.members?.length || 0);
      }
      // Default: 'recent' (updatedAt descending)
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });

    return result;
  }, [trips, searchQuery, activeFilter, sortBy, user?._id]);

  if (isLoading && (!trips || trips.length === 0)) {
    return <TripListSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 pb-16 sm:pb-24 max-w-7xl mx-auto animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* 1. COMPACT EXECUTIVE HEADER                                               */}
      {/* ========================================================================= */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/profile')}
            className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-extrabold text-base overflow-hidden shadow-md shadow-indigo-500/20 active:scale-95 transition-all border-2 border-white shrink-0 hover:ring-2 hover:ring-indigo-500/20"
            title="My Profile & Settings"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />
            )}
          </button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading truncate">
              {timeGreeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{user?.name?.split(' ')[0] || 'Traveler'}</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-bold text-slate-500">
                {trips.length} {trips.length === 1 ? 'Active Vault' : 'Active Vaults'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-extrabold text-indigo-600">
                ₹{totalVaultBalance.toLocaleString()} Managed
              </span>
            </div>
          </div>
        </div>

        {/* Top Actions Hub */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-end sm:self-auto">
          {/* Total Pending Actions Alert Pill */}
          {totalPendingNotifications > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('needs_action')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-3 py-2 rounded-2xl text-xs font-black shadow-md shadow-rose-500/20 active:scale-95 transition-all animate-pulse"
              title={`${totalPendingNotifications} companion requests waiting for your action`}
            >
              <Bell size={13} className="fill-white" />
              <span>{totalPendingNotifications} {totalPendingNotifications === 1 ? 'Action' : 'Actions'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-10 h-10 bg-white border border-slate-200/90 rounded-2xl text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
            title="Sync Live Ledgers"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          {/* Primary Create Button */}
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95 transition-all group"
          >
            <Plus size={15} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>New Vault</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. INTELLIGENT CONTROL BAR (SEARCH, FILTERS, SORT & VIEW MODE)             */}
      {/* ========================================================================= */}
      <div className="space-y-3.5 mb-6 sm:mb-8">
        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination, trip name, or companion..."
              className="w-full p-3.5 pl-11 pr-10 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xs"
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

          {/* Sort Selector & View Toggle Cluster */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto">
            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:w-48">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ArrowDownUp size={14} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-9 pr-8 py-3 bg-white border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer shadow-xs"
              >
                <option value="recent">Recently Active</option>
                <option value="spend_desc">Highest Spend</option>
                <option value="budget_pct_desc">Budget % Used</option>
                <option value="companions_desc">Most Companions</option>
                <option value="name_asc">Alphabetical (A-Z)</option>
              </select>
            </div>

            {/* View Mode Toggle (Grid vs List) */}
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => handleToggleView('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleToggleView('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                title="Compact List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs Strip */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar pb-1">
          <div className="flex gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Vaults ({trips.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('admin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeFilter === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <Crown size={12} />
              <span>Admin ({adminTripsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('needs_action')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeFilter === 'needs_action'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Bell size={12} />
              <span>Actions ({totalPendingNotifications})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('with_budget')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeFilter === 'with_budget'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <Target size={12} />
              <span>Budget Tracked ({budgetTrackedCount})</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-400 shrink-0 hidden md:inline">
            Showing {processedTrips.length} of {trips.length} {trips.length === 1 ? 'vault' : 'vaults'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODERN TRIP CARDS CONTAINER (GRID & LIST VIEWS)                        */}
      {/* ========================================================================= */}
      <div>
        {processedTrips.length === 0 ? (
          /* Empty / Zero State with Inspiration Starters */
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 sm:p-14 text-center shadow-xs mt-2 animate-in fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500/15 via-purple-500/20 to-pink-500/15 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-inner">
              <Compass size={36} className="text-indigo-600 animate-bounce" />
            </div>

            <h3 className="font-black text-slate-900 text-xl sm:text-2xl mb-1.5 font-heading">
              {searchQuery ? 'No Matching Trip Vaults' : 'Start Your First Trip Vault'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-8">
              {searchQuery
                ? `No trips matched "${searchQuery}". Clear your search query or reset active filters.`
                : 'Create a shared passbook to log split expenses, settle debts seamlessly, and keep all companions in sync.'
              }
            </p>

            {searchQuery ? (
              <button
                onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                Clear Search & Filters
              </button>
            ) : (
              <div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/25 active:scale-95 transition-all inline-flex items-center gap-2 mb-8"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Create Custom Trip Vault</span>
                </button>

                {/* Instant Starter Templates */}
                <div className="pt-6 border-t border-slate-100 max-w-3xl mx-auto">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">
                    Or 1-Tap Quick Start with a Template:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    {PRESET_DESTINATIONS.slice(0, 3).map((template) => (
                      <div
                        key={template.name}
                        onClick={() => {
                          setTripName(template.name);
                          setCurrency(template.currency);
                          setTripBudget(template.budget?.toString() || '');
                          setShowForm(true);
                        }}
                        className="cursor-pointer bg-slate-50 hover:bg-indigo-50/50 p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-200 transition-all group"
                      >
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {template.desc}
                        </p>
                        <span className="text-[10px] font-black text-indigo-600 mt-2 block">
                          Budget ~ {template.currency}{template.budget.toLocaleString()} ➔
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ========================================================================= */
          /* 4A. MODERN BENTO GRID CARDS                                              */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {processedTrips.map((trip) => {
              const isAdmin = trip.members?.some(m => (m.user?._id || m.user)?.toString() === user?._id?.toString() && m.role === 'admin');
              const memberCount = trip.members?.length || 0;
              const theme = getTripTheme(trip.name);
              const tripCurrency = trip.currency || '₹';
              const totalVault = trip.totalVault || 0;
              const hasBudget = trip.budget && trip.budget > 0;
              const budgetPercent = hasBudget ? Math.min(100, Math.round((totalVault / trip.budget) * 100)) : null;
              const remainingBudget = hasBudget ? trip.budget - totalVault : null;

              return (
                <div
                  key={trip._id}
                  className="card-hover-fx bg-white rounded-[2.2rem] p-5 sm:p-6 border border-slate-200/80 hover:border-indigo-300 shadow-xs flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle top ambient thematic gradient strip */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient} opacity-85 group-hover:opacity-100 transition-opacity`}></div>

                  <div>
                    {/* Top Row: Themed Icon + Title + Actions */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-slate-200/80 flex items-center justify-center text-2xl shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                          {theme.emoji}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3
                            onClick={() => navigate(`/trip/${trip._id}`)}
                            className="font-black text-lg sm:text-xl text-slate-900 truncate font-heading group-hover:text-indigo-600 transition-colors cursor-pointer"
                            title={trip.name}
                          >
                            {trip.name}
                          </h3>

                          {/* Role & Alert Badges */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {isAdmin ? (
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Crown size={10} className="fill-indigo-600" />
                                <span>ORGANIZER</span>
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                MEMBER
                              </span>
                            )}

                            {trip.pendingRequestsCount > 0 && (
                              <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                                <Bell size={10} className="fill-rose-600" />
                                <span>{trip.pendingRequestsCount} {trip.pendingRequestsCount === 1 ? 'Action' : 'Actions'}</span>
                              </span>
                            )}

                            <span className={`${theme.badgeBg} text-[10px] font-extrabold px-2 py-0.5 rounded-full border`}>
                              {theme.tag}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Delete or Member Leave Action Button */}
                      {isAdmin ? (
                        <button
                          onClick={() => setTripToDelete(trip._id)}
                          disabled={isDeleting}
                          title="Delete Trip Vault"
                          className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-transparent hover:border-rose-100 transition-all active:scale-90 shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setTripToLeave(trip._id)}
                          disabled={isLeaving}
                          title="Leave Trip Vault"
                          className="p-2.5 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-2xl border border-transparent hover:border-amber-100 transition-all active:scale-90 shrink-0"
                        >
                          <LogOut size={16} />
                        </button>
                      )}
                    </div>

                    {/* Mid Section: Spend / Balance Card */}
                    <div
                      onClick={() => navigate(`/trip/${trip._id}`)}
                      className="cursor-pointer bg-slate-50/90 hover:bg-indigo-50/40 p-4 rounded-2xl border border-slate-100 transition-all mb-4"
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Vault Spend
                        </span>
                        <div className="text-right">
                          <span className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                            {tripCurrency}{totalVault.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Budget Tracker Progress Bar */}
                      {hasBudget ? (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                            <span>Budget: {tripCurrency}{trip.budget.toLocaleString()}</span>
                            <span className={budgetPercent > 90 ? 'text-rose-600 font-black' : budgetPercent > 70 ? 'text-amber-600 font-black' : 'text-indigo-600 font-black'}>
                              {budgetPercent}% used {remainingBudget < 0 ? `(Over by ${tripCurrency}${Math.abs(remainingBudget).toLocaleString()})` : `(${tripCurrency}${remainingBudget.toLocaleString()} left)`}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                budgetPercent > 90 ? 'bg-gradient-to-r from-rose-500 to-red-600' : budgetPercent > 70 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                              }`}
                              style={{ width: `${budgetPercent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span>Flexible Limit</span>
                          <span className="text-indigo-600 hover:underline">Set Target Budget ➔</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Row: Companion Avatar Cluster & Enter Button */}
                  <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                    <div className="flex items-center -space-x-2.5 overflow-hidden py-1">
                      {trip.members?.slice(0, 4).map((member, idx) => (
                        <div
                          key={member.user?._id || idx}
                          className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-black overflow-hidden shadow-xs hover:z-10 hover:scale-110 transition-transform cursor-pointer"
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
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-extrabold shadow-xs">
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
        ) : (
          /* ========================================================================= */
          /* 4B. COMPACT EXECUTIVE LEDGER / TABLE VIEW                                */
          /* ========================================================================= */
          <div className="bg-white rounded-[2rem] border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Destination Vault</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4 text-right">Total Spend</th>
                    <th className="py-3.5 px-4">Budget Utilization</th>
                    <th className="py-3.5 px-4">Travelers</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {processedTrips.map((trip) => {
                    const isAdmin = trip.members?.some(m => (m.user?._id || m.user)?.toString() === user?._id?.toString() && m.role === 'admin');
                    const memberCount = trip.members?.length || 0;
                    const theme = getTripTheme(trip.name);
                    const tripCurrency = trip.currency || '₹';
                    const totalVault = trip.totalVault || 0;
                    const hasBudget = trip.budget && trip.budget > 0;
                    const budgetPercent = hasBudget ? Math.min(100, Math.round((totalVault / trip.budget) * 100)) : null;

                    return (
                      <tr 
                        key={trip._id}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/trip/${trip._id}`)}
                      >
                        {/* Destination & Icon */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{theme.emoji}</span>
                            <div>
                              <strong className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors block">
                                {trip.name}
                              </strong>
                              {trip.pendingRequestsCount > 0 && (
                                <span className="text-[10px] font-black text-rose-600 flex items-center gap-1 mt-0.5">
                                  <Bell size={10} /> {trip.pendingRequestsCount} action required
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          {isAdmin ? (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Crown size={10} /> ADMIN
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              MEMBER
                            </span>
                          )}
                        </td>

                        {/* Spend */}
                        <td className="py-4 px-4 text-right">
                          <strong className="font-black text-slate-900 text-sm font-heading">
                            {tripCurrency}{totalVault.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </td>

                        {/* Budget Bar */}
                        <td className="py-4 px-4 min-w-[140px]">
                          {hasBudget ? (
                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                <span>{budgetPercent}%</span>
                                <span>{tripCurrency}{trip.budget.toLocaleString()}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${budgetPercent > 90 ? 'bg-rose-500' : budgetPercent > 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                  style={{ width: `${budgetPercent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">No budget limit</span>
                          )}
                        </td>

                        {/* Travelers */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {trip.members?.slice(0, 3).map((m, idx) => (
                                <div key={idx} className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                                  {m.user?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                              ))}
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">{memberCount}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/trip/${trip._id}`)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-xl font-bold text-xs transition-all active:scale-95"
                            >
                              Open
                            </button>
                            {isAdmin ? (
                              <button
                                onClick={() => setTripToDelete(trip._id)}
                                className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Delete Trip"
                              >
                                <Trash2 size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setTripToLeave(trip._id)}
                                className="p-1.5 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                title="Leave Trip"
                              >
                                <LogOut size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. PROFESSIONAL "CREATE TRIP VAULT" STUDIO MODAL                          */}
      {/* ========================================================================= */}
      <CreateTripModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onCreateTrip={handleCreateTripVault}
      />

      {/* ========================================================================= */}
      {/* 6. DELETE CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      {tripToDelete && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-lg font-black text-center text-slate-900 mb-1.5 font-heading">
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

      {/* ========================================================================= */}
      {/* 7. LEAVE CONFIRMATION MODAL                                               */}
      {/* ========================================================================= */}
      {tripToLeave && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <LogOut size={28} />
            </div>

            <h3 className="text-lg font-black text-center text-slate-900 mb-1.5 font-heading">
              Leave Trip Vault?
            </h3>

            <p className="text-xs text-center text-slate-500 mb-6">
              You will be removed from this trip vault and it will no longer appear on your dashboard. You will need an invite link to rejoin.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTripToLeave(null)}
                disabled={isLeaving}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 active:scale-95 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                disabled={isLeaving}
                className="flex-1 py-3.5 bg-amber-600 text-white font-bold rounded-2xl text-xs shadow-lg shadow-amber-600/25 hover:bg-amber-700 active:scale-95 transition disabled:opacity-50"
              >
                {isLeaving ? 'Leaving...' : 'Leave Vault'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}