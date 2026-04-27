import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, Plus, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function MacroBit({ label, value, color }) {
  if (!value) return null;
  return <span className={cn('text-[10px] font-medium', color)}>{label} {value}</span>;
}

export default function FoodSearchPanel({ onSave, isSaved }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('searchFoods', { query: q.trim(), pageSize: 20 });
      setResults(res.data?.foods || []);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(window._foodSearchTimer);
    window._foodSearchTimer = setTimeout(() => doSearch(val), 500);
  };

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="e.g. chicken breast, greek yogurt, oats…"
          className="pl-9 bg-secondary/40"
          value={query}
          onChange={handleChange}
          autoFocus
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {!searched && !loading && (
        <p className="text-center text-xs text-muted-foreground py-6">Type to search…</p>
      )}

      {searched && results.length === 0 && !loading && (
        <p className="text-center text-xs text-muted-foreground py-6">No results for "{query}" — try a custom food instead.</p>
      )}

      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {results.map((food, i) => {
          const saved = isSaved(food);
          return (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-secondary/30 rounded-lg hover:bg-secondary/60 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{food.name}</p>
                <div className="flex gap-2 mt-0.5">
                  {food.calories > 0 && <span className="text-[10px] text-orange-600 font-semibold">{food.calories} cal</span>}
                  <MacroBit label="P" value={food.protein_g ? `${food.protein_g}g` : null} color="text-blue-600" />
                  <MacroBit label="C" value={food.carbs_g ? `${food.carbs_g}g` : null} color="text-amber-600" />
                  <MacroBit label="F" value={food.fats_g ? `${food.fats_g}g` : null} color="text-rose-600" />
                  {food.serving_size && <span className="text-[10px] text-muted-foreground">· {food.serving_size}</span>}
                </div>
              </div>
              <button
                onClick={() => onSave(food)}
                disabled={saved}
                className={cn(
                  'shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all',
                  saved
                    ? 'text-green-600 bg-green-50 border border-green-200 cursor-default'
                    : 'text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20'
                )}
              >
                {saved ? <><Check className="w-3 h-3" /> Saved</> : <><Plus className="w-3 h-3" /> Add</>}
              </button>
            </div>
          );
        })}
      </div>

      {results.length > 0 && (
        <p className="text-center text-[10px] text-muted-foreground mt-3">USDA FoodData Central · {results.length} results</p>
      )}
    </div>
  );
}