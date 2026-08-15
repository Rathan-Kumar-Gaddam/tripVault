import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useTripStore, { computeBilateralDebts } from '../store/useTripStore';
import { 
  ArrowLeft, 
  UserPlus, 
  Phone, 
  User, 
  Trash2, 
  ShieldCheck, 
  Users, 
  AlertTriangle,
  X,
  HandCoins
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '../components/SkeletonLoader';

export default function AddMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, currentTrip, transactions, fetchTripDetails, addMember, removeMember, isLoading } = useTripStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Member removal modal state
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!currentTrip || currentTrip._id !== id) {
      setFetchError(null);
      fetchTripDetails(id).catch((err) => {
        setFetchError(err.response?.data?.message || err.message || 'Failed to load trip members');
      });
    }
  }, [id]);

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const cleanPhone = phone.trim();

    if (!trimmedName) {
      toast.error('Please enter friend\'s name.');
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

  if ((!currentTrip || currentTrip._id !== id) && !fetchError) {
    return <DashboardSkeleton />;
  }

  if (fetchError || !currentTrip) {
    return (
      <div className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{fetchError || 'Trip Not Found'}</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-3 bg-slate-900 text-white font-bold text-xs rounded-2xl"
        >
          ← Back to Trips
        </button>
      </div>
    );
  }

  const currency = currentTrip?.currency || '₹';
  const myMembership = currentTrip?.members?.find(m => (m.user?._id || m.user)?.toString() === user?._id?.toString());
  const isAdmin = myMembership?.role === 'admin';

  const { companionDebts } = computeBilateralDebts(currentTrip?.members, transactions, user?._id);

  // Map companion debts by user ID
  const debtMap = {};
  companionDebts.forEach(d => {
    const uid = (d.user?._id || d.user)?.toString();
    if (uid) debtMap[uid] = d;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 pb-24 sm:pb-20 relative">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 sm:mb-8">
        <button 
          onClick={() => navigate(`/trip/${id}`)} 
          className="p-3 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">Trip Companions</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {currentTrip?.members?.length || 0} {(currentTrip?.members?.length === 1) ? 'Companion' : 'Companions'}
          </p>
        </div>
        <div className="w-10"></div>
      </header>

      {/* Main Content Grid (2 Columns on Desktop for Admin) */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
        
        {/* Add New Member Section (Only for Admin) */}
        {isAdmin && (
          <section className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Invite New Companion</h2>
                <p className="text-xs text-slate-400">Add by name and 10-digit mobile number</p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Friend's Full Name" 
                  required 
                  disabled={isSubmitting}
                  className="w-full p-4 pl-11 rounded-2xl border border-slate-200 bg-slate-50/50 font-medium text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70" 
                />
              </div>

              <div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    placeholder="10-digit Phone (e.g. 9845201587)" 
                    required 
                    disabled={isSubmitting}
                    className="w-full p-4 pl-11 rounded-2xl border border-slate-200 bg-slate-50/50 font-medium tracking-wide text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70" 
                  />
                </div>
                <div className="flex justify-between items-center mt-1 px-1 text-xs font-medium">
                  <span className="text-slate-400 text-[11px]">Can login immediately with phone</span>
                  <span className={phone.length === 10 ? 'text-emerald-600 font-bold text-[11px]' : 'text-slate-400 text-[11px]'}>
                    {phone.length}/10 digits
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || phone.length !== 10 || !name.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all mt-1 flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                {isSubmitting ? 'Adding Member...' : 'Add Member'}
              </button>
            </form>
          </section>
        )}

        {/* Current Members List */}
        <section className={isAdmin ? 'lg:col-span-7' : 'w-full'}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Trip Companions ({currentTrip?.members?.length || 0})
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {currentTrip?.members?.map((member) => {
            const isMemberAdmin = member.role === 'admin';
            const isSelf = (member.user?._id || member.user) === user?._id;
            const mUser = member.user || member;
            const uid = (mUser?._id || mUser)?.toString();
            const p2p = debtMap[uid];

            return (
              <div 
                key={uid || member._id} 
                className="bg-white p-4 rounded-3xl border border-gray-100/80 shadow-sm flex items-center justify-between gap-3 transition-all hover:border-gray-200"
              >
                {/* Avatar & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white border-2 border-white shadow-sm flex items-center justify-center text-lg font-bold overflow-hidden shrink-0">
                    {mUser?.avatar ? (
                      <img src={mUser.avatar} alt={mUser.name} className="w-full h-full object-cover" />
                    ) : (
                      mUser?.name ? mUser.name.charAt(0).toUpperCase() : <User size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 truncate text-sm">
                        {mUser?.name} {isSelf ? '(You)' : ''}
                      </p>
                      {isMemberAdmin && (
                        <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0">
                          <ShieldCheck size={11} /> ADMIN
                        </span>
                      )}
                    </div>
                    
                    {/* Bilateral status for non-self */}
                    {!isSelf && p2p && (
                      <p className={`text-xs font-bold mt-0.5 ${
                        p2p.status === 'owes_you' ? 'text-emerald-600' : p2p.status === 'you_owe' ? 'text-rose-600' : 'text-gray-400'
                      }`}>
                        {p2p.status === 'owes_you' && `Owes you ${currency}${p2p.amount.toFixed(2)}`}
                        {p2p.status === 'you_owe' && `You owe ${currency}${p2p.amount.toFixed(2)}`}
                        {p2p.status === 'settled' && 'Settled up (₹0.00)'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Settle Action & Remove Button */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isSelf && p2p && p2p.status !== 'settled' && (
                    <button
                      onClick={() => navigate(`/trip/${id}/add-money?mode=settle&with=${uid}&amount=${p2p.amount}`)}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                      title="Settle up"
                    >
                      <HandCoins size={12} />
                      <span>Settle</span>
                    </button>
                  )}

                  {/* Remove Button (Admin only, cannot remove self) */}
                  {isAdmin && !isSelf && (
                    <button
                      onClick={() => setMemberToRemove(member)}
                      title={`Remove ${mUser?.name}`}
                      className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-transparent hover:border-rose-100 transition-all active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>

      {/* Delete Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <button 
                onClick={() => setMemberToRemove(null)}
                disabled={isRemoving}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Remove Companion?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to remove <strong>{memberToRemove.user?.name}</strong> from this trip?
            </p>

            {Math.abs(memberToRemove.balance || 0) > 0.01 && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-800 font-medium mb-4">
                ⚠️ <strong>Note:</strong> This member has an unsettled balance of <strong>{currentTrip?.currency || '₹'}{(memberToRemove.balance || 0).toFixed(2)}</strong>.
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={isRemoving}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl text-sm shadow-md shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isRemoving ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}