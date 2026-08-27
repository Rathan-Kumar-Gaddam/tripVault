import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { 
  Users, 
  Compass, 
  ArrowRight, 
  ShieldCheck,
  Smartphone,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { sound } from '../utils/soundEffects';

export default function JoinTrip() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, getTripPreview, joinTrip, loginWithPhone } = useTripStore();

  const requestedRole = searchParams.get('role') === 'viewer' ? 'viewer' : 'member';

  const [tripPreview, setTripPreview] = useState(null);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  // Quick 1-tap phone join
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (id) {
      sessionStorage.setItem('pendingJoinTripId', id);
      getTripPreview(id)
        .then((data) => setTripPreview(data))
        .catch((err) => setError(err.message || 'Trip not found or link expired'));
    }
  }, [id, getTripPreview]);

  const handleJoinAuthenticated = async () => {
    try {
      setIsJoining(true);
      await joinTrip(id, requestedRole);
      sessionStorage.removeItem('pendingJoinTripId');
      sound.playJoinSound();
      toast.success(`Welcome to ${tripPreview?.name || 'the trip'}! 🎉`);
      navigate(`/trip/${id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to join trip');
    } finally {
      setIsJoining(false);
    }
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
  };

  const handleQuickPhoneJoin = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setIsJoining(true);
      const res = await loginWithPhone(phone, name.trim() || undefined);

      if (res?.requiresName && !isNewUser) {
        setIsNewUser(true);
        setIsJoining(false);
        toast('Please enter your name to complete your passbook profile ✍️', { icon: '👋' });
        return;
      }

      if (res?.token) {
        await joinTrip(id, requestedRole);
        sessionStorage.removeItem('pendingJoinTripId');
        sound.playJoinSound();
        toast.success(`Welcome to ${tripPreview?.name || 'the trip'}! 🎉`);
        navigate(`/trip/${id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to join trip');
    } finally {
      setIsJoining(false);
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <Compass size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-heading">Trip Vault Not Found</h2>
        <p className="text-xs text-slate-500 max-w-xs mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center px-4 sm:px-6 py-6 sm:py-10 pb-8 relative max-w-md mx-auto">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Logo size="lg" className="mx-auto mb-3" />
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
          Trip Vault Invite
        </span>
      </div>

      {/* Trip Invitation Card */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-slate-100 mb-6">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading mb-1">
            {tripPreview?.name || 'Loading trip...'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Organized by <strong className="text-slate-800 font-bold">{tripPreview?.adminName || 'Trip Admin'}</strong>
          </p>
        </div>

        {/* Quick Details Chips */}
        <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 mb-6 text-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Companions</p>
            <p className="text-sm font-black text-slate-800 mt-0.5 flex items-center justify-center gap-1">
              <Users size={13} className="text-indigo-600" />
              <span>{tripPreview?.memberCount || 1} Members</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</p>
            <p className="text-sm font-black text-indigo-600 mt-0.5">
              {tripPreview?.currency || '₹'}
            </p>
          </div>
        </div>

        {/* If user is ALREADY logged in */}
        {user ? (
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Logged in as {user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email || user.phone}</p>
              </div>
            </div>

            <button
              onClick={handleJoinAuthenticated}
              disabled={isJoining}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isJoining ? (
                <span>Joining Vault...</span>
              ) : (
                <>
                  <span>Join Trip Vault</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        ) : (
          /* If user is NOT logged in: 1-Tap Mobile Number Join Flow */
          <form onSubmit={handleQuickPhoneJoin} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                Enter your 10-digit mobile number to join
              </label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  required
                  disabled={isJoining}
                  className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium tracking-wide text-sm placeholder:text-slate-400 disabled:opacity-70"
                />
              </div>
            </div>

            {isNewUser && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-150">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    disabled={isJoining}
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium text-sm placeholder:text-slate-400 disabled:opacity-70"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining || phone.length !== 10 || (isNewUser && !name.trim())}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isJoining ? (
                <span>Entering Vault...</span>
              ) : (
                <>
                  <span>{isNewUser ? 'Complete & Join Vault' : 'Join with Mobile'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('pendingJoinTripId', id);
                  navigate('/auth');
                }}
                className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Or Sign In with Email & Password →
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Protection Badge */}
      <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>End-to-end synchronized group ledger</span>
      </div>
    </div>
  );
}
