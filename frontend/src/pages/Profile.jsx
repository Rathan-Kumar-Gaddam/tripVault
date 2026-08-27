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
  LogOut, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { compressAvatarImage } from '../utils/coverPhotos';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, fetchProfile, logout } = useTripStore();

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

  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEmail(user?.email || '');
    setAvatar(user?.avatar || '');
  }

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressAvatarImage(file, 300, 0.85);
      setAvatar(compressed);
      toast.success('Photo ready to save! 📸');
    } catch (err) {
      toast.error(err.message || 'Failed to process image');
    }
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
    <div className="p-4 sm:p-8 max-w-xl mx-auto space-y-6 pb-24 sm:pb-20 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <button 
          type="button"
          onClick={() => navigate('/')} 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>All Trips</span>
        </button>
        <button 
          type="button"
          onClick={logout} 
          className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
          Profile & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal details and payment preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Avatar Card */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-2xl text-slate-700 shadow-2xs">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                name ? name.charAt(0).toUpperCase() : <User size={36} className="text-slate-400" />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs active:scale-95 transition-all"
              title="Upload Photo"
            >
              <Camera size={14} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">{name || 'Traveler'}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{email || phone || 'No contact set'}</p>
          </div>

          {avatar && (
            <button
              type="button"
              onClick={() => setAvatar('')}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 size={12} />
              <span>Remove Photo</span>
            </button>
          )}
        </div>

        {/* Inputs Card */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-4">
          
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSaving}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSaving}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
              10-Digit Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={10}
                disabled={isSaving}
                placeholder="Optional mobile number"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 py-1"
            >
              <div className="flex items-center gap-2">
                <Lock size={15} className="text-slate-400" />
                <span>Security & Password</span>
              </div>
              {showPasswordSection ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showPasswordSection && (
              <div className="space-y-3 pt-3">
                {user?.hasPassword && (
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                  />
                )}
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 6 chars)"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 mt-2"
          >
            {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>

    </div>
  );
}
