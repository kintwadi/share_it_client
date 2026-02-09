
import React, { useEffect, useState } from 'react';
import { ResourceCard } from '../components/ResourceCard';
import { mockApi } from '../services/mockApi';
import { Listing, ListingType, AvailabilityStatus, User } from '../types';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const ITEMS_PER_PAGE = 6;

export const Home: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | ListingType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recommended, setRecommended] = useState<Listing[]>([]);
  const [borrowCats, setBorrowCats] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { t } = useLanguage();

  const CATEGORIES = [t('home.category_all'), 'Tools', 'Gardening', 'Kitchen', 'Outdoors', 'Music', 'Misc'];

  useEffect(() => {
    // Reset category filter if it was the default "All Categories" but language changed
    setSelectedCategory(t('home.category_all'));
  }, [t]);

  useEffect(() => {
    mockApi.getCurrentUser().then(setCurrentUser).catch(() => setCurrentUser(null));
    mockApi.getBorrowingHistory().then(hist => {
      const cats = new Set<string>(hist.map(h => h.listing.category));
      setBorrowCats(cats);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const computeFallback = () => {
      if (!currentUser || listings.length === 0) { setRecommended([]); return; }
      const candidates = listings.filter(l => l.ownerId !== currentUser.id);
      const scored = candidates.map(l => {
        let score = 0;
        if (borrowCats.has(l.category)) score += 2;
        if (filterType !== 'ALL' && l.type === filterType) score += 1;
        if (selectedCategory !== t('home.category_all') && l.category === selectedCategory) score += 1;
        const distBoost = l.distanceMiles ? Math.max(0, 10 - l.distanceMiles) / 10 : 0;
        score += distBoost;
        return { l, score };
      }).sort((a,b) => b.score - a.score).slice(0, 6).map(s => s.l);
      setRecommended(scored);
    };
    const loadServerRecs = async () => {
      if (!currentUser) { setRecommended([]); return; }
      try {
        const recs = await mockApi.getRecommendedListings(6);
        if (recs.length > 0) setRecommended(recs); else computeFallback();
      } catch { computeFallback(); }
    };
    loadServerRecs();
  }, [listings, currentUser, filterType, selectedCategory, borrowCats, t]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = searchQuery 
          ? await mockApi.searchListings(searchQuery)
          : await mockApi.getListings();
        
        // Filter for public visibility: Remove Blocked and Hidden items
        let filtered = data.filter(l => 
          l.status !== AvailabilityStatus.BLOCKED && 
          l.status !== AvailabilityStatus.HIDDEN
        );

        if (filterType !== 'ALL') {
          filtered = filtered.filter(l => l.type === filterType);
        }

        if (selectedCategory !== t('home.category_all')) {
          filtered = filtered.filter(l => l.category === selectedCategory);
        }

        if (locationQuery) {
          filtered = filtered.filter(l => 
            l.owner?.address?.toLowerCase().includes(locationQuery.toLowerCase())
          );
        }
          
        setListings(filtered);
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, locationQuery, filterType, selectedCategory, t]);

  const totalPages = Math.ceil(listings.length / ITEMS_PER_PAGE);
  const paginatedListings = listings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 300, behavior: 'smooth' }); // Scroll to top of grid instead of top of page
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-800 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative px-8 py-16 md:py-20 md:px-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="max-w-2xl">
             <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-4 backdrop-blur-sm border border-white/10">
               <Sparkles size={12} className="mr-2" />
               {t('home.hero_badge')}
             </div>
             <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
               {t('home.hero_title_1')} <br/><span className="text-brand-200">{t('home.hero_title_2')}</span>
             </h1>
             <p className="text-lg text-brand-50/90 mb-8 leading-relaxed max-w-lg">
               {t('home.hero_desc')}
             </p>
             
             {/* Search Bar Embedded in Hero */}
             <div className="bg-white p-2 rounded-full shadow-lg max-w-3xl w-full flex items-center transition-transform focus-within:scale-105 duration-300">
                <div className="flex-[1.5] flex items-center border-r border-gray-200">
                  <div className="pl-4 text-gray-400">
                    <Search size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder={t('home.search_placeholder')}
                    className="w-full px-4 py-2.5 text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex-1 flex items-center px-2">
                   <div className="pl-2 text-gray-400">
                     <MapPin size={20} />
                   </div>
                   <input 
                     type="text" 
                     placeholder="City, Zip..."
                     className="w-full px-4 py-2.5 text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                     value={locationQuery}
                     onChange={(e) => setLocationQuery(e.target.value)}
                   />
                </div>

                <button 
                  className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-full font-bold shadow-md transition-colors"
                  onClick={() => {}}
                >
                  Search
                </button>
             </div>
           </div>
           
           {/* Abstract Visual Right */}
           <div className="hidden md:block relative">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl rotate-3 transform hover:rotate-0 transition-all duration-500 w-64 shadow-2xl">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/20"></div>
                    <div className="space-y-2">
                       <div className="w-24 h-2 bg-white/20 rounded-full"></div>
                       <div className="w-16 h-2 bg-white/10 rounded-full"></div>
                    </div>
                 </div>
                 <div className="w-full h-32 bg-white/10 rounded-lg mb-3"></div>
                 <div className="w-full h-8 bg-brand-400 rounded-lg"></div>
              </div>
           </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="sticky top-20 z-30 bg-slate-50/95 backdrop-blur py-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            <button 
               onClick={() => setFilterType('ALL')}
               className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${filterType === 'ALL' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
             >
               {t('home.filter_all')}
             </button>
             <button 
               onClick={() => setFilterType(ListingType.GOODS)}
               className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${filterType === ListingType.GOODS ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
             >
               {t('home.filter_goods')}
             </button>
             <button 
               onClick={() => setFilterType(ListingType.SKILL)}
               className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${filterType === ListingType.SKILL ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
             >
               {t('home.filter_skills')}
             </button>
          </div>

          <div className="relative w-full md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
        
        {/* Result Count */}
        {!loading && listings.length > 0 && (
           <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('home.showing')} {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, listings.length)} {t('home.of')} {listings.length} {t('home.results')}
           </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
          <p className="text-gray-400 animate-pulse">{t('home.loading')}</p>
        </div>
      ) : (
        <>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Filter className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.no_matches')}</h3>
              <p className="text-gray-500 mb-6 text-center max-w-sm">{t('home.no_matches_desc')}</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('ALL');
                  setSelectedCategory(t('home.category_all'));
                }}
                className="px-6 py-2.5 bg-brand-50 text-brand-700 font-semibold rounded-full hover:bg-brand-100 transition-colors"
              >
                {t('home.clear_filters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {paginatedListings.map(listing => (
                <ResourceCard 
                  key={listing.id} 
                  listing={listing} 
                  onClick={() => navigate(`/listing/${listing.id}`)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && listings.length > 0 && (
            <div className="flex justify-center items-center space-x-2 pt-10 pb-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex space-x-2 bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-9 h-9 rounded-full font-medium text-sm transition-all ${
                      currentPage === page 
                        ? 'bg-gray-900 text-white shadow-md scale-105' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {currentUser && recommended.length > 0 && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
            <span className="text-xs text-gray-500">Based on your activity and nearby listings</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {recommended.map(listing => (
              <div key={listing.id} className="relative">
                <button
                  onClick={async (e) => { e.stopPropagation(); await mockApi.dismissRecommendation(listing.id); setRecommended(prev => prev.filter(l => l.id !== listing.id)); }}
                  className="absolute top-2 right-2 z-10 px-2 py-1 text-[10px] bg-white/90 border border-gray-200 rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600 shadow-sm"
                  aria-label="Dismiss"
                >
                  Dismiss
                </button>
                <ResourceCard 
                  listing={listing} 
                  onClick={() => navigate(`/listing/${listing.id}`)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
