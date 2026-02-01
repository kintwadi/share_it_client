
import React from 'react';
import { Listing, ListingType, AvailabilityStatus } from '../types';
import { MapPin, ShieldCheck, BadgeCheck, Heart, DollarSign, Gift } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ResourceCardProps {
  listing: Listing;
  onClick?: () => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ listing, onClick }) => {
  const { formatPrice } = useLanguage();
  const isSkill = listing.type === ListingType.SKILL;
  const isAvailable = listing.status === AvailabilityStatus.AVAILABLE;
  const isFree = !listing.hourlyRate || listing.hourlyRate === 0;
  
  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden border border-gray-100"
    >
      {/* Image Header */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img 
          src={listing.imageUrl} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        
        {/* Gradient Overlay for Text Visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
           <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/20 text-white ${
            isSkill ? 'bg-indigo-500/80' : 'bg-teal-500/80'
           }`}>
             {isSkill ? 'Skill' : 'Item'}
           </span>

           {isFree && (
             <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/20 text-white bg-gradient-to-r from-pink-500 to-rose-500 flex items-center gap-1 animate-pulse">
               <Gift size={10} />
               Special
             </span>
           )}
        </div>

        <button className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-red-500 transition-colors">
          <Heart size={16} />
        </button>

        {/* Price Tag & Status */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
           {listing.status !== AvailabilityStatus.AVAILABLE ? (
            <span className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-sm uppercase tracking-wide">
              {listing.status === AvailabilityStatus.BORROWED ? 'Borrowed' : 'Busy'}
            </span>
           ) : (
             <span className={`backdrop-blur-md text-[10px] px-2.5 py-1 rounded-md font-bold shadow-sm uppercase tracking-wide flex items-center ${
                isFree 
                 ? 'bg-white text-pink-600 border border-pink-100' 
                 : 'bg-white/95 text-gray-900'
              }`}>
               {isFree ? 'Free' : `${formatPrice(listing.hourlyRate || 0)}/hr`}
             </span>
           )}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-2">
           <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors">
             {listing.title}
           </h3>
           <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mt-1">{listing.category}</p>
        </div>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow leading-relaxed">
          {listing.description}
        </p>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-50 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img 
                  src={listing.owner?.avatarUrl || `https://picsum.photos/seed/${listing.owner?.id}/80/80`} 
                  onError={(e)=>{ (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${listing.owner?.id}/80/80`; }}
                  alt={listing.owner?.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
                  <BadgeCheck size={12} className="text-blue-500" />
                </div>
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-semibold text-gray-900">{listing.owner?.name}</span>
                 <div className="flex items-center text-[10px] text-gray-500">
                    <ShieldCheck size={10} className="mr-0.5 text-emerald-500" />
                    <span>{listing.owner?.trustScore}% Trust</span>
                 </div>
              </div>
            </div>

            <div className="flex items-center text-slate-500 text-xs font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                <MapPin size={12} className="mr-1 text-slate-400" />
                {listing.distanceMiles} mi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
