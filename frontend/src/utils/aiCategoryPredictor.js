/**
 * AI Category Predictor Engine for TripVault
 * Automatically suggests and maps expense descriptions to the most accurate category
 */

const CATEGORY_RULES = [
  {
    categoryId: 'Food & Dining',
    keywords: [
      'dinner', 'lunch', 'breakfast', 'brunch', 'meal', 'food', 'restaurant', 'cafe', 'bistro',
      'buffet', 'biryani', 'pizza', 'burger', 'pasta', 'noodles', 'sushi', 'taco', 'steak',
      'zomato', 'swiggy', 'dining', 'kitchen', 'mess', 'thali', 'dosa', 'roti', 'curry',
      'shawarma', 'sandwich', 'kfc', 'mcdonalds', 'dominos', 'bbq', 'barbeque', 'tandoor',
      'dhaba', 'canteen', 'eatery', 'dessert', 'ice cream', 'gelato', 'bakery', 'waffle'
    ],
    weight: 1.0,
  },
  {
    categoryId: 'Transport & Fuel',
    keywords: [
      'uber', 'ola', 'cab', 'taxi', 'auto', 'rickshaw', 'rapido', 'grab', 'lyft',
      'fuel', 'petrol', 'diesel', 'gas', 'gasoline', 'toll', 'toll gate', 'toll plaza',
      'parking', 'valet', 'metro', 'bus', 'train', 'irctc', 'fare', 'ride', 'rental',
      'scooty', 'scooter', 'bike rental', 'car rental', 'highway', 'ferry', 'boat', 'speedboat',
      'fuel station', 'petrol bunk', 'mechanic', 'puncture', 'driver'
    ],
    weight: 1.0,
  },
  {
    categoryId: 'Flights & Transit',
    keywords: [
      'flight', 'airfare', 'plane', 'indigo', 'air india', 'vistara', 'spicejet', 'emirates',
      'qatar', 'singapore airlines', 'boarding', 'airport', 'terminal', 'excess baggage',
      'luggage', 'transit', 'runway', 'flight ticket', 'airline', 'visa', 'passport fee'
    ],
    weight: 1.2,
  },
  {
    categoryId: 'Stay & Hotels',
    keywords: [
      'hotel', 'resort', 'airbnb', 'stay', 'hostel', 'villa', 'homestay', 'lodge',
      'booking.com', 'agoda', 'makemytrip', 'room', 'suite', 'checkout', 'checkin',
      'bed', 'cottage', 'tent', 'camping', 'glamping', 'accommodation', 'dorm', 'guesthouse',
      'oyo', 'marriott', 'hyatt', 'hilton', 'radisson', 'taj'
    ],
    weight: 1.1,
  },
  {
    categoryId: 'Nightlife & Drinks',
    keywords: [
      'beer', 'wine', 'pub', 'bar', 'cocktail', 'cocktails', 'club', 'clubbing', 'nightclub',
      'brewery', 'microbrewery', 'tequila', 'vodka', 'whiskey', 'whisky', 'rum', 'gin',
      'alcohol', 'liquor', 'booze', 'drinks', 'party', 'lounge', 'shots', 'disco', 'karaoke',
      'entry cover', 'cover charge', 'cider', 'champagne', 'hookah', 'sheesha'
    ],
    weight: 1.1,
  },
  {
    categoryId: 'Snacks & Drinks',
    keywords: [
      'coffee', 'starbucks', 'cafe coffee day', 'ccd', 'chai', 'tea', 'snack', 'snacks',
      'juice', 'smoothie', 'shake', 'boba', 'bubble tea', 'water bottle', 'mineral water',
      'chips', 'popcorn', 'cookies', 'pastry', 'croissant', 'coconut water', 'soda', 'coke',
      'pepsi', 'red bull', 'energy drink', 'chocolates', 'donut', 'street food', 'samosa'
    ],
    weight: 0.9,
  },
  {
    categoryId: 'Activities & Fun',
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
    categoryId: 'Sightseeing & Tours',
    keywords: [
      'guide', 'tour guide', 'tour', 'temple', 'palace', 'monument', 'fort', 'castle',
      'waterfall', 'viewpoint', 'sunset point', 'sunrise point', 'island tour', 'sightseeing',
      'boat tour', 'city tour', 'heritage', 'national park', 'aquarium', 'zoo', 'botanical garden',
      'cable car', 'ropeway', 'ferris wheel'
    ],
    weight: 1.0,
  },
  {
    categoryId: 'Shopping',
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
    categoryId: 'Health & Medical',
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
 * Predicts the most relevant category from a given expense description
 * @param {string} text - User's expense description (e.g. "Dinner at beachfront shack")
 * @param {Array} customCategories - Optional list of user-created custom categories
 * @returns {{ categoryId: string, confidence: number, matchedKeyword: string, isCustom: boolean } | null}
 */
export function predictCategoryFromDescription(text = '', customCategories = []) {
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
