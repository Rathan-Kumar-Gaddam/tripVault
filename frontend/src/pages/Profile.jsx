import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { 
  ArrowLeft, 
  Camera, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  LogOut, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const { user, trips, fetchTrips, updateProfile, fetchProfile, logout } = useTripStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  
  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    if (trips.length === 0) fetchTrips();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Handle phone input formatting (digits only, max 10)
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
  };

  // Image compressor using HTML5 canvas
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    // Limit source file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight base64 JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(compressedBase64);
        toast.success('Photo ready to save! 📸');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatar('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Photo removed.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    const trimmedName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!trimmedName) {
      toast.error('Name cannot be empty.');
      return;
    }

    if (cleanPhone && cleanPhone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits.');
      return;
    }

    if (showPasswordSection && newPassword) {
      if (user?.hasPassword && !currentPassword) {
        toast.error('Current password is required to change password.');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match.');
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload = {
        name: trimmedName,
        phone: cleanPhone || '',
        email: cleanEmail || '',
        avatar: avatar || '',
      };

      if (showPasswordSection && newPassword) {
        if (currentPassword) payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await updateProfile(payload);
      toast.success('Profile updated successfully! ✨');
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 pb-28 sm:pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 sm:mb-8">
        <button 
          onClick={() => navigate('/')} 
          className="p-3 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">Profile & Settings</h1>
        <button 
          onClick={logout} 
          title="Sign Out" 
          className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl hover:bg-rose-100 shadow-sm active:scale-95 transition-transform"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-4 flex flex-col items-center bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
          <div className="relative group mb-4">
            <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-extrabold shadow-indigo-500/20">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                name ? name.charAt(0).toUpperCase() : <User size={48} />
              )}
            </div>

            {/* Camera upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-2xl shadow-lg border-2 border-white hover:bg-slate-800 active:scale-95 transition-all"
              title="Upload Photo"
            >
              <Camera size={18} />
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>

          <h2 className="text-xl font-bold text-slate-900 font-heading text-center">{name || 'Traveler'}</h2>
          <p className="text-xs text-slate-400 font-medium mb-4">{phone || email || 'No phone set'}</p>

          <div className="flex items-center gap-2 w-full justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors"
            >
              Change Photo
            </button>
            {avatar && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>

          {/* Account Info Stats Card */}
          <div className="w-full bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg shadow-slate-900/10 flex items-center justify-between mt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <Sparkles size={20} className="text-amber-300" />
              </div>
              <div>
                <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Active Member</p>
                <p className="text-sm font-bold">{trips.length} Group {trips.length === 1 ? 'Trip' : 'Trips'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/30">
              <CheckCircle2 size={14} /> Verified
            </div>
          </div>
        </div>

        {/* Right Column: Profile Form & Password Settings */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSaving}
                  placeholder="Your Name"
                  className="w-full p-4 pl-12 bg-slate-50/50 border border-slate-200 rounded-2xl font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70 shadow-sm"
                />
              </div>
            </div>

            {/* 10-Digit Phone Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  disabled={isSaving}
                  placeholder="10-digit Phone Number"
                  className="w-full p-4 pl-12 bg-slate-50/50 border border-slate-200 rounded-2xl font-medium tracking-wide text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70 shadow-sm"
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 px-1 text-xs font-medium">
                <span className="text-slate-400">Used for fast passwordless login</span>
                <span className={phone.length === 10 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {phone.length}/10 digits
                </span>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Email Address (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSaving}
                  placeholder="name@example.com"
                  className="w-full p-4 pl-12 bg-slate-50/50 border border-slate-200 rounded-2xl font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70 shadow-sm"
                />
              </div>
            </div>

            {/* Password Accordion */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-5 shadow-sm">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full flex items-center justify-between text-left font-bold text-slate-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Lock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Security & Password</p>
                    <p className="text-xs font-normal text-slate-400">
                      {user?.hasPassword ? 'Change your account password' : 'Set a password for your account'}
                    </p>
                  </div>
                </div>
                {showPasswordSection ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>

              {showPasswordSection && (
                <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-col gap-3 animate-in fade-in duration-200">
                  {user?.hasPassword && (
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current Password"
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:border-indigo-500 outline-none"
                    />
                  )}
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min 6 characters)"
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
