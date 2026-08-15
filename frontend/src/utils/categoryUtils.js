import { 
  Utensils, 
  Car, 
  Hotel, 
  Ticket, 
  ShoppingBag, 
  Coffee, 
  Plane, 
  Sparkles, 
  Camera, 
  HeartPulse, 
  Tag, 
  HandCoins, 
  HelpCircle,
  Fuel,
  Compass,
  Film,
  Music,
  Gift
} from 'lucide-react';

export const COLOR_THEMES = [
  {
    id: 'amber',
    name: 'Warm Amber',
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    border: 'border-amber-200',
    activeBorder: 'border-amber-400',
    text: 'text-amber-700',
    ring: 'ring-amber-400/40',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    hex: '#f59e0b',
    glow: 'shadow-amber-500/20'
  },
  {
    id: 'cyan',
    name: 'Electric Cyan',
    gradient: 'from-cyan-500 to-blue-500',
    bgLight: 'bg-cyan-50',
    border: 'border-cyan-200',
    activeBorder: 'border-cyan-400',
    text: 'text-cyan-700',
    ring: 'ring-cyan-400/40',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    hex: '#06b6d4',
    glow: 'shadow-cyan-500/20'
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    gradient: 'from-indigo-500 to-purple-600',
    bgLight: 'bg-indigo-50',
    border: 'border-indigo-200',
    activeBorder: 'border-indigo-400',
    text: 'text-indigo-700',
    ring: 'ring-indigo-400/40',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    hex: '#6366f1',
    glow: 'shadow-indigo-500/20'
  },
  {
    id: 'rose',
    name: 'Neon Rose',
    gradient: 'from-pink-500 to-rose-600',
    bgLight: 'bg-rose-50',
    border: 'border-rose-200',
    activeBorder: 'border-rose-400',
    text: 'text-rose-700',
    ring: 'ring-rose-400/40',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    hex: '#f43f5e',
    glow: 'shadow-rose-500/20'
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeBorder: 'border-emerald-400',
    text: 'text-emerald-700',
    ring: 'ring-emerald-400/40',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    hex: '#10b981',
    glow: 'shadow-emerald-500/20'
  },
  {
    id: 'fuchsia',
    name: 'Sunset Fuchsia',
    gradient: 'from-fuchsia-500 to-pink-600',
    bgLight: 'bg-fuchsia-50',
    border: 'border-fuchsia-200',
    activeBorder: 'border-fuchsia-400',
    text: 'text-fuchsia-700',
    ring: 'ring-fuchsia-400/40',
    badge: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
    hex: '#d946ef',
    glow: 'shadow-fuchsia-500/20'
  },
  {
    id: 'lime',
    name: 'Vibrant Lime',
    gradient: 'from-lime-500 to-emerald-600',
    bgLight: 'bg-lime-50',
    border: 'border-lime-200',
    activeBorder: 'border-lime-400',
    text: 'text-lime-700',
    ring: 'ring-lime-400/40',
    badge: 'bg-lime-100 text-lime-800 border-lime-300',
    hex: '#84cc16',
    glow: 'shadow-lime-500/20'
  },
  {
    id: 'ruby',
    name: 'Ruby Red',
    gradient: 'from-red-500 to-rose-600',
    bgLight: 'bg-red-50',
    border: 'border-red-200',
    activeBorder: 'border-red-400',
    text: 'text-red-700',
    ring: 'ring-red-400/40',
    badge: 'bg-red-100 text-red-800 border-red-300',
    hex: '#ef4444',
    glow: 'shadow-red-500/20'
  }
];

export const POPULAR_EMOJIS = [
  '🍽️', '☕', '🍕', '🍔', '🍦', '🍷', '🍺', '🍿',
  '🚕', '⛽', '✈️', '🚆', '🛵', '⛵', '🎟️', '🏨',
  '🛍️', '🎁', '🏖️', '🏔️', '🏄‍♂️', '🎿', '⛺', '📸',
  '🎭', '🎮', '💊', '💳', '🎉', '🛵', '🔥', '✨'
];

export const PRESET_CATEGORIES = [
  {
    id: 'Food & Dining',
    label: 'Food & Dining',
    emoji: '🍽️',
    icon: Utensils,
    theme: COLOR_THEMES[0], // amber
    defaultNote: 'Dinner / Lunch',
  },
  {
    id: 'Transport & Fuel',
    label: 'Transport & Fuel',
    emoji: '🚕',
    icon: Car,
    theme: COLOR_THEMES[1], // cyan
    defaultNote: 'Taxi / Fuel / Toll',
  },
  {
    id: 'Stay & Hotels',
    label: 'Stay & Hotels',
    emoji: '🏨',
    icon: Hotel,
    theme: COLOR_THEMES[2], // indigo
    defaultNote: 'Hotel / Resort Stay',
  },
  {
    id: 'Activities & Fun',
    label: 'Activities & Fun',
    emoji: '🎟️',
    icon: Ticket,
    theme: COLOR_THEMES[3], // rose
    defaultNote: 'Entry Tickets / Activity',
  },
  {
    id: 'Shopping',
    label: 'Shopping',
    emoji: '🛍️',
    icon: ShoppingBag,
    theme: COLOR_THEMES[4], // emerald
    defaultNote: 'Souvenirs / Shopping',
  },
  {
    id: 'Snacks & Drinks',
    label: 'Snacks & Drinks',
    emoji: '☕',
    icon: Coffee,
    theme: COLOR_THEMES[0], // amber
    defaultNote: 'Coffee & Snacks',
  },
  {
    id: 'Flights & Transit',
    label: 'Flights & Transit',
    emoji: '✈️',
    icon: Plane,
    theme: COLOR_THEMES[1], // cyan
    defaultNote: 'Flight / Train booking',
  },
  {
    id: 'Nightlife & Drinks',
    label: 'Nightlife & Drinks',
    emoji: '🍸',
    icon: Sparkles,
    theme: COLOR_THEMES[5], // fuchsia
    defaultNote: 'Pub / Nightlife',
  },
  {
    id: 'Sightseeing & Tours',
    label: 'Sightseeing',
    emoji: '📸',
    icon: Camera,
    theme: COLOR_THEMES[6], // lime
    defaultNote: 'Tour / Sightseeing Guide',
  },
  {
    id: 'Health & Medical',
    label: 'Health & Meds',
    emoji: '💊',
    icon: HeartPulse,
    theme: COLOR_THEMES[7], // ruby
    defaultNote: 'Medical / Pharmacy',
  },
];

// Helper to get custom categories for a trip (plus global saved custom categories)
export const getCustomCategories = (tripId) => {
  const categoriesMap = new Map();
  try {
    // Load global custom categories
    const globalRaw = localStorage.getItem('custom_categories_global');
    if (globalRaw) {
      const parsed = JSON.parse(globalRaw);
      if (Array.isArray(parsed)) {
        parsed.forEach(c => {
          if (c && c.label) categoriesMap.set(c.label.toLowerCase(), c);
        });
      }
    }
    // Load trip-specific custom categories
    if (tripId) {
      const tripRaw = localStorage.getItem(`custom_categories_${tripId}`);
      if (tripRaw) {
        const parsed = JSON.parse(tripRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach(c => {
            if (c && c.label) categoriesMap.set(c.label.toLowerCase(), c);
          });
        }
      }
    }
    return Array.from(categoriesMap.values());
  } catch {
    return Array.from(categoriesMap.values());
  }
};

// Helper to save a custom category
export const saveCustomCategory = (tripId, categoryObj) => {
  if (!categoryObj?.label) return getCustomCategories(tripId);
  try {
    const existing = getCustomCategories(tripId);
    const filtered = existing.filter(
      c => c.id !== categoryObj.id && c.label.toLowerCase() !== categoryObj.label.toLowerCase()
    );
    const updated = [...filtered, categoryObj];

    // Save to both global and trip-specific storage
    localStorage.setItem('custom_categories_global', JSON.stringify(updated));
    if (tripId) {
      localStorage.setItem(`custom_categories_${tripId}`, JSON.stringify(updated));
    }
    return updated;
  } catch {
    return [];
  }
};

// Helper to delete a custom category
export const deleteCustomCategory = (tripId, categoryId) => {
  try {
    const existing = getCustomCategories(tripId);
    const updated = existing.filter(c => c.id !== categoryId && c.label !== categoryId);
    localStorage.setItem('custom_categories_global', JSON.stringify(updated));
    if (tripId) {
      localStorage.setItem(`custom_categories_${tripId}`, JSON.stringify(updated));
    }
    return updated;
  } catch {
    return [];
  }
};

// Smart category meta resolver for ANY category name (preset, custom, settlement, etc.)
export const getCategoryMeta = (categoryName, tripId = null) => {
  if (!categoryName) {
    return {
      id: 'Other',
      label: 'General',
      emoji: '🏷️',
      theme: COLOR_THEMES[2],
      hex: '#6366f1',
    };
  }

  // Check preset categories
  const preset = PRESET_CATEGORIES.find(
    c => c.id.toLowerCase() === categoryName.toLowerCase() || c.label.toLowerCase() === categoryName.toLowerCase()
  );
  if (preset) return preset;

  // Check custom categories if tripId is provided
  if (tripId) {
    const customList = getCustomCategories(tripId);
    const custom = customList.find(
      c => c.id.toLowerCase() === categoryName.toLowerCase() || c.label.toLowerCase() === categoryName.toLowerCase()
    );
    if (custom) return custom;
  }

  // Handle special types
  if (categoryName.toLowerCase().includes('settle')) {
    return {
      id: 'Settlement',
      label: 'Settlement',
      emoji: '🤝',
      icon: HandCoins,
      theme: COLOR_THEMES[4], // emerald
      hex: '#10b981',
    };
  }

  if (categoryName.toLowerCase().includes('loan') || categoryName.toLowerCase().includes('cash')) {
    return {
      id: 'Loan / Cash',
      label: 'Loan / Cash',
      emoji: '💵',
      icon: HelpCircle,
      theme: COLOR_THEMES[0], // amber
      hex: '#f59e0b',
    };
  }

  // Default dynamically themed custom category fallback
  // Generate consistent color theme based on string hash
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const themeIndex = Math.abs(hash) % COLOR_THEMES.length;
  const theme = COLOR_THEMES[themeIndex];

  return {
    id: categoryName,
    label: categoryName,
    emoji: '✨',
    icon: Tag,
    theme: theme,
    hex: theme.hex,
  };
};
