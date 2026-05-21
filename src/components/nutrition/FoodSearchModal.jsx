import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Loader2, UtensilsCrossed, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTER_CHIPS = ['All', 'Protein', 'Carbs', 'Fats', 'Dairy', 'Vegetables', 'Snacks'];

const FILTER_KEYWORDS = {
  Protein:    ['chicken', 'beef', 'turkey', 'fish', 'salmon', 'tuna', 'egg', 'protein', 'meat', 'pork', 'steak', 'shrimp'],
  Carbs:      ['rice', 'bread', 'pasta', 'oat', 'grain', 'wheat', 'potato', 'cereal', 'quinoa', 'tortilla'],
  Fats:       ['avocado', 'nut', 'almond', 'peanut', 'butter', 'oil', 'cheese', 'olive', 'coconut', 'seed'],
  Dairy:      ['milk', 'yogurt', 'cheese', 'cream', 'dairy', 'whey', 'casein', 'cottage'],
  Vegetables: ['broccoli', 'spinach', 'kale', 'carrot', 'pepper', 'tomato', 'cucumber', 'lettuce', 'vegetable', 'salad'],
  Snacks:     ['bar', 'chip', 'cookie', 'cracker', 'snack', 'chocolate', 'candy', 'pretzel', 'popcorn'],
};

const POPULAR_FOODS = [
  'chicken breast', 'oats', 'white rice', 'whole eggs', 'salmon fillet',
  'greek yogurt', 'broccoli', 'sweet potato', 'ground beef', 'banana',
];

const FOOD_EMOJI_MAP = {
  chicken: '🍗', beef: '🥩', fish: '🐟', salmon: '🐟', tuna: '🐟',
  egg: '🥚', rice: '🍚', bread: '🍞', pasta: '🍝', oat: '🌾',
  milk: '🥛', yogurt: '🥛', cheese: '🧀', banana: '🍌', apple: '🍎',
  broccoli: '🥦', spinach: '🥗', carrot: '🥕', potato: '🥔',
  avocado: '🥑', nut: '🥜', almond: '🥜', peanut: '🥜',
  chocolate: '🍫', cookie: '🍪', pizza: '🍕', burger: '🍔',
};

function getFoodEmoji(name = '') {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(FOOD_EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return '🍽️';
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function searchOpenFoodFacts(query) {
  const response = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,image_thumb_url,image_url,serving_size`
  );
  const data = await response.json();
  return (data.products || [])
    .filter(p => p.product_name)
    .map(p => ({
      id: p.product_name + (p.brands || ''),
      product_name: p.product_name,
      brands: p.brands || '',
      image_thumb_url: p.image_thumb_url || null,
      serving_size: p.serving_size || '100g',
      calories: parseFloat(p.nutriments?.['energy-kcal_100g']) || 0,
      protein: parseFloat(p.nutriments?.['proteins_100g']) || 0,
      carbs: parseFloat(p.nutriments?.['carbohydrates_100g']) || 0,
      fats: parseFloat(p.nutriments?.['fat_100g']) || 0,
    }));
}

async function fetchUSDAFood(name) {
  const res = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(name)}&pageSize=1&api_key=DEMO_KEY`
  );
  const data = await res.json();
  const food = data.foods?.[0];
  if (!food) return null;
  const getNutrient = (nutrients, n) => {
    const found = nutrients.find(x => x.nutrientName === n);
    return found ? Math.round(found.value) : 0;
  };
  return {
    id: `usda_${food.fdcId}`,
    product_name: food.description,
    brands: food.brandOwner || 'Generic',
    image_thumb_url: null,
    serving_size: '100g',
    calories: getNutrient(food.foodNutrients, 'Energy'),
    protein: getNutrient(food.foodNutrients, 'Protein'),
    carbs: getNutrient(food.foodNutrients, 'Carbohydrate, by difference'),
    fats: getNutrient(food.foodNutrients, 'Total lipid (fat)'),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FoodPhoto({ src, name }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
        {getFoodEmoji(name)}
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

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-secondary shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-secondary rounded w-2/3" />
        <div className="h-2 bg-secondary rounded w-1/3" />
        <div className="flex gap-1">
          {[1,2,3,4].map(i => <div key={i} className="h-4 w-12 bg-secondary rounded" />)}
        </div>
      </div>
      <div className="w-14 h-7 bg-secondary rounded-lg shrink-0" />
    </div>
  );
}

function FoodRow({ food, onAdd }) {
  const [qty, setQty] = useState(100);

  const cal  = Math.round(food.calories * qty / 100);
  const prot = Math.round(food.protein  * qty / 100);
  const carb = Math.round(food.carbs    * qty / 100);
  const fat  = Math.round(food.fats     * qty / 100);

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
      <FoodPhoto src={food.image_thumb_url} name={food.product_name} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate leading-snug">{food.product_name}</p>
        {food.brands && (
          <p className="text-[10px] text-muted-foreground truncate">{food.brands}</p>
        )}
        <div className="flex gap-1 mt-1 flex-wrap">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">{cal} kcal</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">P {prot}g</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">C {carb}g</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700">F {fat}g</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-1 border border-input rounded-lg overflow-hidden">
          <input
            type="number"
            min={1}
            step={10}
            value={qty}
            onChange={e => setQty(Math.max(1, Number(e.target.value)))}
            className="w-14 text-center text-xs font-semibold px-1 py-1 outline-none bg-transparent"
          />
          <span className="text-[10px] text-muted-foreground pr-1.5">g</span>
        </div>
        <button
          onClick={() => onAdd({ food, qty, cal, prot, carb, fat })}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
    </li>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FoodSearchModal({ open, onOpenChange, mealName, onAddFood }) {
  const [tab, setTab] = useState('popular');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const debounceRef = useRef(null);

  // Popular foods from USDA
  const { data: popularFoods = [], isLoading: loadingPopular } = useQuery({
    queryKey: ['popular-foods'],
    queryFn: async () => {
      const results = await Promise.all(POPULAR_FOODS.map(fetchUSDAFood));
      return results.filter(Boolean);
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  // My Library
  const { data: libraryFoods = [], isLoading: loadingLibrary } = useQuery({
    queryKey: ['food-items-all'],
    queryFn: () => base44.entities.FoodItem.list(),
    staleTime: 60_000,
  });

  // Debounced search
  useEffect(() => {
    if (tab !== 'search') return;
    if (search.length < 2) {
      setSearchResults([]);
      setSearchedQuery('');
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchedQuery(search);
      const results = await searchOpenFoodFacts(search);
      setSearchResults(results);
      setSearching(false);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [search, tab]);

  // Filter helper
  const applyFilter = useCallback((foods, nameKey = 'product_name') => {
    if (filter === 'All') return foods;
    const keywords = FILTER_KEYWORDS[filter] || [];
    return foods.filter(f => {
      const name = (f[nameKey] || f.name || '').toLowerCase();
      return keywords.some(k => name.includes(k));
    });
  }, [filter]);

  function handleAdd({ food, qty, cal, prot, carb, fat }) {
    onAddFood({
      food_id:      food.id,
      name:         food.product_name || food.name,
      calories:     cal,
      protein:      prot,
      carbs:        carb,
      fats:         fat,
      serving_unit: 'g',
      serving_size: qty,
    });
    onOpenChange(false);
  }

  function handleLibraryAdd(food) {
    const qty = 100;
    onAddFood({
      food_id:      food.id,
      name:         food.name,
      calories:     Math.round((food.calories || 0) * qty / (food.serving_size || 100)),
      protein:      Math.round((food.protein  || 0) * qty / (food.serving_size || 100)),
      carbs:        Math.round((food.carbs    || 0) * qty / (food.serving_size || 100)),
      fats:         Math.round((food.fats     || 0) * qty / (food.serving_size || 100)),
      serving_unit: food.serving_unit || 'g',
      serving_size: qty,
    });
    onOpenChange(false);
  }

  // Tabs definition
  const TABS = [
    { id: 'popular', label: 'Popular' },
    { id: 'search', label: 'Search' },
    { id: 'library', label: 'My Library' },
  ];

  // Rendered list content per tab
  function renderContent() {
    if (tab === 'popular') {
      if (loadingPopular) return <>{[1,2,3].map(i => <SkeletonRow key={i} />)}</>;
      const filtered = applyFilter(popularFoods);
      if (filtered.length === 0) return <EmptyState message="No popular foods match this filter." />;
      return (
        <ul className="divide-y divide-border">
          {filtered.map(food => (
            <FoodRow key={food.id} food={food} onAdd={handleAdd} />
          ))}
        </ul>
      );
    }

    if (tab === 'search') {
      if (search.length < 2) {
        return (
          <div className="flex flex-col items-center gap-2 py-14 text-center px-6">
            <Search className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Type at least 2 characters to search 3M+ foods</p>
          </div>
        );
      }
      if (searching) return <>{[1,2,3].map(i => <SkeletonRow key={i} />)}</>;
      if (searchResults.length === 0 && searchedQuery) {
        return <EmptyState message={`No results found for "${searchedQuery}"`} />;
      }
      const filtered = applyFilter(searchResults);
      return (
        <>
          {filtered.length > 0 && (
            <p className="text-[11px] text-muted-foreground px-4 py-2 border-b border-border">
              {filtered.length} results for "{searchedQuery}"
            </p>
          )}
          <ul className="divide-y divide-border">
            {filtered.map(food => (
              <FoodRow key={food.id} food={food} onAdd={handleAdd} />
            ))}
          </ul>
        </>
      );
    }

    if (tab === 'library') {
      if (loadingLibrary) return <>{[1,2,3].map(i => <SkeletonRow key={i} />)}</>;
      const searched = libraryFoods.filter(f =>
        !search.trim() ||
        f.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.brand?.toLowerCase().includes(search.toLowerCase())
      );
      const filtered = applyFilter(searched, 'name');
      if (libraryFoods.length === 0) {
        return (
          <div className="flex flex-col items-center gap-3 py-14 px-6 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold">No foods in your library yet</p>
            <p className="text-xs text-muted-foreground">Go to Food Library to add custom foods.</p>
            <Link
              to="/food-library"
              onClick={() => onOpenChange(false)}
              className="mt-1 text-xs text-primary underline underline-offset-2"
            >
              Open Food Library →
            </Link>
          </div>
        );
      }
      if (filtered.length === 0) return <EmptyState message="No foods match your search." />;
      return (
        <ul className="divide-y divide-border">
          {filtered.map(food => {
            // Normalize library food to Open Food Facts shape
            const normalized = {
              id: food.id,
              product_name: food.name,
              brands: food.brand || '',
              image_thumb_url: null,
              serving_size: food.serving_size || '100g',
              calories: (food.calories || 0) / ((food.serving_size || 100) / 100),
              protein:  (food.protein  || 0) / ((food.serving_size || 100) / 100),
              carbs:    (food.carbs    || 0) / ((food.serving_size || 100) / 100),
              fats:     (food.fats     || 0) / ((food.serving_size || 100) / 100),
            };
            return <FoodRow key={food.id} food={normalized} onAdd={handleAdd} />;
          })}
        </ul>
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0 flex-shrink-0">
          <DialogTitle className="text-base font-bold">
            Add Food{mealName ? <span className="text-muted-foreground font-normal"> → {mealName}</span> : ''}
          </DialogTitle>

          {/* Tabs */}
          <div className="flex gap-0 mt-3 border-b border-border">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSearch(''); setFilter('All'); }}
                className={cn(
                  'px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px',
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus={tab === 'search'}
              placeholder={tab === 'search' ? 'Search 3M+ foods (Open Food Facts)...' : 'Filter...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 mt-2 scrollbar-none">
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
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center px-6">
      <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}