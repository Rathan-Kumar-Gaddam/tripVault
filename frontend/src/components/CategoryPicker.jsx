import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Sparkles, 
  X, 
  Check, 
  Trash2, 
  Palette, 
  Smile, 
  Layers 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  PRESET_CATEGORIES, 
  COLOR_THEMES, 
  POPULAR_EMOJIS, 
  getCustomCategories, 
  saveCustomCategory, 
  deleteCustomCategory, 
  getCategoryMeta 
} from '../utils/categoryUtils';

const QUICK_IDEAS = [
  { name: 'Water Sports', emoji: '🏄‍♂️', themeIdx: 1 },
  { name: 'Scooter Rental', emoji: '🛵', themeIdx: 0 },
  { name: 'Drinks & Bar', emoji: '🍷', themeIdx: 5 },
  { name: 'Souvenirs', emoji: '🎁', themeIdx: 4 },
  { name: 'Toll & Parking', emoji: '⛽', themeIdx: 0 },
  { name: 'Camping Gear', emoji: '⛺', themeIdx: 6 },
  { name: 'Movie & Shows', emoji: '🍿', themeIdx: 3 },
  { name: 'Photography', emoji: '📸', themeIdx: 6 },
];

export default function CategoryPicker({ 
  selectedCategory, 
  onSelectCategory, 
  tripId, 
  onAutoFillDescription,
  currentDescription 
}) {
  const [customCategories, setCustomCategories] = useState([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  
  // Custom creator state
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('✨');
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);

  // Load custom categories on mount and when tripId changes
  useEffect(() => {
    setCustomCategories(getCustomCategories(tripId));
  }, [tripId]);

  const handleOpenModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCustomName('');
    setCustomEmoji('✨');
    setSelectedThemeIndex(Math.floor(Math.random() * COLOR_THEMES.length));
    setShowCustomModal(true);
  };

  const handleCloseModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowCustomModal(false);
  };

  const handleSaveCustom = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!customName || !customName.trim()) {
      toast.error('Please enter a category name (e.g. Scuba Diving)');
      return;
    }

    const trimmed = customName.trim();
    const chosenTheme = COLOR_THEMES[selectedThemeIndex] || COLOR_THEMES[0];
    
    const newCategory = {
      id: trimmed,
      label: trimmed,
      emoji: customEmoji || '✨',
      theme: chosenTheme,
      isCustom: true,
      defaultNote: trimmed,
    };

    const updated = saveCustomCategory(tripId, newCategory);
    setCustomCategories(updated);
    
    // Select the newly created category immediately
    onSelectCategory(trimmed);
    
    if (!currentDescription && onAutoFillDescription) {
      onAutoFillDescription(trimmed);
    }

    setShowCustomModal(false);
    toast.success(`Custom category "${trimmed}" created! 🎨`);
  };

  const handleSelectQuickIdea = (idea) => {
    setCustomName(idea.name);
    setCustomEmoji(idea.emoji);
    setSelectedThemeIndex(idea.themeIdx);
  };

  const handleDeleteCustom = (e, catId) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = deleteCustomCategory(tripId, catId);
    setCustomCategories(updated);
    if (selectedCategory === catId) {
      onSelectCategory(PRESET_CATEGORIES[0].id);
    }
    toast.success('Custom category removed');
  };

  const currentTheme = COLOR_THEMES[selectedThemeIndex] || COLOR_THEMES[0];

  return (
    <div className="space-y-2.5 sm:space-y-3 w-full">
      {/* Category Header Row */}
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={13} className="text-indigo-500 shrink-0" />
          <span>Expense Category</span>
        </label>
        <button
          type="button"
          onClick={handleOpenModal}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all active:scale-95 border border-indigo-200/60 shadow-2xs"
        >
          <Plus size={13} strokeWidth={3} />
          <span>+ Custom</span>
        </button>
      </div>

      {/* Fully Responsive Grid of Categories */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 gap-2 sm:gap-2.5 w-full">
        {/* Preset Categories */}
        {PRESET_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const theme = cat.theme;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onSelectCategory(cat.id);
                if (!currentDescription && onAutoFillDescription && cat.defaultNote) {
                  onAutoFillDescription(cat.defaultNote);
                }
              }}
              className={`relative p-2.5 sm:p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 active:scale-95 group overflow-hidden min-h-[76px] sm:min-h-[84px] ${
                isSelected
                  ? `${theme.bgLight} ${theme.activeBorder} ${theme.text} ring-2 ${theme.ring} shadow-md ${theme.glow}`
                  : 'bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50/80'
              }`}
            >
              {/* Top Accent Stripe */}
              {isSelected && (
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
              )}

              {/* Icon / Emoji badge */}
              <div 
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-base sm:text-lg transition-transform duration-200 ${
                  isSelected 
                    ? `bg-gradient-to-tr ${theme.gradient} text-white shadow-xs scale-105` 
                    : 'bg-slate-100 group-hover:scale-105 group-hover:bg-slate-200/70'
                }`}
              >
                <span>{cat.emoji}</span>
              </div>

              <span className="text-[10px] sm:text-[11px] truncate w-full text-center tracking-tight leading-tight px-0.5">
                {cat.label}
              </span>

              {isSelected && (
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              )}
            </button>
          );
        })}

        {/* User's Custom-Made Categories */}
        {customCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id || selectedCategory === cat.label;
          const meta = getCategoryMeta(cat.id || cat.label, tripId);
          const theme = meta.theme || COLOR_THEMES[0];

          return (
            <div
              key={cat.id || cat.label}
              onClick={() => {
                onSelectCategory(cat.id || cat.label);
                if (!currentDescription && onAutoFillDescription) {
                  onAutoFillDescription(cat.label);
                }
              }}
              className={`relative p-2.5 sm:p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 group overflow-hidden min-h-[76px] sm:min-h-[84px] ${
                isSelected
                  ? `${theme.bgLight} ${theme.activeBorder} ${theme.text} ring-2 ${theme.ring} shadow-md ${theme.glow}`
                  : 'bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50/80'
              }`}
            >
              {isSelected && (
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
              )}

              <div 
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-base sm:text-lg transition-transform duration-200 ${
                  isSelected 
                    ? `bg-gradient-to-tr ${theme.gradient} text-white shadow-xs scale-105` 
                    : 'bg-slate-100 group-hover:scale-105 group-hover:bg-slate-200/70'
                }`}
              >
                <span>{cat.emoji || '✨'}</span>
              </div>

              <div className="flex items-center justify-center gap-0.5 sm:gap-1 w-full px-0.5">
                <span className="text-[10px] sm:text-[11px] truncate text-center tracking-tight leading-tight">
                  {cat.label}
                </span>
                <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 font-extrabold shrink-0">
                  ★
                </span>
              </div>

              {/* Delete custom category button */}
              <button
                type="button"
                onClick={(e) => handleDeleteCustom(e, cat.id || cat.label)}
                title="Remove custom category"
                className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}

        {/* Quick Add Custom Card */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="p-2.5 sm:p-3 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 active:scale-95 group min-h-[76px] sm:min-h-[84px]"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-2xs">
            <Plus size={16} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-tight">+ Custom</span>
        </button>
      </div>

      {/* ===================== FULLY RESPONSIVE CUSTOM CREATOR MODAL ===================== */}
      {showCustomModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-t-[2rem] sm:rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full max-h-[90vh] sm:max-h-[88vh] flex flex-col p-5 sm:p-6 relative overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 font-heading">Create Custom Category</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">Tailored for your trip expenses</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body Container */}
            <div className="space-y-3.5 sm:space-y-4 overflow-y-auto pr-1 no-scrollbar flex-1 pb-1">
              {/* Live Preview Card */}
              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200/60 flex flex-col items-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Live Preview
                </span>
                <div className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl border ${currentTheme.bgLight} ${currentTheme.activeBorder} ${currentTheme.text} ring-2 ${currentTheme.ring} shadow-md flex items-center gap-2 sm:gap-2.5 transition-all max-w-full`}>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr ${currentTheme.gradient} text-white flex items-center justify-center text-sm sm:text-base shadow-xs shrink-0`}>
                    <span>{customEmoji || '✨'}</span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm truncate">
                    {customName.trim() || 'Category Name'}
                  </span>
                </div>
              </div>

              {/* Quick Preset Ideas */}
              <div>
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Popular Quick Ideas
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_IDEAS.map((idea) => (
                    <button
                      key={idea.name}
                      type="button"
                      onClick={() => handleSelectQuickIdea(idea)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200/60 rounded-xl text-[11px] sm:text-xs font-bold text-slate-600 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <span>{idea.emoji}</span>
                      <span>{idea.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Name Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveCustom(e);
                    }
                  }}
                  placeholder="e.g. Scuba Diving, Souvenirs, Wine Tasting"
                  maxLength={30}
                  autoFocus
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Emoji Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Smile size={14} className="text-amber-500" />
                    <span>Choose an Emoji</span>
                  </span>
                  <input
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    placeholder="Custom"
                    maxLength={4}
                    className="w-14 sm:w-16 px-1.5 py-0.5 sm:py-1 text-center bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                    title="Type any emoji"
                  />
                </label>
                <div className="grid grid-cols-8 gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-slate-50 border border-slate-200/60 rounded-2xl max-h-24 sm:max-h-28 overflow-y-auto no-scrollbar">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCustomEmoji(emoji)}
                      className={`h-7 sm:h-8 rounded-xl flex items-center justify-center text-sm sm:text-base hover:bg-white transition-all active:scale-95 ${
                        customEmoji === emoji 
                          ? 'bg-white shadow-xs ring-2 ring-indigo-500 scale-105' 
                          : 'hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Palette size={14} className="text-indigo-500" />
                  <span>Choose Theme Color</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {COLOR_THEMES.map((theme, idx) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeIndex(idx)}
                      className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all active:scale-95 ${
                        selectedThemeIndex === idx 
                          ? `${theme.bgLight} ${theme.activeBorder} ring-2 ${theme.ring} shadow-2xs` 
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${theme.gradient} shrink-0`} />
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 truncate">
                        {theme.name.split(' ')[1] || theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Responsive Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2.5 pt-3 border-t border-slate-100 shrink-0 mt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:flex-1 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="w-full sm:flex-2 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={16} strokeWidth={3} />
                <span>Save & Use Category</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
