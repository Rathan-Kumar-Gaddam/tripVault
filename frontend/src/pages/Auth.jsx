import { useState } from 'react';
import useTripStore from '../store/useTripStore';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, error, isLoading } = useTripStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email');
    const password = fd.get('password');
    const name = fd.get('name');

    if (isLogin) {
      await login(email, password);
    } else {
      await register(name, email, password);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col justify-center bg-white">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">TripVault 🧳</h1>
      <p className="text-gray-500 mb-8">{isLogin ? 'Welcome back!' : 'Create an admin account to start.'}</p>

      {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-lg text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <input name="name" type="text" placeholder="Full Name" required className="p-4 bg-gray-50 border border-gray-200 rounded-xl" />
        )}
        <input name="email" type="email" placeholder="Email Address" required className="p-4 bg-gray-50 border border-gray-200 rounded-xl" />
        <input name="password" type="password" placeholder="Password" required className="p-4 bg-gray-50 border border-gray-200 rounded-xl" />

        <button disabled={isLoading} className="bg-indigo-600 text-white font-bold p-4 rounded-xl mt-2">
          {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)} className="mt-6 text-sm text-indigo-600 font-medium">
        {isLogin ? "Need to create a trip? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}