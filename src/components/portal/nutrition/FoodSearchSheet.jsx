import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Camera, Plus, Clock, TrendingUp } from 'lucide-react';

const SAMPLE_FOODS = [
  { id: 1, name: 'Chicken Breast', brand: '', serving: '100g', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { id: 2, name: 'Banana', brand: '', serving: '1 medium', calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
  { id: 3, name: 'Brown Rice', brand: '', serving: '100g', calories: 112, protein: 2.6, carbs: 24, fats: 0.9 },
  { id: 4, name: 'Greek Yogurt', brand: 'Fage', serving: '100g', calories: 59, protein: 10, carbs: 3.3, fats: 0.4 },
  { id: 5, name: 'Broccoli', brand: '', serving: '100g', calories: 34, protein: 2.8, carbs: 7, fats: 0.4 },
  { id: 6, name: 'Salmon', brand: '', serving: '100g', calories: 208, protein: 20, carbs: 0, fats: 13 },
  { id: 7, name: 'Sweet Potato', brand: '', serving: '100g', calories: 86, protein: 1.6, carbs: 20, fats: 0.1 },
  { id: 8, name: 'Eggs', brand: '', serving: '1 large', calories: 78, protein: 6, carbs: 0.6, fats: 5.5 },
];

const RECENT_FOODS = [
  { id: 101, name: 'Oatmeal', serving: '50g', calories: 190 },
  { id: 102, name: 'Almonds', serving: '23 nuts', calories: 160 },
  { id: 103, name: 'Apple', serving: '1 med', calories: 95 },
];

const FREQUENT_FOODS = [
  { id: 201, name: 'Chicken Breast', times: 28 },
  { id: 202, name: 'Brown Rice', times: 24 },
  { id: 203, name: 'Broccoli', times: 22 },
  { id: 204, name: 'Eggs', times: 19 },
  { id: 205, name: 'Banana', times: 16 },
];

export default function FoodSearchSheet({ isOpen, onClose, onSelectFood, mealName }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (search.trim()) {
      const filtered = SAMPLE_FOODS.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.brand.toLowerCase().includes(search.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [search]);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        exit={{ y: 400 }}
        className="w-full bg-white rounded-t-[28px] max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="flex justify-center py-2.5">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search foods or scan..."
              className="flex-1 bg-transparent text-slate-800 text-sm focus:outline-none placeholder-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="flex-shrink-0">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <button className="flex-shrink-0 p-1">
              <Camera className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">

          {/* Search results */}
          {results.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Results</p>
              <div className="space-y-1">
                {results.map(food => (
                  <button key={food.id}
                    onClick={() => onSelectFood(food)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-slate-50 active:bg-blue-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-semibold text-sm">{food.name}</p>
                      {food.brand && <p className="text-slate-400 text-xs">{food.brand}</p>}
                      <p className="text-slate-400 text-xs mt-0.5">{food.serving}</p>
                    </div>
                    <p className="text-slate-800 font-bold text-sm whitespace-nowrap">{food.calories}cal</p>
                    <button
                      onClick={e => { e.stopPropagation(); onSelectFood(food); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600"
                      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state — show recent + frequent */}
          {!search && (
            <>
              {/* Recent */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recently Logged</p>
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {RECENT_FOODS.map(f => (
                    <button key={f.id}
                      onClick={() => onSelectFood(f)}
                      className="flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap"
                      style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequent */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Frequent Foods</p>
                </div>
                <div className="space-y-1">
                  {FREQUENT_FOODS.map(f => (
                    <button key={f.id}
                      onClick={() => onSelectFood(SAMPLE_FOODS.find(s => s.name === f.name))}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-slate-50 transition-colors">
                      <div className="flex-1">
                        <p className="text-slate-900 font-semibold text-sm">{f.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{f.times}x logged</p>
                      </div>
                      <Plus className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* No results */}
          {search && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No foods found</p>
              <button className="text-blue-600 text-xs font-bold mt-2">Create Custom Food →</button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}