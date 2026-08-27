import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import {
  Plus,
  Trash2,
  AlertTriangle,
  User,
  RefreshCw,
  Search,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { TripListSkeleton } from '../components/SkeletonLoader';
import CreateTripModal from '../components/CreateTripModal';
import { getCoverPhotoForTrip } from '../utils/coverPhotos';

export default function TripsList() {
  const { user, trips, fetchTrips, createTrip, deleteTrip, leaveTrip, logout, isLoading } = useTripStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'closed'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Delete & Leave confirmation modals
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tripToLeave, setTripToLeave] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchTrips();
      toast.success('Trips synchronized! 🔄');
    } catch {
      toast.error('Failed to sync trips.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!tripToDelete) return;
    try {
      setIsDeleting(true);
      await deleteTrip(tripToDelete._id);
      setTripToDelete(null);
      toast.success('Trip vault removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete trip');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmLeave = async () => {
    if (!tripToLeave) return;
    try {
      setIsLeaving(true);
      await leaveTrip(tripToLeave._id);
      setTripToLeave(null);
      toast.success('Left trip vault');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave trip');
    } finally {
      setIsLeaving(false);
    }
  };

  // Filtered trips
  const filteredTrips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (trips || []).filter((trip) => {
      let matchesFilter = true;
      if (activeFilter === 'active') matchesFilter = !trip.isClosed;
      if (activeFilter === 'closed') matchesFilter = !!trip.isClosed;

      let matchesSearch = true;
      if (q) {
        matchesSearch =
          trip.name?.toLowerCase().includes(q) ||
          trip.destination?.toLowerCase().includes(q);
      }

      return matchesFilter && matchesSearch;
    });
  }, [trips, searchQuery, activeFilter]);

  // Overall Net Standing across all trips
  const overallNetPosition = useMemo(() => {
    let total = 0;
    (trips || []).forEach((t) => {
      const myMembership = t.members?.find(
        (m) => (m.user?._id || m.user)?.toString() === user?._id?.toString()
      );
      total += myMembership?.balance || 0;
    });
    return Math.round(total * 100) / 100;
  }, [trips, user?._id]);

  if (isLoading && (!trips || trips.length === 0)) {
    return <TripListSkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-20 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* TOP HEADER: User Profile, Actions & Sign Out                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5">
          <Logo size="md" />
          <div className="hidden sm:block h-7 w-px bg-slate-200"></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
              Trip Vaults
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              Manage shared ledgers & companion balances
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* User Profile Avatar Pill */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 p-1.5 pr-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl shadow-2xs transition-all active:scale-95 text-left group"
            title="Profile & Settings"
          >
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <span className="text-xs font-bold text-slate-800 truncate max-w-[100px] group-hover:text-indigo-600">
              {user?.name?.split(' ')[0] || 'Profile'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl shadow-2xs transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Vaults"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Vault</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 rounded-2xl shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Sign Out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OVERALL NET BALANCE HERO CARD                                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Total Net Balance (All Trips)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
              overallNetPosition > 0.01 
                ? 'text-emerald-600' 
                : overallNetPosition < -0.01 
                ? 'text-rose-600' 
                : 'text-slate-900'
            }`}>
              {overallNetPosition >= 0 ? '+' : '-'}₹{Math.abs(overallNetPosition).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {overallNetPosition > 0 ? 'to be received' : overallNetPosition < 0 ? 'you need to pay' : 'fully settled up'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <User size={14} />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEARCH AND STATUS FILTERS                                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips by name or destination..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 outline-none transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'all' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({trips?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('active')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'active' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('closed')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'closed' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TRIPS GRID WITH HD COVER PHOTOS                                           */}
      {/* ========================================================================= */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 text-2xl">
            ✈️
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {searchQuery ? 'No trips match your search' : 'No trips yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6">
            {searchQuery 
              ? 'Try searching with a different keyword or clear the filter.' 
              : 'Create your first shared trip vault to start tracking expenses, splitting bills, and settling debts.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Create Your First Trip</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTrips.map((trip) => {
            const tripId = trip._id;
            const currency = trip.currency || '₹';
            const coverPhoto = getCoverPhotoForTrip(trip.name || trip.destination, trip.coverPhoto);
            const myMembership = trip.members?.find(
              (m) => (m.user?._id || m.user)?.toString() === user?._id?.toString()
            );
            const myBalance = Math.round((myMembership?.balance || 0) * 100) / 100;
            const totalSpent = trip.totalExpenses || 0;
            const budget = trip.budget || 0;
            const budgetPct = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : null;
            const isAdmin = (trip.createdBy?._id || trip.createdBy)?.toString() === user?._id?.toString() || myMembership?.role === 'admin';

            return (
              <div
                key={tripId}
                onClick={() => navigate(`/trip/${tripId}`)}
                className="group relative bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-slate-300 rounded-[2rem] overflow-hidden transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* HD Cover Photo Header */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={coverPhoto} 
                      alt={trip.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-between p-4 text-white">
                      
                      {/* Top Badges & Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {trip.isClosed ? (
                            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-extrabold uppercase tracking-wider border border-white/10">
                              Archived 🔒
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                              Active Vault
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTripToDelete(trip);
                              }}
                              className="p-1.5 bg-black/40 hover:bg-rose-600 backdrop-blur-md text-white rounded-xl transition-colors"
                              title="Delete Trip"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTripToLeave(trip);
                              }}
                              className="p-1.5 bg-black/40 hover:bg-amber-600 backdrop-blur-md text-white rounded-xl transition-colors"
                              title="Leave Trip"
                            >
                              <LogOut size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom Header Info */}
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-xs truncate">
                          {trip.name}
                        </h2>
                        <p className="text-xs text-slate-200/90 font-medium truncate mt-0.5">
                          {trip.destination || trip.name}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-3.5">
                    
                    {/* Member Avatars & Spend Details */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center -space-x-2 overflow-hidden">
                        {(trip.members || []).slice(0, 4).map((m, idx) => {
                          const u = m.user || m;
                          return (
                            <div 
                              key={u._id || idx} 
                              className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center overflow-hidden shadow-2xs shrink-0"
                              title={u.name}
                            >
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                u.name?.charAt(0).toUpperCase()
                              )}
                            </div>
                          );
                        })}
                        {(trip.members?.length || 0) > 4 && (
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-900 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                            +{(trip.members?.length || 0) - 4}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Spend</p>
                        <p className="text-xs font-black text-slate-900">{currency}{totalSpent.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Budget Progress Bar */}
                    {budget > 0 && (
                      <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                          <span>Budget: {currency}{budget.toLocaleString()}</span>
                          <span className={budgetPct >= 90 ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}>
                            {budgetPct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              budgetPct >= 90 ? 'bg-rose-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${budgetPct}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Net Personal Position Pill */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">Your Standing</span>
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${
                    myBalance > 0 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : myBalance < 0 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    <span>
                      {myBalance > 0 
                        ? `+${currency}${myBalance.toLocaleString()} (Owed)` 
                        : myBalance < 0 
                        ? `-${currency}${Math.abs(myBalance).toLocaleString()} (You Owe)` 
                        : 'Settled Up ✓'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE TRIP MODAL                                                         */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <CreateTripModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateTrip={async (tripData) => {
            const created = await createTrip(tripData);
            setShowCreateModal(false);
            if (created?._id) {
              navigate(`/trip/${created._id}`);
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE MODAL                                                      */}
      {/* ========================================================================= */}
      {tripToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete "{tripToDelete.name}"?</h3>
            <p className="text-xs text-slate-500 mb-6">
              This action cannot be undone. All expense records and group balances will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Vault'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM LEAVE MODAL                                                       */}
      {/* ========================================================================= */}
      {tripToLeave && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <LogOut size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Leave "{tripToLeave.name}"?</h3>
            <p className="text-xs text-slate-500 mb-6">
              You will be removed from this trip vault. Ensure your debts are settled before leaving.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTripToLeave(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                disabled={isLeaving}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {isLeaving ? 'Leaving...' : 'Leave Trip'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}