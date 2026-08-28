import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import Logo from '../components/Logo';
import {
  Smartphone, 
  Mail, 
  Lock, 
  User, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Palmtree,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' | 'email'

  // Phone login states
  const [phone, setPhone] = useState('');
  const [phoneUserName, setPhoneUserName] = useState('');
  const [isNewPhoneUser, setIsNewPhoneUser] = useState(false);

  // Register mode states
  const [regPhone, setRegPhone] = useState('');

  const { login, loginWithPhone, register, joinTrip, error, isLoading } = useTripStore();

  const handleTabSwitch = (loginState) => {
    setIsLogin(loginState);
    useTripStore.setState({ error: null });
    setIsNewPhoneUser(false);
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
    if (error) useTripStore.setState({ error: null });
  };

  const handleRegPhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setRegPhone(raw);
    if (error) useTripStore.setState({ error: null });
  };

  const checkPendingJoin = async () => {
    const pendingTripId = sessionStorage.getItem('pendingJoinTripId');
    if (pendingTripId) {
      try {
        await joinTrip(pendingTripId);
        sessionStorage.removeItem('pendingJoinTripId');
        toast.success('Joined trip vault! 🚀');
        navigate(`/trip/${pendingTripId}`);
        return true;
      } catch {
        sessionStorage.removeItem('pendingJoinTripId');
      }
    }
    return false;
  };

  // Handle Phone Sign-In (No OTP, No Password)
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      const res = await loginWithPhone(phone, phoneUserName.trim() || undefined);
      
      if (res?.requiresName && !isNewPhoneUser) {
        setIsNewPhoneUser(true);
        toast('Welcome to TripVault! Please enter your name to complete your profile ✍️', { icon: '👋' });
        return;
      }

      if (res?.token) {
        toast.success(`Welcome ${res.name || ''}! 🎉`);
        const joined = await checkPendingJoin();
        if (!joined) navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Phone sign-in failed');
    }
  };

  // Handle Email & Password Sign-In or Register
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    try {
      if (isLogin) {
        const email = fd.get('email')?.toString().trim();
        const password = fd.get('password')?.toString();
        if (!email || !password) {
          toast.error('Please provide both email and password.');
          return;
        }
        await login(email, password);
        toast.success('Welcome back! ✈️');
        const joined = await checkPendingJoin();
        if (!joined) navigate('/');
      } else {
        const name = fd.get('name')?.toString().trim();
        const email = fd.get('email')?.toString().trim();
        const password = fd.get('password')?.toString();
        const cleanRegPhone = regPhone.trim();

        if (!name) {
          toast.error('Name is required');
          return;
        }
        if (!email) {
          toast.error('Email is required');
          return;
        }
        if (!password || password.length < 6) {
          toast.error('Password must be at least 6 characters.');
          return;
        }
        if (cleanRegPhone && cleanRegPhone.length !== 10) {
          toast.error('Phone number must be exactly 10 digits.');
          return;
        }

        await register(name, email, password, cleanRegPhone || undefined);
        toast.success('Account created successfully! Welcome to TripVault 🎉');
        const joined = await checkPendingJoin();
        if (!joined) navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-8 relative">
      
      {/* Top Bar with gentle Back Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => navigate('/welcome')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors p-1"
        >
          <ArrowLeft size={15} />
          <span>Home Overview</span>
        </button>
        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
          ✨ Peaceful Splitting
        </span>
      </div>

      {/* Main Peaceful Auth Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <Logo size="lg" className="mx-auto" onClick={() => navigate('/welcome')} />
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
            {isLogin ? 'Welcome Back' : 'Create Vault Account'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {isLogin 
              ? 'Sign in to access your trip ledgers and live balances' 
              : 'Join TripVault to organize group travel expenses with ease'}
          </p>
        </div>

        {/* Clean Rounded Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 space-y-5">
          
          {/* Main Tabs: Sign In vs Register */}
          <div className="flex p-1 bg-slate-100/90 rounded-2xl">
            <button 
              type="button"
              onClick={() => handleTabSwitch(true)} 
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                isLogin ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => handleTabSwitch(false)} 
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                !isLogin ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Register
            </button>
          </div>

          {/* Sub-Toggle for Sign-In: Mobile vs Email */}
          {isLogin && (
            <div className="flex p-1 bg-slate-50 border border-slate-200/70 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('phone');
                  useTripStore.setState({ error: null });
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all ${
                  loginMethod === 'phone'
                    ? 'bg-white border border-slate-200 text-indigo-600 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                <Smartphone size={13} />
                <span>Mobile (1-Tap)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email');
                  useTripStore.setState({ error: null });
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all ${
                  loginMethod === 'email'
                    ? 'bg-white border border-slate-200 text-indigo-600 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                <Mail size={13} />
                <span>Email & Password</span>
              </button>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* METHOD 1: 1-TAP MOBILE SIGN-IN                                            */}
          {/* ========================================================================= */}
          {isLogin && loginMethod === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                  10-Digit Mobile Number
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
                    disabled={isLoading}
                    autoFocus
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold tracking-wide text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Prompt name if new user */}
              {isNewPhoneUser && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-150">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      value={phoneUserName}
                      onChange={(e) => setPhoneUserName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                      disabled={isLoading}
                      autoFocus
                      className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-70"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading || phone.length !== 10 || (isNewPhoneUser && !phoneUserName.trim())}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span className="inline-block animate-pulse">Entering Vault...</span>
                ) : (
                  <>
                    <span>{isNewPhoneUser ? 'Complete & Enter Vault' : 'Continue with Mobile'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* METHOD 2: EMAIL & PASSWORD SIGN-IN                                        */}
          {/* ========================================================================= */}
          {isLogin && loginMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    disabled={isLoading}
                    autoFocus
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-70" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="password" 
                    type="password" 
                    placeholder="Enter your password" 
                    required 
                    disabled={isLoading}
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-70" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span className="inline-block animate-pulse">Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In with Email</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* REGISTER MODE: FULL ACCOUNT CREATION                                      */}
          {/* ========================================================================= */}
          {!isLogin && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="name" 
                    type="text" 
                    placeholder="e.g. Rahul Sharma" 
                    required 
                    disabled={isLoading}
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-70" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    disabled={isLoading}
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-70" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                  10-Digit Mobile (Optional)
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="phone" 
                    type="tel" 
                    value={regPhone}
                    onChange={handleRegPhoneChange}
                    maxLength={10}
                    placeholder="10-digit Mobile" 
                    disabled={isLoading}
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold tracking-wide text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-70" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                  Create Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="password" 
                    type="password" 
                    placeholder="Password (min 6 characters)" 
                    required 
                    disabled={isLoading}
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-70" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span className="inline-block animate-pulse">Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account & Enter</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 text-center">
          <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-2xs">
            <Palmtree size={16} className="text-emerald-600 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-slate-700">Trip Ledgers</p>
          </div>
          <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-2xs">
            <Sparkles size={16} className="text-indigo-600 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-slate-700">AI Auto-Tag</p>
          </div>
          <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-2xs">
            <ShieldCheck size={16} className="text-purple-600 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-slate-700">Debt Settle</p>
          </div>
        </div>

      </div>

      {/* Subtle Footer Note */}
      <div className="text-center text-[11px] text-slate-400 font-medium pb-2">
        <span>TripVault • Group travel expenses without the math</span>
      </div>

    </div>
  );
}