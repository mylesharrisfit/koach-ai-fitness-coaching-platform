import React, { useState } from 'react';
import { Search, X, Layout, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';



const CATEGORIES = [
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'strength', label: 'Strength' },
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'athletic', label: 'Athletic Performance' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'custom', label: 'General Fitness' },
];

export default function ProgramSearchFilter({
  searchQuery,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  categories,
  onCategoriesChange,
  duration,
  onDurationChange,
  frequency,
  onFrequencyChange,
  sessionLength,
  onSessionLengthChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  layout,
  onLayoutChange,
  resultCount,
}) {
  const [showFilters, setShowFilters] = useState(false);
  
  const activeFiltersCount = [
    difficulty !== 'all' ? 1 : 0,
    categories.length > 0 ? 1 : 0,
    duration !== 'all' ? 1 : 0,
    frequency !== 'all' ? 1 : 0,
    sessionLength !== 'all' ? 1 : 0,
    status !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleCategoryToggle = (cat) => {
    if (categories.includes(cat)) {
      onCategoriesChange(categories.filter(c => c !== cat));
    } else {
      onCategoriesChange([...categories, cat]);
    }
  };

  const handleClearAll = () => {
    onDifficultyChange('all');
    onCategoriesChange([]);
    onDurationChange('all');
    onFrequencyChange('all');
    onSessionLengthChange('all');
    onStatusChange('all');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="w-4 h-4" />
        </div>
        <Input
          type="text"
          placeholder="Search programs by name, goal, or exercise type..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 bg-card border border-border"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Count */}
      {searchQuery && (
        <div className="text-xs text-muted-foreground">
          {resultCount} result{resultCount !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 pb-3 border-b border-border flex-wrap">
        {/* Difficulty Dropdown */}
        <Select value={difficulty} onValueChange={onDifficultyChange}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="elite">Elite</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleCategoryToggle(cat.value)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap',
                categories.includes(cat.value)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Duration Dropdown */}
        <Select value={duration} onValueChange={onDurationChange}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Length</SelectItem>
            <SelectItem value="1-4">1-4 weeks</SelectItem>
            <SelectItem value="5-8">5-8 weeks</SelectItem>
            <SelectItem value="9-12">9-12 weeks</SelectItem>
            <SelectItem value="12+">12+ weeks</SelectItem>
          </SelectContent>
        </Select>

        {/* Frequency Dropdown */}
        <Select value={frequency} onValueChange={onFrequencyChange}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Frequency</SelectItem>
            <SelectItem value="2-3">2-3x/week</SelectItem>
            <SelectItem value="4-5">4-5x/week</SelectItem>
            <SelectItem value="6">6x/week</SelectItem>
          </SelectContent>
        </Select>

        {/* Session Length Dropdown */}
        <Select value={sessionLength} onValueChange={onSessionLengthChange}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Session Length</SelectItem>
            <SelectItem value="0-30">Under 30 min</SelectItem>
            <SelectItem value="30-45">30-45 min</SelectItem>
            <SelectItem value="45-60">45-60 min</SelectItem>
            <SelectItem value="60+">60+ min</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Chips */}
        <div className="flex items-center gap-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'unassigned', label: 'Unassigned' },
            { value: 'archived', label: 'Archived' },
          ].map(st => (
            <button
              key={st.value}
              onClick={() => onStatusChange(st.value)}
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap',
                status === st.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
              )}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Clear All Link */}
        {activeFiltersCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-primary hover:text-primary/80 font-medium ml-2"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Bottom Row: Sort, Filter Count, Layout Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most-assigned">Most Assigned</SelectItem>
              <SelectItem value="alphabetical-az">Alphabetical A-Z</SelectItem>
              <SelectItem value="alphabetical-za">Alphabetical Z-A</SelectItem>
              <SelectItem value="duration-short">Shortest Duration</SelectItem>
              <SelectItem value="duration-long">Longest Duration</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters Count Badge */}
          {activeFiltersCount > 0 && (
            <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded-lg border border-border">
              Filters {activeFiltersCount}
            </span>
          )}
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center gap-1 bg-muted border border-border rounded-lg p-1">
          <button
            onClick={() => onLayoutChange('grid')}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-md transition-all',
              layout === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Grid view"
          >
            <Layout className="w-4 h-4" />
          </button>
          <button
            onClick={() => onLayoutChange('list')}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-md transition-all',
              layout === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="List view"
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}