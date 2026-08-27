import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { 
  ArrowLeft, 
  UserPlus, 
  Trash2, 
  AlertTriangle,
  LogOut,
  Share2,
  Copy,
  Check,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '../components/SkeletonLoader';

export default function AddMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, currentTrip, fetchTripDetails, addMember, removeMember, leaveTrip } = useTripStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modals
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!currentTrip || currentTrip._id !== id) {
      fetchTripDetails(id).catch((err) => {
        if (isMounted) {
          setFetchError(err.response?.data?.message || err.message || 'Failed to load trip members');
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [id, currentTrip, fetchTripDetails]);

  const members = useMemo(() => currentTrip?.members || [], [currentTrip?.members]);
  const myData = members.find(m => (m.user?._id || m.user)?.toString() === user?._id?.toString());
  const isAdmin = (currentTrip?.createdBy?._id || currentTrip?.createdBy)?.toString() === user?._id?.toString() || myData?.role === 'admin';
  const currency = currentTrip?.currency || '₹';

  const inviteUrl = `${window.location.origin}/join/${id}`;

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Join our trip vault "${currentTrip?.name}" on TripVault to track shared expenses and balances: ${inviteUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

    if (!trimmedName) {
      toast.error("Please enter friend's name.");
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addMember(id, {
        name: trimmedName,
        phone: cleanPhone,
      });
      toast.success(`${trimmedName} added to trip! 👥`);
      setName('');
      setPhone('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove || isRemoving) return;
    const targetUid = memberToRemove.user?._id || memberToRemove.user;
    const targetName = memberToRemove.user?.name || 'Companion';

    try {
      setIsRemoving(true);
      await removeMember(id, targetUid);
      toast.success(`${targetName} removed from trip.`);
      setMemberToRemove(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleConfirmLeave = async () => {
    if (isLeaving) return;
    try {
      setIsLeaving(true);
      await leaveTrip(id);
      toast.success('You have left the trip vault.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave trip.');
    } finally {
      setIsLeaving(false);
    }
  };

  if ((!currentTrip || currentTrip._id !== id) && !fetchError) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 max-w-xl mx-auto space-y-6 pb-24 sm:pb-20 animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <button
          type="button"
          onClick={() => navigate(`/trip/${id}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Vault</span>
        </button>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {currentTrip?.name}
        </span>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
          Trip Companions ({members.length})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage trip members, individual balances, and invite friends
        </p>
      </div>

      {/* Quick Invite Share Card */}
      <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900">Invite Friends via Link</h3>
          </div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
            1-Click Join
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopyInvite}
            className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            title="Share on WhatsApp"
          >
            <MessageCircle size={15} />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Add Companion Form (Admin Only) */}
      {isAdmin && (
        <form onSubmit={handleAddSubmit} className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-3.5">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900">Add Companion Directly</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              required
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit Phone"
              required
              maxLength={10}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || phone.length !== 10}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : '+ Add Member to Vault'}
          </button>
        </form>
      )}

      {/* Active Members List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {members.map((m) => {
          const u = m.user || m;
          const isMe = u._id === user?._id;
          const balance = Math.round((m.balance || 0) * 100) / 100;
          const isMemberAdmin = m.role === 'admin' || (currentTrip?.createdBy?._id || currentTrip?.createdBy)?.toString() === u._id?.toString();

          return (
            <div key={u._id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center font-bold text-xs text-slate-800 shrink-0">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    u.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {u.name} {isMe ? '(You)' : ''}
                    </p>
                    {isMemberAdmin && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {u.phone || u.email || 'Companion'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {balance > 0.01 ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                    +{currency}{balance.toLocaleString()}
                  </span>
                ) : balance < -0.01 ? (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60">
                    -{currency}{Math.abs(balance).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                    Settled
                  </span>
                )}

                {isAdmin && !isMe && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(m)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove Member"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave Trip Trigger for non-admins */}
      {!isAdmin && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center justify-center gap-1.5 mx-auto"
          >
            <LogOut size={14} />
            <span>Leave This Trip Vault</span>
          </button>
        </div>
      )}

      {/* Remove Member Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Remove Companion?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Remove <strong>{memberToRemove.user?.name}</strong> from this vault? Any existing transaction history will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {isRemoving ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Trip Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <LogOut size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Leave Trip Vault?</h3>
            <p className="text-xs text-slate-500 mb-6">
              You will no longer receive live balance updates for this trip.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                disabled={isLeaving}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
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