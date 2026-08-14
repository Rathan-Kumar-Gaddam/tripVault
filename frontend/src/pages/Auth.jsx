import { useState } from 'react';
import useTripStore from '../store/useTripStore';
import { PlaneTakeoff, Smartphone, Mail, Lock, User } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' | 'email'
  const [phone, setPhone] = useState('');
  const { login, loginWithPhone, register, error, isLoading } = useTripStore();

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (isLogin) {
      if (loginMethod === 'phone') {
        const cleanPhone = phone.trim();
        if (!cleanPhone || cleanPhone.length !== 10) {
          useTripStore.setState({ error: 'Please enter a valid 10-digit phone number.' });
          return;
        }
        await loginWithPhone(cleanPhone);
      } else {
        const email = fd.get('email')?.toString().trim();
        const password = fd.get('password')?.toString();
        if (email && password) await login(email, password);
      }
    } else {
      const name = fd.get('name')?.toString().trim();
      const email = fd.get('email')?.toString().trim();
      const password = fd.get('password')?.toString();
      const regPhone = fd.get('phone')?.toString().trim();
      await register(name, email, password, regPhone);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-gray-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-900/20 rotate-3">
          <PlaneTakeoff size={32} className="-rotate-3" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">TripVault</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">
          {isLogin 
            ? (loginMethod === 'phone' ? 'Log in with your phone to view vaults.' : 'Welcome back, trip organizer.') 
            : 'Create your vault and invite friends.'}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-sm font-medium mb-6 animate-in fade-in zoom-in-95">
          {error}
        </div>
      )}

      {/* Login Mode Switcher (Phone vs Email) */}
      {isLogin && (
        <div className="flex p-1 bg-gray-200/60 backdrop-blur-sm rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              loginMethod === 'phone'
                ? 'bg-white shadow-[0_2px_8px_rgb(0,0,0,0.08)] text-gray-900'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Smartphone size={16} /> Phone Number
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              loginMethod === 'email'
                ? 'bg-white shadow-[0_2px_8px_rgb(0,0,0,0.08)] text-gray-900'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Mail size={16} /> Email & Password
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                name="name" 
                type="text" 
                placeholder="Full Name" 
                required 
                disabled={isLoading}
                className="w-full p-4 pl-12 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-400 disabled:opacity-70" 
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                name="email" 
                type="email" 
                placeholder="Email Address" 
                required 
                disabled={isLoading}
                className="w-full p-4 pl-12 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-400 disabled:opacity-70" 
              />
            </div>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                name="phone" 
                type="tel" 
                placeholder="Phone Number (Optional)" 
                disabled={isLoading}
                className="w-full p-4 pl-12 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-400 disabled:opacity-70" 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                name="password" 
                type="password" 
                placeholder="Password" 
                required 
                disabled={isLoading}
                className="w-full p-4 pl-12 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-400 disabled:opacity-70" 
              />
            </div>
          </>
        )}

        {isLogin && loginMethod === 'phone' && (
          <div className="space-y-3">
            <div>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  name="phone" 
                  type="tel" 
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  placeholder="10-digit Phone (e.g. 9845201587)" 
                  required 
                  disabled={isLoading}
                  className="w-full p-4 pl-12 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium tracking-wide placeholder:text-gray-400 disabled:opacity-70" 
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 px-1 text-xs font-medium">
                <span className="text-gray-400">10-digit phone number</span>
                <span className={phone.length === 10 ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                  {phone.length}/10 digits
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 px-1 font-medium">
              💡 If your trip admin added you by phone number, enter it here to jump straight into your vaults.
            </p>
          </div>
        )}

        {isLogin && loginMethod === 'email' && (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                name="email" 
                type="email" 
                placeholder="Email Address" 
                required 
                disabled={isLoading}
                className="w-full p-4 pl-12 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-400 disabled:opacity-70" 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                name="password" 
                type="password" 
                placeholder="Password" 
                required 
                disabled={isLoading}
                className="w-full p-4 pl-12 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-400 disabled:opacity-70" 
              />
            </div>
          </div>
        )}

        <button 
          disabled={isLoading} 
          className="w-full bg-gray-900 text-white font-bold p-4 rounded-2xl mt-2 shadow-lg shadow-gray-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading 
            ? 'Processing...' 
            : isLogin 
              ? (loginMethod === 'phone' ? 'Sign In with Phone' : 'Sign In with Email') 
              : 'Create Account'}
        </button>
      </form>

      {/* Quick alternative login button link */}
      {isLogin && (
        <button
          type="button"
          onClick={() => setLoginMethod(loginMethod === 'phone' ? 'email' : 'phone')}
          className="mt-3 text-xs text-indigo-600 font-semibold hover:underline text-center transition-colors"
        >
          {loginMethod === 'phone' ? '✉️ Login with Email & Password instead' : '📱 Login with Phone Number instead'}
        </button>
      )}

      <button 
        onClick={() => {
          setIsLogin(!isLogin);
          setLoginMethod('phone');
        }} 
        className="mt-8 text-sm text-gray-500 font-medium hover:text-gray-900 transition-colors text-center"
      >
        {isLogin ? "Need to create a trip? " : "Already have an account? "}
        <span className="text-indigo-600 font-bold">{isLogin ? "Sign up" : "Sign in"}</span>
      </button>
    </div>
  );
}