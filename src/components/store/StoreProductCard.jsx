import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dumbbell, Salad, Users, Package, Layers, EyeOff, Star, Edit, Eye, ShoppingCart, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORY_STYLES = {
  workout:   { badge: 'bg-[#EFF6FF] text-[#2563EB]',   icon: Dumbbell, gradient: 'from-[#EFF6FF] to-[#DBEAFE]' },
  nutrition: { badge: 'bg-[#F0FDF4] text-[#16A34A]',   icon: Salad,    gradient: 'from-[#F0FDF4] to-[#DCFCE7]' },
  coaching:  { badge: 'bg-[#FFF7ED] text-[#D97706]',   icon: Users,    gradient: 'from-[#FFF7ED] to-[#FEF3C7]' },
  bundle:    { badge: 'bg-[#F5F3FF] text-[#7C3AED]',   icon: Layers,   gradient: 'from-[#F5F3FF] to-[#EDE9FE]' },
  other:     { badge: 'bg-[#F3F4F6] text-[#374151]',   icon: Package,  gradient: 'from-[#F3F4F6] to-[#E5E7EB]' },
};

const TYPE_LABEL = {
  workout_program: 'Workout',
  nutrition_plan: 'Nutrition',
  coaching_package: 'Coaching',
  guide_ebook: 'Ebook',
  video_course: 'Course',
  bundle: 'Bundle',
  custom: 'Product',
};

export default function StoreProductCard({ listing, onEdit, onView }) {
  const [buyingOut, setBuyingOut] = useState(false);
  const cat = CATEGORY_STYLES[listing.category] || CATEGORY_STYLES.other;
  const CatIcon = cat.icon;
  const isDiscounted = listing.original_price && Number(listing.original_price) > Number(listing.price);
  const typeLabel = TYPE_LABEL[listing.product_type] || listing.category;

  const handleBuyNow = async () => {
    setBuyingOut(true);
    const res = await base44.functions.invoke('storeCheckout', {
      listing_id: listing.id,
      success_url: `${window.location.origin}/store?purchase=success`,
      cancel_url: `${window.location.origin}/store`,
    });
    if (res?.data?.checkout_url) {
      window.open(res.data.checkout_url, '_blank');
    } else {
      toast.error(res?.data?.error || 'Could not start checkout');
    }
    setBuyingOut(false);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 group relative flex flex-col">
      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center bg-gradient-to-br', cat.gradient)}>
            <CatIcon className="w-12 h-12 opacity-15" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', cat.badge)}>
            {typeLabel}
          </span>
          {listing.is_free && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">FREE</span>
          )}
          {!listing.is_published && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] flex items-center gap-1">
              <EyeOff className="w-2.5 h-2.5" /> Draft
            </span>
          )}
          {listing.payment_type === 'subscription' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Subscription</span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onView(listing)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#111827] rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          <button
            onClick={() => onEdit(listing)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors"
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-[#111827] text-sm leading-tight">{listing.title}</h3>
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
            {listing.features.length > 3 && (
              <p className="text-[11px] text-[#9CA3AF]">+{listing.features.length - 3} more</p>
            )}
          </div>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-baseline gap-1.5">
              {listing.is_free ? (
                <span className="text-lg font-bold text-emerald-600">Free</span>
              ) : (
                <>
                  <span className="text-lg font-bold text-[#111827]">${listing.price}</span>
                  {listing.payment_type === 'subscription' && (
                    <span className="text-[11px] text-[#9CA3AF]">/{listing.billing_frequency === 'monthly' ? 'mo' : listing.billing_frequency === 'annual' ? 'yr' : 'qtr'}</span>
                  )}
                  {isDiscounted && (
                    <span className="text-xs text-[#9CA3AF] line-through">${listing.original_price}</span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              {listing.rating && (
                <span className="flex items-center gap-0.5 font-semibold text-[#111827]">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {listing.rating}
                  {listing.rating_count > 0 && <span className="text-[#9CA3AF] font-normal">({listing.rating_count})</span>}
                </span>
              )}
              {listing.sales_count > 0 && (
                <span>{listing.sales_count} sold</span>
              )}
            </div>
          </div>

          {/* Buy Now button — only show for published products with price */}
          {listing.is_published && !listing.is_free && listing.price > 0 && (
            <button
              onClick={handleBuyNow}
              disabled={buyingOut}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}
            >
              {buyingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ShoppingCart className="w-3.5 h-3.5" /> Buy Now — ${listing.price}</>}
            </button>
          )}
          {listing.is_free && listing.is_published && (
            <button className="w-full py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors">
              Get for Free
            </button>
          )}
        </div>
      </div>
    </div>
  );
}