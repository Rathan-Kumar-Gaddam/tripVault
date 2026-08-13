import { useState } from 'react';
import useTripStore from '../store/useTripStore';
import { PlaneTakeoff } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, error, isLoading } = useTripStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (isLogin) await login(fd.get('email'), fd.get('password'));
    else await register(fd.get('name'), fd.get('email'), fd.get('password'));
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-gray-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-900/20 rotate-3">
          <PlaneTakeoff size={32} className="-rotate-3" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">TripVault</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">{isLogin ? 'Welcome back, traveler.' : 'Create your vault and invite friends.'}</p>
      </div>

      {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-sm font-medium mb-6 animate-in fade-in zoom-in-95">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <input name="name" type="text" placeholder="Full Name" required className="p-4 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-400" />
        )}
        <input name="email" type="email" placeholder="Email Address" required className="p-4 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-400" />
        <input name="password" type="password" placeholder="Password" required className="p-4 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-400" />

        <button disabled={isLoading} className="w-full bg-gray-900 text-white font-bold p-4 rounded-2xl mt-4 shadow-lg shadow-gray-900/20 active:scale-[0.98] transition-all disabled:opacity-70">
          {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)} className="mt-8 text-sm text-gray-500 font-medium hover:text-gray-900 transition-colors">
        {isLogin ? "Need to create a trip? " : "Already have an account? "}
        <span className="text-indigo-600 font-bold">{isLogin ? "Sign up" : "Sign in"}</span>
      </button>
    </div>
  );
}