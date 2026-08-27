import { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  MapPin, 
  Sparkles,
  Check,
  Camera,
  Upload,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from './CustomSelect';
import { 
  COVER_PHOTOS, 
  getCoverPhotoForTrip, 
  DEFAULT_COVER_PHOTO, 
  compressCoverImage 
} from '../utils/coverPhotos';

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

export default function CreateTripModal({ isOpen, onClose, onCreateTrip }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tripName, setTripName] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(DEFAULT_COVER_PHOTO);
  const [isCustomPhoto, setIsCustomPhoto] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [budget, setBudget] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (val) => {
    setTripName(val);
    if (!isCustomPhoto) {
      const matchedPhoto = getCoverPhotoForTrip(val);
      setSelectedPhoto(matchedPhoto);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressCoverImage(file);
      setSelectedPhoto(compressedDataUrl);
      setIsCustomPhoto(true);
      toast.success('Custom cover photo attached! 📸');
    } catch (err) {
      toast.error(err.message || 'Failed to process image file');
    }
  };

  const handleResetToTheme = () => {
    setIsCustomPhoto(false);
    setSelectedPhoto(getCoverPhotoForTrip(tripName));
    toast.success('Reverted to theme photo');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tripName.trim()) {
      toast.error('Please enter a destination or trip name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: tripName.trim(),
        destination: tripName.trim(),
        coverPhoto: selectedPhoto,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currency: currency || '₹',
        budget: Number(budget) > 0 ? Number(budget) : 0,
      };

      await onCreateTrip(payload);
      toast.success(`Trip vault "${tripName.trim()}" created! 🎉`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.2rem] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 relative my-8">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2 bg-white/90 backdrop-blur-md text-slate-500 hover:text-slate-900 rounded-full shadow-xs transition-colors"
        >
          <X size={18} />
        </button>

        {/* Live Hero Preview Card */}
        <div className="relative h-44 rounded-3xl overflow-hidden mb-6 shadow-md border border-slate-100 group">
          <img 
            src={selectedPhoto} 
            alt="Trip Cover Preview" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-5 text-white">
            
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                <Sparkles size={12} />
                <span>{isCustomPhoto ? 'Custom Cover Photo' : 'Trip Vault Preview'}</span>
              </div>

              {/* Upload trigger directly on live preview card */}
              <label className="cursor-pointer px-2.5 py-1 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full text-[10px] font-bold flex items-center gap-1 transition-all">
                <Camera size={11} />
                <span>{isCustomPhoto ? 'Change' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-xs truncate">
              {tripName.trim() || 'Your Next Adventure'}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-200/90 font-medium">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-rose-400" />
                <span>{tripName.trim() || 'Destination'}</span>
              </span>
              <span>•</span>
              <span>Currency: {currency}</span>
              {budget > 0 && (
                <>
                  <span>•</span>
                  <span>Budget: {currency}{Number(budget).toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Trip Name Input */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
              Destination / Trip Name *
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={tripName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Goa Beach Trip, Manali Trek, Dubai 2026"
                required
                autoFocus
                className="w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Curated Cover Photo Selector or Custom Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Choose Cover Theme or Upload
              </label>
              
              {isCustomPhoto && (
                <button
                  type="button"
                  onClick={handleResetToTheme}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={11} />
                  <span>Reset to theme</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              
              {/* Custom Upload Button Slot */}
              <label className={`relative h-16 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                isCustomPhoto 
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs' 
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-500 hover:text-slate-800'
              }`}>
                <Upload size={16} className={isCustomPhoto ? 'text-indigo-600' : 'text-slate-400'} />
                <span className="text-[9px] font-bold mt-1 text-center leading-tight">
                  {isCustomPhoto ? 'Custom' : 'Upload'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Curated Photo Themes */}
              {COVER_PHOTOS.slice(0, 4).map((photo) => {
                const isSelected = !isCustomPhoto && selectedPhoto === photo.url;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      setIsCustomPhoto(false);
                      setSelectedPhoto(photo.url);
                    }}
                    className={`relative h-16 rounded-2xl overflow-hidden border-2 transition-all group ${
                      isSelected 
                        ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/20 scale-[1.02]' 
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.label} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-end p-1.5">
                      <span className="text-[9px] font-bold text-white leading-tight truncate drop-shadow-xs">
                        {photo.label.split('/')[0]}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency & Optional Budget Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                Currency
              </label>
              <CustomSelect
                value={currency}
                onChange={(val) => setCurrency(val)}
                options={CURRENCIES}
                placeholder="Select Currency"
                renderOption={(opt) => (
                  <div className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    <span className="font-semibold">{opt.label}</span>
                  </div>
                )}
                renderSelected={(opt) => (
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span>{opt?.icon}</span>
                    <span>{opt?.code}</span>
                  </div>
                )}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                Budget (Optional)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 50000"
                min="0"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Travel Dates (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || !tripName.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <span className="inline-block animate-pulse">Creating Vault...</span>
            ) : (
              <>
                <span>Create Trip Vault</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
