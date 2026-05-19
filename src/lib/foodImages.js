export function getFoodImageUrl(foodName, size = 200) {
  const clean = encodeURIComponent((foodName || 'healthy food').toLowerCase());
  return `https://source.unsplash.com/${size}x${size}/?${clean},food,meal`;
}

export function getMealImageUrl(mealName, foods = [], size = 400) {
  const query = foods[0]?.name || foods[0]?.food_name || mealName || 'healthy meal';
  const clean = encodeURIComponent(query.toLowerCase());
  return `https://source.unsplash.com/${size}x${size}/?${clean},food`;
}

export function getCategoryEmoji(foodName) {
  const n = (foodName || '').toLowerCase();
  if (n.match(/chicken|beef|turkey|fish|salmon|tuna|egg|protein|shrimp/)) return '🥩';
  if (n.match(/rice|oat|bread|pasta|potato|quinoa/)) return '🍚';
  if (n.match(/broccoli|spinach|kale|pepper|onion|tomato|vegetable/)) return '🥦';
  if (n.match(/apple|banana|berry|mango|orange|fruit/)) return '🍎';
  if (n.match(/milk|yogurt|cheese|dairy/)) return '🥛';
  if (n.match(/almond|walnut|avocado|olive|peanut|butter|oil|nut/)) return '🥑';
  if (n.match(/whey|protein powder|supplement/)) return '💪';
  return '🍽️';
}