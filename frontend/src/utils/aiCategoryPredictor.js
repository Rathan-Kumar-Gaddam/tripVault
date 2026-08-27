/**
 * AI Category Predictor Engine for TripVault
 * Automatically suggests and maps expense descriptions to the most accurate category in real time.
 */

export const PRESET_CATEGORIES = [
  { id: 'Food & Dining', label: 'Food & Dining', emoji: '🍕' },
  { id: 'Transport & Fuel', label: 'Transport & Fuel', emoji: '🚕' },
  { id: 'Stay & Hotels', label: 'Stay & Hotels', emoji: '🏨' },
  { id: 'Flights & Transit', label: 'Flights & Transit', emoji: '✈️' },
  { id: 'Activities & Fun', label: 'Activities & Fun', emoji: '🎟️' },
  { id: 'Shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'Sightseeing & Tours', label: 'Sightseeing', emoji: '📸' },
  { id: 'Health & Medical', label: 'Health & Meds', emoji: '💊' },
  { id: 'General', label: 'General', emoji: '📦' },
];

const CATEGORY_RULES = [
  {
    categoryId: 'Food & Dining',
    label: 'Food & Dining',
    emoji: '🍕',
    keywords: [
      'dinner', 'lunch', 'breakfast', 'brunch', 'meal', 'food', 'restaurant', 'cafe', 'bistro',
      'buffet', 'biryani', 'pizza', 'burger', 'pasta', 'noodles', 'sushi', 'taco', 'steak',
      'zomato', 'swiggy', 'dining', 'kitchen', 'mess', 'thali', 'dosa', 'roti', 'curry',
      'shawarma', 'sandwich', 'kfc', 'mcdonalds', 'dominos', 'bbq', 'barbeque', 'tandoor',
      'dhaba', 'canteen', 'eatery', 'dessert', 'ice cream', 'gelato', 'bakery', 'waffle',
      'coffee', 'starbucks', 'chai', 'tea', 'snack', 'snacks', 'juice', 'smoothie', 'shake',
      'beer', 'wine', 'pub', 'bar', 'cocktail', 'cocktails', 'club', 'whiskey', 'vodka', 'drinks',
      'alcohol', 'liquor', 'booze', 'party', 'lounge', 'shots', 'cider', 'champagne', 'chips'
    ],
    weight: 1.0,
  },
  {
    categoryId: 'Transport & Fuel',
    label: 'Transport & Fuel',
    emoji: '🚕',
    keywords: [
      'uber', 'ola', 'cab', 'taxi', 'auto', 'rickshaw', 'rapido', 'grab', 'lyft',
      'fuel', 'petrol', 'diesel', 'gas', 'gasoline', 'toll', 'toll gate', 'toll plaza',
      'parking', 'valet', 'metro', 'bus', 'train', 'irctc', 'fare', 'ride', 'rental',
      'scooty', 'scooter', 'bike rental', 'car rental', 'highway', 'ferry', 'boat', 'speedboat',
      'fuel station', 'petrol bunk', 'mechanic', 'puncture', 'driver', 'transit'
    ],
    weight: 1.0,
  },
  {
    categoryId: 'Stay & Hotels',
    label: 'Stay & Hotels',
    emoji: '🏨',
    keywords: [
      'hotel', 'resort', 'airbnb', 'stay', 'hostel', 'villa', 'homestay', 'lodge',
      'booking.com', 'agoda', 'makemytrip', 'room', 'suite', 'checkout', 'checkin',
      'bed', 'cottage', 'tent', 'camping', 'glamping', 'accommodation', 'dorm', 'guesthouse',
      'oyo', 'marriott', 'hyatt', 'hilton', 'radisson', 'taj'
    ],
    weight: 1.1,
  },
  {
    categoryId: 'Flights & Transit',
    label: 'Flights & Transit',
    emoji: '✈️',
    keywords: [
      'flight', 'airfare', 'plane', 'indigo', 'air india', 'vistara', 'spicejet', 'emirates',
      'qatar', 'singapore airlines', 'boarding', 'airport', 'terminal', 'excess baggage',
      'luggage', 'flight ticket', 'airline', 'visa', 'passport'
    ],
    weight: 1.2,
  },
  {
    categoryId: 'Activities & Fun',
    label: 'Activities & Fun',
    emoji: '🎟️',
    keywords: [
      'scuba', 'scuba diving', 'diving', 'snorkeling', 'surfing', 'surf', 'safari', 'jungle safari',
      'museum', 'theme park', 'water park', 'amusement park', 'disneyland', 'universal studios',
      'movie', 'cinema', 'pvr', 'imax', 'concert', 'music festival', 'cricket match', 'match tickets',
      'bowling', 'go karting', 'karting', 'arcade', 'trekking', 'trek', 'zipline', 'paragliding',
      'bungee', 'bungee jumping', 'skiing', 'kayaking', 'rafting', 'river rafting', 'tickets',
      'entry ticket', 'entry pass', 'show', 'theatre', 'gaming', 'escape room', 'spa', 'massage'
    ],
    weight: 1.1,
  },
  {
    categoryId: 'Shopping',
    label: 'Shopping',
    emoji: '🛍️',
    keywords: [
      'shopping', 'mall', 'souvenir', 'souvenirs', 'clothes', 'clothing', 'shirt', 'dress',
      'shoes', 'sneakers', 'zara', 'h&m', 'uniqlo', 'market', 'night market', 'flea market',
      'bazaar', 'gift', 'gifts', 'accessories', 'sunglasses', 'hat', 'cap', 'swimwear',
      'perfume', 'supermarket', 'grocery', 'groceries', '7-eleven', 'mart', 'duty free',
      'handicraft', 'chocolates duty free'
    ],
    weight: 0.9,
  },
  {
    categoryId: 'Sightseeing & Tours',
    label: 'Sightseeing',
    emoji: '📸',
    keywords: [
      'guide', 'tour guide', 'tour', 'temple', 'palace', 'monument', 'fort', 'castle',
      'waterfall', 'viewpoint', 'sunset point', 'sunrise point', 'island tour', 'sightseeing',
      'boat tour', 'city tour', 'heritage', 'national park', 'aquarium', 'zoo', 'botanical garden',
      'cable car', 'ropeway', 'ferris wheel'
    ],
    weight: 1.0,
  },
  {
    categoryId: 'Health & Medical',
    label: 'Health & Meds',
    emoji: '💊',
    keywords: [
      'medicine', 'medicines', 'pharma', 'pharmacy', 'chemist', 'hospital', 'clinic',
      'doctor', 'bandaid', 'first aid', 'pills', 'tablet', 'tablets', 'sunscreen', 'sunblock',
      'lotion', 'odomos', 'repellent', 'motion sickness', 'vomistop', 'paracetamol',
      'crocin', 'bandage', 'emergency', 'thermometer', 'drops', 'antiseptic'
    ],
    weight: 1.2,
  },
];

/**
 * Returns full prediction object or null
 */
export function predictCategoryObject(text = '', customCategories = []) {
  if (!text || typeof text !== 'string') return null;

  const normalized = text.toLowerCase().trim();
  if (normalized.length < 2) return null;

  // 1. Check custom categories first (highest priority)
  if (Array.isArray(customCategories) && customCategories.length > 0) {
    for (const customCat of customCategories) {
      const catName = (customCat.label || customCat.id || '').toLowerCase();
      if (catName && (normalized.includes(catName) || catName.includes(normalized))) {
        return {
          categoryId: customCat.id || customCat.label,
          label: customCat.label || customCat.id,
          emoji: customCat.emoji || '✨',
          confidence: 0.95,
          matchedKeyword: catName,
          isCustom: true,
        };
      }
    }
  }

  let bestMatch = null;
  let highestScore = 0;

  // 2. Score standard preset categories
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      const kwLower = kw.toLowerCase();
      let matchScore = 0;

      // Exact match of phrase or word
      if (normalized === kwLower) {
        matchScore = 1.0 * rule.weight;
      } else if (new RegExp(`\\b${kwLower}\\b`, 'i').test(normalized)) {
        // Full word boundary match
        matchScore = (0.85 + (kwLower.length / (normalized.length + 10)) * 0.15) * rule.weight;
      } else if (normalized.includes(kwLower) && kwLower.length >= 4) {
        // Substring match for longer words
        matchScore = 0.7 * rule.weight;
      }

      if (matchScore > highestScore) {
        highestScore = matchScore;
        bestMatch = {
          categoryId: rule.categoryId,
          label: rule.label,
          emoji: rule.emoji,
          confidence: Math.min(0.99, Number(matchScore.toFixed(2))),
          matchedKeyword: kw,
          isCustom: false,
        };
      }
    }
  }

  // Threshold: only return if confidence is reasonably strong (>= 0.60)
  if (bestMatch && highestScore >= 0.60) {
    return bestMatch;
  }

  return null;
}

/**
 * Predicts the most relevant category ID string from a given expense description
 */
export function predictCategoryFromDescription(text = '', customCategories = []) {
  const result = predictCategoryObject(text, customCategories);
  return result ? result.categoryId : null;
}
