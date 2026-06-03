import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Plus, Clock, Loader2, UtensilsCrossed, BookmarkPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ── Local cache ────────────────────────────────────────────────────────────
const CACHE_KEY = 'usda_search_cache';
function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function writeCache(key, value) {
  const cache = readCache();
  const keys = Object.keys(cache);
  if (keys.length >= 50) delete cache[keys[0]];
  cache[key] = value;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

async function searchUSDA(query) {
  const cacheKey = `${query.toLowerCase()}_25`;
  const cached = readCache()[cacheKey];
  if (cached) return cached;

  const res = await base44.functions.invoke('searchFoods', {
    query,
    pageSize: 25,
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
  }));
  writeCache(cacheKey, foods);
  return foods;
}

// ── Custom Food Form ───────────────────────────────────────────────────────
function CustomFoodForm({ onAdd, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', serving_size: '100g', calories: '', protein: '', carbs: '', fats: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.calories !== '';

  const food = {
    id: `custom_${Date.now()}`,
    name: form.name, brand: '',
    calories: Number(form.calories) || 0, protein: Number(form.protein) || 0,
    carbs: Number(form.carbs) || 0, fats: Number(form.fats) || 0,
    serving_size: form.serving_size || '100g', category: 'Custom', source: 'custom',
  };

  return (
    <div className="px-4 py-4 space-y-3 bg-slate-50 border-t border-slate-100">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Add Custom Food</p>
      <input className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Food name *" value={form.name} onChange={e => set('name', e.target.value)} />
      <input className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Serving size (e.g. 100g)" value={form.serving_size} onChange={e => set('serving_size', e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        {[['calories','Calories (kcal) *'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fats','Fats (g)']].map(([k, ph]) => (
          <input key={k} type="number"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} />
        ))}
      </div>
      <div className="flex gap-2">
        <button disabled={!valid} onClick={() => valid && onSave(food)}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white disabled:opacity-40 active:opacity-70">
          Save to My Foods
        </button>
        <button disabled={!valid} onClick={() => valid && onAdd(food, 100)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 active:opacity-70"
          style={{ background: '#2563EB' }}>
          Add to Log
        </button>
      </div>
    </div>
  );
}

// ── Food result row ────────────────────────────────────────────────────────
function FoodResultRow({ food, onAdd, onSave }) {
  const [qty, setQty] = useState(100);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-blue-50 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 font-semibold text-sm leading-snug">{food.name}</p>
          {food.category && <p className="text-slate-400 text-xs">{food.category}</p>}
          <div className="flex gap-2 mt-1 text-xs">
            <span className="text-orange-600 font-semibold">{cal}kcal</span>
            <span className="text-slate-500">P {prot}g · C {carb}g · F {fat}g</span>
          </div>
        </div>
        <span className="text-slate-300 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Serving:</span>
            <input type="number" min={1} step={10} value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className="w-16 h-7 text-xs text-center border border-slate-200 rounded-lg bg-white px-1" />
            <span className="text-xs text-slate-400">g</span>
            <span className="text-xs text-slate-400 ml-1">
              = {cal}kcal · P{prot}g · C{carb}g · F{fat}g
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 active:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
            </button>
            <button onClick={() => onAdd(food, qty)}
              className="flex-1 h-9 rounded-xl text-sm font-semibold text-white active:opacity-70"
              style={{ background: '#2563EB' }}>
              Add to Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Sheet ─────────────────────────────────────────────────────────────
export default function FoodSearchSheet({ isOpen, onClose, onSelectFood, mealName }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [libraryFoods, setLibraryFoods] = useState([]);
  const [tab, setTab] = useState('search');
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
      base44.entities.FoodItem.list().then(setLibraryFoods).catch(() => {});
    }
  }, [isOpen]);

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 450);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // USDA search
  useEffect(() => {
    if (tab !== 'search') return;
    if (debouncedSearch.length < 2) { setResults([]); setHasError(false); return; }
    setIsLoading(true);
    setHasError(false);
    searchUSDA(debouncedSearch)
      .then(r => { setResults(r); if (r.length === 0) setShowCustom(true); })
      .catch(() => { setHasError(true); setShowCustom(true); })
      .finally(() => setIsLoading(false));
  }, [debouncedSearch, tab]);

  const handleAdd = (food, qty) => {
    const scale = qty / 100;
    onSelectFood({
      food_name:        food.name,
      name:             food.name,
      calories:         Math.round(food.calories * scale),
      protein:          Math.round(food.protein  * scale * 10) / 10,
      carbs:            Math.round(food.carbs    * scale * 10) / 10,
      fats:             Math.round(food.fats     * scale * 10) / 10,
      serving_quantity: qty,
      serving_unit:     'g',
      serving:          `${qty}g`,
    });
    onClose();
  };

  const handleSave = async (food) => {
    try {
      await base44.entities.FoodItem.create({
        name: food.name, brand: food.brand || '',
        calories: food.calories, protein: food.protein, carbs: food.carbs, fats: food.fats,
        serving_size: food.serving_size || '100g', source: food.source || 'usda', category: food.category || '',
      });
      toast.success(`"${food.name}" saved`);
      base44.entities.FoodItem.list().then(setLibraryFoods).catch(() => {});
    } catch {
      toast.error('Could not save food');
    }
  };

  const filteredLibrary = libraryFoods.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
        className="w-full bg-white rounded-t-[28px] max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="flex justify-center py-2.5 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-sm font-bold text-slate-800 mb-3">
            Add Food{mealName ? <span className="font-normal text-slate-400"> → {mealName}</span> : ''}
          </p>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-3">
            {[['search','USDA Search'],['library','My Foods']].map(([id, label]) => (
              <button key={id} onClick={() => { setTab(id); setSearch(''); setShowCustom(false); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef} type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'search' ? 'Search USDA database...' : 'Filter my foods...'}
              className="flex-1 bg-transparent text-slate-800 text-sm focus:outline-none placeholder-slate-400"
            />
            {isLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />}
            {search && !isLoading && (
              <button onClick={() => { setSearch(''); setResults([]); }} className="flex-shrink-0">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* SEARCH TAB */}
          {tab === 'search' && (
            <>
              {!search || search.length < 2 ? (
                <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                  <Search className="w-8 h-8 text-slate-200" />
                  <p className="text-sm font-semibold text-slate-700">Search USDA FoodData Central</p>
                  <p className="text-xs text-slate-400">Accurate data for 900k+ foods. Type 2+ characters.</p>
                  <button onClick={() => setShowCustom(v => !v)}
                    className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1">
                    + Add Custom Food {showCustom ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showCustom && <CustomFoodForm onAdd={handleAdd} onSave={handleSave} />}
                </div>
              ) : isLoading ? (
                <div className="space-y-0 divide-y divide-slate-100">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                        <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasError ? (
                <div className="py-8 px-6">
                  <div className="text-center mb-4">
                    <UtensilsCrossed className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Couldn't reach food database</p>
                    <p className="text-xs text-slate-400 mt-1">Add your food manually below.</p>
                  </div>
                  <CustomFoodForm onAdd={handleAdd} onSave={handleSave} />
                </div>
              ) : results.length === 0 ? (
                <div className="py-8 px-6">
                  <div className="text-center mb-4">
                    <UtensilsCrossed className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No results for "{search}"</p>
                    <p className="text-xs text-slate-400 mt-1">Try a different term or add a custom food.</p>
                  </div>
                  <CustomFoodForm onAdd={handleAdd} onSave={handleSave} />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400">{results.length} results · USDA FoodData Central</p>
                    <button onClick={() => setShowCustom(v => !v)}
                      className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                      + Custom {showCustom ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  {showCustom && <CustomFoodForm onAdd={handleAdd} onSave={handleSave} />}
                  <div>
                    {results.map(food => (
                      <FoodResultRow key={food.id} food={food} onAdd={handleAdd} onSave={handleSave} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* MY FOODS TAB */}
          {tab === 'library' && (
            filteredLibrary.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                <UtensilsCrossed className="w-8 h-8 text-slate-200" />
                <p className="text-sm font-semibold text-slate-700">No saved foods yet</p>
                <p className="text-xs text-slate-400">Search USDA and tap the bookmark icon, or add a custom food.</p>
                <button onClick={() => setShowCustom(v => !v)}
                  className="mt-2 text-xs font-semibold text-blue-600">
                  + Add Custom Food
                </button>
                {showCustom && <CustomFoodForm onAdd={handleAdd} onSave={handleSave} />}
              </div>
            ) : (
              <>
                {showCustom && <CustomFoodForm onAdd={handleAdd} onSave={handleSave} />}
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-400">{filteredLibrary.length} saved foods</p>
                  <button onClick={() => setShowCustom(v => !v)}
                    className="text-xs font-semibold text-blue-600">+ Custom</button>
                </div>
                <div>
                  {filteredLibrary.map(food => (
                    <FoodResultRow
                      key={food.id}
                      food={{ ...food, calories: food.calories || 0, protein: food.protein || 0, carbs: food.carbs || 0, fats: food.fats || 0 }}
                      onAdd={handleAdd}
                      onSave={handleSave}
                    />
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}