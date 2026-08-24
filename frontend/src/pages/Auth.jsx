import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import {
  MessageCircle,
  PlaneTakeoff, 
  Smartphone, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  UserPlus 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' | 'email'
  const [phone, setPhone] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1: Enter Phone, 2: Enter OTP
  const [otp, setOtp] = useState('');
  const [otpName, setOtpName] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpChannel, setOtpChannel] = useState('sms'); // 'sms' | 'whatsapp'

  const { login, loginWithPhone, sendPhoneOtp, verifyPhoneOtp, register, joinTrip, error, isLoading } = useTripStore();

  const handleTabSwitch = (loginState) => {
    setIsLogin(loginState);
    setOtpStep(1);
    setOtp('');
    useTripStore.setState({ error: null });
  };

  const handleMethodSwitch = (method) => {
    setLoginMethod(method);
    setOtpStep(1);
    setOtp('');
    useTripStore.setState({ error: null });
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

  const handleSendOtp = async (channelOverride) => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }

    const channelToSend = channelOverride || otpChannel;

    try {
      const res = await sendPhoneOtp(cleanPhone, channelToSend);
      setOtpStep(2);
      // If demo mode or test number, pre-fill; otherwise keep blank for user to enter code
      setOtp(res.demoOtp || '');
      setResendTimer(30);
      toast.success(res.message || `Verification code dispatched via ${channelToSend.toUpperCase()}!`);
      
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP.');
    }
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
      } catch (e) {
        sessionStorage.removeItem('pendingJoinTripId');
      }
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    try {
      if (isLogin) {
        if (loginMethod === 'phone') {
          if (otpStep === 1) {
            await handleSendOtp();
            return;
          }

          // Step 2: Verify OTP
          const cleanOtp = otp.trim();
          if (!cleanOtp) {
            toast.error('Please enter the 4-digit verification code.');
            return;
          }

          await verifyPhoneOtp(phone.trim(), cleanOtp, otpName.trim());
          toast.success('Welcome back to TripVault! ✈️');
          const joined = await checkPendingJoin();
          if (!joined) navigate('/');
        } else {
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
        }
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
    <div className="flex flex-col justify-center px-4 sm:px-6 py-6 sm:py-10 pb-8 relative">
      
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/25 rotate-3 hover:rotate-0 transition-transform">
          <PlaneTakeoff size={32} className="-rotate-3" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-heading">TripVault</h1>
        <p className="text-slate-500 mt-1.5 text-sm font-medium">
          {isLogin 
            ? (loginMethod === 'phone' ? 'Instant access with your 10-digit mobile number' : 'Welcome back to your travel vaults') 
            : 'Create your organizer vault & split with friends'}
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white rounded-[2rem] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-slate-100">
        
        {/* Main Tab: Sign In vs Create Account */}
        <div className="flex p-1.5 bg-slate-100/80 rounded-2xl mb-6">
          <button 
            type="button"
            onClick={() => handleTabSwitch(true)} 
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              isLogin ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => handleTabSwitch(false)} 
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              !isLogin ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Register
          </button>
        </div>

        {/* Login Method Sub-Toggle (Only for Login) */}
        {isLogin && (
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => handleMethodSwitch('phone')}
              className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                loginMethod === 'phone'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Smartphone size={14} /> Phone Number
            </button>
            <button
              type="button"
              onClick={() => handleMethodSwitch('email')}
              className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                loginMethod === 'email'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Mail size={14} /> Email & Password
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold mb-5 flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            {isLogin && loginMethod === 'phone' && error.includes('No account found') && (
              <button
                type="button"
                onClick={() => {
                  setRegPhone(phone);
                  setIsLogin(false);
                  useTripStore.setState({ error: null });
                }}
                className="mt-1 py-2 px-3 bg-white border border-rose-200 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <UserPlus size={14} />
                <span>Create account with {phone} →</span>
              </button>
            )}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Register Mode Inputs */}
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="name" 
                  type="text" 
                  placeholder="Full Name" 
                  required 
                  disabled={isLoading}
                  className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-sm placeholder:text-slate-400 disabled:opacity-70" 
                />
              </div>

              <div>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="phone" 
                    type="tel" 
                    value={regPhone}
                    onChange={handleRegPhoneChange}
                    maxLength={10}
                    placeholder="10-digit Phone (Optional)" 
                    disabled={isLoading}
                    className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium tracking-wide text-sm placeholder:text-slate-400 disabled:opacity-70" 
                  />
                </div>
                {regPhone.length > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1 px-1">{regPhone.length}/10 digits</p>
                )}
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="email" 
                  type="email" 
                  placeholder="Email Address" 
                  required 
                  disabled={isLoading}
                  className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-sm placeholder:text-slate-400 disabled:opacity-70" 
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="password" 
                  type="password" 
                  placeholder="Create Password" 
                  required 
                  disabled={isLoading}
                  className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-sm placeholder:text-slate-400 disabled:opacity-70" 
                />
              </div>
            </>
          )}

          {/* Login Mode - Phone (2-Step OTP Verification) */}
          {isLogin && loginMethod === 'phone' && (
            <div className="space-y-3">
              {otpStep === 1 ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      name="phone" 
                      type="tel" 
                      value={phone}
                      onChange={handlePhoneChange}
                      maxLength={10}
                      placeholder="Enter 10-digit Mobile Number" 
                      required 
                      disabled={isLoading}
                      className="w-full p-4 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold tracking-wide text-sm placeholder:text-slate-400 disabled:opacity-70" 
                    />
                  </div>
                  <div className="flex justify-between items-center px-1 text-xs">
                    <span className="text-slate-400 text-[11px]">Instant OTP verification</span>
                    <span className={phone.length === 10 ? 'text-emerald-600 font-bold text-[11px]' : 'text-slate-400 text-[11px]'}>
                      {phone.length}/10 digits
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 animate-in fade-in">
                  <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} className="text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-950">+91 {phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpStep(1)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block px-1">
                      4-Digit Verification Code
                    </label>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                      maxLength={6}
                      placeholder="1234"
                      autoFocus
                      required
                      className="w-full p-3.5 text-center tracking-[0.5em] text-lg font-black bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                    />
                  </div>

                  <div className="flex justify-between items-center px-1 text-xs">
                    <span className="text-[11px] text-emerald-600 font-semibold">💡 Demo OTP: 1234</span>
                    {resendTimer > 0 ? (
                      <span className="text-[11px] text-slate-400 font-medium">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Login Mode - Email & Password */}
          {isLogin && loginMethod === 'email' && (
            <div className="space-y-3.5">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="email" 
                  type="email" 
                  placeholder="Email Address" 
                  required 
                  disabled={isLoading}
                  className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-sm placeholder:text-slate-400 disabled:opacity-70" 
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="password" 
                  type="password" 
                  placeholder="Password" 
                  required 
                  disabled={isLoading}
                  className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-sm placeholder:text-slate-400 disabled:opacity-70" 
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button 
            type="submit" 
            disabled={isLoading || (isLogin && loginMethod === 'phone' && (otpStep === 1 ? phone.length !== 10 : otp.length < 4))}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block animate-pulse">Authenticating...</span>
            ) : (
              <>
                <span>
                  {!isLogin 
                    ? 'Create Account' 
                    : loginMethod === 'phone' 
                      ? (otpStep === 1 ? 'Get Verification Code 📲' : 'Verify & Enter Vault 🚀')
                      : 'Enter TripVault'}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-3 gap-2 mt-6">
        <div className="bg-white/80 border border-slate-100 p-2.5 rounded-2xl text-center shadow-sm">
          <Zap size={16} className="text-amber-500 mx-auto mb-1" />
          <p className="text-[10px] font-bold text-slate-700">Instant Split</p>
        </div>
        <div className="bg-white/80 border border-slate-100 p-2.5 rounded-2xl text-center shadow-sm">
          <ShieldCheck size={16} className="text-indigo-600 mx-auto mb-1" />
          <p className="text-[10px] font-bold text-slate-700">Group Vault</p>
        </div>
        <div className="bg-white/80 border border-slate-100 p-2.5 rounded-2xl text-center shadow-sm">
          <Sparkles size={16} className="text-purple-600 mx-auto mb-1" />
          <p className="text-[10px] font-bold text-slate-700">Zero Math</p>
        </div>
      </div>
    </div>
  );
}