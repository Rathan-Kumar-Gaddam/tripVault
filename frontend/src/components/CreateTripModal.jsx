import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Plane, 
  Calendar, 
  Wallet, 
  Users, 
  Check, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Compass, 
  DollarSign, 
  Info,
  MapPin,
  ShieldCheck,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from './CustomSelect';

const TRIP_CATEGORIES = [
  { id: 'Vacation', label: 'Vacation & Leisure', emoji: '🏖️', gradient: 'from-amber-500 via-orange-500 to-rose-500' },
  { id: 'Road Trip', label: 'Road Trip', emoji: '🚗', gradient: 'from-indigo-600 via-purple-600 to-pink-500' },
  { id: 'Adventure', label: 'Trek & Adventure', emoji: '🏔️', gradient: 'from-emerald-600 via-teal-600 to-cyan-600' },
  { id: 'Weekend', label: 'Weekend Getaway', emoji: '🏙️', gradient: 'from-purple-600 via-pink-600 to-rose-500' },
  { id: 'Friends', label: 'Friends Hangout', emoji: '🎉', gradient: 'from-blue-600 via-indigo-600 to-purple-600' },
  { id: 'Family', label: 'Family Vacation', emoji: '👨‍👩‍👧', gradient: 'from-teal-600 via-emerald-600 to-lime-600' },
  { id: 'Business', label: 'Business & Offsite', emoji: '💼', gradient: 'from-slate-700 via-slate-800 to-slate-900' },
];

const EMOJI_OPTIONS = ['🏖️', '🏔️', '✈️', '🚗', '🏕️', '🌴', '🏙️', '⛺', '⛵', '🎉', '🏰', '🗺️'];

const CURRENCIES = [
  { code: '₹', label: '₹ INR (India)', icon: '🇮🇳' },
  { code: '$', label: '$ USD (United States)', icon: '🇺🇸' },
  { code: '€', label: '€ EUR (Europe)', icon: '🇪🇺' },
  { code: '£', label: '£ GBP (United Kingdom)', icon: '🇬🇧' },
  { code: 'AED', label: 'AED (UAE Dirham)', icon: '🇦🇪' },
  { code: '¥', label: '¥ JPY (Japan)', icon: '🇯🇵' },
  { code: '฿', label: '฿ THB (Thailand)', icon: '🇹🇭' },
  { code: 'CAD $', label: 'CAD $ (Canada)', icon: '🇨🇦' },
  { code: 'AUD $', label: 'AUD $ (Australia)', icon: '🇦🇺' },
];

const BUDGET_PRESETS = [10000, 25000, 50000, 100000];

export default function CreateTripModal({ isOpen, onClose, onCreateTrip }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Financials, 3: Companions
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState('Vacation');
  const [selectedEmoji, setSelectedEmoji] = useState('🏖️');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  // Financial State
  const [currency, setCurrency] = useState('₹');
  const [budget, setBudget] = useState('');

  // Initial Companions State
  const [companions, setCompanions] = useState([]);
  const [compName, setCompName] = useState('');
  const [compPhone, setCompPhone] = useState('');

  // Auto-suggest emoji based on trip name
  const handleNameChange = (val) => {
    setTripName(val);
    const lower = val.toLowerCase();
    if (lower.includes('beach') || lower.includes('goa') || lower.includes('island')) {
      setSelectedEmoji('🏖️');
      setCategory('Vacation');
    } else if (lower.includes('trek') || lower.includes('mountain') || lower.includes('manali') || lower.includes('hill')) {
      setSelectedEmoji('🏔️');
      setCategory('Adventure');
    } else if (lower.includes('road') || lower.includes('drive') || lower.includes('ladakh')) {
      setSelectedEmoji('🚗');
      setCategory('Road Trip');
    } else if (lower.includes('camp') || lower.includes('forest') || lower.includes('jungle')) {
      setSelectedEmoji('🏕️');
      setCategory('Adventure');
    } else if (lower.includes('flight') || lower.includes('europe') || lower.includes('paris') || lower.includes('dubai') || lower.includes('singapore')) {
      setSelectedEmoji('✈️');
      setCategory('Vacation');
    }
  };

  const selectedCategoryMeta = useMemo(() => {
    return TRIP_CATEGORIES.find(c => c.id === category) || TRIP_CATEGORIES[0];
  }, [category]);

  const handleAddCompanion = (e) => {
    e.preventDefault();
    if (!compName.trim()) {
      toast.error('Please enter companion name.');
      return;
    }
    const cleanPhone = compPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (companions.some(c => c.phone === cleanPhone)) {
      toast.error('Companion with this phone number already added.');
      return;
    }

    setCompanions(prev => [...prev, { name: compName.trim(), phone: cleanPhone }]);
    setCompName('');
    setCompPhone('');
    toast.success(`Added ${compName.trim()} to companion list! 👤`);
  };

  const handleRemoveCompanion = (phoneToRemove) => {
    setCompanions(prev => prev.filter(c => c.phone !== phoneToRemove));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!tripName.trim()) {
      setCurrentStep(1);
      toast.error('Please enter a trip destination name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: tripName.trim(),
        destination: destination.trim() || tripName.trim(),
        category,
        icon: selectedEmoji,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        description: description.trim() || undefined,
        currency: currency || '₹',
        budget: Number(budget) > 0 ? Number(budget) : 0,
        initialMembers: companions,
      };

      await onCreateTrip(payload);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create trip vault.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[94vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* ===================================================================== */}
        {/* MODAL HEADER                                                          */}
        {/* ===================================================================== */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-slate-50/90 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 text-xl shrink-0">
              <span>{selectedEmoji}</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-heading">
                Create Trip Vault
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Set up a shared group expense ledger in 3 simple steps
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ===================================================================== */}
        {/* STEP PROGRESS NAVIGATION TABS                                         */}
        {/* ===================================================================== */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              currentStep === 1 
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center">1</span>
            <span className="truncate">Destination</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!tripName.trim()) {
                toast.error('Please enter a destination name first.');
                return;
              }
              setCurrentStep(2);
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              currentStep === 2 
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center">2</span>
            <span className="truncate">Budget</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!tripName.trim()) {
                toast.error('Please enter a destination name first.');
                return;
              }
              setCurrentStep(3);
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              currentStep === 3 
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center">3</span>
            <span className="truncate">Companions ({companions.length})</span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* MODAL BODY (SCROLLABLE STUDIO)                                        */}
        {/* ===================================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex flex-col gap-5">
          
          {/* DYNAMIC LIVE VIP TRIP CARD PREVIEW */}
          <div className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-r ${selectedCategoryMeta.gradient} text-white shadow-xl relative overflow-hidden transition-all duration-300`}>
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white border border-white/20">
                <Sparkles size={11} className="text-amber-300" />
                <span>{selectedCategoryMeta.label}</span>
              </span>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                Organizer Pass
              </span>
            </div>

            <div className="relative z-10 flex items-center gap-3.5">
              <span className="text-3xl sm:text-4xl shrink-0 drop-shadow">{selectedEmoji}</span>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate font-heading drop-shadow-sm">
                  {tripName.trim() || 'Your Destination Name'}
                </h3>
                <p className="text-xs text-white/80 font-medium flex items-center gap-2 mt-0.5">
                  <span>Target: <strong>{currency}{budget ? Number(budget).toLocaleString() : 'Flexible'}</strong></span>
                  <span>•</span>
                  <span>{companions.length + 1} {companions.length === 0 ? 'Traveler (You)' : 'Travelers'}</span>
                </p>
              </div>
            </div>

            {startDate && (
              <div className="relative z-10 mt-3 pt-2.5 border-t border-white/20 flex items-center gap-2 text-xs font-semibold text-white/90">
                <Calendar size={13} />
                <span>{new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {endDate && <span>➔ {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
              </div>
            )}
          </div>

          {/* =================================================================== */}
          {/* STEP 1: DESTINATION, EMOJI, CATEGORY & DATES                        */}
          {/* =================================================================== */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              {/* Trip Destination / Title */}
              <div>
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1.5 px-1">
                  Trip Destination / Vault Name *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Goa Summer Trip 2026, Manali Trek, Europe Roadtrip"
                    required
                    autoFocus
                    disabled={isSubmitting}
                    className="w-full p-4 pl-11 rounded-2xl bg-slate-50 border border-slate-200/90 font-bold text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Emoji Icon Picker Bar */}
              <div>
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1.5 px-1">
                  Trip Icon Emoji
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setSelectedEmoji(em)}
                      className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center transition-all shrink-0 ${
                        selectedEmoji === em
                          ? 'bg-indigo-50 border-2 border-indigo-600 scale-110 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip Category Selector */}
              <div>
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1.5 px-1">
                  Trip Type / Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TRIP_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setSelectedEmoji(cat.emoji);
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        category === cat.id
                          ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950 font-bold shadow-xs'
                          : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-lg shrink-0">{cat.emoji}</span>
                      <span className="text-xs font-bold truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start & End Dates (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1 px-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 font-semibold text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1 px-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 font-semibold text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1 px-1">
                  Trip Notes / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 5-day reunion with college friends in North Goa"
                  disabled={isSubmitting}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 font-medium text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* STEP 2: FINANCIAL TARGET, CURRENCY & BUDGET                         */}
          {/* =================================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1.5 px-1">
                    Vault Currency
                  </label>
                  <CustomSelect
                    value={currency}
                    onChange={(val) => setCurrency(val)}
                    disabled={isSubmitting}
                    options={CURRENCIES.map(c => ({
                      value: c.code,
                      label: c.label,
                      icon: c.icon,
                    }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1.5 px-1">
                    Target Budget Limit ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0 (Flexible / No limit)"
                    disabled={isSubmitting}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200/90 font-bold text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Quick Budget Presets */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
                  Quick Budget Target:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BUDGET_PRESETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudget(b.toString())}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        budget === b.toString()
                          ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700 font-bold'
                      }`}
                    >
                      <span className="text-xs">{currency}{(b / 1000)}k</span>
                      <span className="block text-[10px] opacity-80 font-medium">({currency}{b.toLocaleString()})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial info box */}
              <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3 text-xs text-indigo-900">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Real-time Group Spend Meter</p>
                  <p className="text-indigo-700/90 leading-relaxed text-[11px]">
                    Setting an estimated budget unlocks the live progress meter on the vault dashboard so everyone knows when you approach your limit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* STEP 3: INITIAL COMPANIONS (OPTIONAL QUICK ADD)                    */}
          {/* =================================================================== */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1 px-1">
                  Add Travel Companions (Optional)
                </h4>
                <p className="text-xs text-slate-500 mb-3 px-1">
                  Add friends now with their 10-digit mobile number, or invite them later via share link.
                </p>

                {/* Companion Quick Add Form */}
                <form onSubmit={handleAddCompanion} className="bg-slate-50/80 border border-slate-200/90 p-3.5 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                      placeholder="Companion Name (e.g. Lokesh)"
                      className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <input
                      type="tel"
                      value={compPhone}
                      onChange={(e) => setCompPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      placeholder="10-digit Phone Number"
                      className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Add Companion to Vault</span>
                  </button>
                </form>
              </div>

              {/* Companions List */}
              {companions.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                    Companions Ready to Join ({companions.length}):
                  </label>
                  <div className="flex flex-col gap-2">
                    {companions.map((comp) => (
                      <div
                        key={comp.phone}
                        className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {comp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">{comp.name}</p>
                            <p className="text-[10px] text-slate-400">+91 {comp.phone}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCompanion(comp.phone)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Remove"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                  No companions added yet. You can also generate an invite link once the vault is created!
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* MODAL FOOTER (CONTROLS)                                               */}
        {/* ===================================================================== */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={isSubmitting}
              className="py-3.5 px-4 bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-3.5 px-4 bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
            >
              Cancel
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (!tripName.trim()) {
                  toast.error('Please enter a destination name.');
                  return;
                }
                setCurrentStep(prev => prev + 1);
              }}
              className="flex-1 py-3.5 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Next Step</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !tripName.trim()}
              className="flex-1 py-3.5 px-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-indigo-600/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Trip Vault...</span>
                </>
              ) : (
                <>
                  <span>Create Trip Vault 🚀</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
