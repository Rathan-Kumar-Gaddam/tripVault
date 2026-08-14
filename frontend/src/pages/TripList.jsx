import { useEffect, useState } from 'react';
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
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TripListSkeleton } from '../components/SkeletonLoader';

const PRESET_DESTINATIONS = [
  { name: '🏖️ Goa Beach', currency: '₹' },
  { name: '🏔️ Manali Trek', currency: '₹' },
  { name: '🌴 Bali Getaway', currency: '$' },
  { name: '🏙️ Dubai Tour', currency: 'AED' },
  { name: '✈️ Europe Eurotrip', currency: '€' },
];

export default function TripsList() {
  const { user, trips, fetchTrips, createTrip, deleteTrip, isLoading } = useTripStore();
  const [showForm, setShowForm] = useState(false);
  const [tripName, setTripName] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [searchQuery, setSearchQuery] = useState('');
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
      toast.error('Please enter a trip name');
      return;
    }

    try {
      setIsCreating(true);
      await createTrip({ name: tripName.trim(), currency });
      setShowForm(false);
      setTripName('');
      toast.success('New trip vault unlocked! 🚀');
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
        toast.success('Trip deleted successfully 🗑️');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete trip.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Calculate portfolio totals
  const totalVaultBalance = trips.reduce((acc, t) => acc + (t.totalVault || 0), 0);
  const totalCompanions = trips.reduce((acc, t) => acc + (t.members?.length || 0), 0);

  const filteredTrips = trips.filter(t => 
    !searchQuery.trim() || t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && trips.length === 0) {
    return <TripListSkeleton />;
  }

  return (
    <div className="p-6 pb-24">
      
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate('/profile')} 
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg overflow-hidden shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform border-2 border-white shrink-0"
            title="My Profile"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />
            )}
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">My Trips</h1>
              <Sparkles size={16} className="text-amber-400" />
            </div>
            <p className="text-slate-500 text-xs font-semibold">Hello, {user?.name?.split(' ')[0]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-indigo-600 shadow-sm active:scale-90 transition-all disabled:opacity-50"
            title="Sync Trips"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          <button 
            onClick={() => navigate('/profile')} 
            title="Profile & Settings" 
            className="p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-all"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Portfolio Quick Overview Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2rem] p-5 mb-6 shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-indigo-200 text-xs font-bold tracking-wider uppercase">Active Vaults</p>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1 font-heading">
              {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}
            </h2>
          </div>
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <Compass size={24} className="text-indigo-300" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-emerald-400" />
            <span className="text-slate-300 font-medium">{trips.length} Total Vaults</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-indigo-300" />
            <span className="text-slate-300 font-medium">{totalCompanions} Companions</span>
          </div>
        </div>
      </div>

      {/* Instant Search Bar if multiple trips exist */}
      {trips.length > 2 && (
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips by destination name..."
            className="w-full p-3 pl-11 pr-10 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Create Trip Expandable / Action */}
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)} 
          className="w-full py-4 px-5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all flex items-center justify-between mb-6 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-xl">
              <Plus size={18} strokeWidth={3} />
            </div>
            <span>Plan a New Trip</span>
          </div>
          <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
        </button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200/80 mb-6 flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Plane size={18} />
              </div>
              <h2 className="font-bold text-slate-900 text-sm">Create New Trip Vault</h2>
            </div>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {PRESET_DESTINATIONS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => { setTripName(preset.name); setCurrency(preset.currency); }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 whitespace-nowrap active:scale-95 transition-all"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input 
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="Trip Name (e.g. Goa 2026)" 
              required 
              disabled={isCreating}
              className="flex-1 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70" 
            />
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              disabled={isCreating}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-70 cursor-pointer"
            >
              <option value="₹">₹ INR</option>
              <option value="$">$ USD</option>
              <option value="€">€ EUR</option>
              <option value="£">£ GBP</option>
              <option value="AED">AED</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              disabled={isCreating}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 active:scale-95 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isCreating || !tripName.trim()}
              className="flex-1 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 active:scale-95 transition disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Save Trip'}
            </button>
          </div>
        </form>
      )}

      {/* Trips Cards List */}
      <div className="flex flex-col gap-4">
        {filteredTrips.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 text-center shadow-sm mt-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Compass size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1 font-heading">
              {searchQuery ? 'No Trips Found' : 'No Trips Created Yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">
              {searchQuery ? `No trip matching "${searchQuery}".` : 'Create your first group trip or ask your travel organizer to add you by phone number.'}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => setShowForm(true)} 
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
              >
                + Create First Trip
              </button>
            )}
          </div>
        ) : (
          filteredTrips.map((trip) => {
            const isAdmin = trip.members?.some(m => m.user?._id === user?._id && m.role === 'admin');
            const memberCount = trip.members?.length || 0;

            return (
              <div 
                key={trip._id} 
                className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 transition-all hover:border-slate-300 hover:shadow-md group relative"
              >
                <div className="flex justify-between items-start">
                  <div 
                    onClick={() => navigate(`/trip/${trip._id}`)} 
                    className="cursor-pointer flex-1 min-w-0 pr-2"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-extrabold text-lg text-slate-900 truncate font-heading group-hover:text-indigo-600 transition-colors">
                        {trip.name}
                      </h2>
                      {isAdmin && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                          ADMIN
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 font-medium">
                      Vault Total: <strong className="text-slate-700 font-bold">{trip.currency}{(trip.totalVault || 0).toFixed(2)}</strong>
                    </p>
                  </div>

                  {/* Delete Option for Admin */}
                  {isAdmin && (
                    <button 
                      onClick={() => setTripToDelete(trip._id)} 
                      disabled={isDeleting}
                      title="Delete Trip"
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-transparent hover:border-rose-100 transition-all active:scale-90"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Companion Avatar Stack & Open Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center -space-x-2 overflow-hidden py-1">
                    {trip.members?.slice(0, 4).map((member, idx) => (
                      <div 
                        key={member.user?._id || idx}
                        className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-extrabold overflow-hidden shadow-sm"
                        title={member.user?.name}
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
                    <span className="text-[11px] font-semibold text-slate-400 ml-3">
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <button 
                    onClick={() => navigate(`/trip/${trip._id}`)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl active:scale-95 transition-all"
                  >
                    <span>Open</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 mb-2 font-heading">Delete Trip Vault?</h3>
            <p className="text-xs text-center text-slate-500 mb-6">
              This will permanently delete this trip, all its logged transactions, and member ledgers. This action cannot be undone.
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