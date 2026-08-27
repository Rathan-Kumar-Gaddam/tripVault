import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { 
  ArrowRight, 
  Check, 
  Sparkles, 
  Users, 
  Download, 
  HandCoins, 
  Smartphone,
  PieChart,
  Palmtree
} from 'lucide-react';
import { predictCategoryObject } from '../utils/aiCategoryPredictor';

const DEMO_MEMBERS = [
  { id: '1', name: 'You', avatar: null, emoji: '😎' },
  { id: '2', name: 'Rahul', avatar: null, emoji: '🚗' },
  { id: '3', name: 'Priya', avatar: null, emoji: '🍕' },
  { id: '4', name: 'Ananya', avatar: null, emoji: '📸' },
];

export default function Landing() {
  const navigate = useNavigate();

  // Interactive Live Demo State
  const [demoAmount, setDemoAmount] = useState(2400);
  const [demoDesc, setDemoDesc] = useState('Seafood Dinner & Drinks');
  const [demoSelectedIds, setDemoSelectedIds] = useState(['1', '2', '3', '4']);

  const demoPredicted = useMemo(() => {
    return predictCategoryObject(demoDesc);
  }, [demoDesc]);

  const demoSplitCount = demoSelectedIds.length || 1;
  const demoPerPerson = (demoAmount / demoSplitCount).toFixed(2);

  const toggleDemoMember = (memberId) => {
    if (demoSelectedIds.includes(memberId)) {
      if (demoSelectedIds.length > 1) {
        setDemoSelectedIds(demoSelectedIds.filter((id) => id !== memberId));
      }
    } else {
      setDemoSelectedIds([...demoSelectedIds, memberId]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR                                                        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-semibold text-slate-600">
            <a href="#playground" className="hover:text-indigo-600 transition-colors">Live Split Demo</a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION                                                              */}
      {/* ========================================================================= */}
      <section className="relative pt-12 sm:pt-20 pb-14 sm:pb-20 overflow-hidden text-center px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Gentle Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-bold shadow-2xs">
            <Palmtree size={14} className="text-emerald-600" />
            <span>Peaceful Group Travel Expense Management</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] font-heading">
            Travel with friends.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
              Without the awkward math.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xs sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
            Create your shared trip vault in seconds. Real-time avatar splitting, intelligent AI auto-tagging, and 1-tap debt settlements.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Create Your Vault Free</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="#playground"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center shadow-2xs"
            >
              Try Interactive Split Demo
            </a>
          </div>

          {/* Trust points */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-5 text-[11px] sm:text-xs font-semibold text-slate-500 border-t border-slate-200/80 max-w-lg mx-auto">
            <div className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" />
              <span>100% Free Forever</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" />
              <span>1-Tap Mobile Sign In</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" />
              <span>PDF & Excel Export</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* INTERACTIVE PLAYGROUND (LIVE BILL SPLITTER DEMO)                          */}
      {/* ========================================================================= */}
      <section id="playground" className="py-14 sm:py-16 bg-white border-y border-slate-200/80 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center space-y-2 mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Interactive Playground
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
              See How Simple Splitting Feels
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Adjust the bill slider, type an expense description, and toggle companion avatars.
            </p>
          </div>

          {/* Peaceful Playground Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs max-w-lg mx-auto space-y-6">
            
            {/* Amount Slider & Display */}
            <div className="text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Expense Amount
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-heading">
                ₹{Number(demoAmount).toLocaleString()}
              </div>
              <input
                type="range"
                min="200"
                max="10000"
                step="100"
                value={demoAmount}
                onChange={(e) => setDemoAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Live Description Input with AI Category Detection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                What is this for?
              </label>
              <input
                type="text"
                value={demoDesc}
                onChange={(e) => setDemoDesc(e.target.value)}
                placeholder="e.g. Seafood Dinner, Uber cab, Hotel stay"
                className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-all shadow-2xs"
              />
              {demoPredicted && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 animate-in fade-in">
                  <Sparkles size={13} className="text-indigo-600" />
                  <span>AI Auto-Detected:</span>
                  <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold text-[11px]">
                    {demoPredicted.emoji} {demoPredicted.label}
                  </span>
                </div>
              )}
            </div>

            {/* Companion Avatars Selector with Live Calculated Shares */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Sharing Companions ({demoSplitCount} selected)
                </span>
                <span className="text-xs font-black text-indigo-600">
                  ₹{demoPerPerson} / person
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {DEMO_MEMBERS.map((m) => {
                  const isSelected = demoSelectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleDemoMember(m.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all text-left ${
                        isSelected
                          ? 'bg-white border-indigo-400 text-slate-900 shadow-2xs ring-2 ring-indigo-500/10'
                          : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{m.emoji}</span>
                        <span className="text-xs font-bold truncate">{m.name}</span>
                      </div>
                      <span className={`text-xs font-black shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {isSelected ? `₹${demoPerPerson}` : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Result Pill */}
            <div className="p-4 bg-white border border-indigo-200/90 rounded-2xl flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-indigo-600">Calculated Share</p>
                <p className="text-xs text-slate-500 font-medium">Each friend owes exactly</p>
              </div>
              <span className="text-2xl font-black text-indigo-600 font-heading">₹{demoPerPerson}</span>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* HOW IT WORKS (3 SIMPLE STEPS)                                             */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
            Simple & Easy
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
            How TripVault Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/90 p-6 rounded-3xl space-y-3 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto font-black text-sm">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Create a Vault</h3>
            <p className="text-xs text-slate-500">
              Name your trip, pick a travel cover photo, and invite friends with an instant share link.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 p-6 rounded-3xl space-y-3 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto font-black text-sm">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Add Shared Expenses</h3>
            <p className="text-xs text-slate-500">
              Log meals, cabs, or hotels. AI auto-detects categories and splits with selected companion avatars.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 p-6 rounded-3xl space-y-3 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto font-black text-sm">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">Settle in 1-Tap</h3>
            <p className="text-xs text-slate-500">
              Everyone sees who they owe. Tap settle to clear debts with zero confusion or circular payments.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURE BENTO GRID                                                        */}
      {/* ========================================================================= */}
      <section id="features" className="py-14 bg-white border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Key Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
              Everything You Need For Group Travel
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            
            <div className="bg-slate-50 border border-slate-200/90 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Avatar Bill Splitting</h3>
              <p className="text-xs text-slate-500">
                Split meals or taxi rides with visual companion avatars and live per-person math.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">AI Auto-Tagging</h3>
              <p className="text-xs text-slate-500">
                Type &quot;dinner&quot; or &quot;uber&quot; and let TripVault categorize your expense automatically.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <HandCoins size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Debt Minimization</h3>
              <p className="text-xs text-slate-500">
                Members only see the people they owe. 1-tap pre-fills the exact debt amount.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center">
                <PieChart size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Live Group Analytics</h3>
              <p className="text-xs text-slate-500">
                Category spending breakdowns and companion contributions in visual progress bars.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <Download size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">PDF & Excel Statements</h3>
              <p className="text-xs text-slate-500">
                Download printable PDF breakdowns and itemized CSV files for record or taxes.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Smartphone size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">1-Tap Mobile Sign In</h3>
              <p className="text-xs text-slate-500">
                No password friction. Access your trip vaults with just your 10-digit mobile number.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CALL TO ACTION                                                      */}
      {/* ========================================================================= */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 space-y-5 shadow-xs">
          <Logo size="lg" className="mx-auto" />

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
            Ready to organize your next adventure?
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Create your first trip vault in 10 seconds and invite your travel companions.
          </p>

          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <span>Start Your Vault Free</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="mt-auto border-t border-slate-200/80 py-8 bg-slate-100/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} TripVault. Peaceful travel ledgers & zero math.</p>
          <div className="flex items-center gap-4 font-semibold">
            <button onClick={() => navigate('/auth')} className="hover:text-slate-900">Sign In</button>
            <a href="#playground" className="hover:text-slate-900">Live Demo</a>
            <a href="#features" className="hover:text-slate-900">Features</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
