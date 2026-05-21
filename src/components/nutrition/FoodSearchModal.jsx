import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Loader2, UtensilsCrossed, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────
const FILTER_CHIPS = ['All', 'Protein', 'Carbs', 'Fats', 'Dairy', 'Vegetables', 'Snacks'];

const FILTER_KEYWORDS = {
  Protein:    ['chicken', 'beef', 'fish', 'salmon', 'tuna', 'turkey', 'egg', 'whey', 'protein', 'pork', 'shrimp', 'steak'],
  Carbs:      ['rice', 'pasta', 'bread', 'oat', 'potato', 'cereal', 'wheat', 'grain', 'tortilla', 'quinoa'],
  Fats:       ['avocado', 'oil', 'butter', 'nut', 'almond', 'peanut', 'olive', 'coconut', 'cheese', 'cream'],
  Dairy:      ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'dairy', 'whey', 'casein'],
  Vegetables: ['broccoli', 'spinach', 'kale', 'carrot', 'pepper', 'tomato', 'lettuce', 'cucumber', 'zucchini', 'vegetable'],
  Snacks:     ['chip', 'cookie', 'cracker', 'bar', 'snack', 'candy', 'chocolate', 'pretzel', 'popcorn'],
};

const POPULAR_FOODS_LIST = [
  'Chicken Breast', 'Oats', 'Brown Rice', 'Eggs', 'Salmon',
  'Greek Yogurt', 'Broccoli', 'Sweet Potato', 'Almonds', 'Banana',
];

const FOOD_EMOJI = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('chicken') || n.includes('turkey') || n.includes('beef') || n.includes('fish') || n.includes('salmon')) return '🥩';
  if (n.includes('rice') || n.includes('oat') || n.includes('bread') || n.includes('pasta')) return '🌾';
  if (n.includes('egg')) return '🥚';
  if (n.includes('milk') || n.includes('yogurt') || n.includes('cheese')) return '🥛';
  if (n.includes('broccoli') || n.includes('spinach') || n.includes('vegetable') || n.includes('kale')) return '🥦';
  if (n.includes('banana') || n.includes('apple') || n.includes('fruit')) return '🍎';
  if (n.includes('almond') || n.includes('nut') || n.includes('avocado')) return '🥑';
  if (n.includes('sweet potato') || n.includes('potato')) return '🍠';
  return '🍽️';
};

// ── API Helpers ────────────────────────────────────────────────────────────
const searchOpenFoodFacts = async (query) => {
  const response = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,image_thumb_url,serving_size`
  );
  const data = await response.json();
  return (data.products || [])
    .filter(p => p.product_name)
    .map(p => ({
      id: `off_${p.product_name}_${Math.random()}`,
      name: p.product_name,
      brand: p.brands || '',
      image: p.image_thumb_url || null,
      calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
      protein: Math.round(p.nutriments?.['proteins_100g'] || 0),
      carbs: Math.round(p.nutriments?.['carbohydrates_100g'] || 0),
      fats: Math.round(p.nutriments?.['fat_100g'] || 0),
      serving_size: p.serving_size || '100g',
      source: 'off',
    }));
};

const getUSDAFood = async (name) => {
  const res = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(name)}&pageSize=1&api_key=DEMO_KEY`
  );
  const data = await res.json();
  const food = data.foods?.[0];
  if (!food) return null;
  const getNutrient = (nutrients, nutrientName) => {
    const n = nutrients.find(x => x.nutrientName === nutrientName);
    return n ? Math.round(n.value) : 0;
  };
  return {
    id: `usda_${name}`,
    name: food.description,
    brand: food.brandOwner || 'Generic',
    image: null,
    calories: getNutrient(food.foodNutrients, 'Energy'),
    protein: getNutrient(food.foodNutrients, 'Protein'),
    carbs: getNutrient(food.foodNutrients, 'Carbohydrate, by difference'),
    fats: getNutrient(food.foodNutrients, 'Total lipid (fat)'),
    serving_size: '100g',
    source: 'usda',
  };
};

// ── Sub-components ─────────────────────────────────────────────────────────
function FoodPhoto({ src, name }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
        {FOOD_EMOJI(name)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-secondary"
      onError={() => setFailed(true)}
    />
  );
}

function MacroChips({ calories, protein, carbs, fats }) {
  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">{calories} kcal</span>
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">P {protein}g</span>
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">C {carbs}g</span>
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700">F {fats}g</span>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-border">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-secondary shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-secondary rounded w-2/3" />
            <div className="h-2.5 bg-secondary rounded w-1/3" />
            <div className="flex gap-1">
              {[1,2,3,4].map(j => <div key={j} className="h-4 w-12 bg-secondary rounded" />)}
            </div>
          </div>
          <div className="h-7 w-14 bg-secondary rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

function FoodRow({ food, onAdd }) {
  const [qty, setQty] = useState(100);

  const displayCalories = Math.round(food.calories * qty / 100);
  const displayProtein  = Math.round(food.protein  * qty / 100);
  const displayCarbs    = Math.round(food.carbs    * qty / 100);
  const displayFats     = Math.round(food.fats     * qty / 100);

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
      <FoodPhoto src={food.image} name={food.name} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate leading-snug">{food.name}</p>
        {food.brand && (
          <p className="text-[10px] text-muted-foreground truncate">{food.brand}</p>
        )}
        <MacroChips
          calories={displayCalories}
          protein={displayProtein}
          carbs={displayCarbs}
          fats={displayFats}
        />
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={10}
            step={10}
            value={qty}
            onChange={e => setQty(Math.max(10, Number(e.target.value)))}
            className="w-14 h-6 text-xs text-center border border-input rounded-md bg-background"
          />
          <span className="text-xs text-muted-foreground">g</span>
        </div>
        <button
          onClick={() => onAdd(food, qty)}
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
    </li>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function FoodSearchModal({ open, onOpenChange, mealName, onAddFood }) {
  const [tab, setTab]           = useState('popular');
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter]     = useState('All');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Fetch Open Food Facts when debounced search changes
  useEffect(() => {
    if (tab !== 'search') return;
    if (debouncedSearch.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    searchOpenFoodFacts(debouncedSearch)
      .then(setSearchResults)
      .finally(() => setIsSearching(false));
  }, [debouncedSearch, tab]);

  // Popular foods from USDA
  const { data: popularFoods = [], isLoading: popularLoading } = useQuery({
    queryKey: ['usda-popular'],
    queryFn: () => Promise.all(POPULAR_FOODS_LIST.map(getUSDAFood)).then(r => r.filter(Boolean)),
    staleTime: 60 * 60 * 1000,
    enabled: open,
  });

  // My Library
  const { data: libraryFoods = [], isLoading: libraryLoading } = useQuery({
    queryKey: ['food-items-all'],
    queryFn: () => base44.entities.FoodItem.list(),
    staleTime: 60_000,
    enabled: open,
  });

  const applyFilter = (items) => {
    if (filter === 'All') return items;
    const keywords = FILTER_KEYWORDS[filter] || [];
    return items.filter(f => keywords.some(kw => f.name?.toLowerCase().includes(kw)));
  };

  const handleAdd = (food, qty) => {
    onAddFood({
      food_name:    food.name,
      calories:     Math.round(food.calories * qty / 100),
      protein:      Math.round(food.protein  * qty / 100),
      carbs:        Math.round(food.carbs    * qty / 100),
      fats:         Math.round(food.fats     * qty / 100),
      serving_quantity: qty,
      serving_unit: 'g',
    });
    onOpenChange(false);
  };

  // Library foods mapped to same shape
  const mappedLibrary = libraryFoods.map(f => ({
    id: f.id,
    name: f.name,
    brand: f.brand || '',
    image: null,
    calories: f.calories || 0,
    protein: f.protein || 0,
    carbs: f.carbs || 0,
    fats: f.fats || 0,
    serving_size: f.serving_size,
    source: 'library',
  }));

  const filteredLibrary = applyFilter(
    mappedLibrary.filter(f =>
      !search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.brand?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const filteredSearch = applyFilter(searchResults);

  const TABS = [
    { id: 'popular', label: 'Popular' },
    { id: 'search',  label: 'Search' },
    { id: 'library', label: 'My Library' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <DialogTitle className="text-base font-bold">
            Add Food{mealName ? <span className="text-muted-foreground font-normal"> → {mealName}</span> : ''}
          </DialogTitle>

          {/* Tabs */}
          <div className="flex gap-0 mt-3 bg-secondary rounded-lg p-0.5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSearch(''); setFilter('All'); }}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors',
                  tab === t.id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search bar (Search + Library tabs) */}
          {(tab === 'search' || tab === 'library') && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={tab === 'search' ? 'Search 3M+ foods...' : 'Filter library...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 mt-2 scrollbar-none">
            {FILTER_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setFilter(chip)}
                className={cn(
                  'shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                  filter === chip
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                )}
              >
                {chip}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* POPULAR TAB */}
          {tab === 'popular' && (
            popularLoading ? <SkeletonRows /> : (
              <ul className="divide-y divide-border">
                {applyFilter(popularFoods).map(food => (
                  <FoodRow key={food.id} food={food} onAdd={handleAdd} />
                ))}
              </ul>
            )
          )}

          {/* SEARCH TAB */}
          {tab === 'search' && (
            <>
              {!search || search.length < 2 ? (
                <div className="flex flex-col items-center gap-3 py-14 px-6 text-center">
                  <Search className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-foreground">Search the Open Food Facts database</p>
                  <p className="text-xs text-muted-foreground">3 million+ products with real photos. Type at least 2 characters.</p>
                </div>
              ) : isSearching ? (
                <SkeletonRows />
              ) : filteredSearch.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-14 text-center px-6">
                  <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold">No results found for "{search}"</p>
                  <p className="text-xs text-muted-foreground">Try a different search term or check My Library.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground px-4 py-2 border-b border-border">
                    {filteredSearch.length} results for <strong>"{search}"</strong>
                  </p>
                  <ul className="divide-y divide-border">
                    {filteredSearch.map(food => (
                      <FoodRow key={food.id} food={food} onAdd={handleAdd} />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {/* MY LIBRARY TAB */}
          {tab === 'library' && (
            libraryLoading ? <SkeletonRows /> :
            libraryFoods.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 px-6 text-center">
                <UtensilsCrossed className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm font-semibold">No foods in your library yet</p>
                <p className="text-xs text-muted-foreground">Go to Food Library to add custom foods.</p>
              </div>
            ) : filteredLibrary.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-12">No foods match.</p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredLibrary.map(food => (
                  <FoodRow key={food.id} food={food} onAdd={handleAdd} />
                ))}
              </ul>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}