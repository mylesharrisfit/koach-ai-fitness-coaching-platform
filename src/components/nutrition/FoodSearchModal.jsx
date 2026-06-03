import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Loader2, UtensilsCrossed, X, BookmarkPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Local search cache (last 50) ──────────────────────────────────────────
const CACHE_KEY = 'usda_search_cache';
const CACHE_MAX = 50;

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function writeCache(key, value) {
  const cache = readCache();
  const keys = Object.keys(cache);
  if (keys.length >= CACHE_MAX) delete cache[keys[0]];
  cache[key] = value;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

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

// ── USDA search via backend function ──────────────────────────────────────
async function searchUSDA(query, pageSize = 25) {
  const cacheKey = `${query.toLowerCase()}_${pageSize}`;
  const cached = readCache()[cacheKey];
  if (cached) return cached;

  const res = await base44.functions.invoke('searchFoods', {
    query,
    pageSize,
    dataType: 'Survey (FNDDS),SR Legacy,Foundation',
  });
  const foods = (res.data?.foods || []).map(f => ({
    id: f.usda_fdc_id,
    name: f.name,
    brand: f.brand || '',
    calories: f.calories || 0,
    protein: f.protein_g || 0,
    carbs: f.carbs_g || 0,
    fats: f.fats_g || 0,
    serving_size: f.serving_size || '100g',
    category: f.category || '',
    source: 'usda',
    image: null,
  }));
  writeCache(cacheKey, foods);
  return foods;
}

// ── Sub-components ─────────────────────────────────────────────────────────
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
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-secondary shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-secondary rounded w-2/3" />
            <div className="h-2.5 bg-secondary rounded w-1/4" />
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

function FoodRow({ food, onAdd, onSave }) {
  const [qty, setQty] = useState(100);
  const [saving, setSaving] = useState(false);

  const scale = qty / 100;
  const cal  = Math.round(food.calories * scale);
  const prot = Math.round(food.protein  * scale * 10) / 10;
  const carb = Math.round(food.carbs    * scale * 10) / 10;
  const fat  = Math.round(food.fats     * scale * 10) / 10;

  const handleSave = async () => {
    setSaving(true);
    await onSave(food);
    setSaving(false);
  };

  return (
    <li className="px-4 py-3 hover:bg-secondary/40 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
          {FOOD_EMOJI(food.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug">{food.name}</p>
          {food.category && (
            <p className="text-[10px] text-muted-foreground truncate">{food.category}</p>
          )}
          <MacroChips calories={cal} protein={prot} carbs={carb} fats={fat} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2.5 pl-13">
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-xs text-muted-foreground shrink-0">Serving:</span>
          <input
            type="number"
            min={1}
            step={10}
            value={qty}
            onChange={e => setQty(Math.max(1, Number(e.target.value)))}
            className="w-16 h-7 text-xs text-center border border-input rounded-md bg-background"
          />
          <span className="text-xs text-muted-foreground">g</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          title="Save to My Foods"
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => onAdd(food, qty)}
          className="flex items-center gap-1 h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add to Log
        </button>
      </div>
    </li>
  );
}

// ── Custom Food Form ───────────────────────────────────────────────────────
function CustomFoodForm({ onAdd, onSave }) {
  const [form, setForm] = useState({ name: '', serving_size: '100g', calories: '', protein: '', carbs: '', fats: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.calories !== '';

  const food = {
    id: `custom_${Date.now()}`,
    name: form.name,
    brand: '',
    calories: Number(form.calories) || 0,
    protein:  Number(form.protein)  || 0,
    carbs:    Number(form.carbs)    || 0,
    fats:     Number(form.fats)     || 0,
    serving_size: form.serving_size || '100g',
    category: 'Custom',
    source: 'custom',
  };

  return (
    <div className="px-4 py-4 space-y-3">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Custom Food</p>
      <Input placeholder="Food name *" value={form.name} onChange={e => set('name', e.target.value)} />
      <Input placeholder="Serving size (e.g. 100g, 1 cup)" value={form.serving_size} onChange={e => set('serving_size', e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Calories (kcal) *" type="number" value={form.calories} onChange={e => set('calories', e.target.value)} />
        <Input placeholder="Protein (g)" type="number" value={form.protein} onChange={e => set('protein', e.target.value)} />
        <Input placeholder="Carbs (g)" type="number" value={form.carbs} onChange={e => set('carbs', e.target.value)} />
        <Input placeholder="Fats (g)" type="number" value={form.fats} onChange={e => set('fats', e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button
          disabled={!valid}
          onClick={() => valid && onSave(food)}
          className="flex-1 h-9 rounded-lg border border-border text-xs font-semibold hover:bg-secondary transition-colors disabled:opacity-40"
        >
          Save to My Foods
        </button>
        <button
          disabled={!valid}
          onClick={() => valid && onAdd(food, 100)}
          className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          Add to Log
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function FoodSearchModal({ open, onOpenChange, mealName, onAddFood }) {
  const [tab, setTab]           = useState('search');
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter]     = useState('All');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const debounceRef = useRef(null);

  // My Library
  const [libraryFoods, setLibraryFoods] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLibraryLoading(true);
    base44.entities.FoodItem.list()
      .then(setLibraryFoods)
      .catch(() => {})
      .finally(() => setLibraryLoading(false));
  }, [open]);

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 450);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // USDA search
  useEffect(() => {
    if (tab !== 'search') return;
    if (debouncedSearch.length < 2) { setSearchResults([]); setSearchError(false); return; }
    setIsSearching(true);
    setSearchError(false);
    searchUSDA(debouncedSearch)
      .then(r => { setSearchResults(r); if (r.length === 0) setShowCustom(true); })
      .catch(() => { setSearchError(true); setShowCustom(true); })
      .finally(() => setIsSearching(false));
  }, [debouncedSearch, tab]);

  const applyFilter = (items) => {
    if (filter === 'All') return items;
    const kw = FILTER_KEYWORDS[filter] || [];
    return items.filter(f => kw.some(k => f.name?.toLowerCase().includes(k)));
  };

  const handleAdd = (food, qty) => {
    const scale = qty / 100;
    onAddFood({
      food_name:        food.name,
      calories:         Math.round(food.calories * scale),
      protein:          Math.round(food.protein  * scale * 10) / 10,
      carbs:            Math.round(food.carbs    * scale * 10) / 10,
      fats:             Math.round(food.fats     * scale * 10) / 10,
      serving_quantity: qty,
      serving_unit:     'g',
    });
    onOpenChange(false);
  };

  const handleSave = async (food) => {
    try {
      await base44.entities.FoodItem.create({
        name:         food.name,
        brand:        food.brand || '',
        calories:     food.calories,
        protein:      food.protein,
        carbs:        food.carbs,
        fats:         food.fats,
        serving_size: food.serving_size || '100g',
        source:       food.source || 'usda',
        category:     food.category || '',
      });
      toast.success(`"${food.name}" saved to My Foods`);
      base44.entities.FoodItem.list().then(setLibraryFoods).catch(() => {});
    } catch {
      toast.error('Failed to save food');
    }
  };

  const mappedLibrary = libraryFoods.map(f => ({
    id: f.id, name: f.name, brand: f.brand || '', calories: f.calories || 0,
    protein: f.protein || 0, carbs: f.carbs || 0, fats: f.fats || 0,
    serving_size: f.serving_size, category: f.category || '', source: 'library', image: null,
  }));

  const filteredLibrary = applyFilter(
    mappedLibrary.filter(f =>
      !search || f.name?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const filteredSearch = applyFilter(searchResults);

  const TABS = [
    { id: 'search',  label: 'USDA Search' },
    { id: 'library', label: 'My Foods' },
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
              <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); setFilter('All'); setShowCustom(false); }}
                className={cn('flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors',
                  tab === t.id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder={tab === 'search' ? 'Search USDA food database...' : 'Filter my foods...'}
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

          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 mt-2 scrollbar-none">
            {FILTER_CHIPS.map(chip => (
              <button key={chip} onClick={() => setFilter(chip)}
                className={cn('shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                  filter === chip ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                )}>
                {chip}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* USDA SEARCH TAB */}
          {tab === 'search' && (
            <>
              {!search || search.length < 2 ? (
                <div className="flex flex-col items-center gap-3 py-14 px-6 text-center">
                  <Search className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-foreground">Search the USDA FoodData Central</p>
                  <p className="text-xs text-muted-foreground">Accurate nutrient data for 900k+ foods. Type at least 2 characters.</p>
                </div>
              ) : isSearching ? (
                <SkeletonRows />
              ) : searchError ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center px-6">
                  <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold">Couldn't reach the food database</p>
                  <p className="text-xs text-muted-foreground mb-2">Add your food manually instead.</p>
                  <CustomFoodForm onAdd={handleAdd} onSave={handleSave} />
                </div>
              ) : filteredSearch.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center px-6">
                  <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold">No results for "{search}"</p>
                  <p className="text-xs text-muted-foreground mb-1">Try a different search or add a custom food.</p>
                  <button
                    onClick={() => setShowCustom(v => !v)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary mt-1"
                  >
                    Add Custom Food {showCustom ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showCustom && <CustomFoodForm onAdd={handleAdd} onSave={handleSave} />}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <p className="text-xs text-muted-foreground">
                      {filteredSearch.length} results · <span className="text-[10px]">USDA FoodData Central</span>
                    </p>
                    <button onClick={() => setShowCustom(v => !v)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                      + Custom {showCustom ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  {showCustom && (
                    <div className="border-b border-border bg-secondary/30">
                      <CustomFoodForm onAdd={handleAdd} onSave={handleSave} />
                    </div>
                  )}
                  <ul className="divide-y divide-border">
                    {filteredSearch.map(food => (
                      <FoodRow key={food.id} food={food} onAdd={handleAdd} onSave={handleSave} />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {/* MY FOODS TAB */}
          {tab === 'library' && (
            libraryLoading ? <SkeletonRows /> :
            libraryFoods.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 px-6 text-center">
                <UtensilsCrossed className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm font-semibold">No saved foods yet</p>
                <p className="text-xs text-muted-foreground">Search USDA and tap the bookmark icon to save foods here, or add a custom food.</p>
                <button onClick={() => setShowCustom(v => !v)} className="text-xs font-semibold text-primary mt-1">
                  + Add Custom Food
                </button>
                {showCustom && <CustomFoodForm onAdd={handleAdd} onSave={handleSave} />}
              </div>
            ) : filteredLibrary.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-12">No foods match.</p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredLibrary.map(food => (
                  <FoodRow key={food.id} food={food} onAdd={handleAdd} onSave={handleSave} />
                ))}
              </ul>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}