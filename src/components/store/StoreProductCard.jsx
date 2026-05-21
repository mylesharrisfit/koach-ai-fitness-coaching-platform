import React from 'react';
import { cn } from '@/lib/utils';
import { Dumbbell, Salad, Users, Package, EyeOff, Star, Edit, Eye } from 'lucide-react';

const CATEGORY_STYLES = {
  workout:  { badge: 'bg-[#EFF6FF] text-[#2563EB]',  icon: Dumbbell,  gradient: 'from-[#EFF6FF] to-[#DBEAFE]' },
  nutrition:{ badge: 'bg-[#F0FDF4] text-[#16A34A]',  icon: Salad,     gradient: 'from-[#F0FDF4] to-[#DCFCE7]' },
  coaching: { badge: 'bg-[#FFF7ED] text-[#D97706]',  icon: Users,     gradient: 'from-[#FFF7ED] to-[#FEF3C7]' },
  bundle:   { badge: 'bg-[#F5F3FF] text-[#7C3AED]',  icon: Package,   gradient: 'from-[#F5F3FF] to-[#EDE9FE]' },
};

export default function StoreProductCard({ listing, onEdit, onView }) {
  const cat = CATEGORY_STYLES[listing.category] || CATEGORY_STYLES.workout;
  const CatIcon = cat.icon;
  const isDiscounted = listing.original_price && Number(listing.original_price) > Number(listing.price);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden hover:shadow-md transition-all group relative">
      {/* Image area */}
      <div className="h-40 relative overflow-hidden bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6]">
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center bg-gradient-to-br', cat.gradient)}>
            <CatIcon className="w-10 h-10 opacity-20" />
          </div>
        )}
        {/* Category badge */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', cat.badge)}>
            {listing.category}
          </span>
          {!listing.is_published && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] flex items-center gap-1">
              <EyeOff className="w-2.5 h-2.5" /> Draft
            </span>
          )}
        </div>
        {/* Hover action buttons */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button onClick={() => onView(listing)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#111827] rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          <button onClick={() => onEdit(listing)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors">
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[#111827] text-sm leading-tight">{listing.title}</h3>
        {listing.description && (
          <p className="text-xs text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">{listing.description}</p>
        )}

        {listing.features?.length > 0 && (
          <div className="mt-2.5 space-y-1">
            {listing.features.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-[#9CA3AF] flex-shrink-0" />
                <p className="text-xs text-[#6B7280] truncate">{f}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-[#111827]">${listing.price}</span>
            {isDiscounted && (
              <span className="text-xs text-[#9CA3AF] line-through">${listing.original_price}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            {listing.rating && (
              <span className="flex items-center gap-0.5 font-semibold text-[#111827]">
                ★ {listing.rating}
              </span>
            )}
            {listing.sales_count > 0 && (
              <span>{listing.sales_count} sold</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}